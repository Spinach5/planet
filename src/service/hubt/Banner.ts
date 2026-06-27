import axios from "axios";
import cacheManager from "../../utils/cache";

const CACHE_KEY = "bannerImages";
const BANNER_URL = "https://www.hbut.edu.cn/";

/**
 * Extract banner image URLs from HBUT homepage HTML.
 */
function extractBannerImages(html: string): string[] {
  const images: string[] = [];
  if (typeof html !== "string") return images;

  // Match all img src attributes
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1].trim();
    if (!src) continue;

    // Skip icons, logos, backgrounds, and internal CMS placeholders
    if (/icon|logo|avatar|_bg|bg_|qr-?code|wechat|wx-?code/i.test(src)) continue;
    // Skip virtual_attach_file (CMS internal, may require auth)
    if (/virtual_attach_file/i.test(src)) continue;

    // Match images with standard extensions
    const isImageFile = /\.(jpe?g|png|webp)(\?|$)/i.test(src);

    if (isImageFile) {
      const fullUrl = src.startsWith("http")
        ? src
        : `https://www.hbut.edu.cn${src.startsWith("/") ? "" : "/"}${src}`;
      if (!images.includes(fullUrl)) images.push(fullUrl);
    }

    if (images.length >= 6) break;
  }

  return images;
}

/**
 * Fetch banner images from the HBUT school homepage.
 * Fetches HTML from www.hbut.edu.cn, extracts image URLs, caches result.
 */
export async function getBanner(forceRefresh = false): Promise<string[]> {
  // Return cached if available
  if (!forceRefresh) {
    const cached = await cacheManager.getAsync<string[]>(CACHE_KEY);
    if (cached && cached.length > 0) return cached;
  }

  try {
    const response = await axios.get(BANNER_URL, {
      timeout: 10000,
      responseType: "text",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36",
      },
    });

    if (response.status !== 200) return [];
    const html = String(response.data ?? "");
    const images = extractBannerImages(html);

    // Only cache if we got results
    if (images.length > 0) {
      void cacheManager.setAsync(CACHE_KEY, images);
    }

    return images;
  } catch {
    // Return cached images on failure if available
    const cached = await cacheManager.getAsync<string[]>(CACHE_KEY);
    return cached ?? [];
  }
}
