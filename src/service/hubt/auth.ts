import encryptPassword from "../../utils/hbut/loginEncrypt";
import { clearHbutCookies, hbutRequest } from "../../utils/request";
import { runtimeLogger } from "../../utils/runtimeLogger";
import { solveCaptcha } from "./captcha";

interface AuthResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: unknown;
}

export async function auth(
  stuID: string,
  password: string,
): Promise<AuthResult> {
  // Clear stale session cookies from previous attempts.
  // A failed login can leave a poisoned session cookie that
  // causes subsequent attempts to always fail.
  await clearHbutCookies();

  // Step 1: Encrypt password
  let encodedPassword: string;
  try {
    encodedPassword = encryptPassword(password);
    if (!encodedPassword) {
      return { success: false, message: "密码加密失败" };
    }
  } catch (e: unknown) {
    const err = e as { message?: string };
    return {
      success: false,
      message: `加密异常: ${err.message ?? "未知错误"}`,
    };
  }

  // Step 2: Solve slider captcha
  runtimeLogger.info("Auth", "正在求解滑块验证码...");
  const captchaResult = await solveCaptcha();
  let validate = "";
  if (captchaResult.success && captchaResult.validate) {
    validate = captchaResult.validate;
    runtimeLogger.info("Auth", "验证码求解成功");
  } else {
    runtimeLogger.warn("Auth", "验证码求解失败，尝试无验证码登录");
  }

  // Step 3: Build login params
  const params = new URLSearchParams();
  params.append("username", stuID);
  params.append("password", encodedPassword);
  params.append("vcode", "");
  if (validate) params.append("jcaptchaCode", validate);
  params.append("rememberMe", "1");

  const loginConfig = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Referer: "https://jwxt.hbut.edu.cn",
      Origin: "https://jwxt.hbut.edu.cn",
    },
    withCredentials: true,
  };

  // Step 4: Submit login
  try {
    const response = await hbutRequest.post(
      "/admin/login",
      params.toString(),
      loginConfig,
    );
    const httpStatus = response.status;

    // Redirect (302) means success — cookies saved
    if (httpStatus >= 300 && httpStatus < 400) {
      return { success: true, message: "登录成功" };
    }

    let responseData = response.data;

    // Parse string response as JSON if needed (axios responseType is 'text')
    if (typeof responseData === "string") {
      try {
        responseData = JSON.parse(responseData);
      } catch {
        // Not JSON — e.g. HTML page after redirect
      }
    }

    // JSON response handling
    if (typeof responseData === "object" && responseData !== null) {
      // ret !== "0" means wrong password
      if (responseData.ret !== undefined && String(responseData.ret) !== "0") {
        await clearHbutCookies();
        return { success: false, message: "密码输入错误" };
      }

      const codeVal =
        responseData.code !== undefined ? responseData.code : responseData.ret;
      if (
        codeVal !== undefined &&
        codeVal !== 0 &&
        codeVal !== 200 &&
        String(codeVal) !== "0"
      ) {
        await clearHbutCookies();
        return {
          success: false,
          message: String(
            responseData.message ?? responseData.msg ?? "登录失败",
          ),
        };
      }
    }

    if (httpStatus !== 200) {
      await clearHbutCookies();
      return { success: false, message: `HTTP 错误: ${String(httpStatus)}` };
    }

    return { success: true, message: "登录成功" };
  } catch (error: unknown) {
    await clearHbutCookies();
    runtimeLogger.error("Auth", "登录请求失败", error);
    const err = error as {
      response?: { data?: Record<string, unknown> };
      message?: string;
    };
    if (err.response) {
      const errorData = err.response.data;
      if (typeof errorData === "object") {
        return {
          success: false,
          message:
            typeof errorData.message === "string"
              ? errorData.message
              : typeof errorData.msg === "string"
                ? errorData.msg
                : "请求失败",
          data: errorData,
        };
      }
    }

    return {
      success: false,
      message: err.message ?? "网络请求失败",
      error: err,
    };
  }
}
