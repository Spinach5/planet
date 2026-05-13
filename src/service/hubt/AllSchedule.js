
// 获取所有课表
import cacheManager from "../../utils/cache";
import { hbutRequest } from "../../utils/request";
import { getXhid } from './getXhid';
import { getCurrentSemester } from "./CurrentSemester";

const AllSchedule_CACHE_KEY = "AllScheduleData";  // 定义缓存key

export async function getAllSchedule() {
  // 1. 优先从缓存获取（和第一段一致）
  const cached = cacheManager.get(AllSchedule_CACHE_KEY);
  if (cached) {
    console.log("[getAllSchedule] 从缓存获取课表");
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

  try {
    const xhid = await getXhid();
	const semester = await getCurrentSemester()

    const response = await hbutRequest.get(
      `/admin/pkgl/xskb/sdpkkbList?xnxq=${semester}&xhid=${xhid}`,
      loginConfig
    );

    // 检查 HTTP 状态码
    if (response.status !== 200) {
      console.log("[getAllSchedule] 网络请求失败, status:", response.status);
      throw new Error("获取课表失败：网络请求失败");
    }

    // 检查登录失效
    if (response.status === 300) {
      console.log("[getAllSchedule] 登录失效，请重新登录");
      throw new Error("获取课表失败：登录失效，请重新登录");
    }

    // 检查业务返回码
    if (response.data?.ret !== 0) {
      console.log("[getAllSchedule] 接口返回异常:", response.data);
      throw new Error("获取课表失败：接口返回 ret 不为 0");
    }

    const AllScheduleData = response.data.data;

    // 3. 存入缓存（永不过期，和第一段一致）
    cacheManager.set(AllSchedule_CACHE_KEY, AllScheduleData);
    console.log("[getAllSchedule] 已缓存课表数据");

    return AllScheduleData;

  } catch (error) {
    // 如果错误已经是 Error 对象，直接抛出；否则包装一下
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("获取课表失败：" + error);
  }
}