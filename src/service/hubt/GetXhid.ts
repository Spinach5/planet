import cacheManager from '../../utils/cache';
import { hbutRequest } from '../../utils/request';

const CACHE_KEY = 'xhid';

export async function getXhid(): Promise<string> {
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
  };

  const response = await hbutRequest.get('/admin/xsd/xyjc/getXsjbxx', loginConfig);

  if (response.status !== 200) {
    throw new Error('获取 xhid 失败：网络请求失败');
  }

  const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

  if (data.ret !== 0) {
    throw new Error('获取xhid失败：接口返回 ret 不为 0');
  }

  const xhid = data.data.id;
  if (!xhid) {
    throw new Error('获取 xhid 失败：响应数据中无 id 字段');
  }

  await cacheManager.setAsync(CACHE_KEY, xhid);
  return xhid;
}
