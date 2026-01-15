#!/bin/bash

# 1. 拉取最新代码
echo "Pulling latest code..."
git pull

# 2. 停止旧容器
echo "Stopping old container..."
docker stop weekly-keeper || true
docker rm weekly-keeper || true

# 3. 重新构建镜像
echo "Building new image..."
docker build -t weekly-keeper-img .

# 4. 运行新容器 (映射端口 和 数据卷)
# -p 8888:80  : 将服务器的 8888 端口映射到容器的 80 端口 (你可以改)
# -v $(pwd)/data:/app/data : 将当前目录下的 data 文件夹挂载进去，保证数据不丢失！
echo "Starting container..."
docker run -d \
  --name weekly-keeper \
  --restart unless-stopped \
  -p 8888:80 \
  -v $(pwd)/data:/app/data \
  weekly-keeper-img

echo "Deployed successfully! Access at http://YOUR_SERVER_IP:8888"
