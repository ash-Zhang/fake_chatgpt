# 使用官方Node.js运行时作为基础镜像
FROM node:20-alpine AS base

# 安装依赖阶段
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 禁用telemetry以加快构建速度
ENV NEXT_TELEMETRY_DISABLED=1

# 构建Next.js应用（standalone模式）
RUN npm run build

# 生产阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 从构建阶段复制standalone输出
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static

# 暴露端口
EXPOSE 8000

# 使用shell形式以确保PORT环境变量正确扩展
# Next.js standalone模式的server.js会自动监听0.0.0.0和PORT环境变量
CMD sh -c "PORT=${PORT:-8000} node server.js"

