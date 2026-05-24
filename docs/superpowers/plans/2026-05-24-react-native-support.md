# React Native Platform Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add React Native as a third platform (alongside WeChat and H5) and build an APK via local Android Studio.

**Architecture:** Follow existing platform-specific file pattern (`*.rn.js`). Use `fetch` API for RN requests, `jsencrypt` for login encryption. Webpack5 compiler for RN build, Vite stays for H5/WeChat. Custom `TabBar` + `SafeAreaView` navigation preserved across all platforms.

**Tech Stack:** Taro 4.2.0, React Native, Webpack5, jsencrypt, fetch API, Android Studio

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/utils/request.rn.js` | Create | RN HTTP client using `fetch`, with Cookie management and redirect handling |
| `src/utils/hbut/loginEncrypt.rn.js` | Create | RN login encryption using `jsencrypt` (same as H5) |
| `config/index.js` | Modify | Add Webpack5 compiler for RN, update `appName` to `taro_mini` |
| `package.json` | Modify | Add RN dependencies (`@tarojs/plugin-platform-rn`, `react-native`, etc.) |

---

### Task 1: Create RN Request Module

**Files:**
- Create: `src/utils/request.rn.js`

**Context:** Follow the `request.weapp.js` pattern (factory + cookie manager + manual redirects) but use RN's native `fetch` API instead of `Taro.request`. The `fetch` API is built into React Native and supports manual redirect handling.

- [ ] **Step 1: Create `src/utils/request.rn.js`**

```js
// utils/request.rn.js
import { API_BASE } from '../config/api'
import CookiesManager from './cookies'
import runtimeLogger from './runtimeLogger'

/**
 * 拼接完整 URL
 */
function resolveUrl(base, relative) {
  if (relative.startsWith('http')) return relative
  const baseClean = base.replace(/\/$/, '')
  const relClean = relative.replace(/^\//, '')
  return `${baseClean}/${relClean}`
}

/**
 * 核心请求函数（带手动重定向和 Cookie 自动管理）
 * 使用 RN 原生 fetch API
 * @param {CookiesManager} cookieManager Cookie管理器实例
 */
async function requestCore(url, method, data, headers, baseURL, cookieManager, redirectCount = 0) {
  const fullUrl = resolveUrl(baseURL, url)

  // 自动携带已保存的 Cookie
  const cookieString = cookieManager.toString()
  if (cookieString) {
    headers['Cookie'] = cookieString
  }

  // 处理 form-urlencoded 数据
  let requestData = data
  const contentType = headers['Content-Type'] || ''
  if (contentType.indexOf('application/x-www-form-urlencoded') !== -1 && data && typeof data !== 'string') {
    if (typeof data.toString === 'function' && data.toString !== Object.prototype.toString) {
      requestData = data.toString()
    } else if (typeof data === 'object') {
      requestData = Object.entries(data)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')
    }
  }

  const response = await fetch(fullUrl, {
    method,
    headers,
    body: method !== 'GET' && method !== 'HEAD' ? requestData : undefined,
    redirect: 'manual',
  })

  // 保存 Set-Cookie
  const setCookieHeader = response.headers.get('set-cookie')
  if (setCookieHeader) {
    const cookieHeaders = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
    cookieHeaders.forEach(header => {
      cookieManager.parseAndMerge(header)
    })
  }

  // 手动处理重定向
  if (response.status >= 300 && response.status < 400 && response.status !== 304) {
    const location = response.headers.get('location')
    if (location && redirectCount < 5) {
      const redirectUrl = resolveUrl(fullUrl, location)
      return requestCore(redirectUrl, 'GET', null, {}, baseURL, cookieManager, redirectCount + 1)
    } else if (redirectCount >= 5) {
      throw new Error('重定向次数过多')
    }
  }

  const responseText = await response.text()
  let responseData
  try {
    responseData = JSON.parse(responseText)
  } catch {
    responseData = responseText
  }

  // 将 response headers 转为普通对象
  const responseHeaders = {}
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value
  })

  return {
    data: responseData,
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    config: { url, method, data, headers, baseURL },
  }
}

