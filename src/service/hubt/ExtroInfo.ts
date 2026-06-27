import cacheManager from "../../utils/cache";
import { hbutRequest } from "../../utils/request";
import { getXhid } from "./GetXhid";

const CACHE_KEY_PREFIX = "ExtroInfoData_";

interface PracticeItem {
  jxbzc: string;
  kcmc: string;
  xkrs: string;
  zcstr: string;
  zjname: string;
}

function extractPracticeInfo(data: unknown[]): PracticeItem[] {
  if (!Array.isArray(data)) return [];
  return data.map((item) => {
    const it = item as Record<string, unknown>;
    return {
      jxbzc: String(it.jxbzc ?? ""),
      kcmc: String(it.kcmc ?? "").replace(/<[^>]*>/g, ""),
      xkrs: String(it.xkrs ?? ""),
      zcstr: String(it.zcstr ?? ""),
      zjname: String(it.zjname ?? "").replace(/<[^>]*>/g, ""),
    };
  });
}

/**
 * Get extro/practice info for a semester.
 * Matches the original Taro getExtroInfo: POST /admin/api/getZclistByXnxq
 */
export async function getExtroInfo(
  semester: string,
  forceRefresh = false,
): Promise<PracticeItem[]> {
  const cacheKey = CACHE_KEY_PREFIX + semester;

  if (!forceRefresh) {
    const cached = cacheManager.get<PracticeItem[]>(cacheKey);
    if (cached) return cached;
  }

  const loginConfig = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Referer: "https://jwxt.hbut.edu.cn",
      Origin: "https://jwxt.hbut.edu.cn",
    },
    withCredentials: true,
  };

  const xhid = await getXhid();
  const params = new URLSearchParams();
  params.append("xnxq", semester);
  params.append("userId", xhid);

  const response = await hbutRequest.post(
    "/admin/api/getZclistByXnxq",
    params,
    loginConfig,
  );

  if (response.status !== 200) {
    throw new Error("获取实践信息失败：网络请求失败");
  }

  const data =
    typeof response.data === "string"
      ? (JSON.parse(response.data) as Record<string, unknown>)
      : (response.data as Record<string, unknown>);

  if (data?.ret !== 0) {
    throw new Error("获取实践信息失败：接口返回 ret 不为 0");
  }

  const sjkData = extractPracticeInfo(
    ((data.data as Record<string, unknown> | undefined)?.bpkkc as unknown[]) ??
      [],
  );

  await cacheManager.setAsync(cacheKey, sjkData);
  return sjkData;
}
