import cacheManager from '../../utils/cache';
import type { ClassTime } from '../../utils/hbut/timeHelper';
import { getSortedClassTimes } from '../../utils/hbut/timeHelper';
import { hbutRequest } from '../../utils/request';

const CACHE_KEY = 'timetable';

export async function getTimeTable(semester?: string): Promise<ClassTime[]> {
  const cached = await cacheManager.getAsync<ClassTime[]>(CACHE_KEY);
  if (cached) return cached;

  let effectiveSemester = semester;
  if (!effectiveSemester) {
    const loginConfig = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
    };
    const resp = await hbutRequest.get('/admin/xsd/xsdcjcx/getCurrentXnxq', loginConfig);
    if (resp.status !== 200) throw new Error('获取时间表失败：无法获取学期');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const dt = typeof resp.data === 'string' ? JSON.parse(resp.data) as Record<string, unknown> : resp.data as Record<string, unknown>;
    effectiveSemester = String(typeof dt.data === 'string' ? dt.data : '');
  }

  const loginConfig = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Referer: 'https://jwxt.hbut.edu.cn',
      Origin: 'https://jwxt.hbut.edu.cn',
    },
  };

  const response = await hbutRequest.get(
    `admin/api/getZclistByXnxq?xnxq=${effectiveSemester}`,
    loginConfig,
  );

  if (response.status !== 200) {
    throw new Error('获取时间表失败：网络请求失败');
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const data = typeof response.data === 'string' ? JSON.parse(response.data) as Record<string, unknown> : response.data as Record<string, unknown>;

  if (data?.ret !== 0) {
    throw new Error('获取时间表失败：接口返回 ret 不为 0');
  }
  const jcsjszList = (data.data as Record<string, unknown> | undefined)?.jcsjszList;
  if (!jcsjszList) {
    throw new Error('获取时间表失败：响应数据中无 jcsjszList 字段');
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const timetable = getSortedClassTimes(jcsjszList as never);
  await cacheManager.setAsync(CACHE_KEY, timetable);
  return timetable;
}
