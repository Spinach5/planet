# APK 更新功能 — 设计文档

日期: 2026-06-29 | 状态: pending

## 目的

用户手动点击"检查更新"时，通过 Gitee Releases API 检测新版本，下载 zip 解压 APK，调系统安装器更新。

## 数据流

```
设置页「检查更新」
    │  GET https://gitee.com/api/v5/repos/damn_2/planet/releases/latest
    ▼
提取 tag_name, name, body, zip_url
    │  compareVersion(local, remote)
    ▼
┌─ 无更新 ── toast "已是最新版本"
└─ 有新版本 ── 更新弹窗（显示 name + body）
                ├─ 取消 ── 关闭
                └─ 更新 ── 检查「安装未知应用」权限
                              ├─ 无权限 ── 引导跳转系统设置
                              └─ 有权限 ── 下载进度弹窗
                                            ├─ 取消 ── 清理临时文件
                                            ├─ 失败 ── 弹窗"重试/取消"，支持断点续传
                                            └─ 完成 ── 解压取 APK → 调系统安装器
                                                          └─ 安装完成 ── 清理临时文件
```

## 新增文件

### `src/service/update.ts`

| 函数 | 签名 | 职责 |
|------|------|------|
| `checkUpdate()` | `() => Promise<CheckResult>` | 调 Gitee API，取 latest release。URL 使用配置常量 `{owner}/{repo}`。比较 tag_name 和本地 `expo-constants` 的 version。有更新返回 `{hasUpdate: true, name, body, zipUrl, remoteVersion}`；无返回 `{hasUpdate: false}` |
| `downloadZip(url, onProgress)` | `(url: string, onProgress: (pct: number, status: string) => void) => Promise<string>` | 用 `expo-file-system.createDownloadResumable()` 创建可恢复下载。`onProgress` 回调 `(pct, statusText)`，进度状态见下表。返回 zip 本地路径 |
| `extractApk(zipPath)` | `(zipPath: string) => Promise<string>` | 用 `expo-file-system` 解压 zip 到临时目录，遍历找第一个 `.apk` 文件，返回 apk 路径 |
| `checkInstallPermission()` | `() => Promise<boolean>` | 检查 `REQUEST_INSTALL_PACKAGES` 权限（Android 8.0+）。无权限引导跳转系统设置页 |
| `installApk(apkPath)` | `(apkPath: string) => Promise<void>` | 用 `expo-intent-launcher` + `expo-file-system` 的 content URI 调起 Android 系统安装器。调起前先调用 `checkInstallPermission()` |

#### Gitee 配置常量

```typescript
const GITEE_CONFIG = {
  owner: 'damn_2',    // Gitee 个人空间地址
  repo: 'planet',
};
const RELEASES_URL = `https://gitee.com/api/v5/repos/${GITEE_CONFIG.owner}/${GITEE_CONFIG.repo}/releases/latest`;
```

#### 下载状态文案

| 进度 | 文案 |
|------|------|
| 0% | "准备下载..." |
| 1%~99% | "下载中 {pct}%" |
| 100% | "下载完成，准备安装..." |

#### 断点续传

`createDownloadResumable` 返回的对象支持 `resumeAsync()`。下载失败时保存 `downloadResumable` 实例引用，用户点"重试"时调用 `resumeAsync()` 复用已下载部分。

### 版本比较规则（精确）

- 去除本地版本和远程 `tag_name` 的 `v` 前缀
- **只比较 X.Y.Z 数字部分，预发布标识（`-*`）一律忽略**。如 `1.0.1-beta2` 与 `1.0.1` 视为相同版本，不触发更新
- 比较：`major * 10000 + minor * 100 + patch`
- 远程 > 本地 → 有更新；相等或更低 → 无更新

### APK 复用策略

下载完成后，将 `{version: remoteVersion, apkPath}` 存入 AsyncStorage key `"cached_apk"`。下次检查更新时：
- 若 `cached_apk.version === remoteVersion` → 跳过下载，直接用已缓存的 apk 安装
- 若版本不同 → 清除旧缓存，重新下载

### 文件清理策略

| 时机 | 清理内容 |
|------|---------|
| 下载过程中用户点取消 | 删除已下载的临时 zip（`downloadResumable.cancelAsync()` 后删文件） |
| 安装完成后 | 删除临时 zip 和 apk（同时清除 AsyncStorage 的 `cached_apk`） |

清理失败仅 log，不影响主流程。

### 权限检查流程

```
installApk() 被调用
  ↓
checkInstallPermission()
  ├─ 有权限 ── 直接调起系统安装器
  └─ 无权限 ── Alert 弹窗 "需要「安装未知应用」权限"
                ├─ 取消 ── 返回
                └─ 去设置 ── Intent 跳转系统设置页
```

## 修改文件

### `src/app/settings.tsx`

"检查更新" 行点击事件替换为完整更新流程：

1. 按钮变为禁用态，显示"检查中..."
2. 调用 `checkUpdate()`
3. 无更新 → toast "已是最新版本"，按钮恢复
4. 有更新 → `Alert.alert` 弹窗：
   - 标题: `"发现新版本 v${remoteVersion}"`
   - 内容: `name\n\nbody`（body 中的 markdown 链接保留纯文本展示）
   - 按钮: `["取消", {text: "更新"}]`
5. 点击"更新" → **权限检查**（`checkInstallPermission`），无权限引导设置
6. 有权限 → Modal 显示下载进度（百分比 + 状态文案 + 取消按钮）
7. 下载完成 → 自动 `extractApk()` → `installApk()`
8. 安装成功 → 清理临时文件
9. 任何步骤失败 → 弹窗提供"重试/取消"

进度弹窗使用已有的 Modal 模式（参考 `showClearConfirm` 的 Modal 写法）。

## 新增依赖

- `expo-file-system` — Expo SDK 内置，下载和文件操作
- `expo-intent-launcher` — 调起 Android 安装 Intent

```bash
npx expo install expo-file-system expo-intent-launcher
```

## 日志埋点

使用 `runtimeLogger` 在关键步骤打点：

| 步骤 | level | 信息 |
|------|-------|------|
| 检查更新开始/结束 | INFO | 是否命中缓存 / 远程版本 |
| 下载开始 | INFO | url + 本地路径 |
| 下载进度 | DEBUG | `{pct}%` |
| 下载完成/失败 | INFO/ERROR | 文件大小 / 错误信息 |
| 解压 APK | INFO | apk 文件名 |
| 安装调起 | INFO | apk 路径 |

## 边界情况

- **Release 无 zip asset**：按 asset name 包含 `zip` 过滤，找不到则提示"未找到下载文件"
- **zip 内无 apk**：遍历全部文件，无 `.apk` 则提示"安装包不存在"
- **下载中断**：用户取消或网络中断，保存 `downloadResumable` 引用，弹窗提供"重试"按钮，复用断点续传
- **安装失败**：Android 系统可能因权限/安全策略拒绝安装，toast 提示
- **网络错误**：所有 Gitee API 和下载请求均 try-catch，失败弹窗"重试/取消"

## 版本对齐规范

- `app.json` 的 `expo.version` 是本地版本号
- Gitee Release 的 `tag_name`（去除 `v` 前缀和 `-*` 后缀后）应与 `expo.version` 保持一致的数字部分
- 发版流程：先在 Gitee 打 tag 创建 Release 并上传 zip → 再更新 `app.json` version 并构建

## 不做

- 启动自动检查（仅手动触发）
- APK 下载后自动静默安装（Android 禁止）
- 强制更新（不阻止用户跳过）
- iOS 支持（本次仅 Android）
