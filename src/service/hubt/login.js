// login.js
import { auth } from "./auth";
import Taro from "@tarojs/taro";
import { checkStuID } from "../../utils/checkStuID";
import userManager from "../userInfo";
import { getStuInfo } from "./StuInfo";

export async function login(stuId, password) {
	//清除缓存
	console.log(stuId, password)
	userManager.logout();

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
	userManager.setField("stuId", stuId);//设置学号
	userManager.setField("password", password);//设置密码

	const res = await auth();

	if (!res.success) {
		console.log("登录失败");
		Taro.showToast({
			title: res.message,
			icon: "none",
		});
		return false;
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
