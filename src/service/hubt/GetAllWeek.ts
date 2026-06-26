import cacheManager from '../../utils/cache';
import { hbutRequest } from '../../utils/request';

const CACHE_KEY = 'AllWeekData';

export async function getAllWeek(): Promise<number[]> {
  const cached = await cacheManager.getAsync<number[]>(CACHE_KEY);
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

  const response = await hbutRequest.get('/admin/getCurrentPkZc', loginConfig);

  if (response.status !== 200) {
    throw new Error('获取排课周次失败：网络请求失败');
  }

  const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

  if (data?.ret !== 0) {
    throw new Error('获取排课周次失败：接口返回 ret 不为 0');
  }

  const weekData = data.data;
  if (!weekData || !Array.isArray(weekData) || weekData.length === 0) {
    throw new Error('获取排课周次失败：响应数据中无有效的排课周次数据');
  }

  await cacheManager.setAsync(CACHE_KEY, weekData);
  return weekData;
}
