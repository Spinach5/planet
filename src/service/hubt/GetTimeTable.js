//https://jwxt.hbut.edu.cn/admin/api/getZclistByXnxq?xnxq=2025-2026-2&role=&userId=&xqid=1
//获取时间作息数组
import { hbutRequest } from "../../utils/request";
import { getSortedClassTimes } from "../../utils/hbut/timeHelper";
import { getCurrentSemester } from "./CurrentSemester";

export async function getTimeTable() {
	const loginConfig = {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			Referer: "https://jwxt.hbut.edu.cn",
			Origin: "https://jwxt.hbut.edu.cn",
		},
		// dataType: "text",
		withCredentials: true,
	};
	const semester=await getCurrentSemester();
	const response = await hbutRequest.get(
		"admin/api/getZclistByXnxq?xnxq=" + semester,
		loginConfig,
	);
	if (response.data.ret === 0) {
		return getSortedClassTimes(response.data.data.jcsjszList);
	} else {
		console.log("获取时间作息表,尝试重新登录");
		return [];
	}
}
