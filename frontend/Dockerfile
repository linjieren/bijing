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
RUN npm ci

COPY . .
RUN npm run build

# ===========================
# 阶段 2：Nginx 静态服务
# ===========================
FROM nginx:alpine AS production

# 拷贝构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA 路由回退配置
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://api:3000/api/; \
        proxy_http_version 1.1; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
