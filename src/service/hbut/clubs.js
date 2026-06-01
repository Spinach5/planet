// 获取所有社团
import cacheManager from "../../utils/cache";
import { opendiffRequest } from "../../utils/request";
import runtimeLogger from "../../utils/runtimeLogger";

const CACHE_KEY_CLUBS = "All_CLUBS";
const CACHE_KEY_CLUBCATEGORY = "ALL_CLUBCATEGORY"

export async function getAllClub(forceRefresh = false) {
    const cached_clubs = cacheManager.get(CACHE_KEY_CLUBS);
    const cached_clubcategory = cacheManager.get(CACHE_KEY_CLUBCATEGORY);
    if (cached_clubs && cached_clubcategory && !forceRefresh) {
        console.log("[getAllClub] 从缓存获取社团");
        return { club: cached_clubs, clubcategory: cached_clubcategory };
    }

    // 实际请求函数
    const fetchClubs = async () => {
        const club_res = await opendiffRequest.get('/opendiff/clubs')
        const club_category_res = await opendiffRequest.get('/opendiff/clubcategory')
        return { club: club_res.data, clubcategory: club_category_res.data };
    };

    try {
        // TODO 自动重试
        const response = await fetchClubs()
        cacheManager.set(CACHE_KEY_CLUBS, response.club);
        cacheManager.set(CACHE_KEY_CLUBCATEGORY, response.clubcategory);
        console.log(`[getAllClub] 已缓存社团数据`);
        return response;
    } catch (error) {
        runtimeLogger.error("Club", "获取社团列表失败", error);
        throw error;
    }
}
