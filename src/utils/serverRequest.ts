import axios from 'axios';
import userManager from '@/service/userInfo';

const SERVER_BASE = 'https://spinach.cc.cd';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Unified request function for the app's backend server.
 * Injects JWT token from userManager for authenticated requests.
 */
async function request<T = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  data?: unknown,
  params?: Record<string, string | undefined>,
): Promise<ApiResponse<T>> {
  let url = `${SERVER_BASE}${path}`;

  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {};

  const token = userManager.getServerToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (data) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await axios({
    url,
    method,
    data,
    headers,
    timeout: 15000,
  });

  if (response.status >= 400) {
    if (response.status === 401 || response.status === 403) {
      userManager.setServerToken('');
    }
    const body = response.data as ApiResponse;
    throw new Error(body.message ?? `请求失败 (${String(response.status)})`);
  }

  return response.data as ApiResponse<T>;
}

export async function serverGet<T = unknown>(
  url: string,
  params?: Record<string, string>,
): Promise<ApiResponse<T>> {
  return request<T>('GET', url, undefined, params);
}

export async function serverPost<T = unknown>(
  url: string,
  data?: unknown,
): Promise<ApiResponse<T>> {
  return request<T>('POST', url, data);
}

export async function serverPut<T = unknown>(
  url: string,
  data?: unknown,
): Promise<ApiResponse<T>> {
  return request<T>('PUT', url, data);
}

export async function serverDelete<T = unknown>(
  url: string,
  data?: unknown,
): Promise<ApiResponse<T>> {
  return request<T>('DELETE', url, data);
}

export async function serverUpload(
  url: string,
  fileUri: string,
): Promise<ApiResponse<{ url: string }>> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    // React Native patches XHR.send() to accept {uri} objects directly
    // without going through the broken global FormData polyfill
    const formData = new FormData();
    const filename = fileUri.split('/').pop() ?? 'photo.jpg';
    formData.append('file', { uri: fileUri, type: 'image/jpeg', name: filename } as unknown as Blob);

    xhr.open('POST', `${SERVER_BASE}${url}`);
    const token = userManager.getServerToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.timeout = 30000;

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText) as ApiResponse<{ url: string }>;
        if (xhr.status >= 400) {
          reject(new Error(data.message ?? `上传失败 (${String(xhr.status)})`));
        } else {
          resolve(data);
        }
      } catch {
        reject(new Error('上传响应解析失败'));
      }
    };
    xhr.onerror = () => reject(new Error('网络错误'));
    xhr.ontimeout = () => reject(new Error('上传超时'));
    xhr.send(formData);
  });
}
