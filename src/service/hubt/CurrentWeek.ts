import cacheManager from '../../utils/cache';
import { hbutRequest } from '../../utils/request';

const CACHE_KEY = 'CurrentWeek';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour — week changes on Monday, 1h staleness is acceptable

export async function getCurrentWeek(): Promise<number> {
  const cached = await cacheManager.getAsync<number>(CACHE_KEY);
  if (cached !== null) {
    return Number(cached); // normalize: old cache may have stored string
  }

  const loginConfig = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Referer: 'https://jwxt.hbut.edu.cn',
      Origin: 'https://jwxt.hbut.edu.cn',
    },
  };

  const response = await hbutRequest.post('/admin/api/getXlzc', {}, loginConfig);

  if (response.status !== 200) {
    throw new Error('获取当前周数失败：网络请求失败');
  }

  const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

  if (data?.ret !== 0) {
    throw new Error('获取当前周数失败：接口返回 ret 不为 0');
  }

  const currentWeek = Number(data.data?.xlzc);
  if (isNaN(currentWeek)) {
    throw new Error('获取当前周数失败：响应数据中 xlzc 不是有效数字');
  }

  await cacheManager.setAsync(CACHE_KEY, currentWeek, CACHE_TTL);
  return currentWeek;
}
