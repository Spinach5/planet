import { hbutRequest } from '../../utils/request';

interface HbResponse {
  ret: number;
  msg?: string;
  results?: unknown[];
}

/**
 * Query for empty classrooms from the HBUT academic portal.
 */
export async function getEmptyClassRoom(
  building: string,
  weekNum: number,
  weekday: number,
  sectionStr: string,
): Promise<unknown[]> {
  const params = new URLSearchParams({
    'page.size': '100',
    jxldm: building,
    zcStr: String(weekNum),
    xqStr: String(weekday),
    jcStr: sectionStr,
  });

  const response = await hbutRequest.get(
    `/admin/system/jxzy/jsxx/getKxjscx?${params.toString()}`,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Referer: 'https://jwxt.hbut.edu.cn',
        Origin: 'https://jwxt.hbut.edu.cn',
      },
      withCredentials: true,
    },
  );

  const json = response.data as HbResponse;

  if (json.ret !== 0) {
    throw new Error(`空教室查询失败: ${json.msg ?? ''}`);
  }

  return json.results ?? [];
}

/**
 * Get list of teaching buildings with category information from the HBUT portal.
 */
export async function getTeachBuilding(): Promise<string[]> {
  const response = await hbutRequest.get(
    '/admin/system/jxzy/jsxx/queryForXsd',
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Referer: 'https://jwxt.hbut.edu.cn',
        Origin: 'https://jwxt.hbut.edu.cn',
      },
      withCredentials: true,
      responseType: 'text',
    },
  );

  const html = String(response.data ?? '');

  const buildings: string[] = [];
  if (html) {
    const optionRegex = /<option[^>]*value="([^"]*)"[^>]*>([^<]*)<\/option>/gi;
    let match: RegExpExecArray | null;
    while ((match = optionRegex.exec(html)) !== null) {
      if (match[1] && match[2].trim()) {
        buildings.push(match[2].trim());
      }
    }
  }

  return buildings;
}
