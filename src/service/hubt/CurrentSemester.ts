import { hbutRequest } from '../../utils/request';
import userManager from '../../service/userInfo';
import { getSemesterList as buildSemesterList } from '../../utils/hbut/semesterHelper';
import { withCache } from '../utils';

const PERMANENT_TTL = 100 * 365 * 24 * 60 * 60 * 1000; // ~100 years

export const getCurrentSemester = withCache(
  async (): Promise<string> => {
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

    const data = typeof response.data === 'string' ? JSON.parse(response.data) as Record<string, unknown> : response.data as Record<string, unknown>;

    if (data.ret !== 0) {
      throw new Error('获取当前学期失败：接口返回 ret 不为 0');
    }

    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const semesterData = String(data.data ?? '');
    return semesterData;
  },
  { cacheKey: 'CurrentSemester', ttl: PERMANENT_TTL },
);

/**
 * Get semester list from grade year to current semester.
 * Matches the original Taro project behavior.
 */
export const getSemesterList = withCache(
  async (): Promise<string[]> => {
    const currentSemester = await getCurrentSemester();
    const grade = userManager.getGrade();
    const originYear = grade === '0' ? '' : grade;

    if (!originYear) {
      return [currentSemester];
    }

    const semesterList = buildSemesterList(originYear, currentSemester);
    return semesterList;
  },
  { cacheKey: 'SemesterList', ttl: PERMANENT_TTL },
);
