import cacheManager from '../../utils/cache';
import { hbutRequest } from '../../utils/request';

const CACHE_KEY = 'ExamInfoData';

export async function getExamInfo(): Promise<unknown[]> {
  const cached = await cacheManager.getAsync<unknown[]>(CACHE_KEY);
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

  const response = await hbutRequest.get(
    '/admin/xsd/kwglXsdKscx/ajaxXsksList',
    loginConfig,
  );

  if (response.status !== 200) {
    throw new Error('获取考试信息失败：网络请求失败');
  }

  const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

  if (data?.ret !== 0) {
    throw new Error('获取考试信息失败：接口返回 ret 不为 0');
  }

  const examResults = data?.results;
  if (!examResults || !Array.isArray(examResults)) {
    throw new Error('获取考试信息失败：响应数据中无有效的 results 字段');
  }

  await cacheManager.setAsync(CACHE_KEY, examResults);
  return examResults;
}
