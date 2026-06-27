import cacheManager from '../../utils/cache';
import { hbutRequest } from '../../utils/request';
import { getXhid } from './GetXhid';

const CACHE_KEY = 'StuInfo';

export interface CleanStuInfo {
  realName: string;
  stuId: string;
  grade: string;
  majority: string;
  class: string;
  college: string;
  xhid: string;
}

export async function getStuInfo(): Promise<CleanStuInfo> {
  const cached = await cacheManager.getAsync<CleanStuInfo>(CACHE_KEY);
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

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const rawData = typeof response.data === 'string' ? JSON.parse(response.data) as Record<string, unknown> : response.data as Record<string, unknown>;

  if (rawData?.ret !== 0) {
    throw new Error('获取个人信息失败：接口返回 ret 不为 0');
  }

  const stuInfoRaw = (rawData.data as Record<string, unknown> | undefined);

  if (!stuInfoRaw) {
    throw new Error('获取个人信息失败：响应数据中无个人信息');
  }
  if (typeof stuInfoRaw !== 'object') {
    throw new Error('获取个人信息失败：响应数据格式异常');
  }

  // Map HBUT raw fields to clean names (matching Taro project)
  const cleanInfo: CleanStuInfo = {
    realName: String(stuInfoRaw.xm ?? ''),
    stuId: String(stuInfoRaw.xh ?? ''),
    grade: String(stuInfoRaw.sznj ?? ''),
    majority: String(stuInfoRaw.zymc ?? ''),
    class: String(stuInfoRaw.bjmc ?? ''),
    college: String(stuInfoRaw.skyx ?? ''),
    xhid,
  };

  await cacheManager.setAsync(CACHE_KEY, cleanInfo);
  return cleanInfo;
}
