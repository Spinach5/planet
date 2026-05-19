// utils/requestWithRetry.js
import { auth } from './auth';

/**
 * 自动重登请求包装器（仅在遇到需要重新登录的状态码时触发）
 * @param {Function} requestFn - 执行实际请求的异步函数
 * @param {Object} options - 配置项
 * @param {number} options.maxRetry - 最大重试次数，默认1
 * @param {Array<number>} options.retryStatuses - 需要重登的状态码列表，默认 [300,302,303]
 * @returns {Promise<any>}
 */
export async function AutoRetry(requestFn, options = {}) {
  const { maxRetry = 1, retryStatuses = [300, 302, 303] } = options;
  let retryCount = 0;

  const execute = async () => {
    try {
      const response = await requestFn();
      const status = response.status || response.statusCode;

      // 只有状态码在重试列表中且未达最大重试次数时，才重新登录并重试
      if (retryStatuses.indexOf(status) !== -1 && retryCount < maxRetry) {
        console.log(`检测到状态码 ${status}，尝试重新登录...`);
        await auth();  // 重新登录，更新全局 Cookie
        retryCount++;
        return await execute();
      }

      // 其他状态（包括 200）正常返回
      return response;
    } catch (error) {
      // 如果错误中包含重定向信息，也可尝试重登
      if (error.message && error.message.contains('redirect') && retryCount < maxRetry) {
        console.log('捕获到重定向错误，尝试重新登录...', error);
        await auth();
        retryCount++;
        return await execute();
      }
      throw error;
    }
  };

  return execute();
}
