import { hbutRequest } from '../../utils/request';
import encryptPassword from '../../utils/hbut/loginEncrypt';

interface AuthResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: unknown;
}

export async function auth(stuID: string, password: string): Promise<AuthResult> {
  let encodedPassword: string;
  try {
    encodedPassword = encryptPassword(password);
    if (!encodedPassword) {
      return { success: false, message: '密码加密失败' };
    }
  } catch (e: unknown) {
    const err = e as { message?: string };
    return { success: false, message: `加密异常: ${err.message ?? '未知错误'}` };
  }

  const params = new URLSearchParams();
  params.append('username', stuID);
  params.append('password', encodedPassword);
  params.append('rememberMe', '1');
  params.append('vcode', '');
  params.append('jcaptchaCode', '');

  const loginConfig = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Referer: 'https://jwxt.hbut.edu.cn',
      Origin: 'https://jwxt.hbut.edu.cn',
    },
    withCredentials: true,
  };

  try {
    const response = await hbutRequest.post('/admin/login', params.toString(), loginConfig);
    const responseData = response.data;

    // Check if response is JSON (failure case)
    if (typeof responseData === 'object' && responseData !== null) {
      if (responseData.code !== 0 && responseData.code !== 200) {
        return {
          success: false,
          message: responseData.message ?? responseData.msg ?? '登录失败',
          data: responseData,
        };
      }
    }

    if (response.status !== 200) {
      return { success: false, message: `HTTP 错误: ${response.status}` };
    }

    return {
      success: true,
      message: '登录请求已完成，请验证',
      data: responseData,
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: Record<string, unknown> }; message?: string };
    if (err.response) {
      const errorData = err.response.data;
      if (typeof errorData === 'object') {
        return {
          success: false,
          message: errorData.message ?? errorData.msg ?? '请求失败',
          data: errorData,
        };
      }
    }

    return {
      success: false,
      message: err.message ?? '网络请求失败',
      error: err,
    };
  }
}
