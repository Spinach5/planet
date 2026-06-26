import cacheManager from '../../utils/cache';
import { hbutRequest } from '../../utils/request';
import { getXhid } from './GetXhid';

const CACHE_KEY = 'StuInfo';

export async function getStuInfo(): Promise<unknown> {
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
    `/admin/xsd/xskp/xskp?xhid=${xhid}`,
    loginConfig,
  );

  if (response.status !== 200) {
    throw new Error('获取个人信息失败：网络请求失败');
  }

  const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

  if (data?.ret !== 0) {
    throw new Error('获取个人信息失败：接口返回 ret 不为 0');
  }

  const stuInfo = data.data;
  if (!stuInfo) {
    throw new Error('获取个人信息失败：响应数据中无个人信息');
  }
  if (typeof stuInfo !== 'object') {
    throw new Error('获取成绩数据失败：响应数据格式异常');
  }

  await cacheManager.setAsync(CACHE_KEY, stuInfo);
  return stuInfo;
}
