# APK 应用内更新 — 完整重写设计文档

日期: 2026-06-30 | 状态: approved | 参考: `apk-in-app-update-tutorial.md`

## 目的

按照教程的三层架构（service → hook → UI），完整重写应用内 APK 更新功能。修复实战中发现的三个核心问题：
1. 系统安装器不弹出（缺少 `RETURN_RESULT` extra 导致 `resultCode=0`）
2. 缓存时机错误导致二次检查静默失败
3. `contentUri` 获取不可靠

## 架构

```
settings.tsx
 ├─ UpdateDialog (下载进度/确认/错误弹窗)
 └─ useAppUpdate Hook
     └─ update.ts (纯逻辑，零 UI 依赖)
```

### 数据流

```
checkUpdate()
  ├─ 无更新 → { hasUpdate: false }
  ├─ 有新版本 + 有同版本缓存 → { hasUpdate: true, zipUrl: "" }
  └─ 有新版本 + 无缓存 → { hasUpdate: true, zipUrl: "..." }

startUpdate()
  ├─ zipUrl 为空（缓存命中）→ getCachedApkPath() → installApk()
  │   ├─ 成功 → 结束
  │   └─ 失败 → cleanupFiles() → 走下载流程
  └─ zipUrl 有值 → downloadUpdate() → extractApkIfNeeded()
      → installApk() → cacheApk()  ← 安装成功后缓存
```

### 状态机

```
idle → checking → hasUpdate → downloading → extracting → installing
  │       │          │            │             │            │
  │       └──────────┼────────────┼─────────────┼────────────┤
  │                  └────────────┴─────────────┴──→ error   │
  └──────────────────────────────────────────────────────────┘
```

## 文件变更

| 操作 | 文件 | 说明 |
|------|------|------|
| 重写 | `src/service/update.ts` | 教程架构 + 实战修复 |
| 新建 | `src/hooks/useAppUpdate.ts` | 状态机 hook |
| 新建 | `src/components/UpdateDialog.tsx` | 三种弹窗（确认/进度/错误） |
| 修改 | `src/app/settings.tsx` | 替换内联逻辑为 hook + 组件 |
| 修改 | `app.json` | 加 `REQUEST_INSTALL_PACKAGES` 权限 |

## 核心修复点

### 1. installApk — `RETURN_RESULT` extra

```typescript
await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
  data: contentUri,
  type: "application/vnd.android.package-archive",
  flags: 1,  // FLAG_GRANT_READ_URI_PERMISSION
  extra: {
    "android.intent.extra.NOT_UNKNOWN_SOURCE": true,
    "android.intent.extra.RETURN_RESULT": true,  // ← 关键
  },
});
```

`RETURN_RESULT` 告诉包安装器必须 `setResult`，否则 `startActivityForResult` 立即返回 CANCELED。

### 2. contentUri 双保险

```typescript
let contentUri = apkFile.contentUri;           // 新 API getter（优先）
if (!contentUri) {
  contentUri = await getContentUriAsync(apkFile.uri);  // legacy fallback
}
```

### 3. 缓存时机

`cacheApk()` 在 `installApk()` **成功之后**调用。失败不缓存，避免下次检查陷入死循环。

### 4. 缓存安装失败恢复

缓存 APK 安装失败 → `cleanupFiles()` 清理 → fallback 到下载流程（而非显示错误或静默失败）。

## 依赖

| 库 | 版本 | 用途 |
|---|------|------|
| `expo-file-system` | ~56.0.8 | 下载、文件读写、contentUri |
| `expo-file-system/legacy` | — | `getContentUriAsync` fallback |
| `expo-intent-launcher` | ~56.0.4 | 调起安装器、权限设置页 |
| `expo-constants` | — | 获取本地版本号、包名 |
| `fflate` | ^0.8.3 | ZIP 解压 |
| `@react-native-async-storage/async-storage` | — | APK 缓存信息持久化 |

可移除：`expo-sharing`（不再需要分享面板兜底）。

## Verification

1. `yarn lint` — 无新增错误
2. `npx tsc --noEmit` — 通过
3. 手动测试（Android 真机）：
   - 有更新 → Alert → 下载 → 进度条 → 安装器弹出
   - 安装成功后再次检查 → "已是最新版本"
   - 缓存安装失败 → 清理 → 自动重新下载
   - 无安装权限 → error 弹窗 + 引导跳转设置
   - 下载中取消 → 进度弹窗关闭，可重新开始
