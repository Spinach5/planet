// src/service/index.js — 统一入口，根据学校自动路由
import { getSchool } from './router';

const api = (fn) => (...args) => getSchool()[fn](...args);

export const getAllSchedule  = api('getAllSchedule');
export const getAllWeek      = api('getAllWeek');
export const getCredits      = api('getCredits');
export const getCurrentWeek  = api('getCurrentWeek');
export const getDailySchedule = api('getDailySchedule');
export const getExamInfo     = api('getExamInfo');
export const getExtroInfo    = api('getExtroInfo');
export const getSemesterList = api('getSemesterList');
export const getScores       = api('getScores');
export const getStuInfo      = api('getStuInfo');
export const getTimeTable    = api('getTimeTable');

// auth 直接转发
export const auth = (...args) => getSchool().auth(...args);

// login 是跨学校编排，从 login.js 导出
export { login } from './login';
