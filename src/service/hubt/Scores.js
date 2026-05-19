// 学生成绩绩点
// https://hbut.jw.chaoxing.com/admin/xsd/xskp/xyqk?fasz=1&xhid=...
import { hbutRequest } from "../../utils/request";
import cacheManager from "../../utils/cache";
import { getXhid } from "./GetXhid"; // 需要获取 xhid
import { AutoRetry } from "./autoRetry";

const CACHE_KEY = "ScoresData"; // 定义缓存key

export async function getScores(forceRefresh = false) {
	// 1. 优先从缓存获取
	const cached = cacheManager.get(CACHE_KEY);
	if (cached && !forceRefresh) {
		console.log("[getScores] 从缓存获取成绩数据");
		return cached;
	}
	const fetchScores = async () => {
		const loginConfig = {
			headers: {
				"Content-Type":
					"application/x-www-form-urlencoded; charset=UTF-8",
				Referer: "https://jwxt.hbut.edu.cn",
				Origin: "https://jwxt.hbut.edu.cn",
			},
			withCredentials: true,
		};

		// 获取 xhid（参考 URL 中的 xhid 参数）
		const xhid = await getXhid();

		const response = await hbutRequest.get(
			`/admin/xsd/xskp/xyqk?xhid=${xhid}`,
			loginConfig,
		);
		return response;
	};

	try {
		const response = await AutoRetry(fetchScores, { maxRetry: 1 });
		// 检查 HTTP 状态码
		if (response.status !== 200) {
			console.log("[getScores] 网络请求失败, status:", response.status);
			throw new Error("获取成绩数据失败：网络请求失败");
		}

		// 检查登录失效
		if (response.status === 300) {
			console.log("[getScores] 登录失效，请重新登录");
			throw new Error("获取成绩数据失败：登录失效，请重新登录");
		}

		// 检查业务返回码
		if (response.data?.ret !== 0) {
			console.log("[getScores] 接口返回异常:", response.data);
			throw new Error("获取成绩数据失败：接口返回 ret 不为 0");
		}

		const scoresData = response.data.data;

		// 验证数据有效性
		if (!scoresData) {
			console.log("[getScores] 响应数据中无 data 字段");
			throw new Error("获取成绩数据失败：响应数据中无成绩数据");
		}

		// 可选：进一步验证 scoresData 的结构是否符合预期
		// 例如成绩通常应该是数组或包含特定字段的对象
		if (typeof scoresData !== "object") {
			console.log("[getScores] 响应数据格式异常");
			throw new Error("获取成绩数据失败：响应数据格式异常");
		}

		const extractData = {
			gpa: scoresData.gpa,
			averageScore: scoresData.pjcj,
			notPass: scoresData.bjgms,
			gpaRank: scoresData.gpazypm,
			gottenCredits: scoresData.hdzxf,
			chosenClass: scoresData.yxkms,
		};
		// 3. 存入缓存（永不过期）
		cacheManager.set(CACHE_KEY, extractData);
		console.log("[getScores] 已缓存成绩数据");

		return extractData;
	} catch (error) {
		// 如果错误已经是 Error 对象，直接抛出；否则包装一下
		if (error instanceof Error) {
			throw error;
		}
		throw new Error("获取成绩数据失败：" + error);
	}
}
