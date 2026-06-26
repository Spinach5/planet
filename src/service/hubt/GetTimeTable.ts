import cacheManager from '../../utils/cache';
import { hbutRequest } from '../../utils/request';
import { getCurrentSemester } from './CurrentSemester';
import { getSortedClassTimes } from '../../utils/hbut/timeHelper';
import type { ClassTime } from '../../utils/hbut/timeHelper';

const CACHE_KEY = 'timetable';

export async function getTimeTable(): Promise<ClassTime[]> {
  const cached = await cacheManager.getAsync<ClassTime[]>(CACHE_KEY);
  if (cached) {
    return cached;
  }

  const loginConfig = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Referer: 'https://jwxt.hbut.edu.cn',
      Origin: 'https://jwxt.hbut.edu.cn',
    },
    withCredentials: true,
  };

  const semester = await getCurrentSemester();
  const response = await hbutRequest.get(
    `admin/api/getZclistByXnxq?xnxq=${semester}`,
    loginConfig,
  );

  if (response.status !== 200) {
    throw new Error('获取时间表失败：网络请求失败');
  }

  const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

  if (data.ret !== 0) {
    throw new Error('获取时间表失败：接口返回 ret 不为 0');
  }
  if (!data.data.jcsjszList) {
    throw new Error('获取时间表失败：响应数据中无 jcsjszList 字段');
  }

  const timetable = getSortedClassTimes(data.data.jcsjszList);
  await cacheManager.setAsync(CACHE_KEY, timetable);
  return timetable;
}
