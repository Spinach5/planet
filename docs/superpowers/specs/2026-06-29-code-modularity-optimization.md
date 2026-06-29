# Planet 项目代码模块化与复用性优化 Spec

**Date**: 2026-06-29
**Status**: Approved
**Scope**: 提升 Expo Router + React Native 项目的模块化水平，增强代码复用性，减少重复代码，统一状态管理

---

## 1. 项目概览

### 1.1 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Expo | ~56.0.12 |
| 导航 | expo-router | ~56.2.11 |
| UI 库 | react-native-paper | ^5.15.3 |
| 语言 | TypeScript | ~6.0.3 |
| 状态管理 | React Context + 单例类 | - |
| 存储 | @react-native-async-storage/async-storage | 2.2.0 |
| 网络 | axios | ^1.18.1 |
| 动画 | react-native-reanimated | 4.3.1 |

### 1.2 目录结构

```
src/
├── app/                    # expo-router 文件路由
│   ├── (tabs)/            # Tab 页（首页/课表/我的）
│   ├── _layout.tsx        # 根布局
│   ├── books.tsx          # 书籍列表
│   ├── books-detail.tsx   # 书籍详情
│   ├── club.tsx           # 社团列表
│   ├── login.tsx          # 登录
│   └── ... (20+ 页面)
├── components/             # 组件
│   ├── ui/                # UI 组件
│   ├── GridContainer.tsx
│   ├── GridItem.tsx
│   ├── HeadStatus.tsx
│   ├── MaterialIcon.tsx
│   ├── themed-view.tsx
│   ├── themed-text.tsx
│   └── ...
├── constants/              # 常量
│   └── theme.ts           # 主题色板
├── hooks/                  # 自定义 Hooks
│   ├── use-color-scheme.ts
│   ├── use-theme-settings.tsx
│   └── use-theme.ts
├── service/                # 服务层
│   ├── hubt/              # 湖北工业大学教务 API
│   ├── server/            # 应用服务器 API（books/clubs/chat）
│   ├── userInfo.ts        # 用户状态单例
│   ├── weatherInfo.ts     # 天气状态单例
│   ├── gitee.ts
│   └── update.ts
├── utils/                  # 工具函数
│   ├── hbut/              # 教务相关工具
│   ├── cache.ts           # 缓存管理
│   ├── cookies.ts         # Cookie 管理
│   ├── request.ts         # 教务请求封装
│   ├── serverRequest.ts   # 服务器请求封装
│   ├── toast.tsx          # Toast 组件与 Hook
│   ├── runtimeLogger.ts   # 日志
│   └── useDebouncedPush.ts
├── config/                 # 配置
│   └── api.ts
├── types/                  # 类型声明
└── global.css              # 全局样式
```

---

## 2. 现状问题分析

### 2.1 状态管理碎片化

| 问题 | 位置 | 影响 |
|------|------|------|
| 用户状态用单例类 | `src/service/userInfo.ts` | 命令式 API，UI 无法响应式更新，需要手动检测 |
| 主题用 Context | `src/hooks/use-theme-settings.tsx` | 声明式 API，与用户状态模式不统一 |
| 天气用单例 | `src/service/weatherInfo.ts` | 同用户状态问题 |
| 功能开关散落在组件 | `src/components/GridContainer.tsx` | 每个组件自己读 AsyncStorage，逻辑重复 |
| 登录状态变化不驱动 UI | 首页 index.tsx | 用 useRef + useEffect 轮询检测登录状态变化 |

**核心问题**：用户状态变化后，页面无法自动响应更新，需要通过 `useFocusEffect` 或 `AppState` 监听来手动刷新。

### 2.2 页面逻辑重复度高

以书籍列表页和社团列表页为例：

| 重复模式 | books.tsx | club.tsx | 说明 |
|----------|-----------|----------|------|
| 页面框架（渐变背景+头部+ScrollView） | ✅ | ✅ | 几乎完全一样 |
| 头部返回按钮+标题 | ✅ | ✅ | 每个页面手写 |
| 下拉刷新 | ✅ | ✅ | 各自实现 |
| 加载状态 | ✅ Skeleton | ✅ Loading | 不统一 |
| 空状态 | ✅ | ✅ | 各自实现 |
| 错误状态 | ✅ 点击重试 | ❌ | 不统一 |
| 分类筛选标签栏 | ✅ 多选 | ✅ 单选 | 样式类似但代码重复 |
| FAB 悬浮按钮 | ✅ | ✅ | 各自实现 |
| 鉴权检查 | ❌ | ✅ | 每个需要登录的页面手写 |
| useTheme / useSafeAreaInsets | ✅ | ✅ | 每个页面都要调一遍 |
| getColorFromName 工具函数 | ✅ 页面内定义 | ✅ 页面内定义 | 重复定义 |

**估算**：每个列表页约 300 行代码，其中至少 50% 是可复用的样板代码。

### 2.3 Service 层缓存逻辑重复

**现状**：每个带缓存的 API 函数都手写相同的缓存判断模式：

```typescript
// 重复模式，出现于 books.ts、clubs.ts、hubt/ 下多个文件
export async function getXXX(forceRefresh = false): Promise<XXX> {
  if (!forceRefresh) {
    const cached = await cacheManager.getAsync<XXX>(CACHE_KEY);
    if (cached) return cached;
  }
  const res = await serverGet<XXX>(endpoint, params);
  const data = transform(res);
  void cacheManager.setAsync(CACHE_KEY, data, CACHE_TTL);
  return data;
}
```

**受影响文件**：
- `src/service/server/books.ts` — 2 个函数
- `src/service/server/clubs.ts` — 至少 2 个函数
- `src/service/hubt/AllSchedule.ts`
- `src/service/hubt/Banner.ts`
- `src/service/hubt/CurrentWeek.ts`
- `src/service/hubt/CurrentSemester.ts`
- `src/service/hubt/ExamInfo.ts`
- `src/service/hubt/Scores.ts`
- `src/service/hubt/StuInfo.ts`
- `src/service/hubt/ExtroInfo.ts`
- ... 等 10+ 个文件

### 2.4 CacheManager 能力不足

| 缺失能力 | 影响 |
|----------|------|
| 同步 get 不可用（RN 只有异步存储） | 无法在非 async 上下文中读取缓存 |
| 不支持按前缀删除 | 无法批量清除某一类缓存（如清除所有书籍相关缓存） |
| 不支持获取所有 key | 无法实现按前缀删除 |
| 没有 TTL 批量清理 | 过期数据一直占用空间 |
| 没有缓存统计 | 无法监控缓存使用情况 |

**注意**：`cache.ts` 中 `get()` 方法直接返回 `null`，仅为 API 兼容保留，实际所有调用都应该用 `getAsync`。

