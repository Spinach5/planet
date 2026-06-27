import cacheManager from "../../utils/cache";
import { hbutRequest } from "../../utils/request";

const CACHE_KEY_PREFIX = "ExamInfoData_";

interface ExamItem {
  kcmc: string;
  jsmc: string;
  kssj: string;
  ksfs: string;
  kspcmc: string;
  zwh: string;
}

interface ExamResult {
  total: number;
  exams: ExamItem[];
}

function extractExamInfo(raw: Record<string, unknown>): ExamResult {
  if (!raw || typeof raw !== "object") {
    return { total: 0, exams: [] };
  }

  const total = Number(raw.total);
  const safeTotal = Number.isNaN(total) ? 0 : total;

  const results = Array.isArray(raw.results) ? raw.results : [];
  const exams: ExamItem[] = results
    .map((item) => {
      const it = item as Record<string, unknown>;
      return {
        kcmc: String(it.kcmc ?? "").replace(/<[^>]*>/g, ""),
        jsmc: String(it.jsmc ?? "").replace(/<[^>]*>/g, ""),
        kssj: String(it.kssj ?? ""),
        ksfs: String(it.ksfs ?? ""),
        kspcmc: String(it.kspcmc ?? ""),
        zwh: String(it.zwh ?? ""),
      };
    })
    .sort((a, b) => {
      const timeA = a.kssj ? a.kssj.split("~")[0].trim() : "";
      const timeB = b.kssj ? b.kssj.split("~")[0].trim() : "";

      if (!timeA && !timeB) return 0;
      if (!timeA) return 1;
      if (!timeB) return -1;

      return new Date(timeA).getTime() - new Date(timeB).getTime();
    });

  return { total: safeTotal, exams };
}

/**
 * Get exam info for a semester, sorted by exam time.
 * Matches the original Taro getExamInfo.
 */
export async function getExamInfo(
  semester: string,
  forceRefresh = false,
): Promise<ExamResult> {
  const cacheKey = CACHE_KEY_PREFIX + semester;

  if (!forceRefresh) {
    const cached = await cacheManager.getAsync<ExamResult>(cacheKey);
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

  const response = await hbutRequest.get(
    `admin/xsd/kwglXsdKscx/ajaxXsksList?xnxq=${semester}`,
    loginConfig,
  );

  if (response.status !== 200) {
    throw new Error("获取考试信息失败：网络请求失败");
  }

  const data =
    typeof response.data === "string"
      ? (JSON.parse(response.data) as Record<string, unknown>)
      : (response.data as Record<string, unknown>);

  if (data?.ret !== 0) {
    throw new Error("获取考试信息失败：接口返回 ret 不为 0");
  }

  const examResults = extractExamInfo(data);

  await cacheManager.setAsync(cacheKey, examResults);
  return examResults;
}
