import type { CourseCleaned, CourseRaw } from "../../utils/hbut/courseHelper";
import { extractCourseData } from "../../utils/hbut/courseHelper";
import { hbutRequest } from "../../utils/request";
import { withCache } from "../utils";
import { getXhid } from "./GetXhid";

const fetchSchedule = withCache(
  async (semester: string, _forceRefresh?: boolean): Promise<CourseCleaned[]> => {
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
      `admin/pkgl/xskb/sdpkkbList?xnxq=${semester}&xhid=${xhid}`,
      loginConfig,
    );

    if (response.status !== 200) {
      throw new Error("获取课表失败：网络请求失败");
    }

     
    const data: Record<string, unknown> | null = typeof response.data === "string"
        ? JSON.parse(response.data) as Record<string, unknown>
        : response.data as Record<string, unknown>;

    if (data.ret !== 0) {
      throw new Error("获取课表失败：接口返回 ret 不为 0");
    }

    return extractCourseData(data.data as CourseRaw[]);
  },
  {
    cacheKey: "All_COURSE",
    ttl: 30 * 60 * 1000,
    keyBuilder: (args) => (args[0] as string) || "default",
  },
);

export async function getAllSchedule(
  forceRefreshOrSemester?: boolean | string,
  semester?: string,
): Promise<CourseCleaned[]> {
  // Support both call styles: getAllSchedule(semester) and getAllSchedule(forceRefresh, semester)
  let forceRefresh: boolean;
  let effectiveSemester: string;
  if (typeof forceRefreshOrSemester === "boolean") {
    forceRefresh = forceRefreshOrSemester;
    effectiveSemester = semester ?? "";
  } else {
    forceRefresh = false;
    effectiveSemester = forceRefreshOrSemester ?? "";
  }
  return fetchSchedule(effectiveSemester, forceRefresh);
}