### 2.5 组件抽象不足

#### 2.5.1 缺少的业务组件

| 组件 | 用途 | 重复出现次数 |
|------|------|-------------|
| PageHeader | 页面头部（返回+标题+右侧操作） | 15+ 页面 |
| GradientScreen | 渐变背景的页面容器 | 15+ 页面 |
| StatusView | 状态视图（loading/empty/error） | 10+ 页面 |
| SearchBar | 搜索栏 | 3+ 页面 |
| CategoryChipBar | 分类标签栏（单选/多选） | 5+ 页面 |
| FAB | 悬浮操作按钮 | 5+ 页面 |
| ListSkeleton | 列表骨架屏 | 3+ 页面 |
| Avatar | 头像（图片/首字/颜色） | 多处内联实现 |
| EmptyState | 空状态 | 多处内联实现 |

#### 2.5.2 组件分层不清晰

```
components/
├── ui/                  # 只有一个 collapsible
├── GridContainer.tsx    # 功能组件（首页功能宫格）
├── GridItem.tsx         # 子组件
├── HeadStatus.tsx       # 头部组件
├── IndexSwiper.tsx      # 轮播图
├── Loading.tsx          # 基础组件
├── LoadingOverlay.tsx   # 基础组件
├── MaterialIcon.tsx     # 图标组件
├── animated-icon.tsx    # 动画图标
├── themed-view.tsx      # 主题视图
├── themed-text.tsx      # 主题文字
└── ...
```

**问题**：
- 没有清晰的分层（base/business/feature）
- `ui/` 目录只有一个组件，名不副实
- 主题相关组件（themed-view/themed-text）可以归为一类
- 功能组件和基础组件混在一起

### 2.6 Hooks 复用不足

#### 2.6.1 现有 Hooks

| Hook | 用途 |
|------|------|
| `useColorScheme` | 颜色方案（平台适配） |
| `useThemeSettings` | 主题设置 Context |
| `useTheme` | 获取主题色板 |
| `useDebouncedPush` | 防抖导航 |

#### 2.6.2 缺少的通用 Hooks

| Hook | 用途 | 可减少的重复代码 |
|------|------|-----------------|
| `useList` | 通用列表（加载+分页+下拉刷新+状态管理） | 每个列表页约 100 行 |
| `useRequest` | 单个请求（loading/error/data） | 每个请求约 20 行 |
| `useDebounce` | 防抖值 | - |
| `useAuthGuard` | 鉴权守卫 | 每个需要登录的页面约 30 行 |
| `useRefresh` | 下拉刷新封装 | - |
| `useAsyncState` | 异步初始化状态 | - |
| `useAppState` | 应用前后台状态 | - |

### 2.7 工具函数散落

| 问题 | 例子 |
|------|------|
| 颜色生成函数重复定义 | `getHashCode` / `getColorFromName` 在 books.tsx 和 club.tsx 中分别定义 |
| 工具函数没有分类 | `utils/` 下混放通用工具、业务工具、平台工具 |
| 缺少通用格式化工具 | 日期、价格、数字格式化各自实现 |

### 2.8 页面组织方式问题

#### 2.8.1 单文件页面过大

- `books.tsx` — 310 行（模板 + 样式 + 业务逻辑混在一起）
- `club.tsx` — 203 行
- 随着功能迭代，页面文件会越来越大

#### 2.8.2 expo-router 文件路由的组织问题

所有页面都平铺在 `src/app/` 根目录下，随着页面增多，查找困难：

```
app/
├── _layout.tsx
├── affair.tsx
├── books-detail.tsx
├── books-edit.tsx
├── books.tsx
├── chat-detail.tsx
├── chat-list.tsx
├── club-add.tsx
├── club-detail.tsx
├── club.tsx
├── empty-room.tsx
├── exam.tsx
├── feedback.tsx
├── food.tsx
├── join.tsx
├── login.tsx
├── muyu.tsx
├── repo.tsx
├── runtime-log.tsx
├── scores.tsx
├── settings.tsx
├── weather.tsx
└── (tabs)/
    ├── _layout.tsx
    ├── course.tsx
    ├── index.tsx
    └── user.tsx
```

**建议**：可以按功能模块分组（用 `(group)` 路由组不影响 URL）：

```
app/
├── _layout.tsx
├── (tabs)/
├── (books)/
│   ├── books.tsx
│   ├── books-detail.tsx
│   └── books-edit.tsx
├── (club)/
│   ├── club.tsx
│   ├── club-detail.tsx
│   └── club-add.tsx
├── (chat)/
│   ├── chat-list.tsx
│   └── chat-detail.tsx
└── ...
```

---

## 3. 总体优化方案

### 3.1 优化目标

- 减少 25-35% 的重复代码
- 建立统一的状态管理方案（zustand）
- 抽取 8+ 个通用 Hooks
- 抽象 10+ 个业务组件
- 统一缓存策略，消除 service 层缓存样板代码
- 改善目录结构，提升可维护性

### 3.2 实施阶段

| 阶段 | 内容 | 改动量 | 风险 |
|------|------|--------|------|
| Phase 1 | 通用 Hooks + 业务组件抽象 | 15-20 文件 | 低 |
| Phase 2 | Service 层缓存封装 + CacheManager 增强 | 10-15 文件 | 低 |
| Phase 3 | 引入 zustand 状态管理 | 10-15 文件 | 中 |
| Phase 4 | 目录结构优化 + 页面内聚化 | 20-30 文件 | 中 |

---

## 4. Phase 1: 通用 Hooks 与业务组件抽象

### 4.1 新增通用 Hooks

#### 4.1.1 目录结构

```
src/hooks/
├── index.ts               # 统一导出
├── use-color-scheme.ts
├── use-theme-settings.tsx
├── use-theme.ts
├── useList.ts             # 新增：通用列表
├── useRequest.ts          # 新增：请求封装
├── useDebounce.ts         # 新增：防抖值
├── useAuthGuard.ts        # 新增：鉴权守卫
├── useRefresh.ts          # 新增：下拉刷新
└── useAppState.ts         # 新增：应用状态
```

#### 4.1.2 useList.ts 详细设计

**用途**：封装列表页通用逻辑（数据获取、加载状态、下拉刷新、加载更多、错误处理）

**接口定义**：

```typescript
function useList<T>(
  fetchFn: (params: { page: number; pageSize: number }, forceRefresh?: boolean) => Promise<{
    list: T[];
    total: number;
  } | T[]>,
  options?: {
    defaultPageSize?: number;      // 默认 20
    immediate?: boolean;           // 默认 true，是否立即加载
    dataKey?: string;              // 返回数据中列表字段名，自动检测 list/data/books
    onSuccess?: (data: T[]) => void;
    onError?: (error: Error) => void;
  }
)
```