/**
 * 创建请求实例
 * @param {string} baseURL 基础URL
 * @param {CookiesManager} cookieManager Cookie管理器实例
 */
function createRequest(baseURL, cookieManager) {
  const instance = {
    baseURL,
    async request(config) {
      const { url, method = 'GET', data, headers = {} } = config
      try {
        return await requestCore(url, method, data, headers, baseURL, cookieManager)
      } catch (error) {
        runtimeLogger.error('Request', `${method} ${url} 失败`, error)
        throw error
      }
    },
    get(url, config = {}) {
      return this.request({ ...config, url, method: 'GET' })
    },
    post(url, data, config = {}) {
      return this.request({ ...config, url, method: 'POST', data })
    },
    put(url, data, config = {}) {
      return this.request({ ...config, url, method: 'PUT', data })
    },
    delete(url, config = {}) {
      return this.request({ ...config, url, method: 'DELETE' })
    },
  }
  return instance
}

// 为不同后端创建独立的 Cookie 管理器实例
export const hbutCookies = new CookiesManager('hbut')
export const opendiffCookies = new CookiesManager('opendiff')
export const giteeCookies = new CookiesManager('gitee')
const defaultCookies = new CookiesManager('')

// 为不同后端创建请求实例
export const hbutRequest = createRequest(API_BASE.hbut, hbutCookies)
export const opendiffRequest = createRequest(API_BASE.opendiff, opendiffCookies)
export const giteeRequest = createRequest(API_BASE.gitee, giteeCookies)
export default createRequest('', defaultCookies)
```

- [ ] **Step 2: Verify file was created correctly**

Run: `cat src/utils/request.rn.js | head -5`
Expected: First line shows `// utils/request.rn.js`

- [ ] **Step 3: Commit**

```bash
git add src/utils/request.rn.js
git commit -m "feat: add React Native request module using fetch API"
```

---

### Task 2: Create RN Login Encryption Module

**Files:**
- Create: `src/utils/hbut/loginEncrypt.rn.js`

**Context:** Identical logic to `loginEncrypt.h5.js` — use `jsencrypt` library (already a dependency). Taro's platform file resolution will automatically select this file when `TARO_ENV === 'rn'`.

- [ ] **Step 1: Create `src/utils/hbut/loginEncrypt.rn.js`**

```js
/**
 * React Native 端加密函数
 * 使用 jsencrypt（与 H5 端相同）
 */
import { JSEncrypt } from 'jsencrypt'

function encryptPassword(password) {
  const publicKey = 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDcwU0RBrR31L3eHKVGogsJKdr36D3rrjUNaZ77yxxO9HSIojA4jyJylCVALkcu4cK+bbGLpedilJSlcyohso+IBI+A/eAfjS/GhIT/OWEsg8/+YLt+asM8+pdISE/T14tTqg/WDe8nqX48dazB0Izu1ytaPPFRWuYqtUTRpZ7IsQIDAQAB'
  const encrypt = new JSEncrypt()
  encrypt.setPublicKey(publicKey)
  const result = encrypt.encrypt(password)
  if (result === false) {
    throw new Error('加密失败，请检查公钥或输入内容')
  }
  return result
}

export default encryptPassword
```

- [ ] **Step 2: Verify file was created correctly**

Run: `cat src/utils/hbut/loginEncrypt.rn.js | head -5`
Expected: First line shows `/** React Native 端加密函数`

- [ ] **Step 3: Commit**

```bash
git add src/utils/hbut/loginEncrypt.rn.js
git commit -m "feat: add React Native login encryption module"
```

---

### Task 3: Update Build Configuration for RN

**Files:**
- Modify: `config/index.js:25` (compiler line)
- Modify: `config/index.js:163-170` (rn block)

