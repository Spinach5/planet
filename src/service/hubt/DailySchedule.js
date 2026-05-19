// 获取每日作息
import { hbutRequest } from "../../utils/request";
import cacheManager from "../../utils/cache";
import { AutoRetry } from "./autoRetry";

// 注意：因为每天的时间参数不同，缓存key需要包含日期参数
const getCacheKey = (time) => `DailySchedule_${time}`;

export async function getDailySchedule(time) {
  // 1. 优先从缓存获取（根据时间参数生成不同的缓存key）
  const cacheKey = getCacheKey(time);
  const cached = cacheManager.get(cacheKey);
  if (cached) {
    console.log(`[getDailySchedule] 从缓存获取作息数据，时间: ${time}`);
    return cached;
  }
  const fetchDailySchedule = async ()=>{
	  const loginConfig = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Referer: "https://jwxt.hbut.edu.cn",
      Origin: "https://jwxt.hbut.edu.cn",
    },
    withCredentials: true,
  };

    const response = await hbutRequest.get(
      `/admin/getDayBz?rq=${time}`,
      loginConfig
    );
	return response;
  }

  try{
	const response = await AutoRetry(fetchDailySchedule, {maxRetry:1})
    // 检查 HTTP 状态码
    if (response.status !== 200) {
      console.log("[getDailySchedule] 网络请求失败, status:", response.status);
      throw new Error("获取作息数据失败：网络请求失败");
    }

    // 检查登录失效
    if (response.status === 300) {
      console.log("[getDailySchedule] 登录失效，请重新登录");
      throw new Error("获取作息数据失败：登录失效，请重新登录");
    }

    // 检查业务返回码
    if (response.data?.ret !== 0) {
      console.log("[getDailySchedule] 接口返回异常:", response.data);
      throw new Error("获取作息数据失败：接口返回 ret 不为 0");
    }

    const bzList = response.data.data?.bzList;

    // 验证数据有效性
    if (!bzList || !Array.isArray(bzList)) {
      console.log("[getDailySchedule] 响应数据中无有效的 bzList 字段");
      throw new Error("获取作息数据失败：响应数据中无有效的 bzList 字段");
    }

    // 3. 存入缓存（永不过期）
    cacheManager.set(cacheKey, bzList);
    console.log(`[getDailySchedule] 已缓存作息数据，时间: ${time}`);

    return bzList;

  } catch (error) {
    // 如果错误已经是 Error 对象，直接抛出；否则包装一下
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("获取作息数据失败：" + error);
  }
}
