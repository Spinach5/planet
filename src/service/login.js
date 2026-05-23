// login.js
import Taro from "@tarojs/taro";
import { checkStuID } from "../utils/checkStuID";
import userManager from "./userInfo";
import { getSchool } from "./router";
import runtimeLogger from "../utils/runtimeLogger";

const SUPPORTED_UNIVERSITIES = ["湖北工业大学", "武汉科技大学"];

export async function login(stuId, password, university) {
	// 清除旧缓存
	userManager.logout();

	// 校验学校（修正 indexOf 逻辑）
	if (SUPPORTED_UNIVERSITIES.indexOf(university) === -1) {
		await Taro.showToast({ title: "暂不支持该学校", icon: "error" });
		return false;
	}

	if (!checkStuID(stuId)) {
		await Taro.showToast({ title: "学号格式错误", icon: "none" });
		return false;
	}
	if (!password) {
		await Taro.showToast({ title: "密码不能为空", icon: "none" });
		return false;
	}

	// 保存基本信息（避免明文密码落盘，仅内存）
	userManager.setField("stuId", stuId);
	userManager.setField("university", university);
	userManager.setField("password", password); // 不建议存储明文密码

	// 执行登录（auth 应根据 university 调用不同接口）
	let authRes;
	try {
		const school = getSchool();
		authRes = await school.auth();
	} catch (err) {
		runtimeLogger.error("Login", "登录请求异常", err);
		await Taro.showToast({ title: "网络错误", icon: "none" });
		return false;
	}

	if (!authRes?.success) {
		const msg = authRes?.message || "登录失败，请检查账号密码";
		runtimeLogger.warn("Login", msg);
		await Taro.showToast({ title: msg, icon: "error", duration: 3000 });
		return false;
	}

	// 获取用户详细信息
	let stuInfo;
	try {
		stuInfo = await school.getStuInfo();
	} catch (err) {
		runtimeLogger.error("Login", "获取用户信息失败", err);
		await Taro.showToast({ title: "获取用户信息失败", icon: "none" });
		return false;
	}

	if (!stuInfo) {
		await Taro.showToast({ title: "获取用户信息失败", icon: "none" });
		return false;
	}

	userManager.setFields(stuInfo);
	userManager.setField("isLoggedIn", true);
	runtimeLogger.info("Login", `登录成功: ${stuInfo.stuId || stuId}`);
	await Taro.showToast({ title: "登录成功", icon: "success" });
	return true;
}
