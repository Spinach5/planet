// 获取实践信息（实验课表）
import { hbutRequest } from "../../utils/request";
import cacheManager from "../../utils/cache";

const EXTRO_INFO_CACHE_KEY = "ExtroInfoData";  // 定义缓存key

export async function getExtroInfo() {
  // 1. 优先从缓存获取
  const cached = cacheManager.get(EXTRO_INFO_CACHE_KEY);
  if (cached) {
    console.log("[getExtroInfo] 从缓存获取实践信息");
    return cached;
  }

  const loginConfig = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Referer: "https://jwxt.hbut.edu.cn",
      Origin: "https://jwxt.hbut.edu.cn",
    },
    withCredentials: true,
  };

  try {
    // const params = new URLSearchParams();
    // params.append("type", 1);
    // params.append("zc", 10);

    // const response = await hbutRequest.post(
    //   "/admin/getXsdSykb",
    //   params,
    //   loginConfig,
    // );
const type = 1;
const zc = 10;

const response = await hbutRequest.post(
  `/admin/getXsdSykb?type=${type}&zc=${zc}`,
  loginConfig
);
    // 检查 HTTP 状态码
    if (response.status !== 200) {
      console.log("[getExtroInfo] 网络请求失败, status:", response.status);
      throw new Error("获取实践信息失败：网络请求失败");
    }

    // 检查登录失效
    if (response.status === 300) {
      console.log("[getExtroInfo] 登录失效，请重新登录");
      throw new Error("获取实践信息失败：登录失效，请重新登录");
    }

    // 检查业务返回码
    if (response.data?.ret !== 0) {
      console.log("[getExtroInfo] 接口返回异常:", response.data);
      throw new Error("获取实践信息失败：接口返回 ret 不为 0");
    }

    const sjkData = response.data.data?.sjk;

    // 验证数据有效性（验证是否为数组）
    if (!sjkData || !Array.isArray(sjkData)) {
      console.log("[getExtroInfo] 响应数据中无有效的 sjk 字段");
      throw new Error("获取实践信息失败：响应数据中无有效的 sjk 字段");
    }

    // 3. 存入缓存（永不过期）
    cacheManager.set(EXTRO_INFO_CACHE_KEY, sjkData);
    console.log("[getExtroInfo] 已缓存实践信息");

    return sjkData;

  } catch (error) {
    // 如果错误已经是 Error 对象，直接抛出；否则包装一下
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("获取实践信息失败：" + error);
  }
}