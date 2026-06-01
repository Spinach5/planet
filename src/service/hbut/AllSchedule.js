// 获取所有课表
import cacheManager from "../../utils/cache";
import { hbutRequest } from "../../utils/request";
import { getXhid } from "./GetXhid";
import { extractCourseData } from "../../utils/hbut/courseHelper";
import { AutoRetry } from "./autoRetry";

const CACHE_KEY = "All_COURSE_";

export async function getAllSchedule(forceRefresh = false, semester) {
  console.log(`[getAllSchedule] semester:${semester}`);
  if (forceRefresh) {
    cacheManager.remove(CACHE_KEY + semester);
    console.log(`[getAllSchedule] 已清除${semester}课表缓存`);
  } else {
    const cached = cacheManager.get(CACHE_KEY + semester);
    if (cached) {
      console.log("[getAllSchedule] 从缓存获取课表");
      return cached;
    }
  }

  // 实际请求函数
  const fetchSchedule = async () => {
    const xhid = await getXhid();
    const loginConfig = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Referer: "https://jwxt.hbut.edu.cn",
        Origin: "https://jwxt.hbut.edu.cn",
      },
      withCredentials: true,
    };
    const response = await hbutRequest.get(
      `admin/pkgl/xskb/sdpkkbList?xnxq=${semester}&xhid=${xhid}`,
      loginConfig
    );
    return response; // 返回完整响应对象
  };

  try {
    const response = await AutoRetry(fetchSchedule, { maxRetry: 1 });

    if (response.status !== 200) {
      console.warn(`网络请求失败，状态码: ${response.status}`);
    }
    if (response.data.ret !== 0) {
      console.warn(`接口返回异常: ret=${response.data.ret}`);
    }

    const courseData = extractCourseData(response.data.data);
    cacheManager.set(CACHE_KEY + semester, courseData);
    console.log(`[getAllSchedule] 已缓存${semester}课表数据`);
    return courseData;
  } catch (error) {
    console.error("[getAllSchedule] 获取失败:", error);
    throw error;
  }
}
