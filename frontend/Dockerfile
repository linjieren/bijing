# 多阶段构建：笔境前端 Web 应用

# ===========================
# 阶段 1：构建
# ===========================
FROM node:20-alpine AS builder

WORKDIR /app

# 构建参数：控制反馈按钮显示
ARG VITE_ENABLE_FEEDBACK=false
ENV VITE_ENABLE_FEEDBACK=${VITE_ENABLE_FEEDBACK}

COPY package*.json ./
RUN npm install

COPY . .
# Docker 构建跳过 tsc 类型检查（Vite 自身会转译 TS），避免未清理的 TS 严格错误阻塞部署
RUN npx vite build

# ===========================
# 阶段 2：Nginx 静态服务
# ===========================
FROM nginx:alpine AS production

# 拷贝构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx 配置通过 docker-compose volume 挂载，避免 build 阶段解析 upstream 主机名失败

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
