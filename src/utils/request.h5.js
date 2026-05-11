// utils/request.js
import axios from "axios";
import TaroAdapter from "taro-axios-adapter";
import CookiesManager from "./cookies"; // 导入 CookiesManager 类
import { API_BASE } from "../config/api";

/**
 * 创建带有 Cookie 自动管理的请求实例
 * @param {string} baseURL      基础 URL
 * @param {string} cookiesPrefix Cookie 管理器前缀（区分不同服务）
 */
const createRequest = (baseURL, cookiesPrefix = "") => {
	// 为此后端创建独立的 Cookie 管理器实例
	const cookieManager = new CookiesManager(cookiesPrefix);

	// eslint-disable-next-line import/no-named-as-default-member
	const instance = axios.create({
		baseURL,
		timeout: 15000,
		adapter: TaroAdapter,
		withCredentials: true, // 允许跨域带 Cookie
		responseType: "text",
	});

	// 请求拦截器：添加 Cookie 头
	instance.interceptors.request.use(
		(config) => {
			console.log("请求拦截器");
			const cookieString = cookieManager.toString();
			if (cookieString) {
				config.headers["Cookie"] = cookieString;
			}
			return config;
		},
		(error) => Promise.reject(error),
	);

	// 响应拦截器：提取并保存 Set-Cookie
	instance.interceptors.response.use(
		(response) => {
			console.log("响应拦截器");
			const setCookie = response.headers["set-cookie"];
			if (setCookie) {
				// 兼容数组（axios 会将多个同名头合并为数组）或字符串
				const cookieHeaders = Array.isArray(setCookie)
					? setCookie
					: [setCookie];
				console.log(cookieHeaders);
				cookieHeaders.forEach((header) => {
					cookieManager.parseAndMerge(header);
				});
			}

			return response; //保留整个 response
		},
		(error) => Promise.reject(error),
	);

	return instance;
};

// 为不同后端创建实例（自动隔离 Cookie）
export const hbutRequest = createRequest(API_BASE.hbut, "hbut");

// 默认实例（无 URL，用于相对路径请求）
export default createRequest("");
