import cacheManager from '../../utils/cache';
import { hbutRequest } from '../../utils/request';
import { getXhid } from './GetXhid';
import { extractCourseData } from '../../utils/hbut/courseHelper';
import type { CourseCleaned } from '../../utils/hbut/courseHelper';

const CACHE_KEY = 'All_COURSE_';

export async function getAllSchedule(semester?: string): Promise<CourseCleaned[]> {
  // Use cached semester if not provided
  const cacheKey = semester ? CACHE_KEY + semester : CACHE_KEY;

  if (semester) {
    const cached = await cacheManager.getAsync<CourseCleaned[]>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const loginConfig = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Referer: 'https://jwxt.hbut.edu.cn',
      Origin: 'https://jwxt.hbut.edu.cn',
    },
    withCredentials: true,
  };

  const xhid = await getXhid();
  const response = await hbutRequest.get(
    `admin/pkgl/xskb/sdpkkbList?xnxq=${semester}&xhid=${xhid}`,
    loginConfig,
  );

  if (response.status !== 200) {
    throw new Error('获取课表失败：网络请求失败');
  }

  const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

  if (data.ret !== 0) {
    throw new Error('获取课表失败：接口返回 ret 不为 0');
  }

  const courseData = extractCourseData(data.data);
  if (semester) {
    await cacheManager.setAsync(cacheKey, courseData);
  }
  return courseData;
}
