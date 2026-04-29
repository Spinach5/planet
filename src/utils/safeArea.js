import Taro from '@tarojs/taro'
import cacheManager from './cache'   // 导入 CacheManager 实例（默认无前缀，或自定义）

class SafeAreaManager {
  constructor() {
    this.safeAreaTop = 44
    this.safeAreaBottom = 34
    this.isReady = false
    this.cacheKey = 'safeArea'        // 缓存 key（由 cacheManager 决定是否加前缀）
    this._syncCache = null
  }

  // 保存到缓存（使用 CacheManager，永不过期）
  saveToCache(values) {
    // 第三个参数传 null 表示永不过期（或省略，默认 null）
    cacheManager.set(this.cacheKey, values, null)
  }

  // 从缓存读取（使用 CacheManager）
  getFromCache() {
    return cacheManager.get(this.cacheKey)  // 如果没有或过期会返回 null
  }

  // 同步获取安全距离（优先内存，其次缓存，最后默认值）
  getSafeAreaSync() {
    if (this._syncCache) {
      return this._syncCache
    }
    // 尝试从缓存同步读取（cacheManager.get 本身就是同步的）
    const cached = cacheManager.get(this.cacheKey)
    if (cached && typeof cached === 'object') {
      const { top, bottom } = cached
      this._syncCache = { top, bottom }
      return { top, bottom }
    }
    // 返回默认值
    return { top: 44, bottom: 34 }
  }

  // 初始化（异步获取系统信息）
  async init(forceRefresh = false) {
    if (this.isReady && !forceRefresh) return this.getValues()

    // 1. 尝试从缓存读取
    const cached = this.getFromCache()
    if (cached && !forceRefresh) {
      this.applyValues(cached)
      this.setCSSVariables()
      this._syncCache = { top: this.safeAreaTop, bottom: this.safeAreaBottom }
      console.log('使用缓存的安全距离:', cached)
      return this.getValues()
    }

    // 2. 获取系统信息
    try {
      let top, bottom
      if(process.env.TARO_ENV === 'h5'){
        top = 0
        bottom = 0
      }else{
        const res = await Taro.getSystemInfo({})
      const { safeArea, statusBarHeight } = res
      if (safeArea) {
        top = safeArea.top || 44
        const rawbottom = safeArea.bottom
        bottom = (rawbottom && rawbottom < 200)? rawbottom : 0
        
      } else {
        top = statusBarHeight || 44
        bottom = 0
      }
      }
      

      const values = {
        top,
        bottom,
      }

      this.applyValues(values)
      this.saveToCache(values)       // 使用 cacheManager 保存
      this.setCSSVariables()
      this.isReady = true
      this._syncCache = { top, bottom }

      console.log('安全距离获取成功:', values)
      return this.getValues()
    } catch (error) {
      console.error('获取安全距离失败，使用默认值:', error)
      const defaultValues = { top: 44, bottom: 34}
      this.applyValues(defaultValues)
      this.setCSSVariables()
      this.isReady = true
      this._syncCache = { top: defaultValues.top, bottom: defaultValues.bottom }
      return this.getValues()
    }
  }

  // 应用数值到实例属性
  applyValues(values) {
    this.safeAreaTop = values.top
    this.safeAreaBottom = values.bottom
  }

  // 设置 CSS 变量（仅 H5）
  setCSSVariables() {
    if (process.env.TARO_ENV === 'h5' && typeof document !== 'undefined') {
      const root = document.documentElement
      root.style.setProperty('--safe-area-top', `${this.safeAreaTop}px`)
      root.style.setProperty('--safe-area-bottom', `${this.safeAreaBottom}px`)
      root.style.setProperty('--status-bar-height', `${this.statusBarHeight}px`)
    }
  }

  // 获取当前值
  getValues() {
    return {
      top: this.safeAreaTop,
      bottom: this.safeAreaBottom,
      isReady: this.isReady,
    }
  }
}

const safeAreaManager = new SafeAreaManager()
export default safeAreaManager
export const getSafeArea = () => safeAreaManager.getSafeAreaSync()