// Captcha solver using Tencent CloudBase cloud function (same as original Taro project)
import cloudbase from '@cloudbase/js-sdk';

const CAPTCHA_ID = 'fdHguSojgSJag5B74ij8Bu8ZAzWlNgXM';
const CAPTCHA_BASE = 'https://captcha.chaoxing.com';
const REFERER = 'https://jwxt.hbut.edu.cn';
const REFERER_LOGIN = `${REFERER}/admin/login`;

// CloudBase config from original Taro project
const CLOUDBASE_ENV = 'cloudbase-d0gl91v7x5514ed03';
const CLOUDBASE_KEY = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjlkMWRjMzFlLWI0ZDAtNDQ4Yi1hNzZmLWIwY2M2M2Q4MTQ5OCJ9.eyJhdWQiOiJjbG91ZGJhc2UtZDBnbDkxdjd4NTUxNGVkMDMiLCJleHAiOjI1MzQwMjMwMDc5OSwiaWF0IjoxNzgxODcyMDE5LCJhdF9oYXNoIjoidENDeFNQeEJUV21lcExaRUJyNExrZyIsInByb2plY3RfaWQiOiJjbG91ZGJhc2UtZDBnbDkxdjd4NTUxNGVkMDMiLCJtZXRhIjp7InBsYXRmb3JtIjoiQXBpS2V5In0sImFkbWluaXN0cmF0b3JfaWQiOiIyMDY0MTY4NjkyNDkxNzk2NDgyIiwidXNlcl90eXBlIjoiIiwiY2xpZW50X3R5cGUiOiJjbGllbnRfc2VydmVyIiwiaXNfc3lzdGVtX2FkbWluIjp0cnVlfQ.pCwuQucnRijSWhqzBXKFfAjIeWL6K75Emn_I9QJN86nI43NTfWqoYjRhsXUNzzve7sZcPk4sbCJJ1TQtfVtmjPLeAC4SH4IpGJBZHAwH9bumGxDAzf-Es6a7jrh19t8I8bCmrPHMQVtxpVr7OneRGsGdQOVjtn0T56l38WKyyqqt8wY-a68hWrVVp0hiJ3Wj5r6epxGgGGZcWjxgr3WlWyZZ4h5mYJgPs3BoG-bzsFANIzyRxca-VjdcdHpTI7NvwC3lxKA2-l7GNFH_reiUHl8lznfr7zRU1PrkaNO9B7XRX2x9SLZHf2BAGoo1TfFUrOfIQ4hPgMnsZ4eAOfidFg';

function uuid4(): string {
  const key = '0123456789abcdef';
  let uuid = '';
  for (let i = 0; i < 36; i++) {
    uuid += key.charAt(Math.floor(Math.random() * 16));
  }
  return uuid;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseJSONP(text: string): any {
  const start = text.indexOf('{');
  if (start === -1) throw new Error('JSONP parse failed');
  let depth = 0;
  let end = -1;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) throw new Error('JSONP unclosed');
   
  return JSON.parse(text.slice(start, end + 1));
}

// Simple hash for captcha encryption params (matching original Taro)
function md5Hash(s: string): string {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const chr = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

// Init cloudbase SDK (lazy, cached)
let cloudbaseApp: ReturnType<typeof cloudbase.init> | null = null;
function getCloudbase() {
  cloudbaseApp ??= cloudbase.init({
      env: CLOUDBASE_ENV,
      accessKey: CLOUDBASE_KEY,
    });
  return cloudbaseApp;
}

/**
 * Call the cloud function to compute captcha gap.
 * This is the same approach as the original Taro project.
 */
async function callCaptchaCloud(shadeImage: string, cutoutImage: string): Promise<number> {
  const app = getCloudbase();
  const res = await app.callFunction({
    name: 'captcha',
    data: { shadeImage, cutoutImage },
  });
   
   
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return ((res.result as { x?: number })?.x) ?? 0;
}

/**
 * Solve the slider captcha using the cloud function for gap computation.
 * Returns the validate code on success.
 */
export async function solveCaptcha(): Promise<{ success: boolean; validate?: string }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      // 1. Get captcha config and timestamp
      const now = Date.now();
      const confUrl = `${CAPTCHA_BASE}/get/conf?callback=cx_captcha_function&captchaId=${CAPTCHA_ID}&_=${String(now)}`;
      const confResp = await fetch(confUrl, { credentials: 'include' });
      const confText = await confResp.text();
      const confData = parseJSONP(confText);
      const t = String(confData.t as number);

      // 2. Generate encryption params
      const captchaKey = md5Hash(`${t}${uuid4()}`);
      const token = `${md5Hash(`${t}${CAPTCHA_ID}slide${captchaKey}`)}:${String(Number(t) + 300000)}`;
      const iv = md5Hash(`${CAPTCHA_ID}slide${String(Date.now())}${uuid4()}`);

      // 3. Get slider images
      const imgForm = new URLSearchParams({
        callback: 'cx_captcha_function',
        captchaId: CAPTCHA_ID,
        type: 'slide',
        version: '1.1.20',
        captchaKey,
        token,
        referer: REFERER_LOGIN,
        jcaptchaDefect: '1',
        iv,
        _: String(Date.now()),
      });

      const imgResp = await fetch(`${CAPTCHA_BASE}/get/verification/image`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: imgForm.toString(),
      });
      const imgText = await imgResp.text();
      const imgData = parseJSONP(imgText);
      const vo = imgData.imageVerificationVo as { shadeImage?: string; cutoutImage?: string } | undefined;

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!vo?.shadeImage || !vo?.cutoutImage) continue;

      const verifyToken = imgData.token as string;
      if (!verifyToken) continue;

      // 4. Call cloud function to compute gap (matching original Taro approach)
      const gap = await callCaptchaCloud(vo.shadeImage, vo.cutoutImage);
      if (gap < 10) continue;

      // 5. Submit verification
      const checkParams = new URLSearchParams({
        callback: 'cx_captcha_function',
        captchaId: CAPTCHA_ID,
        type: 'slide',
        token: verifyToken,
        textClickArr: `[{"x":${String(gap)}}]`,
        coordinate: '[]',
        runEnv: '10',
        version: '1.1.20',
        t: 'a',
        iv,
        _: String(Date.now()),
      });

      const checkResp = await fetch(`${CAPTCHA_BASE}/check/verification/result?${checkParams.toString()}`, {
        credentials: 'include',
        headers: { Referer: `${REFERER}/` },
      });
      const checkText = await checkResp.text();
      const checkData = parseJSONP(checkText);

      if (checkData.error !== 0) continue;
      if (checkData.result !== true && checkData.code !== 0 && checkData.code !== 200) continue;

      // Extract validate
      let validate = '';
      try {
        if (typeof checkData.extraData === 'string') {
          const ed = JSON.parse(checkData.extraData) as { validate?: string };
          if (ed.validate) validate = ed.validate;
        }
      } catch {
        const match = /"validate":"([^"]+)"/.exec(checkText);
        if (match) validate = match[1].replace(/\\/g, '');
      }

      return { success: true, validate };
    } catch {
      // Retry next attempt
    }
  }

  return { success: false };
}
