import { hbutRequest } from "../../utils/request";

export async function getSchedule(time) {
	const loginConfig = {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			Referer: "https://jwxt.hbut.edu.cn",
			Origin: "https://jwxt.hbut.edu.cn",
		},
		withCredentials: true,
	};

	const response = await hbutRequest.get(`/admin/getDayBz?rq=${time}`,
        loginConfig);
        console.log(response.data.ret)
	if(response.data.ret === 0){
        console.log(response.data.data.bzList)
		return response.data.data.bzList;
	}
	else{
		return [];
	}
}
