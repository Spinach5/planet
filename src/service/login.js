// login.js
import { auth } from "./hubt/auth";
import Taro from "@tarojs/taro";
import { checkStuID } from "../utils/checkStuID";
import userManager from "./userInfo";
import { getStuInfo } from "./hubt/StuInfo";
//目前实现的学校
const universitys = ["湖北工业大学"]
export async function login(stuId, password,university) {
	//清除缓存
	console.log(stuId, password,university);
	userManager.logout();
	//检测学校
	if (!universitys.indexOf(university)) {
		Taro.showToast({
			title: "暂不支持该学校",
			icon: "error",
		});
		return false;
	}


	if (!checkStuID(stuId)) {
		Taro.showToast({
			title: "学号格式错误",
			icon: "none",
		});
		return false;
	}
	if (!password) {
		Taro.showToast({
			title: "密码不能为空",
			icon: "none",
		});
		return false;
	}
	userManager.setField("stuId", stuId); //设置学号
	userManager.setField("password", password); //设置密码
	userManager.setField("university", university); //设置学校
	const res = await auth();

	if (!res.success) {
		console.log("登录失败");
		setTimeout(() => {
			// Taro.showToast({
			// 	title: res.message,
			// 	icon: "error",
			// 	duration: 5000,
			// });
			return false;
		}, 10);
	}
	//这里获取用户信息

	const stuInfo = await getStuInfo();

	if (!stuInfo) {
		console.log("获取用户信息失败");
		Taro.showToast({
			title: "获取用户信息失败",
			icon: "none",
		});
		return false;
	}
	userManager.setFields(stuInfo);
	userManager.setField("isLoggedIn", true);
	return true;
}
