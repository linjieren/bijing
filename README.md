# 笔境 (bijing) · AI 驱动的互动式网文平台

[![Status](https://img.shields.io/badge/Status-Active-success)]()
[![Tech](https://img.shields.io/badge/Frontend-React_19%20%7C%20Vite_6%20%7C%20Tailwind_4-blue)]()
[![Tech](https://img.shields.io/badge/Backend-Node_20%20%7C%20Express_4%20%7C%20PostgreSQL-green)]()
[![AI](https://img.shields.io/badge/AI-Moonshot_Kimi_API-purple)]()
[![Deploy](https://img.shields.io/badge/Deploy-Render_|_Docker-orange)]()

> **选择你的命运，书写独一无二的故事。**
>
> 笔境是一个由 AI 实时生成内容的**互动式网文平台**。在古风、科幻、悬疑、言情等多个世界观中，每一次选择都会改变故事走向，让用户从"读者"变成"主角"。

## 核心特性

- 🤖 **AI 实时续写** —— 基于 Moonshot Kimi 大模型，根据你的选择即时生成下一段沉浸式剧情
- 🌐 **多世界观** —— 古风 / 科幻 / 悬疑 / 言情 / 玄幻……持续扩展的故事宇宙
- 🎭 **分支剧情** —— 每个选择都会改写后续剧情与结局，提供真实的"互动小说"体验
- 👥 **社区广场** —— 玩家可以发布自己创作或游玩的故事，点赞 / 评论 / 收藏他人的作品
- 📱 **移动优先** —— 完整响应式设计 + 自定义 React 组件 + Framer Motion 动效，手机即开即用
- 🔐 **完整账号体系** —— 邮箱 / 短信验证码 / JWT 鉴权 / 个人主页

## 产品截图

> ⚠️ 项目截图待补充。建议截 4 张：首页广场 / 故事创建 / 阅读器（核心交互）/ 个人主页。

## 技术栈

### 前端

| 技术 | 用途 |
|---|---|
| **React 19** | UI 框架 |
| **Vite 6** | 构建工具（极快冷启动） |
| **TypeScript 5** | 全量类型安全 |
| **Tailwind CSS 4** | 原子化样式 |
| **Zustand 5** | 轻量状态管理（比 Redux 简洁 10 倍） |
| **Framer Motion 12** | 动效（StoryIntroAnimation 开场动画等） |
| **React Router 7** | 路由 |
| **lucide-react** | 图标库 |
| **pnpm + monorepo workspace** | 包管理 + 多包协同 |

### 后端

| 技术 | 用途 |
|---|---|
| **Node.js 20** | 运行时 |
| **Express 4** | Web 框架 |
| **TypeScript 5** | 全量类型安全 |
| **PostgreSQL** | 主数据库（用户、故事、章节、社交关系） |
| **pg** | PostgreSQL 驱动 |
| **JWT** | 鉴权 |
| **axios** | HTTP 客户端（调 Kimi API） |
| **dotenv** | 环境变量管理 |

### AI & 部署

| 技术 | 用途 |
|---|---|
| **Moonshot Kimi API** (`moonshot-v1-8k`) | AI 章节生成 |
| **Docker + docker-compose** | 容器化 |
| **Render** | 部署平台（render.yaml 配置） |
| **Nginx** | 前端反向代理 |

## 项目结构

```text
bijing/
├── backend/                 # Express + TypeScript 后端
│   ├── src/
│   │   ├── index.ts         # 入口（Express app + CORS + 路由挂载）
│   │   ├── routes/          # 7 个 API 路由
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── stories.ts   # 故事 CRUD
│   │   │   ├── share.ts
│   │   │   ├── square.ts    # 广场
│   │   │   ├── feedback.ts
│   │   │   └── events.ts    # 事件追踪
│   │   ├── services/        # 11 个业务服务
│   │   │   ├── aiService.ts      # ⭐ Kimi API 集成
│   │   │   ├── storyService.ts
│   │   │   ├── chapterService.ts
│   │   │   ├── userService.ts
│   │   │   ├── authService.ts
│   │   │   ├── shareService.ts
│   │   │   ├── likeService.ts
│   │   │   ├── squareService.ts
│   │   │   ├── eventService.ts
│   │   │   ├── feedbackService.ts
│   │   │   └── smsService.ts
│   │   ├── middleware/      # Express 中间件（auth / error / response / user）
│   │   ├── db/              # SQL 初始化脚本
│   │   └── types/           # TypeScript 类型定义
│   ├── scripts/             # 迁移脚本
│   ├── Dockerfile
│   └── package.json
├── frontend/                # React + Vite 前端
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── pages/           # 7 个页面
│   │   │   ├── ReaderPage.tsx       # ⭐ 核心交互页
│   │   │   ├── CreatePage.tsx
│   │   │   ├── CommunityPage.tsx
│   │   │   ├── MyStoriesPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── ShareLandingPage.tsx
│   │   ├── components/      # 通用组件
│   │   ├── stores/          # Zustand stores
│   │   ├── api/             # 后端 API 客户端
│   │   ├── types/           # TypeScript 类型
│   │   └── utils/           # 工具函数
│   ├── Dockerfile
│   └── package.json
├── ops/                     # 部署配置
│   ├── docker-compose.yml
│   └── nginx/
└── render.yaml               # Render 部署清单
```

## 快速开始

### 本地开发

```bash
# 1. 克隆
git clone https://github.com/linjieren/bijing.git
cd bijing

# 2. 启动 PostgreSQL（用 docker-compose）
cd ops
docker-compose up -d
cd ..

# 3. 配置后端环境变量
cd backend
cp .env.example .env
# 编辑 .env，填入 DATABASE_URL 和 KIMI_API_KEY
npm install
npm run db:init
npm run dev    # http://localhost:3000

# 4. 启动前端（新终端）
cd ../frontend
cp .env.example .env
# 编辑 .env，设置 VITE_API_BASE_URL=http://localhost:3000
pnpm install
pnpm dev       # http://localhost:5173
```

### Docker 部署

```bash
# 启动完整 stack（postgres + backend + frontend + nginx）
cd ops
docker-compose up -d
```

### Render 部署

`render.yaml` 已配置：
- `bijing-backend`（Web Service，Docker，Node 20）
- 环境变量：`KIMI_API_KEY` / `DATABASE_URL` / `KIMI_MODEL=moonshot-v1-8k`
- 一键部署到 Render

## 核心 API

| Method | Path | 用途 |
|---|---|---|
| `POST` | `/api/auth/signup` | 注册 |
| `POST` | `/api/auth/login` | 登录 |
| `POST` | `/api/stories` | 创建故事（AI 生成初始章节） |
| `GET` | `/api/stories/:id` | 获取故事详情 |
| `POST` | `/api/stories/:id/chapters` | AI 续写下一章（核心） |
| `GET` | `/api/square` | 社区广场列表 |
| `POST` | `/api/square/:id/like` | 点赞 |
| `POST` | `/api/feedback` | 提交反馈 |
| `POST` | `/api/events` | 埋点事件追踪 |

## 产品演进路线图

- [x] MVP —— 0→1 单用户 + AI 续写（2025）
- [x] 社区广场 + 分享（2026 Q1）
- [x] 移动端响应式 + Framer Motion 动效（2026 Q2）
- [ ] **多人共创模式** —— 多个玩家在同一故事中投票决定剧情（2026 Q4）
- [ ] **世界观商店** —— UGC 创作者可发布自定义世界观（2027 Q1）
- [ ] **角色关系图谱** —— 用 LLM 提取人物关系 + 可视化（2027 Q2）
- [ ] **付费章节** —— 商业化路径（订阅 / 单章节解锁）

## 反思与教训

> 这是本人从 0 到 1 独立完成并上线的第二个 SaaS 项目（前一个是 HyperSpot Tech 跨境出海诊断 SaaS）。

做笔境时**复用了 HyperSpot 的几个关键经验**：
1. **先做 MVP，再做社区** —— HyperSpot 当初一上来就做了社区功能但没用户，笔境这次先验证 AI 续写的核心体验
2. **数据库 schema 先简单后扩展** —— 用 SQL migration 脚本增量演进，避免早期过度设计
3. **移动端从第一天就是一等公民** —— HyperSpot 的教训：后期重写移动端很贵
4. **用 Render 而不是自建 K8s** —— 一个 Solo Founder 不该过早投入基础设施

## 商业化思考

互动式网文是一个**已经验证**的市场（晋江、起点等传统网文平台 + Character.AI / Replika 等 AI 角色产品）。笔境的差异化在于：
- **AI 真正续写剧情**（不是固定剧本）
- **每个选择都有后果**（不是无脑爽文）
- **社区 + 创作工具**（用户既是读者也是创作者）

可能路径：付费章节 / 创作者分成 / 高级世界观订阅。

## License

MIT

## 致谢

- AI 模型：[Moonshot AI Kimi](https://platform.moonshot.cn/) 提供 `moonshot-v1-8k` API
- 部署平台：[Render](https://render.com/)
- UI 灵感：传统网文平台（晋江 / 起点）+ AI 角色产品（Character.AI）

---

> 本项目是个人 Vibe Coding 作品，展示 AI 应用从 0→1 的端到端能力（产品设计 / 前后端全栈 / AI 集成 / 部署 / 数据模型）。
> 想要更多内容 AI 方向的项目，可参考姊妹项目 [video-conversion-KG](https://github.com/linjieren/video-conversion-KG)（小红书短视频转化方法论 Skill）。
