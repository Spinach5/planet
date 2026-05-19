import { getSemesterList } from "../../utils/semesterHelper";
import { getGrade } from "../userInfo";
import { hbutRequest } from "../../utils/request";
import cacheManager from "../../utils/cache";
import { AutoRetry } from "./autoRetry";

const CACHE_KEY = "SemesterList"; // 定义缓存key

export async function getSemeseterList() {
	// 1. 优先从缓存获取（和第一段一致）
	const cached = cacheManager.get(CACHE_KEY);
	if (cached) {
		console.log("[getSemeseterList] 从缓存获取当前学期");
		return cached;
	}
	const fetchCurrentSemester = async () => {
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
			"/admin/xsd/xsdcjcx/getCurrentXnxq",
			loginConfig,
		);
		return response; // 返回完整响应对象
	};
	try {
		const response = await AutoRetry(fetchCurrentSemester, { maxRetry: 1 });

		if (response.status !== 200) {
			throw new Error(`网络请求失败，状态码: ${response.status}`);
		}
		if (response.data.ret !== 0) {
			throw new Error(`接口返回异常: ret=${response.data.ret}`);
		}

		const CurrentSemesterData = response.data.data;
		const OriginYear = getGrade();
		if (OriginYear === "0") {
			console.log("[getSemeseterList] 未获取到年级信息，请先登录");
			throw new Error("获取当前学期失败：未获取到年级信息，请先登录");
		}
		const SemesterList = getSemesterList(OriginYear, CurrentSemesterData);

		// 3. 存入缓存（永不过期，和第一段一致）
		cacheManager.set(CACHE_KEY, SemesterList);
		console.log("[getSemeseterList] 已缓存当前学期");

		return SemesterList;
	} catch (error) {
		console.error("[getAllSchedule] 获取失败:", error);
		throw error;
	}
}
