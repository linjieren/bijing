# 多阶段构建：笔境后端 API 服务

# ===========================
# 阶段 1：构建
# ===========================
FROM node:20-alpine AS builder

WORKDIR /app

# 先拷贝依赖文件，利用缓存层
COPY package*.json tsconfig.json ./
RUN npm ci

# 拷贝源码并编译
COPY src ./src
RUN npm run build

# ===========================
# 阶段 2：生产运行
# ===========================
FROM node:20-alpine AS production

WORKDIR /app

# 安装生产依赖
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# 拷贝编译产物
COPY --from=builder /app/dist ./dist

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

EXPOSE 3000

CMD ["node", "dist/index.js"]
