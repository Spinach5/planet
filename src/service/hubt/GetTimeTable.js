//https://jwxt.hbut.edu.cn/admin/api/getZclistByXnxq?xnxq=2025-2026-2&role=&userId=&xqid=1
//获取时间作息数组
import { getSortedClassTimes } from "../../utils/hbut/timeHelper";
import cacheManager from "../../utils/cache";
import { hbutRequest } from "../../utils/request";
import { AutoRetry } from "./autoRetry";

const CACHE_KEY = "timetable";

export async function getTimeTable(semester) {
	// 1. 优先从缓存获取
	const cached = cacheManager.get(CACHE_KEY);
	if (cached) {
		return cached;
	}
	const fetchTimeTable = async () => {
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
			"admin/api/getZclistByXnxq?xnxq=" + semester,
			loginConfig,
		);
		return response;
	};
	try {
		// 2. 缓存未命中，发起请求
		const response = await AutoRetry(fetchTimeTable, { maxRetry: 1 });
		if (response.status !== 200) {
			console.log("[getXhid] 网络请求失败");
			throw new Error("获取时间表失败：网络请求失败");
		}
		if (response.status === 300) {
			console.log("[getXhid] 登录失效，请重新登录");
			throw new Error("获取时间表失败：登录失效，请重新登录");
		}
		if (response.data.ret !== 0) {
			console.log("[getCurrentWeek] 接口返回异常:", response.data);
			throw new Error("获取时间表失败：接口返回 ret 不为 0");
		}
		if (!response.data.data.jcsjszList) {
			throw new Error("获取 时间表 失败：响应数据中无 jcsjszList 字段");
		}

		// 清洗时间表
		const timetable = getSortedClassTimes(response.data.data.jcsjszList);

		// 3. 存入缓存（永不过期）
		cacheManager.set(CACHE_KEY, timetable);
		console.log("[timetable] 已缓存 xhid:");

		return timetable;
	} catch (error) {
		// 如果错误已经是 Error 对象，直接抛出；否则包装一下
		if (error instanceof Error) {
			throw error;
		}
		throw new Error("获取排课周次失败：" + error);
	}
}
