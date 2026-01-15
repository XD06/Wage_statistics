# 第一阶段：构建 React 前端应用
FROM node:18-alpine as builder

# 设置工作目录
WORKDIR /app

# 复制依赖定义文件
COPY package*.json ./

# 安装所有依赖（包含构建工具 Vite 等）
RUN npm install

# 复制所有源代码
COPY . .

# 执行构建，生成静态文件（默认在 dist 目录）
RUN npm run build

# ---------------------------------------

# 第二阶段：生产环境服务器
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 这里的 server.js 需要 express，我们单独安装它作为生产依赖
RUN npm install express

# 复制 Node.js 服务器脚本
COPY server.js .

# 将第一阶段构建好的前端静态文件 (dist) 复制到 server.js 预期的 public 目录中
COPY --from=builder /app/dist ./public

# 创建数据存储目录（用于挂载卷）
RUN mkdir -p data

# 暴露端口（与 server.js 中的 PORT 80 对应）
EXPOSE 80

# 启动服务
CMD ["node", "server.js"]
