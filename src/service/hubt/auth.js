// auth.js
import { hbutRequest } from "../../utils/request";
import encryptPassword from "../../utils/hbut/loginEncrypt";
import userManager from "../userInfo";

export async function auth() {
	const { stuId, password } = userManager.getAccount();
	console.log("正在登录，账号:", stuId);
	console.log("正在登录，密码:", password);
	let encodedPassword;
	try {
		encodedPassword = encryptPassword(password);
		if (!encodedPassword) {
			console.error("密码加密失败");
			return { success: false, message: "密码加密失败" };
		}
	} catch (e) {
		console.error(`加密异常: ${e.message}`);
		return { success: false, message: `加密异常: ${e.message}` };
	}

	const params = new URLSearchParams();
	params.append("username", stuId);
	params.append("password", encodedPassword);
	params.append("rememberMe", "1");
	params.append("vcode", "");
	params.append("jcaptchaCode", "");

	const loginConfig = {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			Referer: "https://jwxt.hbut.edu.cn",
			Origin: "https://jwxt.hbut.edu.cn",
		},
		dataType: "text", // 期望返回 HTML
		withCredentials: true,
	};

	try {
		const response = await hbutRequest.post(
			"/admin/login",
			params,
			loginConfig,
		);

		// 判断登录是否成功的逻辑
		const responseData = response.data;

		// 1. 检查是否返回 JSON（失败情况）
		if (
			typeof responseData === "object" ||
			responseData?.startsWith("{") ||
			responseData?.startsWith("[")
		) {
			try {
				const jsonData =
					typeof responseData === "object"
						? responseData
						: JSON.parse(responseData);

				// 根据返回的 JSON 判断失败原因
				if (jsonData.code !== 0 && jsonData.code !== 200) {
					console.error(
						"登录失败:",
						jsonData.message || jsonData.msg || "未知错误",
					);
					return {
						success: false,
						message: jsonData.message || jsonData.msg || "登录失败",
						data: jsonData,
					};
				}
			} catch (e) {
				// 不是有效的 JSON，继续按 HTML 处理
				console.log(e);
			}
		}

		// 2. 检查 HTML 特征（成功情况）

		// 3. 检查 HTTP 状态码（如果请求库会抛出错误，则在 catch 中处理）
		if (response.statusCode && response.statusCode !== 200) {
			console.error(`HTTP 错误: ${response.statusCode}`);
			return {
				success: false,
				message: `HTTP 错误: ${response.statusCode}`,
			};
		}

		// 4. 默认情况：返回 HTML 但不确定是否成功，保守处理
		console.log("登录状态，返回了 HTML");

		return {
			success: true, // 根据实际情况调整，或进一步检查
			message: "登录请求已完成，请验证",
			data: responseData,
		};
	} catch (error) {
		// 5. 请求异常处理（网络错误、超时等）
		console.error("登录请求异常:", error);

		// 尝试获取响应数据（如果有的话）
		if (error.response) {
			const errorData = error.response.data;
			// 判断返回的是否是 JSON 错误信息
			if (typeof errorData === "object") {
				return {
					success: false,
					message: errorData.message || errorData.msg || "请求失败",
					data: errorData,
				};
			}
		}

		return {
			success: false,
			message: error.message || "网络请求失败",
			error: error,
		};
	}
}