**返回值**：

| 字段 | 类型 | 说明 |
|------|------|------|
| data | `T[]` | 列表数据 |
| total | `number` | 总条数 |
| page | `number` | 当前页码 |
| loading | `'idle' \| 'loading' \| 'loading-more' \| 'success' \| 'error' \| 'empty'` | 加载状态 |
| error | `Error \| null` | 错误对象 |
| refreshing | `boolean` | 是否正在下拉刷新 |
| load | `(page?: number, force?: boolean) => Promise<void>` | 加载指定页 |
| loadMore | `() => void` | 加载更多 |
| refresh | `() => Promise<void>` | 下拉刷新（设置 refreshing 状态） |
| setData | `(data: T[] \| (prev: T[]) => T[]) => void` | 手动设置数据 |
| reset | `() => void` | 重置状态 |

**实现要点**：
- 自动检测返回结构：优先取 `result.list`，其次 `result.data`，再次 `result.books`，如果是数组直接用
- `refreshing` 状态与 `RefreshControl` 配合
- `loadMore` 自动判断是否还有更多（`data.length < total`）
- 可选的分页支持，如果接口不分页也能用

**文件路径**：`src/hooks/useList.ts`

#### 4.1.3 useRequest.ts 详细设计

**用途**：封装单个异步请求的状态管理

**接口定义**：

```typescript
function useRequest<T, Args extends unknown[] = []>(
  requestFn: (...args: Args) => Promise<T>,
  options?: {
    manual?: boolean;              // 默认 false，是否手动触发
    defaultParams?: Args;         // 默认参数
    initialData?: T;              // 初始数据
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  }
)
```

**返回值**：

| 字段 | 类型 | 说明 |
|------|------|------|
| data | `T \| undefined` | 返回数据 |
| loading | `boolean` | 加载中 |
| error | `Error \| null` | 错误 |
| run | `(...args: Args) => Promise<T>` | 手动触发请求 |
| mutate | `(data: T \| ((prev: T) => T)) => void` | 手动修改 data |
| reset | `() => void` | 重置状态 |

**文件路径**：`src/hooks/useRequest.ts`

#### 4.1.4 useDebounce.ts 详细设计

**用途**：防抖值 Hook

```typescript
function useDebounce<T>(value: T, delay?: number): T
```

**文件路径**：`src/hooks/useDebounce.ts`

#### 4.1.5 useAuthGuard.ts 详细设计

**用途**：页面鉴权守卫，统一处理登录态检查

**接口定义**：

```typescript
function useAuthGuard(options?: {
  requireLogin?: boolean;          // 默认 true
  requireServerToken?: boolean;    // 默认 false
  redirectTo?: string;             // 默认 '/login'
  autoRedirect?: boolean;          // 默认 false，是否自动跳转
})
```

**返回值**：

| 字段 | 类型 | 说明 |
|------|------|------|
| authState | `'checking' \| 'ok' \| 'need-login' \| 'need-register'` | 鉴权状态 |
| isAuthenticated | `boolean` | 是否已通过鉴权 |
| loginRedirect | `() => void` | 跳转到登录页 |

**注意**：
- 由于 userManager 是单例（非响应式），初期版本只在页面聚焦时检查
- Phase 3 引入 zustand 后升级为响应式

**文件路径**：`src/hooks/useAuthGuard.ts`

#### 4.1.6 useRefresh.ts 详细设计

**用途**：下拉刷新封装，管理 refreshing 状态

```typescript
function useRefresh(
  refreshFn: () => Promise<void>,
): {
  refreshing: boolean;
  onRefresh: () => void;
  RefreshControl: React.ReactNode;  // 直接可以用的 RefreshControl 组件
}
```

**文件路径**：`src/hooks/useRefresh.ts`

#### 4.1.7 useAppState.ts 详细设计

**用途**：监听应用前后台状态变化

```typescript
function useAppState(
  onChange?: (nextAppState: AppStateStatus, prevAppState: AppStateStatus) => void,
): AppStateStatus
```

**文件路径**：`src/hooks/useAppState.ts`

#### 4.1.8 hooks/index.ts

统一导出所有 Hooks：

```typescript
export { useList } from './useList';
export { useRequest } from './useRequest';
export { useDebounce } from './useDebounce';
export { useAuthGuard } from './useAuthGuard';
export { useRefresh } from './useRefresh';
export { useAppState } from './useAppState';
export { useTheme } from './use-theme';
export { useThemeSettings, useAppColorScheme } from './use-theme-settings';
```

---

### 4.2 业务组件抽象

#### 4.2.1 组件目录重构

```
src/components/
├── base/                    # 基础组件（原子级）
│   ├── Loading.tsx
│   ├── LoadingOverlay.tsx
│   ├── Avatar.tsx           # 新增：头像组件
│   ├── Icon.tsx → MaterialIcon.tsx（保持原名或重命名）
│   └── ui/
│       └── collapsible.tsx
├── themed/                  # 主题相关组件
│   ├── ThemedView.tsx       # 从 themed-view.tsx 改名
│   └── ThemedText.tsx       # 从 themed-text.tsx 改名
├── business/                # 业务组件（分子级）
│   ├── GradientScreen/      # 新增：渐变背景页面容器
│   │   ├── index.tsx
│   │   └── index.style.ts
│   ├── PageHeader/          # 新增：页面头部
│   │   ├── index.tsx
│   │   └── index.style.ts
│   ├── StatusView/          # 新增：状态视图
│   │   ├── index.tsx
│   │   └── index.style.ts
│   ├── SearchBar/           # 新增：搜索栏
│   │   ├── index.tsx
│   │   └── index.style.ts
│   ├── CategoryChipBar/     # 新增：分类标签栏
│   │   ├── index.tsx
│   │   └── index.style.ts
│   ├── FAB/                 # 新增：悬浮按钮
│   │   ├── index.tsx
│   │   └── index.style.ts
│   ├── ListSkeleton/        # 新增：列表骨架屏
│   │   ├── index.tsx
│   │   └── index.style.ts
│   ├── EmptyState/          # 新增：空状态
│   │   ├── index.tsx
│   │   └── index.style.ts
│   └── RetryView/           # 新增：错误重试视图
│       ├── index.tsx
│       └── index.style.ts
├── layout/                  # 布局组件
│   ├── GridContainer.tsx
│   ├── GridItem.tsx
│   └── HeadStatus.tsx
└── feature/                 # 功能组件（页面级）
    ├── IndexSwiper.tsx
    ├── animated-icon.tsx
    ├── animated-icon.web.tsx
    ├── external-link.tsx
    ├── hint-row.tsx
    ├── web-badge.tsx
    └── ... （其他功能组件移入）
```

