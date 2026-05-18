// src/utils/userManager.js
import Taro from "@tarojs/taro";
import cacheManager from "../utils/cache";
import { cleanH5Cookies } from "../utils/cleanH5Cookies";

class UserManager {
	constructor() {
		// 用户信息字段
		this.university = "hbut"; // 大学
		this.realName = "帅哥"; // 真实姓名
		this.stuId = ""; // 学号
		this.password = ""; // 密码
		this.grade = 0; // 入学年份
		this.majority = ""; // 专业
		this.class = ""; // 班级
		this.college = ""; // 学院

		this.isLoggedIn = false; // 登录状态
		this.cacheKey = "userInfo"; // 缓存 key
		this._syncCache = null; // 同步缓存
	}

	// 保存到缓存（永不过期）
	saveToCache() {
		const userData = {
			university: this.university,
			realName: this.realName,
			stuId: this.stuId,
			password: this.password,
			grade: this.grade,
			majority: this.majority,
			class: this.class,
			college: this.college,
			isLoggedIn: this.isLoggedIn,
		};
		cacheManager.set(this.cacheKey, userData, null);
	}

	// 从缓存读取
	getFromCache() {
		return cacheManager.get(this.cacheKey);
	}

	// 同步获取用户信息（优先内存，其次缓存）
	getUserInfoSync() {
		if (this._syncCache) {
			return this._syncCache;
		}
		const cached = cacheManager.get(this.cacheKey);
		if (cached && typeof cached === "object") {
			this.applyValues(cached);
			this._syncCache = this.getValues();
			return this._syncCache;
		}
		return this.getValues();
	}

	// 应用数值到实例属性
	applyValues(values) {
		this.university = values.university || "hbut";
		this.realName = values.realName || "帅哥";
		this.stuId = values.stuId || "";
		this.password = values.password || "";
		this.grade = values.grade || 0;
		this.majority = values.majority || "";
		this.class = values.class || "";
		this.college = values.college || "";
		this.isLoggedIn = values.isLoggedIn || false;
	}

	// 获取当前所有值的副本
	getValues() {
		return {
			university: this.university,
			realName: this.realName,
			stuId: this.stuId,
			grade: this.grade,
			majority: this.majority,
			college: this.college,
			class: this.class,
			isLoggedIn: this.isLoggedIn,
		};
	}

	// 修改单个字段
	setField(key, value) {
		if (this.hasOwnProperty(key)) {
			this[key] = value;
			this.saveToCache();
			this._syncCache = this.getValues();
		} else {
			console.warn(`用户信息中不存在字段: ${key}`);
		}
	}

	// 批量修改字段
	setFields(fields) {
		Object.keys(fields).forEach((key) => {
			if (this.hasOwnProperty(key)) {
				this[key] = fields[key];
			}
		});
		this.saveToCache();
		this._syncCache = this.getValues();
	}

	// 从缓存加载用户信息（应用启动时调用）
	async loadFromCache() {
		const cached = this.getFromCache();
		if (cached && cached.isLoggedIn) {
			this.applyValues(cached);
			this._syncCache = this.getValues();
			this.isLoggedIn = true;
			console.log("从缓存加载用户信息成功");
			return true;
		}
		console.log("无有效用户缓存");
		return false;
	}

	// 注销，清空所有状态
	logout() {
		this.university = "hbut";
		this.realName = "帅哥";
		this.stuId = "";
		this.grade = 0;
		this.majority = "";
		this.college = "";
		this.isLoggedIn = false;
		this.password = "";
		this.class = "";
		this._syncCache = null;

		// 清除缓存
		cacheManager.remove(this.cacheKey);
		cacheManager.clear();
		Taro.clearStorage();
		if (process.env.TARO_ENV === "h5") {
			cleanH5Cookies();
		}
		console.log("用户已注销，所有信息已清空");
	}

	// 检查是否登录
	checkLogin() {
		return this.isLoggedIn;
	}

	// 获取当前大学
	getUniversity() {
		return this.university;
	}

	// 获取学号和密码
	getAccount() {
		return { stuId: this.stuId, password: this.password };
	}
}

// 导出全局唯一实例
const userManager = new UserManager();

// 初始化：从缓存加载用户信息
userManager.loadFromCache();

export default userManager;
export const getUserInfo = () => userManager.getUserInfoSync();
export const setUserField = (key, value) => userManager.setField(key, value);
export const setUserFields = (fields) => userManager.setFields(fields);
export const isLoggedIn = () => userManager.checkLogin();
