//获取所有课表
import { hbutRequest } from "../../utils/request";
import xhidManager from './XHid'

export async function getCurrentWeek(semster) {
	const loginConfig = {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			Referer: "https://jwxt.hbut.edu.cn",
			Origin: "https://jwxt.hbut.edu.cn",
		},
		dataType: "text",
		withCredentials: true,
	};
	const xhid = await xhidManager.getXhid()
	const response = await hbutRequest.get(`admin/pkgl/xskb/sdpkkbList?xnxq=${semster}&xhid=${xhid}`, loginConfig);
	if(response.data.ret === 0){
		return response.data.data;
	}
	else{
		return [];
		console.log(response.data);
	}
}

