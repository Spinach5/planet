import axios from 'axios';
import CookieManager from '@react-native-cookies/cookies';
import { API_BASE } from '../config/api';

const createRequest = (baseURL: string) => {
  const instance = axios.create({
    baseURL,
    timeout: 15000,
    withCredentials: true,
    responseType: 'text',
  });

  return instance;
};

export const hbutRequest = createRequest(API_BASE.hbut);

export async function clearHbutCookies(): Promise<void> {
  try {
    await CookieManager.clearAll();
  } catch {
    // ignore
  }
}

export default createRequest('');
