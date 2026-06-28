# Planet 校园助手

一款基于 React Native + Expo 构建的校园生活助手应用，专为湖北工业大学（HBUT）学生打造，提供课表查询、成绩管理、考试安排、空教室查询等校园服务功能。

## 目录

- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [项目架构](#项目架构)
- [目录结构](#目录结构)
- [主要模块说明](#主要模块说明)
- [关键类与函数](#关键类与函数)
- [依赖关系](#依赖关系)
- [运行方式](#运行方式)
- [开发规范](#开发规范)

## 项目概述

Planet 是一个多功能校园助手应用，主要功能包括：

- **课表查询**：自动同步教务系统课程表，支持周视图展示
- **成绩查询**：查看各学期考试成绩
- **考试安排**：查询期末考试时间和地点
- **空教室查询**：实时查询空闲教室
- **电子木鱼**：趣味功能，放松解压
- **天气查询**：实时天气和未来预报
- **书籍交易**：校园二手书交易平台
- **社团活动**：校园社团信息展示
- **美食推荐**：校园周边美食推荐
- **Gitee 仓库**：开源项目贡献者和仓库信息

应用采用原生端渲染，支持 Android、iOS 和 Web 三端运行。

## 技术栈

### 核心框架
- **React Native 0.85.3** - 移动端跨平台框架
- **React 19.2.3** - UI 构建库
- **Expo SDK 56** - React Native 开发工具链
- **Expo Router 56** - 基于文件的路由系统
- **TypeScript 6.0** - 类型安全

### UI 组件库
- **React Native Paper 5.15** - Material Design 3 组件库
- **@expo/vector-icons 15** - 图标库

### 状态管理与数据持久化
- **React Context** - 全局状态管理（主题、Toast等）
- **@react-native-async-storage/async-storage** - 本地数据持久化

### 网络请求
- **Axios 1.18** - HTTP 客户端
- **JSEncrypt 3.5** - RSA 加密库
- **crypto-js 4.2** - 加密算法库

### 其他核心依赖
- **expo-location** - 地理位置服务
- **expo-audio** - 音频播放
- **expo-camera** - 相机功能
- **expo-image-picker** - 图片选择
- **react-native-reanimated** - 动画库
- **react-native-gesture-handler** - 手势处理
- **react-native-safe-area-context** - 安全区域适配

## 项目架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                     应用入口层                           │
│  app.json / package.json / metro.config.js              │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                     路由层 (expo-router)                 │
│  app/_layout.tsx → app/(tabs)/ → 各页面组件              │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                     UI 组件层                            │
│  components/  →  可复用组件                              │
│  hooks/       →  自定义 Hooks                            │
│  constants/   →  主题常量                                │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                     服务层 (Service)                     │
│  service/hubt/     →  教务系统 API                       │
│  service/server/   →  应用后端 API                       │
│  service/gitee.ts  →  Gitee API                          │
│  service/weatherInfo.ts → 天气服务                       │
│  service/userInfo.ts    → 用户信息管理                   │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                     工具层 (Utils)                       │
│  request.ts        →  HTTP 请求封装                      │
│  cache.ts          →  缓存管理                           │
│  cookies.ts        →  Cookie 管理                        │
│  toast.tsx         →  Toast 提示                         │
│  runtimeLogger.ts  →  运行时日志                         │
│  hbut/             →  教务系统工具函数                    │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                     配置层                               │
│  config/api.ts     →  API 基础地址                       │
│  constants/theme.ts → 主题颜色配置                       │
└─────────────────────────────────────────────────────────┘
```

### 架构特点

1. **分层清晰**：采用经典的分层架构，从路由到工具层职责明确
2. **单例模式**：用户管理、天气管理、日志管理等采用单例模式
3. **本地优先**：数据优先从本地缓存读取，提升加载速度
4. **主题系统**：支持浅色/深色/跟随系统三种主题模式
5. **Cookie 管理**：自定义 Cookie 管理器，模拟浏览器会话管理

## 目录结构

```
planet/
├── src/
│   ├── app/                          # 页面路由（expo-router 文件路由）
│   │   ├── (tabs)/                   # 底部标签页
│   │   │   ├── _layout.tsx           # 标签页布局
│   │   │   ├── index.tsx             # 首页
│   │   │   ├── course.tsx            # 课表页
│   │   │   └── user.tsx              # 我的页
│   │   ├── _layout.tsx               # 根布局
│   │   ├── login.tsx                 # 登录页
│   │   ├── exam.tsx                  # 考试页
│   │   ├── scores.tsx                # 成绩页
│   │   ├── empty-room.tsx            # 空教室页
│   │   ├── muyu.tsx                  # 电子木鱼页
│   │   ├── weather.tsx               # 天气页
│   │   ├── books.tsx                 # 书籍列表页
│   │   ├── books-detail.tsx          # 书籍详情页
│   │   ├── books-edit.tsx            # 书籍编辑页
│   │   ├── club.tsx                  # 社团页
│   │   ├── club-detail.tsx           # 社团详情页
│   │   ├── club-add.tsx              # 添加社团页
│   │   ├── chat-list.tsx             # 聊天列表页
│   │   ├── chat-detail.tsx           # 聊天详情页
│   │   ├── food.tsx                  # 美食页
│   │   ├── affair.tsx                # 其他事务页
│   │   ├── settings.tsx              # 设置页
│   │   ├── feedback.tsx              # 反馈页
│   │   ├── repo.tsx                  # 仓库页
│   │   └── runtime-log.tsx           # 运行日志页
│   ├── components/                   # 可复用组件
│   │   ├── ui/                       # UI 基础组件
│   │   ├── GridContainer.tsx         # 首页功能网格
│   │   ├── GridItem.tsx              # 网格项组件
│   │   ├── HeadStatus.tsx            # 页面标题栏
│   │   ├── IndexSwiper.tsx           # 首页轮播
│   │   ├── Loading.tsx               # 加载组件
│   │   ├── LoadingOverlay.tsx        # 加载遮罩
│   │   ├── MaterialIcon.tsx          # 材质图标组件
│   │   ├── themed-text.tsx           # 主题文字组件
│   │   ├── themed-view.tsx           # 主题视图组件
│   │   └── ...
│   ├── config/                       # 配置文件
│   │   └── api.ts                    # API 地址配置
│   ├── constants/                    # 常量定义
│   │   └── theme.ts                  # 主题颜色常量
│   ├── hooks/                        # 自定义 Hooks
│   │   ├── use-color-scheme.ts       # 颜色方案 Hook
│   │   ├── use-theme-settings.tsx    # 主题设置 Hook
│   │   └── use-theme.ts              # 主题 Hook
│   ├── service/                      # 服务层
│   │   ├── hubt/                     # 教务系统服务
│   │   │   ├── auth.ts               # 认证服务
│   │   │   ├── login.ts              # 登录流程
│   │   │   ├── captcha.ts            # 验证码处理
│   │   │   ├── AllSchedule.ts        # 全部课表
│   │   │   ├── DailySchedule.ts      # 每日课表
│   │   │   ├── CourseScores.ts       # 课程成绩
│   │   │   ├── Scores.ts             # 成绩查询
│   │   │   ├── ExamInfo.ts           # 考试信息
│   │   │   ├── CurrentWeek.ts        # 当前周次
│   │   │   ├── CurrentSemester.ts    # 当前学期
│   │   │   ├── GetAllWeek.ts         # 获取所有周次
│   │   │   ├── GetTimeTable.ts       # 获取时间表
│   │   │   ├── GetXhid.ts            # 获取学号ID
│   │   │   ├── StuInfo.ts            # 学生信息
│   │   │   ├── ExtroInfo.ts          # 扩展信息
│   │   │   ├── emptyClassRoom.ts     # 空教室查询
│   │   │   ├── Banner.ts             # 轮播图
│   │   │   └── index.ts              # 导出入口
│   │   ├── server/                   # 应用后端服务
│   │   │   ├── books.ts              # 书籍服务
│   │   │   ├── chat.ts               # 聊天服务
│   │   │   └── clubs.ts              # 社团服务
│   │   ├── gitee.ts                  # Gitee API 服务
│   │   ├── userInfo.ts               # 用户信息管理
│   │   └── weatherInfo.ts            # 天气信息服务
│   ├── types/                        # TypeScript 类型定义
│   │   └── crypto-js.d.ts            # crypto-js 类型声明
│   ├── utils/                        # 工具函数
│   │   ├── hbut/                     # 教务系统工具
│   │   │   ├── courseHelper.ts       # 课程数据处理
│   │   │   ├── emptyClassRoom.ts     # 空教室处理
│   │   │   ├── loginEncrypt.ts       # 登录加密
│   │   │   ├── semesterHelper.ts     # 学期处理
│   │   │   ├── timeHelper.ts         # 时间处理
│   │   │   └── weekHelper.ts         # 周次处理
│   │   ├── request.ts                # HTTP 请求封装
│   │   ├── serverRequest.ts          # 后端请求封装
│   │   ├── cache.ts                  # 缓存管理
│   │   ├── cookies.ts                # Cookie 管理
│   │   ├── rex.ts                    # 正则提取工具
│   │   ├── toast.tsx                 # Toast 提示
│   │   ├── runtimeLogger.ts          # 运行时日志
│   │   ├── useDebouncedPush.ts       # 防抖导航
│   │   └── weekCalculator.ts         # 周次计算
│   └── global.css                    # 全局样式
├── assets/                           # 静态资源
│   ├── images/                       # 图片资源
│   ├── audio/                        # 音频资源
│   └── expo.icon/                    # 应用图标
├── scripts/                          # 脚本
│   └── reset-project.js              # 重置项目脚本
├── app.json                          # Expo 应用配置
├── package.json                      # 项目依赖配置
├── tsconfig.json                     # TypeScript 配置
├── metro.config.js                   # Metro 打包配置
├── eslint.config.js                  # ESLint 配置
├── eas.json                          # EAS 构建配置
└── yarn.lock                         # 依赖锁文件
```

## 主要模块说明

### 1. 路由与页面模块 (`src/app/`)

基于 Expo Router 的文件系统路由，每个文件对应一个页面。

**核心页面**：
- **首页 (`index.tsx`)**：展示轮播图、功能网格入口，支持下拉刷新
- **课表页 (`course.tsx`)**：周视图课表展示，支持切换周次
- **我的页 (`user.tsx`)**：用户信息、设置入口
- **登录页 (`login.tsx`)**：学号密码登录，支持学校选择

### 2. UI 组件模块 (`src/components/`)

**核心组件**：
- **GridContainer**：首页功能网格容器，支持功能开关配置
- **GridItem**：单个功能入口项，自适应图标大小
- **HeadStatus**：页面标题栏，带渐变背景
- **IndexSwiper**：首页轮播图组件
- **MaterialIcon**：封装的材质图标组件
- **ThemedText / ThemedView**：主题感知的基础组件

### 3. 教务系统服务模块 (`src/service/hubt/`)

对接湖北工业大学教务系统（jwxt.hbut.edu.cn）的 API 服务。

**主要功能**：
- **登录认证**：RSA 加密密码 + 滑块验证码 + Cookie 会话管理
- **课表查询**：每日课表、全学期课表
- **成绩查询**：各学期成绩、课程成绩详情
- **考试安排**：期末考试时间地点查询
- **学生信息**：个人学籍信息获取
- **空教室查询**：实时空闲教室查询

### 4. 用户管理模块 (`src/service/userInfo.ts`)

单例模式的用户信息管理器，负责：
- 用户信息的本地持久化存储
- 登录状态维护
- 服务器 Token 管理
- JWT Token 解析与用户 ID 获取
- 密码加密存储

### 5. 天气服务模块 (`src/service/weatherInfo.ts`)

基于 Open-Meteo API 的天气服务，特点：
- IP 定位自动获取当前位置
- 反向地理编码解析省市区
- 实时天气 + 24 小时预报 + 7 天预报
- 30 分钟本地缓存
- WMO 天气代码映射

### 6. 后端服务模块 (`src/service/server/`)

对接应用自有后端（spinach.cc.cd）的服务，包括：
- **书籍交易**：发布、查询、收藏二手书
- **社团管理**：社团信息展示与管理
- **聊天功能**：用户间消息通信

### 7. 工具模块 (`src/utils/`)

**核心工具**：
- **request.ts**：基于 Axios 的请求封装，自动管理 Cookie
- **cache.ts**：带过期时间的本地缓存管理
- **cookies.ts**：Cookie 管理器，支持持久化存储
- **toast.tsx**：全局 Toast 提示组件（Context 模式）
- **runtimeLogger.ts**：运行时日志记录器，最多 500 条
- **useDebouncedPush.ts**：防抖导航 Hook，防止重复点击

## 关键类与函数

### UserManager 类 ([userInfo.ts](file:///workspace/planet/src/service/userInfo.ts))

用户信息单例管理器，核心方法：

| 方法 | 说明 | 参数 | 返回值 |
|------|------|------|--------|
| `saveToCache()` | 保存用户信息到本地存储 | - | `Promise<void>` |
| `loadFromCache()` | 从本地存储加载用户信息 | - | `Promise<boolean>` |
| `checkLogin()` | 检查登录状态 | - | `boolean` |
| `logout()` | 退出登录，清除所有数据 | - | `Promise<void>` |
| `getServerToken()` | 获取服务器 Token | - | `string` |
| `getServerUserId()` | 解析 JWT 获取用户 ID | - | `number` |
| `setFields(fields)` | 批量设置用户字段 | `Record<string, unknown>` | `void` |

### WeatherManager 类 ([weatherInfo.ts](file:///workspace/planet/src/service/weatherInfo.ts))

天气服务单例管理器，核心方法：

| 方法 | 说明 | 参数 | 返回值 |
|------|------|------|--------|
| `init(forceRefresh?)` | 初始化天气数据 | `boolean`（是否强制刷新） | `Promise<CurrentWeather>` |
| `update()` | 强制更新天气 | - | `Promise<CurrentWeather>` |
| `getCurrentWeather()` | 获取当前天气 | - | `CurrentWeather \| null` |
| `get24HourForecast()` | 获取24小时预报 | - | `HourlyForecast[]` |
| `getDailyForecast()` | 获取每日预报 | - | `DailyForecast[]` |
| `getCurrentArea()` | 获取当前地区 | - | `{ city, locality, province }` |
| `static getWeatherInfo(code)` | WMO 代码转天气描述 | `number` | `{ description, icon }` |

### CacheManager 类 ([cache.ts](file:///workspace/planet/src/utils/cache.ts))

带过期时间的缓存管理器，核心方法：

| 方法 | 说明 | 参数 | 返回值 |
|------|------|------|--------|
| `setAsync(key, value, expireTime?)` | 设置缓存 | `key, value, expireTime(ms)` | `Promise<boolean>` |
| `getAsync<T>(key)` | 获取缓存 | `string` | `Promise<T \| null>` |
| `removeAsync(key)` | 删除缓存 | `string` | `Promise<boolean>` |
| `clear()` | 清空所有缓存 | - | `Promise<boolean>` |

### CookiesManager 类 ([cookies.ts](file:///workspace/planet/src/utils/cookies.ts))

Cookie 管理器，核心方法：

| 方法 | 说明 | 参数 | 返回值 |
|------|------|------|--------|
| `init()` | 初始化加载缓存 Cookie | - | `Promise<void>` |
| `get(name)` | 获取单个 Cookie | `string` | `string \| undefined` |
| `set(name, value)` | 设置 Cookie | `string, string` | `Promise<this>` |
| `parseAndMerge(cookieStr)` | 解析并合并 Set-Cookie | `string` | `Promise<this>` |
| `toString()` | 序列化为 Cookie 字符串 | - | `string` |
| `clear()` | 清空所有 Cookie | - | `Promise<this>` |

### RuntimeLogger 类 ([runtimeLogger.ts](file:///workspace/planet/src/utils/runtimeLogger.ts))

运行时日志记录器，核心方法：

| 方法 | 说明 | 参数 |
|------|------|------|
| `debug(module, message, error?)` | 调试日志 | `string, string, Error?` |
| `info(module, message, error?)` | 信息日志 | `string, string, Error?` |
| `warn(module, message, error?)` | 警告日志 | `string, string, Error?` |
| `error(module, message, error?)` | 错误日志 | `string, string, Error?` |
| `getLogs()` | 获取所有日志 | - |
| `clear()` | 清空日志 | - |

### 核心函数

#### `login(stuID, password)` ([login.ts](file:///workspace/planet/src/service/hubt/login.ts))

完整登录流程函数，执行步骤：
1. 调用 `auth()` 进行教务系统认证
2. 获取 xhid（学籍标识）
3. 获取学生详细信息
4. 保存到 userManager

**参数**：`stuID: string, password: string`
**返回**：`Promise<{ success: boolean, message: string }>`

#### `auth(stuID, password)` ([auth.ts](file:///workspace/planet/src/service/hubt/auth.ts))

教务系统认证函数，执行步骤：
1. RSA 加密密码
2. 求解滑块验证码
3. 提交登录请求
4. 处理 302 重定向（登录成功标志）

#### `encryptPassword(password)` ([loginEncrypt.ts](file:///workspace/planet/src/utils/hbut/loginEncrypt.ts))

RSA 公钥加密密码函数，使用预置公钥对密码进行加密。

**参数**：`password: string`
**返回**：`string`（加密后的密文）

#### `extractCourseData(courseList)` ([courseHelper.ts](file:///workspace/planet/src/utils/hbut/courseHelper.ts))

课程数据提取与清洗函数，将原始课表数据转换为结构化数据，合并同一课程的不同节次。

**参数**：`CourseRaw[]`
**返回**：`CourseCleaned[]`

#### `useAppColorScheme()` ([use-theme-settings.tsx](file:///workspace/planet/src/hooks/use-theme-settings.tsx))

获取当前生效的颜色方案 Hook，考虑用户手动设置和系统偏好。

**返回**：`'light' | 'dark'`

#### `useDebouncedPush(cooldownMs?)` ([useDebouncedPush.ts](file:///workspace/planet/src/utils/useDebouncedPush.ts))

防抖导航 Hook，防止快速重复点击导致多次跳转。

**参数**：`cooldownMs?: number`（默认 500ms）
**返回**：`(route: string) => void`

## 依赖关系

### 外部 API 依赖

| 服务 | 地址 | 用途 | 认证方式 |
|------|------|------|----------|
| 湖北工业大学教务系统 | `https://jwxt.hbut.edu.cn` | 课表、成绩、考试等校园数据 | Cookie 会话 |
| 应用后端服务器 | `https://spinach.cc.cd` | 书籍、社团、聊天等社交功能 | JWT Token |
| Open-Meteo 天气 API | `https://api.open-meteo.com` | 天气预报数据 | 无需认证 |
| IP 定位服务 | `https://ipwho.is/` | IP 地理定位 | 无需认证 |
| 反向地理编码 | `https://api.bigdatacloud.net` | 坐标转地址 | 无需认证 |
| Gitee Open API | `https://gitee.com/api/v5` | 开源项目信息 | 无需认证 |

### 内部模块依赖关系

```
页面组件 (app/)
    ↓ 调用
服务层 (service/)
    ↓ 依赖
工具层 (utils/)
    ↓ 基于
配置层 (config/) + 常量层 (constants/)
```

**具体依赖链**：

1. **登录流程**：
   `login.tsx` → `service/hubt/login.ts` → `service/hubt/auth.ts` → `utils/hbut/loginEncrypt.ts` + `utils/request.ts` → `utils/cookies.ts` → `utils/cache.ts`

2. **课表查询**：
   `course.tsx` → `service/hubt/AllSchedule.ts` → `utils/request.ts` → `utils/hbut/courseHelper.ts`

3. **天气查询**：
   `weather.tsx` → `service/weatherInfo.ts` → Open-Meteo API + IP定位

4. **书籍交易**：
   `books.tsx` → `service/server/books.ts` → `utils/serverRequest.ts` → 后端服务器

### 关键数据流

1. **用户登录数据流**：
   ```
   用户输入 → RSA加密 → 教务系统 → Cookie保存 → 获取学籍信息 → userManager → AsyncStorage
   ```

2. **课表数据数据流**：
   ```
   页面请求 → service层 → request(带Cookie) → 教务系统 → 数据清洗 → 页面渲染
   ```

## 运行方式

### 环境要求

- Node.js >= 18
- npm 或 yarn（推荐 yarn）
- Expo CLI（随项目依赖安装）
- 可选：Android Studio（Android 模拟器）、Xcode（iOS 模拟器，仅 macOS）

### 安装依赖

```bash
# 使用 yarn（推荐）
yarn install

# 或使用 npm
npm install
```

### 启动开发服务器

```bash
# 启动 Expo 开发服务器
yarn start

# 或
npm run start
```

启动后，可以通过以下方式运行应用：

- **扫描二维码**：使用 Expo Go 应用扫描终端中的二维码
- **按 `a` 键**：在 Android 模拟器中运行
- **按 `i` 键**：在 iOS 模拟器中运行（仅 macOS）
- **按 `w` 键**：在 Web 浏览器中运行

### 平台特定运行

```bash
# Android
yarn android

# iOS
yarn ios

# Web
yarn web
```

### 代码检查

```bash
yarn lint
```

### 重置项目

```bash
yarn reset-project
```

### 构建发布

项目配置了 EAS (Expo Application Services) 构建，参见 [eas.json](file:///workspace/planet/eas.json)。

## 开发规范

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 配置规则
- 使用 Husky + lint-staged 进行提交前代码检查

### 命名约定

- **组件**：PascalCase（如 `GridContainer`）
- **Hook**：camelCase，以 `use` 开头（如 `useTheme`）
- **工具函数**：camelCase（如 `extractCourseData`）
- **常量**：UPPER_SNAKE_CASE（如 `MAX_LOGS`）
- **类型/接口**：PascalCase（如 `CourseRaw`）

### 路径别名

项目配置了路径别名，在 `tsconfig.json` 中定义：

- `@/*` → `./src/*`
- `@/assets/*` → `./assets/*`

### 主题系统

- 使用 Material Design 3 配色体系
- 支持浅色、深色、跟随系统三种模式
- 主题颜色定义在 [constants/theme.ts](file:///workspace/planet/src/constants/theme.ts)
- 通过 `useTheme()` Hook 获取当前主题颜色

### 缓存策略

- 教务系统数据：通过 Cookie 维持会话
- 天气数据：30 分钟缓存
- 书籍数据：5 分钟缓存
- Gitee 数据：长期缓存（手动刷新）
- 用户设置：永久存储

---

**项目地址**：https://gitee.com/damn_2/planet
