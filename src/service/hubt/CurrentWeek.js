// 获取当前周数
import { hbutRequest } from "../../utils/request";
import cacheManager from "../../utils/cache";
import { AutoRetry } from "./autoRetry";

const CACHE_KEY = "CurrentWeek "; // 定义缓存key

export async function getCurrentWeek() {
	// 1. 优先从缓存获取
	const cached = cacheManager.get(CACHE_KEY);
	if (cached) {
		console.log("[getCurrentWeek] 从缓存获取当前周数");
		return cached;
	}
	const fetchCurrentWeek = async () => {
		const loginConfig = {
			headers: {
				"Content-Type":
					"application/x-www-form-urlencoded; charset=UTF-8",
				Referer: "https://jwxt.hbut.edu.cn",
				Origin: "https://jwxt.hbut.edu.cn",
			},
			withCredentials: true,
		};
		const response = await hbutRequest.post(
			"/admin/api/getXlzc",
			loginConfig,
		);
		return response; // 返回完整响应对象
	};

	try {
		const response = await AutoRetry(fetchCurrentWeek, { maxRetry: 1 });

		if (response.status !== 200) {
			console.log(
				"[getCurrentWeek] 网络请求失败, status:",
				response.status,
			);
			throw new Error("获取当前周数失败：网络请求失败");
		}

		// 检查登录失效
		if (response.status === 300) {
			console.log("[getCurrentWeek] 登录失效，请重新登录");
			throw new Error("获取当前周数失败：登录失效，请重新登录");
		}

		// 检查业务返回码
		if (response.data?.ret !== 0) {
			console.log("[getCurrentWeek] 接口返回异常:", response.data);
			throw new Error("获取当前周数失败：接口返回 ret 不为 0");
		}

		const currentWeek = response.data.data?.xlzc;

		// 验证数据有效性（类似 getXhid 中检查 id 是否存在）
		if (currentWeek === undefined || currentWeek === null) {
			console.log("[getCurrentWeek] 响应数据中无 xlzc 字段");
			throw new Error("获取当前周数失败：响应数据中无 xlzc 字段");
		}

		// 3. 存入缓存（永不过期，和 getSemeseterList 一致）
		cacheManager.set(CACHE_KEY, currentWeek);
		console.log("[getCurrentWeek] 已缓存当前周数:", currentWeek);

		return currentWeek;
	} catch (error) {
		// 如果错误已经是 Error 对象，直接抛出；否则包装一下
		if (error instanceof Error) {
			throw error;
		}
		throw new Error("获取当前周数失败：" + error);
	}
}
