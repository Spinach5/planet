import Taro from "@tarojs/taro";
import { encryptByAES } from "../utils/xxt";
import { request } from "../utils/request";
import { API_BASE } from "../config/api";
import { extractOtherFromHtml, extractXhidFromHtml } from "../utils/rex";
// ==================== 常量 ====================
const NOTEYD_BASE_URL = "https://noteyd.chaoxing.com";

// ==================== 登录相关 ====================

/** 登录并获取 mitudz 域 Cookies */
// schedule.js - login 函数中的响应处理部分
export async function login(username, password) {
	console.log("=== 开始登录 ===");
	console.log("用户名:", username);

	// 1. 获取动态 AES 密钥
	let aeskey = "u2oh6Vu^HWe4_AES";
	try {
		const res = await Taro.request({
			url: `${API_BASE.passportStatic}/js/fanya/login.js`,
			header: { Referer: "https://i.chaoxing.com" },
		});
		console.log("获取密钥响应状态:", res.statusCode);

		// ✅ 修正：res.data 就是响应内容
		if (res.data && typeof res.data === "string") {
			const match = res.data.match(/var transferKey\s*=\s*"([^"]+)"/);
			if (match) {
				aeskey = match[1];
				console.log("获取到 AES 密钥:", aeskey);
			} else {
				console.log("未匹配到密钥，使用默认值");
			}
		} else {
			console.log("响应数据无效，使用默认密钥");
		}
	} catch (e) {
		console.log("获取远程登录 JS 失败，使用默认密钥", e.message);
	}

	// 2. 加密
	const encodedUser = encryptByAES(username, aeskey);
	const encodedPass = encryptByAES(password, aeskey);
	console.log("加密完成");

	// 3. 登录请求
	const loginUrl = `${API_BASE.passport}/fanyalogin`;
	console.log("登录URL:", loginUrl);

	const loginRes = await request(loginUrl, {
		method: "POST",
		data: {
			uname: encodedUser,
			password: encodedPass,
			refer: "https%3A%2F%2Fi.chaoxing.com",
			t: "true",
		},
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Referer: "https://passport2.chaoxing.com/login",
		},
	});

	console.log("=== 登录响应详情 ===");
	console.log("响应状态码:", loginRes?.statusCode);
	console.log("响应数据类型:", typeof loginRes?.data);
	console.log("响应数据:", loginRes?.data);

	// 检查响应
	if (!loginRes) {
		console.error("请求无响应");
		return false;
	}

	if (loginRes.statusCode !== 200) {
		console.error("HTTP 状态码错误:", loginRes.statusCode);
		return false;
	}

	let responseData = loginRes.data;

	// 如果是字符串，尝试解析 JSON
	if (typeof responseData === "string") {
		console.log("响应是字符串，长度:", responseData.length);
		console.log("响应内容预览:", responseData.substring(0, 200));
		try {
			responseData = JSON.parse(responseData);
			console.log("JSON 解析成功:", responseData);
		} catch (e) {
			console.log("不是 JSON 格式，可能是 HTML");
			// 如果是 HTML，可能登录失败，检查是否包含错误信息
			if (
				responseData.includes("登录失败") ||
				responseData.includes("用户名或密码错误")
			) {
				console.error("登录失败: 用户名或密码错误");
				return false;
			}
		}
	}

	if (!responseData || !responseData.status) {
		console.error("登录失败，响应数据:", responseData);
		return false;
	}

	const realUrl = decodeURIComponent(responseData.url);
	console.log("登录成功，跳转URL:", realUrl);

	// 4. 同步主域 Cookie
	try {
		console.log("[1] 访问跳转URL同步 Cookie...");
		await request(realUrl, {
			headers: { Referer: "https://passport2.chaoxing.com/login" },
		});

		console.log("[2] 访问个人空间...");
		await request("https://i.chaoxing.com/base", {
			headers: { Referer: "https://i.chaoxing.com" },
		});

		console.log("[3] SSO 跳转获取 mitudz...");
		const authUrl =
			"https://vkb.jw.chaoxing.com/admin/api/xxtlogin?loginUrl=https%3A%2F%2Fhbut.jw.chaoxing.com%2Fadmin%2Flogin2%3Frole%3Dxs%26url%3Dhttps%253A%252F%252Fmitudz.jw.chaoxing.com%252Fviews%252FhomePage.html%253Frole%253D1%2526domainUrl%253Dhbut.jw.chaoxing.com";
		await request(authUrl, {
			headers: { Referer: "https://i.chaoxing.com/base" },
		});

		console.log("登录完成，Cookie 已保存");
		return true;
	} catch (err) {
		console.error("同步 Cookie 失败:", err);
		return false;
	}
}

// ==================== 课表相关 ====================

/** 提取 xhid */
export async function extractXhid() {
	const res = await request(
		`${API_BASE.hbut}/admin/pkgl/xskb/queryKbForXsd`,
		{ responseType: "text" },
	);
	return extractXhidFromHtml(res.data);
}

/** 当前学年学期 */
export async function getCurrentSemester() {
	const res = await request(
		`${API_BASE.hbut}/v2/system/jcsj/xnxq/getCurrentXnxq?crossOrigin=true`,
		{
			method: "POST",
			headers: {
				Referer: "https://i.chaoxing.com",
				Accept: "application/json, text/plain, */*",
			},
		},
	);
	if (res.data.code === 1) {
		const [year, , semester] = res.data.data.xnxq.split("-");
		return { year: parseInt(year), semester: parseInt(semester) };
	}
	return null;
}

