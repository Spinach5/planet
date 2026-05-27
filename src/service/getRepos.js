import { giteeRequest } from "../utils/request";
import cacheManager from "../utils/cache";

const CACHE_KEY = "GiteeRepos";
const PER_PAGE = 100;

export async function getRepos(force = false) {
  const cached = cacheManager.get(CACHE_KEY);
  if (cached && !force) {
    console.log("[getRepos] 从缓存获取仓库列表");
    return cached;
  }

  const token = process.env.TARO_APP_GITEE;
  if (!token) {
    console.warn("[getRepos] TARO_APP_GITEE 未配置");
    return [];
  }

  try {
    let allRepos = [];
    let page = 1;

    while (true) {
      console.log(`[getRepos] 正在获取第 ${page} 页...`);
      const response = await giteeRequest.get(
        `api/v5/user/repos?access_token=${token}&page=${page}&per_page=${PER_PAGE}&sort=full_name&direction=asc`,
      );

      if (response.status !== 200) {
        console.warn("[getRepos] 请求失败, status:", response.status);
        break;
      }

      const repos = response.data;
      if (!repos || repos.length === 0) {
        console.log("[getRepos] 所有仓库获取完毕");
        break;
      }

      const mapped = repos.map((repo) => ({
        name: repo.full_name,
        url: repo.html_url,
      }));
      allRepos = allRepos.concat(mapped);

      if (repos.length < PER_PAGE) break;
      page++;
    }

    cacheManager.set(CACHE_KEY, allRepos);
    console.log(`[getRepos] 已缓存 ${allRepos.length} 个仓库`);

    return allRepos;
  } catch (error) {
    console.warn("获取仓库列表失败:", error);
    return cached || [];
  }
}
