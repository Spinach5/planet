import cacheManager from "../../utils/cache";
import { extractEmpytClassRoom } from "../../utils/hbut/emptyClassRoom";
import { hbutRequest } from "../../utils/request";

const CACHE_KEY_BUILDING = "TeachBuilding";
const CACHE_KEY_CATEGORY = "TeachBuildingCategory";
const API_PATH = "/admin/system/jxzy/jsxx/queryForXsd";

let _pendingHtml: Promise<string> | null = null;

async function _fetchHtml(): Promise<string> {
  if (_pendingHtml) return _pendingHtml;

  _pendingHtml = (async () => {
    try {
      const response = await hbutRequest.get(API_PATH, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Referer: "https://jwxt.hbut.edu.cn",
          Origin: "https://jwxt.hbut.edu.cn",
        },
        responseType: "text",
      });
      return String(response.data ?? "");
    } finally {
      _pendingHtml = null;
    }
  })();

  return _pendingHtml;
}

/**
 * 从教务系统HTML中提取教学楼名称→代码映射
 * Returns { [name: string]: string } like { "1教": "9", "2教": "16" }
 */
export function extractTeachBuilding(html: string): Record<string, string> {
  const result: Record<string, string> = {};
  const selectMatch = /<select[^>]*id="jxldm"[^>]*>([\s\S]*?)<\/select>/i.exec(
    html,
  );
  if (!selectMatch) return result;

  const optionRegex = /<option\s+value="([^"]*)"[^>]*>([^<]*)<\/option>/gi;
  let match: RegExpExecArray | null;
  while ((match = optionRegex.exec(selectMatch[1])) !== null) {
    const value = match[1];
    const text = match[2].trim();
    if (value !== "" && !(text in result)) {
      result[text] = value;
    }
  }
  return result;
}

/**
 * 提取教室类型分类
 * Returns { [code: string]: string } like { "1": "普通教室", "2": "多媒体教室" }
 */
export function extractTeachBuildingCategory(
  html: string,
): Record<string, string> {
  const result: Record<string, string> = {};
  const selectMatch = /<select[^>]*id="jslx"[^>]*>([\s\S]*?)<\/select>/i.exec(
    html,
  );
  if (!selectMatch) return result;

  const optionRegex = /<option\s+value="([^"]*)"[^>]*>([^<]*)<\/option>/gi;
  let match: RegExpExecArray | null;
  while ((match = optionRegex.exec(selectMatch[1])) !== null) {
    const value = match[1];
    const text = match[2].trim();
    if (value !== "" && !(text in result)) {
      result[value] = text;
    }
  }
  return result;
}

export async function getTeachBuilding(): Promise<Record<string, string>> {
  const cached =
    await cacheManager.getAsync<Record<string, string>>(CACHE_KEY_BUILDING);
  if (cached) return cached;

  const html = await _fetchHtml();
  const data = extractTeachBuilding(html);
  if (Object.keys(data).length === 0) {
    throw new Error("未能解析到任何教学楼信息");
  }
  await cacheManager.setAsync(CACHE_KEY_BUILDING, data);
  return data;
}

export async function getTeachBuildingCategory(): Promise<
  Record<string, string>
> {
  const cached =
    await cacheManager.getAsync<Record<string, string>>(CACHE_KEY_CATEGORY);
  if (cached) return cached;

  const html = await _fetchHtml();
  const data = extractTeachBuildingCategory(html);
  if (Object.keys(data).length === 0) {
    throw new Error("未能解析到任何教室类型信息");
  }
  await cacheManager.setAsync(CACHE_KEY_CATEGORY, data);
  return data;
}

export async function getEmptyClassRoom(
  buildingCode: string,
  weekNum: number,
  weekday: number,
  sectionStr: string,
): Promise<
  Array<{ jsmc: string; jslx: string; jxlmc: string; maxvolume: string }>
> {
  const params = new URLSearchParams({
    "page.size": "100",
    jxldm: buildingCode,
    zcStr: String(weekNum),
    xqStr: String(weekday),
    jcStr: sectionStr,
  });

  const response = await hbutRequest.get(
    `/admin/system/jxzy/jsxx/getKxjscx?${params.toString()}`,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Referer: "https://jwxt.hbut.edu.cn",
        Origin: "https://jwxt.hbut.edu.cn",
      },
    },
  );

   
  const json: Record<string, unknown> =
    typeof response.data === "string"
      ? (JSON.parse(response.data) as Record<string, unknown>)
      : (response.data as Record<string, unknown>);

  if (json.ret !== 0) {
    throw new Error(`空教室查询失败: ${String(json.msg ?? "")}`);
  }

  // Taro project reads json.results (not json.data) — see getEmptyClassRoom.js
   
  const raw = json.results as Array<Record<string, unknown>> | undefined;
  return extractEmpytClassRoom(raw ?? []);
}
