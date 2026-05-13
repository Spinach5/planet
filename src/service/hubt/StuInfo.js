import { hbutRequest } from "../../utils/request";
import { getXhid } from "./GetXhid";
export async function getStuInfo() {
	const loginConfig = {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			Referer: "https://jwxt.hbut.edu.cn",
			Origin: "https://jwxt.hbut.edu.cn",
		},
		// dataType: "text",
		withCredentials: true,
	};
	const xhid=getXhid();
	const response = await hbutRequest.get(
		`/admin/xsd/xskp/xskp?xhid=${xhid}`,
		loginConfig,
	);
	if(response.data.ret === 0){
		return response.data.data;
	}
	else{
		console.log("获取学生信息失败");
		return null;
	}
}
