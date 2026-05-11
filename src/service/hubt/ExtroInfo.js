import { hbutRequest } from "../../utils/request";

export async function getExtroInfo() {
	const loginConfig = {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			Referer: "https://jwxt.hbut.edu.cn",
			Origin: "https://jwxt.hbut.edu.cn",
		},
		// dataType: "text",
		withCredentials: true,
	};

	const params = new URLSearchParams();
	params.append("type", 1);
	params.append("zc", 10);
	const response = await hbutRequest.post(
		"/admin/getXsdSykb",
		params,
		loginConfig,
	);
	if(response.data.ret === 0){
		return response.data.data.sjk;
	}
	else{
		console.log("获取实践信息失败");
		return [];
	}
}
