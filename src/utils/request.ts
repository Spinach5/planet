import axios from 'axios';
import type { AxiosResponse } from 'axios';
import CookiesManager from './cookies';
import { API_BASE } from '../config/api';

const hbutCookieManager = new CookiesManager('hbut');
void hbutCookieManager.init();

const createRequest = (baseURL: string, cookieManager: CookiesManager) => {
  const instance = axios.create({
    baseURL,
    timeout: 15000,
    withCredentials: false,
    responseType: 'text',
  });

  instance.interceptors.request.use(
    async (config) => {
      await cookieManager.ensureLoaded();
      const cookieString = cookieManager.toString();
      if (cookieString) {
        config.headers.Cookie = cookieString;
      }
      return config;
    },
    async (error: Error) => Promise.reject(error),
  );

  instance.interceptors.response.use(
    async (response: AxiosResponse) => {
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        const cookieHeaders = Array.isArray(setCookie) ? setCookie : [setCookie];
        for (const header of cookieHeaders) {
          await cookieManager.parseAndMerge(header);
        }
      }
      return response;
    },
    async (error: Error) => Promise.reject(error),
  );

  return instance;
};

export const hbutRequest = createRequest(API_BASE.hbut, hbutCookieManager);

/** Clear HBUT session cookies — call before each login to start fresh */
export async function clearHbutCookies(): Promise<void> {
  await hbutCookieManager.clear();
}

export default createRequest('', new CookiesManager(''));
