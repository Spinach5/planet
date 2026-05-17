import { hbutRequest } from "../../utils/request";
import cacheManager from "../../utils/cache";
import { extractRanks } from "../../utils/hbut/acadamicHelper";

const CACHE_KEY = "CreditsData";  // 定义缓存key

export async function getCredits() {
  // 1. 优先从缓存获取
  const cached = cacheManager.get(CACHE_KEY);
  if (cached) {
	console.log("[getCredits] 从缓存获取成绩数据");
	return cached;
  }

  const loginConfig = {
	headers: {
	  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
	  Referer: "https://jwxt.hbut.edu.cn",
	  Origin: "https://jwxt.hbut.edu.cn",
	},
	withCredentials: true,
	dataType: 'text',      // 期望返回 HTML
  };

  try {
	// 获取 xhid（参考 URL 中的 xhid 参数）

	const response = await hbutRequest.get(
	  `admin/cjgl/xscjbbdy/getXscjpm?xh=2410321409&sznj=2024&xnxq=2025-2026-2`,
	  loginConfig
	);

	// 检查 HTTP 状态码
	if (response.status !== 200) {
	  console.log("[getCredits] 网络请求失败, status:", response.status);
	  throw new Error("获取成绩数据失败：网络请求失败");
	}

	// 检查登录失效
	if (response.status === 300) {
	  console.log("[getCredits] 登录失效，请重新登录");
	  throw new Error("获取成绩数据失败：登录失效，请重新登录");
	}

	if (typeof response.data !== 'string') {
	  console.log("[getCredits] 响应数据格式异常");
	  throw new Error("获取成绩数据失败：响应数据格式异常");
	}

	const scoresData = extractRanks(response.data);

	// 验证数据有效性
	if (!scoresData) {
	  console.log("[getCredits] 响应数据中无 data 字段");
	  throw new Error("获取成绩数据失败：响应数据中无成绩数据");
	}


	// 3. 存入缓存（永不过期）
	cacheManager.set(CACHE_KEY, scoresData);
	console.log("[getCredits] 已缓存成绩数据");

	return scoresData;

  } catch (error) {
	// 如果错误已经是 Error 对象，直接抛出；否则包装一下
	if (error instanceof Error) {
	  throw error;
	}
	throw new Error("获取成绩数据失败：" + error);
  }
}
