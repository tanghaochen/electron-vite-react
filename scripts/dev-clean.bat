@echo off
echo 启动清理过的开发环境...

REM 删除Vite缓存
IF EXIST node_modules\.vite (
    echo 删除Vite缓存...
    rmdir /s /q node_modules\.vite
)

REM 设置环境变量
SET NODE_OPTIONS=--max-old-space-size=4096
SET TS_NODE_TRANSPILE_ONLY=true
SET SKIP_TYPESCRIPT_CHECK=true

echo 启动开发环境...
call vite

echo 开发环境已关闭! 