**命名规范**：
- 目录用 kebab-case（与现有保持一致）
- 组件文件用 PascalCase（`ThemedView.tsx`）
- 样式文件用 `*.style.ts` 或 `index.style.ts`
- 多文件组件用目录 + index.tsx

#### 4.2.2 GradientScreen 组件详细设计

**用途**：统一的渐变背景页面容器，封装 SafeAreaView + LinearGradient + 基础布局

**Props**：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| children | `ReactNode` | - | 子内容 |
| style | `ViewStyle` | - | 额外样式 |
| contentStyle | `ViewStyle` | - | 内容区域样式 |
| scrollable | `boolean` | `false` | 是否可滚动 |
| refreshControl | `ReactNode` | - | 下拉刷新控件（scrollable=true 时） |
| onScroll | `(e) => void` | - | 滚动事件 |
| header | `ReactNode` | - | 头部内容（在渐变区内） |
| paddingTop | `number` | 自动 | 顶部 padding（默认 insets.top + 8） |

**设计要点**：
- 内置 `useSafeAreaInsets` 和 `useTheme`
- 渐变颜色根据主题自动切换
- 支持 scrollable 模式，内部用 ScrollView
- header 区域在渐变背景之上

**文件路径**：`src/components/business/GradientScreen/index.tsx`

#### 4.2.3 PageHeader 组件详细设计

**用途**：统一的页面头部（返回按钮 + 标题 + 右侧操作区）

**Props**：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| title | `string` | - | 标题文字 |
| showBack | `boolean` | `true` | 是否显示返回按钮 |
| onBack | `() => void` | `router.back()` | 返回事件 |
| right | `ReactNode` | `null` | 右侧内容 |
| style | `ViewStyle` | - | 额外样式 |
| titleStyle | `TextStyle` | - | 标题样式 |
| backIcon | `IconName` | `'arrow-left'` | 返回图标名 |

**设计要点**：
- 与现有 `HeadStatus` 配合使用或替代
- 白色文字（因为在渐变背景上）
- 点击返回调用 `router.back()`

**文件路径**：`src/components/business/PageHeader/index.tsx`

#### 4.2.4 StatusView 组件详细设计

**用途**：统一的状态视图组件（loading / empty / error / content）

**Props**：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| status | `'loading' \| 'empty' \| 'error' \| 'content'` | - | 状态 |
| children | `ReactNode` | - | content 状态下的内容 |
| loadingText | `string` | `'加载中...'` | 加载文字 |
| emptyText | `string` | `'暂无数据'` | 空状态文字 |
| errorText | `string` | `'加载失败，点击重试'` | 错误文字 |
| onRetry | `() => void` | - | 错误重试回调 |
| emptyIcon | `IconName` | - | 空状态图标 |
| style | `ViewStyle` | - | 容器样式 |

**设计要点**：
- 使用 flex 布局，居中显示
- 错误状态整个区域可点击触发重试
- 支持自定义图标和文字

**文件路径**：`src/components/business/StatusView/index.tsx`

#### 4.2.5 SearchBar 组件详细设计

**用途**：统一的搜索栏

**Props**：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| value | `string` | `''` | 搜索值 |
| onChangeText | `(text: string) => void` | - | 文字变化回调 |
| placeholder | `string` | `'搜索'` | 占位文字 |
| onSubmit | `(text: string) => void` | - | 提交搜索回调 |
| debounce | `number` | `0` | 防抖时间（ms） |
| showIcon | `boolean` | `true` | 是否显示搜索图标 |
| style | `ViewStyle` | - | 容器样式 |
| inputStyle | `TextStyle` | - | 输入框样式 |
| variant | `'surface' \| 'transparent'` | `'surface'` | 背景样式 |

**文件路径**：`src/components/business/SearchBar/index.tsx`

#### 4.2.6 CategoryChipBar 组件详细设计

**用途**：横向滚动的分类标签栏，支持单选/多选

**Props**：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| categories | `string[] \| { label: string; value: string }[]` | - | 分类列表 |
| value | `string \| string[]` | - | 当前选中值（多选时为数组） |
| onChange | `(value: string \| string[]) => void` | - | 选中变化回调 |
| mode | `'single' \| 'multi'` | `'single'` | 单选/多选 |
| style | `ViewStyle` | - | 容器样式 |
| contentContainerStyle | `ViewStyle` | - | 内容容器样式 |
| showScrollIndicator | `boolean` | `false` | 是否显示滚动条 |

**设计要点**：
- 水平 ScrollView
- 选中态：蓝色背景 + 白色文字
- 未选中态：灰色背景 + 深色文字
- 圆角标签样式

**文件路径**：`src/components/business/CategoryChipBar/index.tsx`

#### 4.2.7 FAB 组件详细设计

**用途**：悬浮操作按钮（Floating Action Button）

**Props**：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| icon | `IconName` | `'plus'` | 图标名 |
| label | `string` | `''` | 文字标签（可选） |
| onPress | `() => void` | - | 点击事件 |
| position | `'right' \| 'left'` | `'right'` | 位置 |
| bottom | `number` | `80` | 距底部距离（dp） |
| color | `string` | `'#fff'` | 图标颜色 |
| backgroundColor | `string` | `主题 primary` | 背景色 |
| size | `number` | `50` | 按钮大小 |
| visible | `boolean` | `true` | 是否可见 |

**设计要点**：
- 绝对定位
- 带阴影（elevation + shadow）
- 点击反馈（activeOpacity）

**文件路径**：`src/components/business/FAB/index.tsx`

#### 4.2.8 Avatar 组件详细设计

**用途**：统一的头像组件（图片 / 首字 / 颜色背景）

**Props**：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| source | `ImageSourcePropType` | `null` | 图片源 |
| name | `string` | `''` | 名称（无图时显示首字） |
| size | `number` | `40` | 尺寸 |
| backgroundColor | `string` | 根据 name 自动生成 | 背景色 |
| textColor | `string` | `'#fff'` | 文字颜色 |
| style | `ViewStyle` | - | 额外样式 |

**设计要点**：
- 内置 `getColorFromName` 颜色生成逻辑
- 圆形头像
- 图片加载失败时自动降级为首字

**文件路径**：`src/components/base/Avatar.tsx`

#### 4.2.9 通用工具函数抽取

**新增文件**：`src/utils/color.ts`

```typescript
/** 生成字符串的 hash code */
export function getHashCode(str: string): number

/** 根据名称生成颜色（HSL） */
export function getColorFromName(name: string): string
```

**迁移**：将 `books.tsx` 和 `club.tsx` 中重复定义的 `getHashCode` / `getColorFromName` 移除，改为引用此文件。

---

### 4.3 Phase 1 验证清单

