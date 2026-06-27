import cacheManager from "../../utils/cache";
import { hbutRequest } from "../../utils/request";
import { runtimeLogger } from "../../utils/runtimeLogger";

const CACHE_KEY_PREFIX = "v2_AllScores";
const DEFAULT_PAGE_SIZE = 80;

export interface CourseScoreItem {
  xnxq: string;
  kcmc: string;
  xf: string;
  sfbk: string;
  zhcj: number;
}

function extractScores(scores: unknown[]): CourseScoreItem[] {
  if (!Array.isArray(scores)) return [];
  return scores.map((item) => {
    const it = item as Record<string, unknown>;
    const cleanName = String(it.kcmc ?? "")
      .replace(/<[^>]*>/g, "")
      .replace(/^\[\S+\]\s*/, "");
    let zhcj = Number(it.zhcj);
    if (Number.isNaN(zhcj)) zhcj = 0;
    return {
      xnxq: String(it.xnxq ?? ""),
      kcmc: cleanName,
      xf: it.xf != null ? String(it.xf) : "",
      sfbk: it.sfbk != null ? String(it.sfbk) : "0",
      zhcj,
    };
  });
}

export async function getCourseScores(
  semester: string,
  forceRefresh = false,
): Promise<CourseScoreItem[]> {
  const cacheKey = `${CACHE_KEY_PREFIX}_${semester}`;

  if (!forceRefresh) {
    const cached = await cacheManager.getAsync<CourseScoreItem[]>(cacheKey);
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

  const fetchPage = async (size: number) => {
    return hbutRequest.get(
      `admin/xsd/xsdcjcx/xsdQueryXscjList?page.size=${String(size)}`,
      loginConfig,
    );
  };

  try {
    let response = await fetchPage(DEFAULT_PAGE_SIZE);

    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${String(response.status)}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const json: Record<string, unknown> =
      typeof response.data === "string"
        ? (JSON.parse(response.data) as Record<string, unknown>)
        : (response.data as Record<string, unknown>);

    if (json.ret !== 0) {
      throw new Error(`接口返回异常: ret=${String(json.ret)}`);
    }

    // If total larger than default page size, re-fetch with full size
    let results: unknown[] = (json.results as unknown[]) ?? [];
    const total = Number(json.total ?? 0);
    if (total > DEFAULT_PAGE_SIZE) {
      response = await fetchPage(total);
      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${String(response.status)}`);
      }
      const fullJson: Record<string, unknown> =
        typeof response.data === "string"
          ? (JSON.parse(response.data) as Record<string, unknown>)
          : (response.data as Record<string, unknown>);
      results = (fullJson.results as unknown[]) ?? [];
    }

    const scoresData = extractScores(results);
    await cacheManager.setAsync(cacheKey, scoresData);
    return scoresData;
  } catch (error) {
    runtimeLogger.error("CourseScores", "获取课程成绩失败", error);
    if (error instanceof Error) throw error;
    throw new Error(String(error));
  }
}