/** 获取课表 */
export async function getClassSchedule(year, semester, xhid) {
	const url = `${API_BASE.hbut}/admin/pkgl/xskb/sdpkkbList?xnxq=${year}-${year + 1}-${semester}&xhid=${xhid}`;
	const res = await request(url, {
		headers: { Referer: url, Accept: "application/json, text/plain, */*" },
	});
	return res.data.ret === 0 ? res.data : null;
}

/** 提取实践环节等附加信息 */
export async function extractOther(year, semester) {
	const url = `${API_BASE.hbut}/admin/pkgl/xskb/queryKbForXsd?xnxq=${year}-${year + 1}-${semester}`;
	const res = await request(url, { responseType: "text" });
	return extractOtherFromHtml(res.data);
}

/** 当前周次 */
export async function getCurrentWeek() {
	const res = await request(`${API_BASE.hbut}/admin/api/getXlzc`);
	if (res.data.ret === 0) {
		console.log("当前周次:", res.data.data.xlzc);
		return res.data.data.xlzc;
	}
	return null;
}

// ==================== 学生信息相关 ====================

/** 用户信息 */
export async function getUserInfo() {
	const res = await request(
		`${API_BASE.hbut}/v2/xjgl/xsjbxx/getXsjbxxByUser`,
		{
			method: "POST",
			headers: { Referer: "https://i.chaoxing.com" },
		},
	);
	return res.data.code === 1 ? res.data.data : null;
}

/** 专业排名 */
export async function getUserRank() {
	const res = await request(`${API_BASE.hbut}/v2/xsd/index/getXsZypm`, {
		method: "POST",
		headers: { Referer: "https://i.chaoxing.com" },
	});
	return res.data.code === 1 ? res.data.data : null;
}

/** 所在单位 */
export async function getUserUnit() {
	const res = await request(
		NOTEYD_BASE_URL +
			"/proxy/apis/proxy/proxyApiReq?uuid=uidbelongfids&crossOrigin=true&proxy_url=%2Fapi%2Fv2%2Fuidbelongfids",
		{
			method: "POST",
			headers: { Referer: "https://i.chaoxing.com" },
		},
	);
	return res.data.result === 1 ? res.data.data : null;
}

/** 平均学分绩点 */
export async function getAverageScore() {
	const res = await request(`${API_BASE.hbut}/v2/xsd/index/getXsPjxfjd`, {
		method: "POST",
		headers: { Referer: "https://i.chaoxing.com" },
	});
	return res.data.code === 1 ? res.data.data : null;
}

/** 考试信息 */
export async function getExamInfo() {
	const res = await request(`${API_BASE.hbut}/v2/xsd/index/listXsdXsksap`, {
		method: "POST",
		headers: { Referer: "https://i.chaoxing.com" },
	});
	return res.data.code === 1 ? res.data.data : null;
}

/** 已修学分 */
export async function getScoreGotten() {
	const res = await request(`${API_BASE.hbut}/v2/xsd/index/getXsXfAndZxf`, {
		method: "POST",
		headers: { Referer: "https://i.chaoxing.com" },
	});
	return res.data.code === 1 ? res.data.data : null;
}

/** 学业完成度 */
export async function getStudentAcademic() {
	const res = await request(
		`${API_BASE.hbut}/v2/xsd/index/getStudentAcademicCompletionRate`,
		{
			method: "POST",
			headers: { Referer: "https://i.chaoxing.com" },
		},
	);
	return res.data.code === 1 ? res.data.data : null;
}

/** 学期列表 */
export async function getSemesterList() {
	const res = await request(
		`${API_BASE.hbut}/v2/system/jcsj/xnxq/getXnxqList?crossOrigin=true`,
		{
			method: "POST",
			headers: { Referer: "https://i.chaoxing.com" },
		},
	);
	return res.data.code === 1 ? res.data.data : null;
}

/** 成绩列表 */
export async function getScoreList() {
	const res = await request(`${API_BASE.hbut}/v2/xsd/index/listXsdXscj`, {
		method: "POST",
		headers: { Referer: "https://i.chaoxing.com" },
	});
	return res.data.code === 1 ? res.data.data : null;
}

/** 不及格门数及学分 */
export async function getNotpassList() {
	const res = await request(`${API_BASE.hbut}/v2/xsd/index/getXsBjgmsAndXf`, {
		method: "POST",
		headers: { Referer: "https://i.chaoxing.com" },
	});
	return res.data.code === 1 ? res.data.data : null;
}

// ==================== 便捷方法：一次性获取所有课表数据 ====================

export async function fetchAllScheduleData(username, password) {
	const loginSuccess = await login(username, password);
	if (!loginSuccess) {
		throw new Error("登录失败");
	}

	const xhid = await extractXhid();
	if (!xhid) {
		throw new Error("获取 xhid 失败");
	}

	const semesterInfo = await getCurrentSemester();
	if (!semesterInfo) {
		throw new Error("获取学年学期失败");
	}

	const { year, semester } = semesterInfo;
	const schedule = await getClassSchedule(year, semester, xhid);
	const extraInfo = await extractOther(year, semester);

	return { schedule, extraInfo };
}