- [ ] 所有新增 Hooks 类型正确
- [ ] 所有新增组件能正常渲染
- [ ] GradientScreen 组件在浅色/深色模式下颜色正确
- [ ] PageHeader 返回按钮正常工作
- [ ] StatusView 四种状态切换正常
- [ ] CategoryChipBar 单选/多选模式正常
- [ ] FAB 位置和样式正确
- [ ] Avatar 图片/首字/颜色模式正常
- [ ] 组件移动后所有 import 路径正确
- [ ] getColorFromName 工具函数抽离成功
- [ ] 项目能正常构建（`npx expo run:android` 或 `expo start --web`）
- [ ] 首页、课表页、我的页三个 Tab 功能正常
- [ ] 书籍列表页、社团列表页功能正常（暂不迁移，确保不破坏）

---

## 5. Phase 2: Service 层缓存封装与 CacheManager 增强

### 5.1 withCache 高阶函数

#### 5.1.1 设计说明

封装一个高阶函数，包装 service 层的异步查询函数，自动处理缓存读写。

**文件路径**：`src/service/utils/withCache.ts`

**接口定义**：

```typescript
interface WithCacheOptions<T> {
  cacheKey: string;                         // 缓存 key 前缀
  ttl?: number;                             // 过期时间（ms），默认 5 分钟
  keyBuilder?: (args: unknown[]) => string; // 根据参数构建缓存后缀
  forceRefreshArgIndex?: number;            // forceRefresh 参数索引，默认 -1（最后一个）
  resultValidator?: (result: T) => boolean; // 结果校验（只缓存有效结果）
}

function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: WithCacheOptions<Awaited<ReturnType<T>>>
): T & {
  invalidate: (keySuffix?: string) => Promise<void>;
}
```

**使用约定**：
- 被包装函数的最后一个参数是 `forceRefresh`（boolean，可选）
- 当 `forceRefresh === true` 时，跳过缓存读取
- 缓存写入是 fire-and-forget（不阻塞返回）

#### 5.1.2 使用示例

```typescript
// 之前
export async function getBookList(forceRefresh = false): Promise<{ books: BookItem[]; total: number }> {
  if (!forceRefresh) {
    const cached = await cacheManager.getAsync<{ books: BookItem[]; total: number }>(CACHE_KEY_BOOKS);
    if (cached?.books) return cached;
  }
  const res = await serverGet<...>("/api/v1/books", { page: "1", pageSize: "200" });
  const books = (res.data ?? []).map(normalizeBook);
  const data = { books, total: books.length };
  void cacheManager.setAsync(CACHE_KEY_BOOKS, data, CACHE_TTL);
  return data;
}

// 之后
export const getBookList = withCache(
  async (): Promise<{ books: BookItem[]; total: number }> => {
    const res = await serverGet<...>("/api/v1/books", { page: "1", pageSize: "200" });
    const books = (res.data ?? []).map(normalizeBook);
    return { books, total: books.length };
  },
  { cacheKey: "v1_books", ttl: 5 * 60 * 1000 }
);

// 写操作后清除缓存
export async function createBook(data: Record<string, unknown>) {
  const res = await serverPost<...>("/api/v1/books", { ...data, ...getAuthParams() });
  if (res?.success) {
    void getBookList.invalidate(); // 清除缓存
  }
  return res;
}
```

### 5.2 CacheManager 增强

#### 5.2.1 新增方法

在 `src/utils/cache.ts` 的 `CacheManager` 类中新增：

```typescript
/** 按前缀删除缓存 */
removeByPrefix(prefix: string): Promise<boolean>

/** 检查缓存是否存在 */
has(key: string): Promise<boolean>

/** 获取缓存剩余时间（ms），不存在返回 -1，永不过期返回 Infinity */
getRemainingTime(key: string): Promise<number>

/** 批量设置缓存 */
mset(entries: Array<{ key: string; value: unknown; expireTime?: number }>): Promise<boolean>

/** 批量获取缓存 */
mget<T = unknown>(keys: string[]): Promise<Array<T | null>>

/** 获取所有缓存 key */
keys(): Promise<string[]>

/** 清除所有过期缓存 */
cleanExpired(): Promise<number>
```

#### 5.2.2 实现要点

- `keys()`：使用 `AsyncStorage.getAllKeys()`
- `removeByPrefix()`：先用 `keys()` 获取所有 key，过滤前缀后批量删除
- `cleanExpired()`：遍历所有 key，检查过期时间，删除已过期的
- 注意 `CacheData` 结构中有 `timestamp` 和 `expireTime` 字段

### 5.3 Service 层重构范围

#### 5.3.1 service/server/ 下的文件

| 文件 | 函数 | 缓存 Key | TTL |
|------|------|----------|-----|
| `books.ts` | `getBookList` | `v1_books` | 5 min |
| `books.ts` | `getBookCategories` | `v1_book_categories` | 5 min |
| `clubs.ts` | `getAllClub` | `v1_clubs` | 5 min |
| `clubs.ts` | `getClubCategories` | `v1_club_categories` | 5 min |
| `chat.ts` | （如果有列表类接口） | - | - |

#### 5.3.2 service/hubt/ 下的文件

| 文件 | 函数 | 缓存 Key | TTL（估算） |
|------|------|----------|-------------|
| `AllSchedule.ts` | `getAllSchedule` | `v1_all_schedule` | 30 min |
| `Banner.ts` | `getBanner` | `v1_banner` | 10 min |
| `CurrentWeek.ts` | `getCurrentWeek` | `v1_current_week` | 1 hour |
| `CurrentSemester.ts` | `getSemesterList` | `v1_semester_list` | 1 day |
| `ExamInfo.ts` | `getExamInfo` | `v1_exam_info` | 30 min |
| `Scores.ts` | `getScores` | `v1_scores` | 1 hour |
| `StuInfo.ts` | `getStuInfo` | `v1_stu_info` | 1 day |
| `ExtroInfo.ts` | `getExtroInfo` | `v1_extro_info` | 30 min |
| `GetAllWeek.ts` | `getAllWeek` | `v1_all_week` | 1 day |
| `emptyClassRoom.ts` | `getEmptyRoom` | `v1_empty_room` | 10 min |

**注意**：
- 仔细检查每个函数的现有缓存逻辑，确认 TTL 和缓存 key 与原来一致
- 写操作后调用 `.invalidate()` 清除对应缓存
- 没有缓存的函数不需要改动
- 登录相关（auth/login/captcha）不缓存

### 5.4 Phase 2 验证清单

- [ ] CacheManager 新增所有方法正常工作
- [ ] withCache 高阶函数正确处理缓存读取
- [ ] withCache 正确处理 forceRefresh 参数
- [ ] withCache.invalidate() 正确清除缓存
- [ ] CacheManager.removeByPrefix() 按前缀正确删除
- [ ] books.ts 两个函数重构后行为一致
- [ ] clubs.ts 两个函数重构后行为一致
- [ ] hubt/ 下所有带缓存的函数重构完成
- [ ] 下拉刷新（forceRefresh=true）正确绕过缓存
- [ ] 写操作后缓存正确失效
- [ ] 项目能正常构建

