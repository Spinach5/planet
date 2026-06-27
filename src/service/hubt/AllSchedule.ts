import cacheManager from "../../utils/cache";
import type { CourseCleaned, CourseRaw } from "../../utils/hbut/courseHelper";
import { extractCourseData } from "../../utils/hbut/courseHelper";
import { hbutRequest } from "../../utils/request";
import { getXhid } from "./GetXhid";

const CACHE_KEY_PREFIX = "All_COURSE_";

export async function getAllSchedule(
  forceRefreshOrSemester?: boolean | string,
  semester?: string,
): Promise<CourseCleaned[]> {
  // Support both call styles: getAllSchedule(semester) and getAllSchedule(forceRefresh, semester)
  let forceRefresh = false;
  let effectiveSemester = "";
  if (typeof forceRefreshOrSemester === "boolean") {
    forceRefresh = forceRefreshOrSemester;
    effectiveSemester = semester ?? "";
  } else {
    forceRefresh = false;
    effectiveSemester = forceRefreshOrSemester ?? "";
  }

  const cacheKey = effectiveSemester
    ? CACHE_KEY_PREFIX + effectiveSemester
    : CACHE_KEY_PREFIX;

  if (!forceRefresh) {
    const cached = await cacheManager.getAsync<CourseCleaned[]>(cacheKey);
    if (cached) return cached;
  }

  const loginConfig = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Referer: "https://jwxt.hbut.edu.cn",
      Origin: "https://jwxt.hbut.edu.cn",
    },
    withCredentials: true,
  };

  const xhid = await getXhid();
  const response = await hbutRequest.get(
    `admin/pkgl/xskb/sdpkkbList?xnxq=${effectiveSemester}&xhid=${xhid}`,
    loginConfig,
  );

  if (response.status !== 200) {
    throw new Error("获取课表失败：网络请求失败");
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-condition
  const data: Record<string, unknown> | null = typeof response.data === "string"
      ? JSON.parse(response.data) as Record<string, unknown>
      : response.data as Record<string, unknown>;  

  if (data?.ret !== 0) {
    throw new Error("获取课表失败：接口返回 ret 不为 0");
  }

  const courseData = extractCourseData(data.data as CourseRaw[]);
  await cacheManager.setAsync(cacheKey, courseData);
  return courseData;
}
