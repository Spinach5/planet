import cacheManager from "../../utils/cache";
import { extractZc } from "../../utils/hbut/weekHelper";
import { hbutRequest } from "../../utils/request";

const CACHE_KEY_PREFIX = "AllWeekData_";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getAllWeek(semester?: string): Promise<any[]> {
  // Fallback to default endpoint if no semester provided (original Expo behavior)
  if (!semester) {
    const cachedDefault = await cacheManager.getAsync<unknown[]>("AllWeekData");
    if (cachedDefault) return cachedDefault;
    const loginConfig = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Referer: "https://jwxt.hbut.edu.cn",
        Origin: "https://jwxt.hbut.edu.cn",
      },
    };

    const resp = await hbutRequest.get("/admin/getCurrentPkZc", loginConfig);

    if (resp.status !== 200) {
      throw new Error("获取排课周次失败：网络请求失败");
    }

    const dt =
      typeof resp.data === "string"
        ? (JSON.parse(resp.data) as Record<string, unknown>)
        : (resp.data as Record<string, unknown>);

    if (dt?.ret !== 0) {
      throw new Error("获取排课周次失败：接口返回 ret 不为 0");
    }

    const weekData = dt.data;
    if (!weekData || !Array.isArray(weekData) || weekData.length === 0) {
      throw new Error("获取排课周次失败：响应数据中无有效的排课周次数据");
    }
    await cacheManager.setAsync("AllWeekData", weekData);
    return weekData as unknown[];
  }

  // Use semester-specific cache (matches Taro behavior)
  const cacheKey = CACHE_KEY_PREFIX + semester;
  const cached = await cacheManager.getAsync<unknown[]>(cacheKey);
  if (cached && cached.length) return cached;

  const loginConfig = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Referer: "https://jwxt.hbut.edu.cn",
      Origin: "https://jwxt.hbut.edu.cn",
    },
  };

  const response = await hbutRequest.get(
    `/admin/api/getZclistByXnxq?xnxq=${semester}`,
    loginConfig,
  );

  if (response.status !== 200) {
    throw new Error("获取排课周次失败：网络请求失败");
  }

  const data =
    typeof response.data === "string"
      ? (JSON.parse(response.data) as Record<string, unknown>)
      : (response.data as Record<string, unknown>);

  if (data?.ret !== 0) {
    throw new Error("获取排课周次失败：接口返回 ret 不为 0");
  }

  const weekData = extractZc(data);
  if (!weekData || !Array.isArray(weekData) || weekData.length === 0) {
    throw new Error("获取排课周次失败：响应数据中无有效的排课周次数据");
  }

  await cacheManager.setAsync(cacheKey, weekData);
  return weekData;
}
