import { hbutRequest } from '../../utils/request';
import cacheManager from '../../utils/cache';

const CACHE_KEY = 'bannerImages';

/**
 * Extract banner image URLs from HBUT homepage HTML.
 */
function extractBannerImages(html: string): string[] {
  const images: string[] = [];
  if (typeof html !== 'string') return images;

  // Match img src attributes in banner/slider sections
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    if (src && (src.includes('banner') || src.includes('slide') || src.includes('focus') || src.includes('jpg') || src.includes('png'))) {
      // Make relative URLs absolute
      const fullUrl = src.startsWith('http') ? src : `https://www.hbut.edu.cn${src.startsWith('/') ? '' : '/'}${src}`;
      if (!images.includes(fullUrl)) images.push(fullUrl);
    }
    if (images.length >= 6) break;
  }

  return images;
}

/**
 * Fetch banner images from the HBUT school homepage.
 * Matches Taro's getBanner() — fetches HTML, extracts image URLs, caches result.
 */
export async function getBanner(forceRefresh = false): Promise<string[]> {
  // Return cached if available
  if (!forceRefresh) {
    const cached = await cacheManager.getAsync<string[]>(CACHE_KEY);
    if (cached) return cached;
  }

  try {
    const response = await hbutRequest.get('/', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Referer: 'https://www.hbut.edu.cn',
        Origin: 'https://www.hbut.edu.cn',
      },
      withCredentials: true,
      responseType: 'text',
    });

    if (response.status !== 200) return [];
    const html = String(response.data ?? '');
    const images = extractBannerImages(html);

    // Cache indefinitely (cleared on force refresh)
    void cacheManager.setAsync(CACHE_KEY, images);

    return images;
  } catch {
    return [];
  }
}
