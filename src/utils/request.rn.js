// utils/request.rn.js
import { API_BASE } from '../config/api'
import CookiesManager from './cookies'
import runtimeLogger from './runtimeLogger'

/**
 * 拼接完整 URL
 */
function resolveUrl(base, relative) {
  if (relative.startsWith('http')) return relative
  const baseClean = base.replace(/\/$/, '')
  const relClean = relative.replace(/^\//, '')
  return `${baseClean}/${relClean}`
}

/**
 * 核心请求函数（带手动重定向和 Cookie 自动管理）
 * 使用 RN 原生 fetch API
 * @param {CookiesManager} cookieManager Cookie管理器实例
 */
async function requestCore(url, method, data, headers, baseURL, cookieManager, redirectCount = 0) {
  const fullUrl = resolveUrl(baseURL, url)

  // 自动携带已保存的 Cookie
  const cookieString = cookieManager.toString()
  if (cookieString) {
    headers['Cookie'] = cookieString
  }

  // 处理 form-urlencoded 数据
  let requestData = data
  const contentType = headers['Content-Type'] || ''
  if (contentType.indexOf('application/x-www-form-urlencoded') !== -1 && data && typeof data !== 'string') {
    if (typeof data.toString === 'function' && data.toString !== Object.prototype.toString) {
      requestData = data.toString()
    } else if (typeof data === 'object') {
      requestData = Object.entries(data)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)
  let response
  try {
    response = await fetch(fullUrl, {
      method,
      headers,
      body: method !== 'GET' && method !== 'HEAD' ? requestData : undefined,
      redirect: 'manual',
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeoutId)
  }

  // 保存 Set-Cookie
  let cookieHeaders
  if (typeof response.headers.getSetCookie === 'function') {
    cookieHeaders = response.headers.getSetCookie()
  } else if (typeof response.headers.getAll === 'function') {
    cookieHeaders = response.headers.getAll('set-cookie')
  } else {
    const raw = response.headers.get('set-cookie')
    cookieHeaders = raw ? [raw] : []
  }
  cookieHeaders.forEach(header => {
    cookieManager.parseAndMerge(header)
  })

  // 手动处理重定向
  if (response.status >= 300 && response.status < 400 && response.status !== 304) {
    const location = response.headers.get('location')
    if (location && redirectCount < 5) {
      const redirectUrl = resolveUrl(fullUrl, location)
      return requestCore(redirectUrl, 'GET', null, {}, baseURL, cookieManager, redirectCount + 1)
    } else if (redirectCount >= 5) {
      throw new Error('重定向次数过多')
    }
  }

  const responseText = await response.text()
  let responseData
  try {
    responseData = JSON.parse(responseText)
  } catch {
    responseData = responseText
  }

  // 将 response headers 转为普通对象
  const responseHeaders = {}
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value
  })

  return {
    data: responseData,
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    config: { url, method, data, headers, baseURL },
  }
}

/**
 * 创建请求实例
 * @param {string} baseURL 基础URL
 * @param {CookiesManager} cookieManager Cookie管理器实例
 */
function createRequest(baseURL, cookieManager) {
  const instance = {
    baseURL,
    async request(config) {
      const { url, method = 'GET', data, headers = {} } = config
      try {
        return await requestCore(url, method, data, headers, baseURL, cookieManager)
      } catch (error) {
        runtimeLogger.error('Request', `${method} ${url} 失败`, error)
        throw error
      }
    },
    get(url, config = {}) {
      return this.request({ ...config, url, method: 'GET' })
    },
    post(url, data, config = {}) {
      return this.request({ ...config, url, method: 'POST', data })
    },
    put(url, data, config = {}) {
      return this.request({ ...config, url, method: 'PUT', data })
    },
    delete(url, config = {}) {
      return this.request({ ...config, url, method: 'DELETE' })
    },
  }
  return instance
}

// 为不同后端创建独立的 Cookie 管理器实例（模块级，可供外部清除）
export const hbutCookies = new CookiesManager('hbut')
export const opendiffCookies = new CookiesManager('opendiff')
export const giteeCookies = new CookiesManager('gitee')
const defaultCookies = new CookiesManager('')

// 为不同后端创建请求实例（自动隔离 Cookie）
export const hbutRequest = createRequest(API_BASE.hbut, hbutCookies)
export const opendiffRequest = createRequest(API_BASE.opendiff, opendiffCookies)
export const giteeRequest = createRequest(API_BASE.gitee, giteeCookies)
export default createRequest('', defaultCookies)
