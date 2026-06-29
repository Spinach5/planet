// Clubs API — matches Taro src/service/hbut/clubs.js
import { serverGet, serverPost } from "@/utils/serverRequest";
import { withCache } from "@/service/utils";

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

export const getAllClub = withCache(
  async (_forceRefresh = false): Promise<{ clubs: ClubItem[]; categories: string[] }> => {
    const [clubRes, catRes] = await Promise.all([
      serverGet<ClubItem[]>("/api/v1/clubs"),
      serverGet<string[]>("/api/v1/clubs/categories"),
    ]);
    const clubs = clubRes.data ?? [];
    const categories = ["全部", ...(catRes.data ?? [])];
    return { clubs, categories };
  },
  { cacheKey: "v1_clubs", ttl: 5 * 60 * 1000 },
);

export async function getClubDetail(id: number): Promise<ClubItem> {
  const res = await serverGet<ClubItem>(`/api/v1/clubs/${id}`);
  if (res.data) return res.data;
  throw new Error("社团不存在");
}

export async function addClub(data: Record<string, unknown>): Promise<{ success: boolean; message?: string }> {
  const res = await serverPost<{ success: boolean; message?: string }>("/api/v1/clubs", data);
  if (res.success) {
    await getAllClub.invalidate();
  }
  return res;
}
