// 1. 导入两个学校的具体实现模块
import userManager from "./userInfo"
import * as hbutImpl from './hubt/A_index';

// 2. 学校与实现模块的映射表
const modules = {
  hbut: hbutImpl,
};

// 3. 获取当前用户学校的方法
function getCurrentSchool() {
  return userManager.getUniversity() || 'hbut'; // 替换为你的实际获取方式
}

// 4. 动态分发函数
function dispatch(school, funcName, ...args) {
  const mod = modules[school];
  if (!mod) throw new Error(`未知学校: ${school}`);
  if (typeof mod[funcName] !== 'function') {
    throw new Error(`学校 ${school} 没有实现 ${funcName} 方法`);
  }
  return mod[funcName](...args);
}


// 不提前声明方法列表，可以使用 Proxy 代理
export const schoolProxy = new Proxy({}, {
  get(_, methodName) {
    return function(...args) {
      const school = getCurrentSchool();
      return dispatch(school, methodName, ...args);
    };
  }
});