**Context:** Switch to Webpack5 compiler when building for RN, keep Vite for H5/WeChat. Update `appName` from `taroDemo` to `taro_mini`.

- [ ] **Step 1: Update the compiler to be platform-conditional**

In `config/index.js`, change line 25 from:
```js
compiler: "vite",
```
to:
```js
compiler: process.env.TARO_ENV === 'rn' ? 'webpack5' : 'vite',
```

- [ ] **Step 2: Update the `rn` config block**

In `config/index.js`, change lines 163-170 from:
```js
rn: {
    appName: "taroDemo",
    postcss: {
        cssModules: {
            enable: false,
        },
    },
},
```
to:
```js
rn: {
    appName: "taro_mini",
    postcss: {
        cssModules: {
            enable: false,
        },
    },
},
```

- [ ] **Step 3: Verify the changes**

Run: `grep -n "compiler\|appName" config/index.js`
Expected output includes:
- `compiler: process.env.TARO_ENV === 'rn' ? 'webpack5' : 'vite',`
- `appName: "taro_mini",`

- [ ] **Step 4: Commit**

```bash
git add config/index.js
git commit -m "feat: configure Webpack5 compiler for RN, set appName to taro_mini"
```

---

### Task 4: Add RN Dependencies

**Files:**
- Modify: `package.json`

**Context:** Install the packages required for Taro RN builds: the RN platform plugin, React Native core, async storage, and the Webpack5 runner.

- [ ] **Step 1: Install RN dependencies**

```bash
npm install @tarojs/plugin-platform-rn@4.2.0 react-native @react-native-async-storage/async-storage
```

- [ ] **Step 2: Install Webpack5 runner as devDependency**

```bash
npm install --save-dev @tarojs/webpack5-runner@4.2.0
```

- [ ] **Step 3: Verify packages are in `package.json`**

Run: `grep -E "plugin-platform-rn|webpack5-runner|react-native|async-storage" package.json`
Expected: All 4 packages appear in dependencies or devDependencies.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add React Native platform dependencies"
```

---

### Task 5: Build RN Project and Generate Android Shell

**Files:** None (build step only)

**Context:** Run the Taro RN build to generate the JS bundle and the `android/` shell project. This verifies all the previous tasks work together.

- [ ] **Step 1: Run the RN build**

```bash
npm run build:rn
```

Expected: Build completes without errors. Output appears in `dist/rn/`.

- [ ] **Step 2: Verify the Android shell project was generated**

Run: `ls android/`
Expected: Directory exists with `app/`, `build.gradle`, `settings.gradle`, etc.

- [ ] **Step 3: If build fails, check common issues**

- If `@tarojs/plugin-platform-rn` not found → re-run `npm install`
- If Webpack5 errors → verify `@tarojs/webpack5-runner` is installed
- If module resolution errors → check that `request.rn.js` and `loginEncrypt.rn.js` exist at correct paths

- [ ] **Step 4: Commit generated Android project (optional)**

```bash
git add android/ dist/rn/
git commit -m "feat: generate Android shell project from Taro RN build"
```

---

### Task 6: Build APK via Android Studio

**Files:** None (manual Android Studio steps)

**Context:** Open the generated `android/` project in Android Studio and build a debug APK.

**Prerequisites (one-time setup):**
- Android Studio installed
- Android SDK (API level 31+) installed via SDK Manager
- `ANDROID_HOME` environment variable set (e.g., `export ANDROID_HOME=$HOME/Android/Sdk`)
- SDK licenses accepted: `$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses`

- [ ] **Step 1: Open the Android project in Android Studio**

```
File → Open → select the `android/` directory
```

Wait for Gradle sync to complete.

- [ ] **Step 2: Build the debug APK**

```
Build → Build Bundle(s) / APK(s) → Build APK(s)
```

- [ ] **Step 3: Locate the APK**

```bash
ls android/app/build/outputs/apk/debug/
```

Expected: `app-debug.apk` exists.

- [ ] **Step 4: Install on device/emulator (optional)**

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```
