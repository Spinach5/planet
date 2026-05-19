// 获取排课周次（所有周次信息）
import { hbutRequest } from "../../utils/request";
import cacheManager from "../../utils/cache";
import { extractZc } from "../../utils/hbut/weekHelper";
import { AutoRetry } from "./autoRetry";

const CACHE_KEY = "AllWeekData_"; // 定义缓存key

export async function getAllWeek(semester) {
	// 1. 优先从缓存获取
	console.log("传入的" + semester);
	const cached = cacheManager.get(CACHE_KEY + semester);
	if (cached) {
		console.log("[getAllWeek] 从缓存获取排课周次");
		return cached;
	}

	const fetchAllWeek = async () => {
		const loginConfig = {
			headers: {
				"Content-Type":
					"application/x-www-form-urlencoded; charset=UTF-8",
				Referer: "https://jwxt.hbut.edu.cn",
				Origin: "https://jwxt.hbut.edu.cn",
			},
			withCredentials: true,
		};

		const response = await hbutRequest.get(
			`/admin/api/getZclistByXnxq?xnxq=${semester}`,
			loginConfig,
		);
		return response;
	};
	try {
		// 检查 HTTP 状态码
		const response = await AutoRetry(fetchAllWeek, { maxRetry: 1 });
		if (response.status !== 200) {
			console.log("[getAllWeek] 网络请求失败, status:", response.status);
			throw new Error("获取排课周次失败：网络请求失败");
		}

		// 检查登录失效
		if (response.status === 300) {
			console.log("[getAllWeek] 登录失效，请重新登录");
			throw new Error("获取排课周次失败：登录失效，请重新登录");
		}

		// 检查业务返回码
		if (response.data?.ret !== 0) {
			console.log("[getAllWeek] 接口返回异常:", response.data);
			throw new Error("获取排课周次失败：接口返回 ret 不为 0");
		}

		const weekData = extractZc(response.data.data.zclist);

		// 验证数据有效性（验证是否为数组且不为空）
		if (!weekData || !Array.isArray(weekData) || weekData.length === 0) {
			console.log("[getAllWeek] 响应数据中无有效的 data 字段");
			throw new Error("获取排课周次失败：响应数据中无有效的排课周次数据");
		}

		// 3. 存入缓存（永不过期）
		cacheManager.set(CACHE_KEY + semester, weekData);
		console.log("[getAllWeek] 已缓存排课周次");

		return weekData;
	} catch (error) {
		// 如果错误已经是 Error 对象，直接抛出；否则包装一下
		if (error instanceof Error) {
			throw error;
		}
		throw new Error("获取排课周次失败：" + error);
	}
}