---

## 6. Phase 3: 引入 zustand 状态管理

### 6.1 技术选型

**zustand** — 轻量级 React 状态管理库

**选型理由**：
- 轻量（约 1KB gzip）
- 极简 API，无 boilerplate
- 完美支持 React Hooks 和 TypeScript
- 内置 persist 中间件，可对接 AsyncStorage
- 支持 devtools
- RN 环境兼容性好

**安装**：
```bash
yarn add zustand
```

### 6.2 Store 目录结构

```
src/store/
├── index.ts               # 统一导出
├── useUserStore.ts        # 用户状态
├── useThemeStore.ts       # 主题状态
├── useWeatherStore.ts     # 天气状态
├── useSettingsStore.ts    # 设置状态
└── storage.ts             # zustand AsyncStorage 适配
```

### 6.3 storage.ts 适配层

将 AsyncStorage 适配为 zustand persist 的 storage。

**文件路径**：`src/store/storage.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StateStorage } from 'zustand/middleware';

export const asyncStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return AsyncStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await AsyncStorage.removeItem(name);
  },
};

export default asyncStorage;
```

### 6.4 useUserStore.ts 详细设计

**文件路径**：`src/store/useUserStore.ts`

**State 接口**：

```typescript
interface UserState {
  // 基本信息
  university: string;
  realName: string;
  stuId: string;
  encryptedPassword: string;
  xhid: string;
  grade: string;
  majority: string;
  class: string;
  college: string;
  schoolId: string;
  serverToken: string;
  isLoggedIn: boolean;

  // Actions
  login: (userData: Partial<UserState>) => void;
  logout: () => Promise<void>;
  setServerToken: (token: string) => void;
  setEncryptedPassword: (pwd: string) => void;
  setSchoolId: (id: string) => void;
  setField: (key: keyof UserState, value: unknown) => void;
  setFields: (fields: Partial<UserState>) => void;
  getServerUserId: () => number;
  getAccount: () => { stuId: string; password: string };
  getEncryptedPassword: () => string;

  // 内部状态
  _hydrated: boolean;  // 是否已从存储恢复
}
```

**Persist 配置**：
- name: `user-store`
- 持久化字段：`university, realName, stuId, encryptedPassword, xhid, grade, majority, class, college, schoolId, serverToken, isLoggedIn`
- storage: `asyncStorage`
- partialize: 只持久化需要的字段（password 明文不持久化）

**注意事项**：
- `logout` 时需要清除 cookies（hbut cookies）
- `logout` 时清除其他 store 的数据（可选）
- 保持与现有 `userManager` 相同的行为

### 6.5 useThemeStore.ts 详细设计

**文件路径**：`src/store/useThemeStore.ts`

**State 接口**：

```typescript
interface ThemeState {
  themeMode: 'system' | 'light' | 'dark';
  isLoaded: boolean;

  setThemeMode: (mode: 'system' | 'light' | 'dark') => void;
  getColorScheme: () => 'light' | 'dark';  // 考虑 system 模式后的实际值
}
```

**Persist 配置**：
- name: `theme-store`
- 持久化字段：`themeMode`

**注意**：
- 需要结合 RN 的 `useColorScheme` 来计算实际颜色方案
- 可以保留现有 `useThemeSettings` Context 作为兼容层

### 6.6 useWeatherStore.ts 详细设计

**文件路径**：`src/store/useWeatherStore.ts`

**State 接口**：

```typescript
interface WeatherState {
  currentWeather: WeatherData | null;
  weatherList: WeatherData[];
  loading: boolean;
  error: Error | null;

  init: () => Promise<void>;
  update: () => Promise<void>;
  getCurrentWeather: () => WeatherData | null;
}
```

**Persist 配置**：
- name: `weather-store`
- 持久化字段：`currentWeather, weatherList`
- 需要自己实现 TTL（加时间戳字段，读取时检查）

### 6.7 useSettingsStore.ts 详细设计

**文件路径**：`src/store/useSettingsStore.ts`

**State 接口**：

```typescript
interface SettingsState {
  featureToggles: Record<string, boolean>;
  forceUpdate: boolean;

  setFeatureToggle: (key: string, value: boolean) => void;
  setForceUpdate: (value: boolean) => void;
  isFeatureEnabled: (key: string) => boolean;
}
```

**Persist 配置**：
- name: `settings-store`
- 持久化字段：所有

**迁移来源**：`GridContainer.tsx` 中的 `settings_feature_toggles` 逻辑移到这里。

### 6.8 向后兼容策略

**关键原则**：不立即替换旧代码，先新增，再逐步迁移。

#### 6.8.1 userInfo.ts 兼容层

修改 `src/service/userInfo.ts`，将内部实现委托给 zustand store，但保持原 API 不变：

```typescript
import { useUserStore } from '@/store/useUserStore';

// 保持原有的 userManager 对象 API
class UserManagerCompat {
  // 每个 getter/setter 都委托给 store
  get university() { return useUserStore.getState().university; }
  get isLoggedIn() { return useUserStore.getState().isLoggedIn; }
  // ... 其余字段

  checkLogin() { return useUserStore.getState().isLoggedIn; }
  getServerToken() { return useUserStore.getState().serverToken; }
  setServerToken(token: string) {
    useUserStore.getState().setServerToken(token);
  }
  // ... 其余方法
}

export const userManager = new UserManagerCompat();
export default userManager;
```

这样所有现有代码不需要修改，逐步迁移。

#### 6.8.2 theme 兼容层

保留 `use-theme-settings.tsx` 中的 Context API，但内部改用 zustand：

```typescript
// 旧的 useThemeSettings 改为调用 useThemeStore
export function useThemeSettings() {
  const themeMode = useThemeStore(state => state.themeMode);
  const setThemeMode = useThemeStore(state => state.setThemeMode);
  const isLoaded = useThemeStore(state => state.isLoaded);
  return { themeMode, setThemeMode, isLoaded };
}
```

### 6.9 Phase 3 验证清单

- [ ] zustand 安装成功，无类型冲突
- [ ] asyncStorage 适配层正常工作
- [ ] useUserStore 状态正确持久化
- [ ] useUserStore 与旧 userManager API 行为一致
- [ ] useThemeStore 主题切换正常
- [ ] useWeatherStore 天气数据正确缓存
- [ ] useSettingsStore 功能开关正常
- [ ] GridContainer 改用 useSettingsStore 后功能正常
- [ ] 登录流程正常
- [ ] 登出流程正常（清除 cookies、清除 store）
- [ ] 主题切换在设置页正常工作
- [ ] 首页功能开关显示正确
- [ ] 所有旧 API（userManager 等）仍然可用
- [ ] 项目能正常构建

