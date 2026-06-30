import cacheManager from '../../utils/cache';
import { hbutRequest } from '../../utils/request';

const getCacheKey = (time: string) => `DailySchedule_${time}`;

export async function getDailySchedule(time: string): Promise<unknown[]> {
  const cacheKey = getCacheKey(time);
  const cached = await cacheManager.getAsync<unknown[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const loginConfig = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Referer: 'https://jwxt.hbut.edu.cn',
      Origin: 'https://jwxt.hbut.edu.cn',
    },
  };

  const response = await hbutRequest.get(`/admin/getDayBz?rq=${time}`, loginConfig);

  if (response.status !== 200) {
    throw new Error('获取作息数据失败：网络请求失败');
  }

  const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

  if (data?.ret !== 0) {
    throw new Error('获取作息数据失败：接口返回 ret 不为 0');
  }

  const bzList = data.data?.bzList;
  if (!bzList || !Array.isArray(bzList)) {
    throw new Error('获取作息数据失败：响应数据中无有效的 bzList 字段');
  }

  await cacheManager.setAsync(cacheKey, bzList);
  return bzList;
}
