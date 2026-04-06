#!/bin/bash

# 进入项目目录
cd "$(dirname "$0")"

# 检查是否已经安装了依赖
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    npm install --registry=https://registry.npmmirror.com
fi

# 启动开发服务器
npm run dev &

# 等待服务器启动
sleep 3

# 打开浏览器
open "http://localhost:5173"

echo "游戏已启动，正在打开浏览器..."