---

## 7. Phase 4: 目录结构优化与模块内聚化

### 7.1 Utils 目录重构

```
src/utils/
├── common/             # 通用工具（与业务无关）
│   ├── cache.ts       # 缓存管理
│   ├── color.ts       # 颜色工具（新增，getColorFromName 等）
│   ├── cookies.ts     # Cookie 管理
│   ├── request.ts     # 基础请求（hbut 教务用）
│   ├── serverRequest.ts # 服务器请求
│   ├── runtimeLogger.ts # 日志
│   ├── rex.ts         # 正则工具
│   └── format.ts      # 格式化工具（如果有通用的）
├── business/           # 业务工具
│   └── hbut/          # 湖北工业大学业务工具
│       ├── courseHelper.ts
│       ├── emptyClassRoom.ts
│       ├── loginEncrypt.ts
│       ├── semesterHelper.ts
│       ├── timeHelper.ts
│       └── weekHelper.ts
├── react/              # React 相关
│   ├── toast.tsx      # Toast 组件和 hook
│   └── useDebouncedPush.ts
└── platform/           # 平台相关（如果有区分 web/native 的）
```

**注意**：
- 所有文件移动后需要更新 import 路径
- 使用全局搜索确保不遗漏引用

### 7.2 Service 目录重构

```
src/service/
├── index.ts           # 统一导出（如果需要）
├── userInfo.ts        # 用户状态兼容层
├── weatherInfo.ts     # 天气兼容层
├── gitee.ts
├── update.ts
├── utils/             # service 层工具
│   ├── withCache.ts   # 缓存高阶函数
│   └── index.ts
├── hubt/              # 教务 API（原名 hubt，保持）
│   ├── index.ts
│   ├── auth.ts
│   ├── login.ts
│   ├── AllSchedule.ts
│   └── ...
└── server/            # 应用服务器 API
    ├── index.ts
    ├── books.ts
    ├── clubs.ts
    └── chat.ts
```

### 7.3 页面模块内聚化

**目标**：每个业务模块的组件、hooks 等内聚到模块目录中。

**注意**：由于 expo-router 要求页面文件在 `app/` 目录下，采用如下结构：

```
src/
├── app/
│   ├── (tabs)/
│   ├── _layout.tsx
│   ├── books.tsx          # 薄文件，只导入 features/books 中的页面组件
│   ├── books-detail.tsx   # 薄文件
│   └── ...
└── features/              # 功能模块（新增）
    ├── books/
    │   ├── components/
    │   │   ├── BookCard.tsx
    │   │   ├── BookList.tsx
    │   │   └── BookForm.tsx
    │   ├── hooks/
    │   │   └── useBookList.ts
    │   ├── pages/
    │   │   ├── BooksPage.tsx    # 原 books.tsx 的内容
    │   │   ├── BookDetailPage.tsx
    │   │   └── BookEditPage.tsx
    │   ├── types.ts
    │   └── constants.ts
    ├── club/
    │   ├── components/
    │   ├── hooks/
    │   └── pages/
    ├── chat/
    └── course/
```

**app/books.tsx 变成薄文件**：

```typescript
export { default } from '@/features/books/pages/BooksPage';
```

**好处**：
- 业务逻辑从 app/ 目录移出，app/ 只负责路由
- 模块内聚，相关代码放一起
- 便于查找和维护
- 不影响 expo-router 的文件路由

### 7.4 页面组件拆分

以 `books.tsx` 为例，拆分为多个组件：

```
features/books/
├── pages/
│   └── BooksPage.tsx          # 页面组装（组合各子组件）
├── components/
│   ├── BookCard.tsx           # 书籍卡片
│   ├── BookGrid.tsx           # 书籍网格
│   ├── BookSkeleton.tsx       # 骨架屏
│   ├── TradeButtonRow.tsx     # 卖书/买书按钮行
│   ├── BookFilterBar.tsx      # 类型筛选栏
│   └── BookSortBar.tsx        # 排序栏
└── hooks/
    └── useBookFilter.ts       # 筛选逻辑
```

**拆分原则**：
- 超过 300 行的页面组件考虑拆分
- 可复用的子组件抽离
- 复杂业务逻辑抽为 custom hook
- 页面组件（page）只负责组装和状态管理

### 7.5 Phase 4 验证清单

- [ ] utils/ 目录重构后所有 import 路径正确
- [ ] service/ 目录重构后所有 import 路径正确
- [ ] components/ 目录重构后所有 import 路径正确
- [ ] features/ 目录结构建立
- [ ] books 模块迁移完成（页面+组件+hooks）
- [ ] club 模块迁移完成
- [ ] app/ 目录下页面都是薄文件（只 re-export）
- [ ] expo-router 路由正常工作
- [ ] 所有页面能正常访问
- [ ] 项目能正常构建
- [ ] 核心功能正常（登录、课表、书籍、社团）

---

## 8. 问题清单（具体到文件）

### 8.1 状态管理相关

| 问题 | 文件 | 行号 | 说明 |
|------|------|------|------|
| 用户状态用单例类 | `src/service/userInfo.ts` | 48-231 | 非响应式，UI 无法自动更新 |
| 主题用 Context | `src/hooks/use-theme-settings.tsx` | 18-87 | 与用户状态模式不统一 |
| 天气用单例 | `src/service/weatherInfo.ts` | - | 同用户状态问题 |
| 功能开关散落在组件 | `src/components/GridContainer.tsx` | 31-75 | 每个组件自己读存储 |
| 首页轮询检测登录 | `src/app/(tabs)/index.tsx` | 40-47 | 用 useRef + useEffect hack |

### 8.2 页面逻辑重复

| 重复模式 | 文件 1 | 文件 2 | 备注 |
|----------|--------|--------|------|
| 列表页整体框架 | `app/books.tsx` | `app/club.tsx` | 渐变+头部+滚动+刷新 |
| 页面头部 | `app/books.tsx` L108 | `app/club.tsx` L108 | 返回按钮+标题 |
| 分类标签栏 | `app/books.tsx` L148-159 | `app/club.tsx` L121-130 | 样式类似 |
| FAB 悬浮按钮 | `app/books.tsx` L231-233 | `app/club.tsx` L163-165 | 几乎一样 |
| 下拉刷新设置 | `app/books.tsx` L111 | `app/club.tsx` L111 | 各自实现 |
| 空状态视图 | `app/books.tsx` L181 | `app/club.tsx` L136 | 各自实现 |
| getColorFromName | `app/books.tsx` L17-24 | `app/club.tsx` L17-27 | 完全重复 |
| useTheme + useSafeAreaInsets | 每个页面都有 | - | 每个页面重复调用 |

