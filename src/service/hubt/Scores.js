// 学生成绩绩点
// https://hbut.jw.chaoxing.com/admin/xsd/xskp/xyqk?fasz=1&xhid=...
import { hbutRequest } from "../../utils/request";
import cacheManager from "../../utils/cache";
import { getXhid } from './getXhid';  // 需要获取 xhid

const SCORES_CACHE_KEY = "ScoresData";  // 定义缓存key

export async function getScores() {
  // 1. 优先从缓存获取
  const cached = cacheManager.get(SCORES_CACHE_KEY);
  if (cached) {
    console.log("[getScores] 从缓存获取成绩数据");
    return cached;
  }

  const loginConfig = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Referer: "https://jwxt.hbut.edu.cn",
      Origin: "https://jwxt.hbut.edu.cn",
    },
    withCredentials: true,
  };

  try {
    // 获取 xhid（参考 URL 中的 xhid 参数）
    const xhid = await getXhid();
    
    // 注意：原 URL 中还有 fasz=1 参数，一并加上
    const response = await hbutRequest.get(
      `/admin/xsd/xskp/xyqk?fasz=1&xhid=${xhid}`,
      loginConfig
    );

    // 检查 HTTP 状态码
    if (response.status !== 200) {
      console.log("[getScores] 网络请求失败, status:", response.status);
      throw new Error("获取成绩数据失败：网络请求失败");
    }

    // 检查登录失效
    if (response.status === 300) {
      console.log("[getScores] 登录失效，请重新登录");
      throw new Error("获取成绩数据失败：登录失效，请重新登录");
    }

    // 检查业务返回码
    if (response.data?.ret !== 0) {
      console.log("[getScores] 接口返回异常:", response.data);
      throw new Error("获取成绩数据失败：接口返回 ret 不为 0");
    }

    const scoresData = response.data.data;

    // 验证数据有效性
    if (!scoresData) {
      console.log("[getScores] 响应数据中无 data 字段");
      throw new Error("获取成绩数据失败：响应数据中无成绩数据");
    }

    // 可选：进一步验证 scoresData 的结构是否符合预期
    // 例如成绩通常应该是数组或包含特定字段的对象
    if (typeof scoresData !== 'object') {
      console.log("[getScores] 响应数据格式异常");
      throw new Error("获取成绩数据失败：响应数据格式异常");
    }

    // 3. 存入缓存（永不过期）
    cacheManager.set(SCORES_CACHE_KEY, scoresData);
    console.log("[getScores] 已缓存成绩数据");

    return scoresData;

  } catch (error) {
    // 如果错误已经是 Error 对象，直接抛出；否则包装一下
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("获取成绩数据失败：" + error);
  }
}