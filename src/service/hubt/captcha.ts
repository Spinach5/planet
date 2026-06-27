/* eslint-disable */
import CryptoJS from "crypto-js";

// Use require() to load CJS builds — avoids Metro ESM interop
// "Cannot assign to property 'default' which has only a getter"
const cloudbaseSDK = require("@cloudbase/js-sdk");
const adapter = require("@cloudbase/adapter-rn").default;

cloudbaseSDK.useAdapters(adapter);

const CLOUDBASE_ENV = process.env.EXPO_PUBLIC_CLOUDBASE_ENV_ID ?? "";
const CLOUDBASE_KEY = process.env.EXPO_PUBLIC_CLOUDBASE_ACCESS_KEY ?? "";

const cloudbase = cloudbaseSDK.init({
  env: CLOUDBASE_ENV,
  region: "ap-shanghai",
  accessKey: CLOUDBASE_KEY,
});

const CAPTCHA_BASE = "https://captcha.chaoxing.com/captcha";
const CAPTCHA_ID = "fdHguSojgSJag5B74ij8Bu8ZAzWlNgXM";
const REFERER = "https://jwxt.hbut.edu.cn";
const REFERER_LOGIN = REFERER + "/admin/login";

function uuid4(): string {
  const arr: string[] = [];
  const key = "0123456789abcdef";
  for (let i = 0; i < 36; i++)
    arr[i] = key.charAt(Math.floor(Math.random() * 16));
  arr[14] = "4";
  arr[19] = key.charAt((parseInt(arr[19], 16) & 3) | 8);
  arr[8] = arr[13] = arr[18] = arr[23] = "-";
  return arr.join("");
}

function parseJSONP(text: string): Record<string, unknown> {
  const start = text.indexOf("{");
  if (start === -1) throw new Error("JSONP 响应中未找到 JSON 对象");
  let depth = 0,
    end = -1;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) throw new Error("JSONP 响应中 JSON 对象未闭合");
  return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
}

async function ensureLogin(): Promise<void> {
  try {
    const loginState = await cloudbase.auth().getLoginState();
    if (!loginState) {
      await cloudbase.auth().signInAnonymously();
      console.log("[captcha] 匿名登录成功");
    } else {
      console.log("[captcha] 已有登录态");
    }
  } catch (e) {
    console.warn("[captcha] 登录失败:", e);
    throw e;
  }
}

async function callCaptchaCloud(
  shadeImage: string,
  cutoutImage: string,
): Promise<number> {
  try {
    await ensureLogin();
    const res = await cloudbase.callFunction({
      name: "captcha",
      data: { shadeImage, cutoutImage },
    });
    const x = (res.result as { x?: number } | undefined)?.x ?? 0;
    console.log("[captcha] cloud function returned x:", x);
    return x;
  } catch (e) {
    console.warn("[captcha] cloud function call failed:", e);
    return 0;
  }
}

export async function solveCaptcha(): Promise<{
  success: boolean;
  validate?: string;
}> {
  for (let i = 0; i < 3; i++) {
    try {
      const now = Date.now();
      console.log(`[captcha] attempt ${i + 1}: fetching config...`);
      const confUrl =
        CAPTCHA_BASE +
        "/get/conf?callback=cx_captcha_function&captchaId=" +
        CAPTCHA_ID +
        "&_=" +
        String(now);
      const confResp = await fetch(confUrl, { credentials: "include" });
      const confText = await confResp.text();
      const confData = parseJSONP(confText);
      const t = confData.t as number;
      console.log(`[captcha] config fetched, t=${t}`);

      const captchaKey = CryptoJS.MD5(String(t) + uuid4()).toString();
      const token =
        CryptoJS.MD5(String(t) + CAPTCHA_ID + "slide" + captchaKey).toString() +
        ":" +
        String(Number(t) + 300000);
      const iv = CryptoJS.MD5(
        CAPTCHA_ID + "slide" + String(Date.now()) + uuid4(),
      ).toString();

      console.log("[captcha] fetching verification image...");
      const imgForm = new URLSearchParams({
        callback: "cx_captcha_function",
        captchaId: CAPTCHA_ID,
        type: "slide",
        version: "1.1.20",
        captchaKey,
        token,
        referer: REFERER_LOGIN,
        jcaptchaDefect: "1",
        iv,
        _: String(Date.now()),
      });
      const imgResp = await fetch(CAPTCHA_BASE + "/get/verification/image", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body: imgForm.toString(),
      });
      const imgText = await imgResp.text();
      const imgData = parseJSONP(imgText);
      const vo = imgData.imageVerificationVo as
        | { shadeImage?: string; cutoutImage?: string }
        | undefined;
      if (!vo?.shadeImage || !vo?.cutoutImage) {
        console.warn("[captcha] no shade/cutout images in response, retrying");
        continue;
      }
      console.log("[captcha] images received, calling cloud function...");

      const verifyToken = imgData.token as string;
      if (!verifyToken) {
        console.warn("[captcha] no verify token, retrying");
        continue;
      }

      const gap = await callCaptchaCloud(vo.shadeImage, vo.cutoutImage);
      if (gap < 10) {
        console.warn(`[captcha] gap too small (${gap}), retrying`);
        continue;
      }
      console.log(`[captcha] gap=${gap}, submitting verification...`);

      const checkParams = new URLSearchParams({
        callback: "cx_captcha_function",
        captchaId: CAPTCHA_ID,
        type: "slide",
        token: verifyToken,
        textClickArr: '[{"x":' + String(gap) + "}]",
        coordinate: "[]",
        runEnv: "10",
        version: "1.1.20",
        t: "a",
        iv,
        _: String(Date.now()),
      });
      const checkResp = await fetch(
        CAPTCHA_BASE + "/check/verification/result?" + checkParams.toString(),
        {
          credentials: "include",
          headers: { Host: "captcha.chaoxing.com", Referer: REFERER + "/" },
        },
      );
      const checkText = await checkResp.text();
      const checkData = parseJSONP(checkText);
      console.log("[captcha] verification response:", JSON.stringify(checkData));

      if (checkData.error !== 0) {
        console.warn(`[captcha] check error=${checkData.error}, retrying`);
        continue;
      }
      if (
        checkData.result !== true &&
        checkData.code !== 0 &&
        checkData.code !== 200
      ) {
        console.warn(`[captcha] check result=${checkData.result}, code=${checkData.code}, retrying`);
        continue;
      }

      let validate = "";
      try {
        if (checkData.extraData && typeof checkData.extraData === "string") {
          const ed = JSON.parse(checkData.extraData) as { validate?: string };
          if (ed.validate) validate = ed.validate;
        }
      } catch {
        const match = /"validate":"([^"]+)"/.exec(checkText);
        if (match) validate = match[1].replace(/\\/g, "");
      }
      console.log(`[captcha] success! validate=${validate}`);
      return { success: true, validate };
    } catch (e) {
      console.warn(`[captcha] attempt ${i + 1} exception:`, e);
    }
  }
  console.warn("[captcha] all 3 attempts failed");
  return { success: false };
}
