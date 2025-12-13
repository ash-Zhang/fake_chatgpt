# 使用官方Node.js运行时作为基础镜像
FROM node:20-alpine

WORKDIR /app

# 禁用telemetry以加快构建速度
ENV NEXT_TELEMETRY_DISABLED=1

# 复制package文件并安装依赖（包括devDependencies用于构建）
# 注意：不设置NODE_ENV=production，这样npm ci会安装devDependencies
COPY package.json package-lock.json* ./
RUN npm ci

# 复制应用程序代码
COPY . .

# 构建Next.js应用（此时仍需要devDependencies）
RUN npm run build

# 设置生产环境（构建完成后设置）
ENV NODE_ENV=production

# 暴露端口
EXPOSE 8000

# 使用shell形式以确保PORT环境变量正确扩展
# Next.js默认监听0.0.0.0，只需指定端口
CMD sh -c "npx next start -p ${PORT:-8000}"

