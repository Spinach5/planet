import { hbutRequest } from '../../utils/request';
import { withCache } from '../utils';
import { getXhid } from './GetXhid';

export interface ScoresData {
  gpa: number;
  averageScore: number;
  notPass: number;
  gpaRank: string;
  gottenCredits: number;
  chosenClass: number;
}

export const getScores = withCache(
   
  async (_forceRefresh?: boolean): Promise<ScoresData> => {
    const loginConfig = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Referer: 'https://jwxt.hbut.edu.cn',
        Origin: 'https://jwxt.hbut.edu.cn',
      },
      withCredentials: true,
    };

    const xhid = await getXhid();
    const response = await hbutRequest.get(`/admin/xsd/xskp/xyqk?xhid=${xhid}`, loginConfig);

    if (response.status !== 200) {
      throw new Error('获取成绩数据失败');
    }

     
    const raw = typeof response.data === 'string' ? JSON.parse(response.data) as Record<string, unknown> : response.data as Record<string, unknown>;

    if (raw.ret !== 0) {
      throw new Error('获取成绩数据失败：ret 不为 0');
    }

    const d = raw.data as Record<string, unknown> | undefined;
    if (!d || typeof d !== 'object') {
      throw new Error('获取成绩数据失败：格式异常');
    }

    const result: ScoresData = {
      gpa: Number(d.gpa ?? 0),
      averageScore: Number(d.pjcj ?? 0),
      notPass: Number(d.bjgms ?? 0),
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
    gpaRank: String(d.gpazypm ?? ''),
      gottenCredits: Number(d.hdzxf ?? 0),
      chosenClass: Number(d.yxkms ?? 0),
    };

    return result;
  },
  { cacheKey: 'ScoresData', ttl: 60 * 60 * 1000 },
);
