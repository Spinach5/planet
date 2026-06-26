import cacheManager from '../../utils/cache';
import { hbutRequest } from '../../utils/request';

const CACHE_KEY = 'ExtroInfoData';

export async function getExtroInfo(): Promise<unknown[]> {
  const cached = await cacheManager.getAsync<unknown[]>(CACHE_KEY);
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

  const type = 1;
  const zc = 10;

  const response = await hbutRequest.post(
    `/admin/getXsdSykb?type=${type}&zc=${zc}`,
    {},
    loginConfig,
  );

  if (response.status !== 200) {
    throw new Error('获取实践信息失败：网络请求失败');
  }

  const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

  if (data?.ret !== 0) {
    throw new Error('获取实践信息失败：接口返回 ret 不为 0');
  }

  const sjkData = data.data?.sjk;
  if (!sjkData || !Array.isArray(sjkData)) {
    throw new Error('获取实践信息失败：响应数据中无有效的 sjk 字段');
  }

  await cacheManager.setAsync(CACHE_KEY, sjkData);
  return sjkData;
}
