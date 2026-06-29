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
                └─ 更新 ── 下载进度弹窗
                              ├─ 取消 ── 关闭
                              ├─ 失败 ── toast 错误
                              └─ 完成 ── 解压取 APK → 调系统安装器
```

## 新增文件

### `src/service/update.ts`

| 函数 | 签名 | 职责 |
|------|------|------|
| `checkUpdate()` | `() => Promise<{hasUpdate: bool, name: string, body: string, zipUrl: string, remoteVersion: string} \| null>` | 调 Gitee API，取 latest release，比较 tag_name 和 `expo-constants` 读取的本地版本。比较逻辑：去除 `v` 前缀 + 去除 `-beta` 等后缀，semver 比较 |
| `downloadZip(url, onProgress)` | `(url: string, onProgress: (pct: number) => void) => Promise<string>` | 用 `expo-file-system` 创建可恢复下载，回调进度百分比，返回 zip 本地路径 |
| `extractApk(zipPath)` | `(zipPath: string) => Promise<string>` | 用 `expo-file-system` 解压 zip 到临时目录，遍历找第一个 `.apk` 文件，返回 apk 路径 |
| `installApk(apkPath)` | `(apkPath: string) => Promise<void>` | 用 `expo-intent-launcher` + `expo-file-system` 的 content URI 调起 Android 系统安装器 |

### 版本比较规则

- 去除本地和远程的 `v` 前缀
- 去除 `-beta`、`-alpha` 等预发布后缀，只比较数字部分（如 `1.0.1`）
- 远程版本 > 本地版本 → 有更新
- 相等或更低 → 无更新

## 修改文件

### `src/app/settings.tsx`

"检查更新" 行点击事件替换为完整更新流程：

1. 设置 loading 状态，调用 `checkUpdate()`
2. 无更新 → `Alert.alert("提示", "已是最新版本")`
3. 有更新 → `Alert.alert` 弹窗：
   - 标题: `"发现新版本 v${version}"`
   - 内容: name (首行) + 空行 + body
   - 按钮: ["取消", {text: "更新"}]
4. 点击"更新" → Modal 显示下载进度条（百分比 + 取消按钮）
5. 下载完成 → 自动调用 `extractApk()` → `installApk()`
6. 任何步骤失败 → toast 错误信息

进度弹窗使用已有的 Modal 模式（参考 `showClearConfirm` 的 Modal 写法）。

## 新增依赖

- `expo-file-system` — Expo SDK 内置，下载和文件操作
- `expo-intent-launcher` — 调起 Android 安装 Intent

```bash
npx expo install expo-file-system expo-intent-launcher
```

## 边界情况

- **Release 无 zip asset**：按 asset name 包含 `zip` 过滤，找不到则提示"未找到下载文件"
- **zip 内无 apk**：遍历全部文件，无 `.apk` 则提示"安装包不存在"
- **下载中断**：用户取消或网络中断，删除临时文件，不残留
- **安装失败**：Android 系统可能因权限/安全策略拒绝安装，toast 提示用户手动安装
- **网络错误**：所有 Gitee API 和下载请求均 try-catch，失败 toast 提示

## 不做

- 启动自动检查（仅手动触发）
- APK 下载后自动静默安装（Android 禁止）
- 强制更新（不阻止用户跳过）
- iOS 支持（本次仅 Android）
