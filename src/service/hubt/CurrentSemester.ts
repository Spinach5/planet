import cacheManager from '../../utils/cache';
import { hbutRequest } from '../../utils/request';
import userManager from '../../service/userInfo';
import { getSemesterList as buildSemesterList } from '../../utils/hbut/semesterHelper';

const CACHE_KEY = 'CurrentSemester';
const LIST_CACHE_KEY = 'SemesterList';

export async function getCurrentSemester(): Promise<string> {
  const cached = await cacheManager.getAsync<string>(CACHE_KEY);
  if (cached) return cached;

  const loginConfig = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Referer: 'https://jwxt.hbut.edu.cn',
      Origin: 'https://jwxt.hbut.edu.cn',
    },
    withCredentials: true,
  };

  const response = await hbutRequest.get('/admin/xsd/xsdcjcx/getCurrentXnxq', loginConfig);

  if (response.status !== 200) {
    throw new Error('获取当前学期失败：网络请求失败');
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const data = typeof response.data === 'string' ? JSON.parse(response.data) as Record<string, unknown> : response.data as Record<string, unknown>;

  if (data?.ret !== 0) {
    throw new Error('获取当前学期失败：接口返回 ret 不为 0');
  }

  const semesterData = String(data.data ?? '');
  await cacheManager.setAsync(CACHE_KEY, semesterData);
  return semesterData;
}

/**
 * Get semester list from grade year to current semester.
 * Matches the original Taro project behavior.
 */
export async function getSemesterList(): Promise<string[]> {
  const cached = await cacheManager.getAsync<string[]>(LIST_CACHE_KEY);
  if (cached) return cached;

  const currentSemester = await getCurrentSemester();
  const grade = userManager.getGrade();
  const originYear = grade === '0' ? '' : grade;

  if (!originYear) {
    return [currentSemester];
  }

  const semesterList = buildSemesterList(originYear, currentSemester);
  await cacheManager.setAsync(LIST_CACHE_KEY, semesterList);
  return semesterList;
}
