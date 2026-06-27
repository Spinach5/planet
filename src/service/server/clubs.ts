// Clubs API — matches Taro src/service/hbut/clubs.js
import { serverGet, serverPost } from "@/utils/serverRequest";
import cacheManager from "@/utils/cache";

const CACHE_KEY_CLUBS = "v1_clubs";
const CACHE_KEY_CATEGORIES = "v1_club_categories";

export interface ClubItem {
  id: number;
  name: string;
  category: string;
  nature: number;
  school: string;
  intro: string;
  introduction?: string;
  activities?: string;
  contact?: string;
  principal_name?: string;
  schoolId?: string;
  image_url?: string;
}

export async function getAllClub(forceRefresh = false): Promise<{
  clubs: ClubItem[];
  categories: string[];
}> {
  if (!forceRefresh) {
    const cached = await cacheManager.getAsync<ClubItem[]>(CACHE_KEY_CLUBS);
    const cachedCats = await cacheManager.getAsync<string[]>(CACHE_KEY_CATEGORIES);
    if (cached && Array.isArray(cached)) {
      return { clubs: cached, categories: cachedCats ?? ["全部"] };
    }
  }
  const [clubRes, catRes] = await Promise.all([
    serverGet<ClubItem[]>("/api/v1/clubs"),
    serverGet<string[]>("/api/v1/clubs/categories"),
  ]);
  const clubs = clubRes.data ?? [];
  void cacheManager.setAsync(CACHE_KEY_CLUBS, clubs);
  const categories = ["全部", ...(catRes.data ?? [])];
  void cacheManager.setAsync(CACHE_KEY_CATEGORIES, categories);
  return { clubs, categories };
}

export async function getClubDetail(id: number): Promise<ClubItem> {
  const res = await serverGet<ClubItem>(`/api/v1/clubs/${id}`);
  if (res && res.data) return res.data;
  throw new Error("社团不存在");
}

export async function addClub(data: Record<string, unknown>): Promise<{ success: boolean; message?: string }> {
  const res = await serverPost<{ success: boolean; message?: string }>("/api/v1/clubs", data);
  if (res?.success) {
    cacheManager.removeAsync(CACHE_KEY_CLUBS);
    cacheManager.removeAsync(CACHE_KEY_CATEGORIES);
  }
  return res;
}
