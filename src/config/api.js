// 根据环境判断使用代理还是直接请求
const isDev = process.env.NODE_ENV === "development";
const isH5 = process.env.TARO_ENV === "h5";

// H5 开发环境使用代理，其他情况使用完整域名
export const API_BASE = {
	passportStatic:
		isDev && isH5 ? "/chaoxing" : "https://passport2-static.chaoxing.com",
	passport: isDev && isH5 ? "/passport2" : "https://passport2.chaoxing.com",
	hbut: isDev && isH5 ? "/hbut" : "https://hbut.jw.chaoxing.com",
	vkb: isDev && isH5 ? "/vkb" : "https://vkb.jw.chaoxing.com",
	i: isDev && isH5 ? "/i" : "https://i.chaoxing.com",
	note: isDev && isH5 ? "/note" : "https://noteyd.chaoxing.com",
};
