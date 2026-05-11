import { hbutRequest } from "../../utils/request";

export async function getXhid() {
	const loginConfig = {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			Referer: "https://jwxt.hbut.edu.cn",
			Origin: "https://jwxt.hbut.edu.cn",
		},
		dataType: "text",
		withCredentials: true,
	};
	const response = await hbutRequest.get(
		"/admin/pkgl/xskb/queryKbForXsd",
		loginConfig,
	);
	const html = response.data;
	const xhidMatch = html.match(/id="xhid"\s+value="([^"]+)"/);
	const xhid = xhidMatch ? xhidMatch[1] : null;
	return xhid;
}
