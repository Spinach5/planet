import cacheManager from '../../utils/cache';
import { hbutRequest } from '../../utils/request';
import { getXhid } from './GetXhid';

const CACHE_KEY = 'ScoresData';

export async function getScores(): Promise<unknown> {
  const cached = await cacheManager.getAsync<unknown>(CACHE_KEY);
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

  const xhid = await getXhid();
  const response = await hbutRequest.get(
    `/admin/xsd/xskp/xyqk?xhid=${xhid}`,
    loginConfig,
  );

  if (response.status !== 200) {
    throw new Error('获取成绩数据失败：网络请求失败');
  }

  const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

  if (data?.ret !== 0) {
    throw new Error('获取成绩数据失败：接口返回 ret 不为 0');
  }

  const scoresData = data.data;
  if (!scoresData) {
    throw new Error('获取成绩数据失败：响应数据中无成绩数据');
  }
  if (typeof scoresData !== 'object') {
    throw new Error('获取成绩数据失败：响应数据格式异常');
  }

  await cacheManager.setAsync(CACHE_KEY, scoresData);
  return scoresData;
}
