// src/utils/xhidManager.js
import cacheManager from "../../utils/cache"; // 导入 CacheManager 实例（默认无前缀，或自定义）
import { getXhid } from "./GetXhid";

class XHidManager {
	constructor() {
		this.xhid = "";
		this.isReady = false;
		this.cacheKey = "xhid"; // 缓存 key（由 cacheManager 决定是否加前缀）
		this._syncCache = null;
	}

	// 保存到缓存（使用 CacheManager，永不过期）
	saveToCache(xhid) {
		if (!xhid) return;
		cacheManager.set(this.cacheKey, xhid, null);
	}

	// 从缓存读取（使用 CacheManager）
	getFromCache() {
		return cacheManager.get(this.cacheKey); // 如果没有或过期会返回 null
	}

	// 同步获取 xhid（优先内存，其次缓存，最后默认值）
	getXhidSync() {
		if (this._syncCache) {
			return this._syncCache;
		}
		// 尝试从缓存同步读取（cacheManager.get 本身就是同步的）
		const cached = cacheManager.get(this.cacheKey);
		if (cached && typeof cached === "string" && cached.length > 0) {
			this._syncCache = cached;
			this.xhid = cached;
			return cached;
		}
		// 返回默认值
		return "";
	}

	// 异步获取 xhid
	async AsyncFetchXhid(forceRefresh = false) {
		// 1. 尝试从缓存读取
		if (!forceRefresh) {
			const cached = this.getFromCache();
			if (cached) {
				this.applyValues(cached);
				this._syncCache = cached;
				console.log("使用缓存的 xhid:", cached);
				return this.getValues();
			}
		}

		// 2. 从接口获取
		try {
			const xhid = await getXhid();

			if (!xhid) {
				throw new Error("获取到的 xhid 为空");
			}

			this.applyValues(xhid);
			this.saveToCache(xhid);
			this.isReady = true;
			this._syncCache = xhid;
			return this.getValues();
		} catch (error) {
			console.error("获取 xhid 失败:", error);
			const defaultValues = "";
			this.applyValues(defaultValues);
			this.isReady = true;
			this._syncCache = defaultValues;
			return this.getValues();
		}
	}

	// 初始化（自动调用，兼容旧代码）
	async init(forceRefresh = false) {
		return this.AsyncFetchXhid(forceRefresh);
	}

	// 应用数值到实例属性
	applyValues(xhid) {
		this.xhid = xhid || "";
	}

	// 获取当前值（返回对象，保持一致性）
	getValues() {
		return {
			xhid: this.xhid,
			isReady: this.isReady,
		};
	}

	// 获取 xhid 字符串（快捷方法）fetchXhid
	fetchXHid() {
		if (!this.isReady) {
			console.warn("xhid 尚未准备好,请先初始化");
			return "";
		}
		return this.xhid;
	}

	// 清除缓存的 xhid
	clearCache() {
		cacheManager.remove(this.cacheKey);
		this.xhid = "";
		this._syncCache = null;
		this.isReady = false;
		console.log("xhid 缓存已清除");
	}

	// 检查是否已准备好
	isReady() {
		return this.isReady && !!this.xhid;
	}
}

// 导出全局唯一实例
const xhidManager = new XHidManager();
export default xhidManager;
export const fetchXHid = () => xhidManager.fetchXHid();
