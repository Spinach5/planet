import { hbutRequest } from "../../utils/request";

export async function getCurrentWeek() {
	const loginConfig = {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			Referer: "https://jwxt.hbut.edu.cn",
			Origin: "https://jwxt.hbut.edu.cn",
		},
		dataType: "text",
		withCredentials: true,
	};

	const response = await hbutRequest.post(
		"/admin/api/getXlzc",
		 loginConfig);
	if(response.data.ret === 0){
		return response.data.data.xlzc;
	}
	else{
		console.log("获取当前周数失败")
		console.log(response.data);
		return -1;

	}
}
