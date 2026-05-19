// src/service/hubt/getXhid.js
import cacheManager from "../../utils/cache";
import { hbutRequest } from "../../utils/request";
import { AutoRetry } from "./autoRetry";

const CACHE_KEY = "xhid";

export async function getXhid() {
	// 1. 优先从缓存获取
	const cached = cacheManager.get(CACHE_KEY);
	if (cached) {
		return cached;
	}

	// 2. 缓存未命中，发起请求
	const fetchXhid = async () => {
		const loginConfig = {
			headers: {
				"Content-Type":
					"application/x-www-form-urlencoded; charset=UTF-8",
				Referer: "https://jwxt.hbut.edu.cn",
				Origin: "https://jwxt.hbut.edu.cn",
			},
			withCredentials: true,
		};
		const response = await hbutRequest.get(
			"/admin/xsd/xyjc/getXsjbxx",
			loginConfig,
		);
		return response;
	};
	const response = await AutoRetry(fetchXhid, { maxRetry: 1 });
	if (response.status !== 200) {
		console.log("[getXhid] 网络请求失败");
		throw new Error("获取 xhid 失败：网络请求失败");
	}
	if (response.status === 300) {
		console.log("[getXhid] 登录失效，请重新登录");
		throw new Error("获取 xhid 失败：登录失效，请重新登录");
	}
	if (response.data.ret !== 0) {
		console.log("[getCurrentWeek] 接口返回异常:", response.data);
		throw new Error("获取xhid失败：接口返回 ret 不为 0");
	}
	const xhid = response.data.data.id;

	if (!xhid) {
		throw new Error("获取 xhid 失败：响应数据中无 id 字段");
	}

	// 3. 存入缓存（永不过期）
	cacheManager.set(CACHE_KEY, xhid);
	console.log("[getXhid] 已缓存 xhid:", xhid);

	return xhid;
}
