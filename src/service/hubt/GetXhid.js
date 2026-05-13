// src/service/hubt/getXhid.js
import cacheManager from "../../utils/cache";
import { hbutRequest } from "../../utils/request";

const XHID_CACHE_KEY = "xhid";

export async function getXhid() {
  // 1. 优先从缓存获取
  const cached = cacheManager.get(XHID_CACHE_KEY);
  if (cached) {
    return cached;
  }

  // 2. 缓存未命中，发起请求
  const loginConfig = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Referer: "https://jwxt.hbut.edu.cn",
      Origin: "https://jwxt.hbut.edu.cn",
    },
    withCredentials: true,
  };
  const response = await hbutRequest.get(
    "/admin/xsd/xyjc/getXsjbxx",
    loginConfig
  );
  if(response.status !== 200){
	console.log("[getXhid] 网络请求失败")
    throw new Error("获取 xhid 失败：网络请求失败");
  }
  if(response.status === 300){
	console.log("[getXhid] 登录失效，请重新登录")
    throw new Error("获取 xhid 失败：登录失效，请重新登录");
  }
  const xhid = response.data?.id;

  if (!xhid) {
    throw new Error("获取 xhid 失败：响应数据中无 id 字段");
  }

  // 3. 存入缓存（永不过期）
  cacheManager.set(XHID_CACHE_KEY, xhid);
  console.log("[getXhid] 已缓存 xhid:", xhid);

  return xhid;
}