### 8.3 Service 层缓存重复

| 问题 | 出现文件数 | 说明 |
|------|-----------|------|
| 缓存判断样板代码 | 10+ | 每个函数都写 if (!forceRefresh) ... |
| 缓存 key 散落 | 10+ | 没有集中管理 |
| TTL 不统一 | - | 有的有，有的没有 |

### 8.4 组件抽象不足

| 缺失组件 | 重复次数 | 出现位置 |
|----------|----------|----------|
| GradientScreen（渐变页面容器） | 15+ | 几乎所有页面 |
| PageHeader（页面头部） | 15+ | 几乎所有页面 |
| StatusView（状态视图） | 10+ | 列表页、详情页 |
| CategoryChipBar（分类标签） | 5+ | books, club 等 |
| FAB（悬浮按钮） | 5+ | books, club 等 |
| Avatar（头像） | 5+ | books, club, user 等 |
| SearchBar（搜索栏） | 3+ | books 等 |
| ListSkeleton（骨架屏） | 3+ | books 等 |

### 8.5 目录结构问题

| 问题 | 说明 |
|------|------|
| app/ 页面平铺 | 20+ 页面都在根目录，查找困难 |
| components/ 无分层 | 基础、业务、功能混在一起 |
| utils/ 混杂 | 通用、业务、React 工具混放 |
| 缺少 features 目录 | 业务模块的组件/hooks 没有内聚 |

---

## 9. 实施指南

### 9.1 推荐实施顺序

1. **Phase 1**：Hooks + 业务组件（风险最低，收益最大，立即可用）
2. **Phase 2**：Service 层缓存封装（中等风险，减少样板代码）
3. **Phase 3**：zustand 状态管理（中等风险，需要充分测试）
4. **Phase 4**：目录结构优化（低风险，纯重构，工作量大）

### 9.2 给 Claude Code 的执行提示

#### 工作方式
1. 按 Phase 顺序执行，完成一个 Phase 再开始下一个
2. 每个 Phase 开始前先读相关文件，理解现有代码
3. 每移动/重命名一个文件后，全局搜索确认所有引用都已更新
4. 每个 Phase 结束后运行构建验证
5. 保持小步提交，每个组件/Hook 完成后验证

#### 不要做的事
- ❌ 不要修改功能逻辑（这是重构，不是新功能）
- ❌ 不要顺手修 bug（单独记录）
- ❌ 不要引入 breaking change（保持向后兼容）
- ❌ 不要一次性改太多文件
- ❌ 不要删除旧代码（除非有兼容层）
- ❌ 不要改变 expo-router 的 URL 结构

#### 要做的事
- ✅ 每个 Phase 完成后跑 `expo start --web` 或 `yarn web` 验证
- ✅ 修改 import 后全局搜索确认
- ✅ 保留旧 API 的兼容层
- ✅ 遵循现有代码风格
- ✅ 使用现有主题常量（Colors, Spacing, Radius）
- ✅ TypeScript 类型严格
- ✅ 保持现有命名约定

### 9.3 构建验证命令

```bash
# Web 端构建
yarn web

# 类型检查
npx tsc --noEmit

# Lint
yarn lint

# Android 构建（如果有环境）
npx expo run:android
```

---

## 10. 成功标准

### 10.1 量化指标

- [ ] 列表页样板代码减少 50% 以上
- [ ] Service 层缓存逻辑代码减少 70% 以上
- [ ] 新增 7+ 个通用 Hooks
- [ ] 新增 8+ 个业务组件
- [ ] 代码总行数减少 20% 以上（估算）

### 10.2 质量指标

- [ ] 所有页面功能正常（与重构前一致）
- [ ] TypeScript 类型检查通过（无 any 蔓延）
- [ ] Lint 通过
- [ ] Web 端正常运行
- [ ] 登录/登出流程正常
- [ ] 缓存策略与重构前一致
- [ ] 主题切换功能正常
- [ ] 下拉刷新功能正常

### 10.3 可维护性指标

- [ ] 新增列表页开发效率提升 50%
- [ ] 组件分层清晰，职责明确
- [ ] 目录结构合理，易于查找
- [ ] 状态变化可追踪（zustand devtools）
- [ ] 业务模块内聚，相关代码集中

---

## 11. 参考文件索引

| 文件 | 用途 | 行数 |
|------|------|------|
| `src/service/userInfo.ts` | 用户状态单例（迁移目标） | 240 |
| `src/hooks/use-theme-settings.tsx` | 主题 Context（迁移目标） | 88 |
| `src/service/weatherInfo.ts` | 天气单例（迁移目标） | - |
| `src/utils/cache.ts` | 缓存管理器（增强目标） | 109 |
| `src/utils/serverRequest.ts` | 服务器请求封装 | 123 |
| `src/utils/request.ts` | 教务请求封装 | 53 |
| `src/service/server/books.ts` | Book Service（重构目标） | 147 |
| `src/service/server/clubs.ts` | Club Service（重构目标） | - |
| `src/app/books.tsx` | 书籍列表页（重构目标） | 311 |
| `src/app/club.tsx` | 社团列表页（重构目标） | 203 |
| `src/app/(tabs)/index.tsx` | 首页 | 125 |
| `src/components/GridContainer.tsx` | 功能宫格（状态迁移） | 109 |
| `src/constants/theme.ts` | 主题常量 | 157 |
| `src/components/themed-view.tsx` | 主题视图 | 16 |
| `src/components/themed-text.tsx` | 主题文字 | - |
| `src/hooks/use-theme.ts` | 主题 Hook | 12 |

---

## 12. 附录：代码风格约定

### 12.1 命名约定

| 类型 | 风格 | 例子 |
|------|------|------|
| 组件文件 | PascalCase | `BookCard.tsx` |
| 多文件组件目录 | kebab-case | `gradient-screen/` |
| Hook 文件 | camelCase | `useBookList.ts` |
| 工具函数文件 | camelCase | `color.ts` |
| 类型/接口 | PascalCase | `BookItem` |
| 常量 | UPPER_SNAKE_CASE | `CACHE_KEY` |
| 样式对象 | st / styles | `const st = StyleSheet.create({...})` |

### 12.2 组件写法

- 函数式组件 + TypeScript
- 优先使用 TypeScript 类型而非 `any`
- 样式用 `StyleSheet.create`
- 多组件文件用目录 + index.tsx
- 保持与现有代码风格一致

### 12.3 状态管理

- 局部状态用 `useState`
- 跨组件共享用 zustand
- 服务端数据用 service + cache（不用 SWR/React Query，保持轻量）
- 表单状态自己管理（不需要 form 库）
