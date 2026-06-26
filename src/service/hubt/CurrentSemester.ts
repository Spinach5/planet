import cacheManager from '../../utils/cache';
import { hbutRequest } from '../../utils/request';

const CACHE_KEY = 'CurrentSemester';

export async function getCurrentSemester(): Promise<string> {
  const cached = await cacheManager.getAsync<string>(CACHE_KEY);
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

  const response = await hbutRequest.get('/admin/xsd/xsdcjcx/getCurrentXnxq', loginConfig);

  if (response.status !== 200) {
    throw new Error('获取当前学期失败：网络请求失败');
  }

  const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

  if (data?.ret !== 0) {
    throw new Error('获取当前学期失败：接口返回 ret 不为 0');
  }

  const semesterData = data.data;
  await cacheManager.setAsync(CACHE_KEY, semesterData);
  return semesterData;
}
