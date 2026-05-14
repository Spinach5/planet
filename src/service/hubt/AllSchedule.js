// 获取所有课表
import cacheManager from "../../utils/cache";
import { hbutRequest } from "../../utils/request";
import { getXhid } from "./GetXhid";
import { extractCourseData } from "../../utils/hbut/courseHelper";

const CACHE_KEY = "All_COURSE_"; // 定义缓存key

export async function getAllSchedule(semester) {
	// 1. 优先从缓存获取（和第一段一致）
	const cached = cacheManager.get(CACHE_KEY + semester);
	if (cached) {
		console.log("[getCurrentWeek] 从缓存获取课表");
		return cached;
	}

	// 2. 缓存未命中，发起请求
	const loginConfig = {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			Referer: "https://jwxt.hbut.edu.cn",
			Origin: "https://jwxt.hbut.edu.cn",
		},
		withCredentials: true,
	};

	try {
		const xhid = await getXhid();

		const response = await hbutRequest.get(
			`admin/pkgl/xskb/sdpkkbList?xnxq=${semester}&xhid=${xhid}`,
			loginConfig,
		);

		// 检查 HTTP 状态码
		if (response.status !== 200) {
			console.log(
				"[getCurrentWeek] 网络请求失败, status:",
				response.status,
			);
			throw new Error("获取课表失败：网络请求失败");
		}

		// 检查登录失效
		if (response.status === 300) {
			console.log("[getCurrentWeek] 登录失效，请重新登录");
			throw new Error("获取课表失败：登录失效，请重新登录");
		}

		// 检查业务返回码
		if (response.data.ret !== 0) {
			console.log("[getCurrentWeek] 接口返回异常:", response.data);
			throw new Error("获取课表失败：接口返回 ret 不为 0");
		}

		const courseData = extractCourseData(response.data.data);
		console.log(courseData);
		// 3. 存入缓存（永不过期，和第一段一致）
		cacheManager.set(CACHE_KEY + semester, courseData);
		console.log("[getCurrentWeek] 已缓存课表数据");

		return courseData;
	} catch (error) {
		// 如果错误已经是 Error 对象，直接抛出；否则包装一下
		if (error instanceof Error) {
			throw error;
		}
		throw new Error("获取课表失败：" + error);
	}
}
