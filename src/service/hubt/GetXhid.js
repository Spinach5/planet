import { hbutRequest } from "../../utils/request";
//https://jwxt.hbut.edu.cn/admin/xsd/xyjc/getXsjbxx
export async function getXhid() {
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
		"/admin/xsd/xyjc/getXsjbxx",
		loginConfig,
	);
	const xhid = response.data.id;
	return xhid;
}
