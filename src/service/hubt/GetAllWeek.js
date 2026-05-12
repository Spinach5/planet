import { hbutRequest } from "../../utils/request";

export async function getAllWeek() {
	const loginConfig = {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			Referer: "https://jwxt.hbut.edu.cn",
			Origin: "https://jwxt.hbut.edu.cn",
		},
		// dataType: "text",
		withCredentials: true,
	};
	const response = await hbutRequest.get(
		"/admin/getCurrentPkZc",
		loginConfig,
	);
	if(response.data.ret === 0){
		return response.data.data.length-1;
	}
	else{
		console.log("获取排课周次失败,尝试重新登录");
		return 0;
	}
}
