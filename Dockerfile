# 使用官方Node.js运行时作为基础镜像
FROM node:20-alpine AS base

# 安装依赖阶段
FROM base AS deps
WORKDIR /app

# 复制package文件
COPY package.json package-lock.json* ./
RUN npm ci

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 禁用telemetry以加快构建速度
ENV NEXT_TELEMETRY_DISABLED 1

# 构建Next.js应用
RUN npm run build

# 生产镜像
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必要的文件
# standalone模式会将所有文件复制到.next/standalone目录
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

# 暴露端口（PORT环境变量由Koyeb设置）
EXPOSE 3000

# 使用shell形式以确保PORT环境变量正确扩展
CMD sh -c "PORT=${PORT:-3000} node server.js"

