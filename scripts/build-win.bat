@echo off
echo 开始构建Windows应用...

REM 设置环境变量忽略TypeScript错误
SET TS_NODE_TRANSPILE_ONLY=true
SET SKIP_TYPESCRIPT_CHECK=true

REM 执行构建
call vite build
IF %ERRORLEVEL% NEQ 0 (
    echo 构建前端资源失败!
    exit /b %ERRORLEVEL%
)

call electron-builder --win --x64
IF %ERRORLEVEL% NEQ 0 (
    echo 打包应用失败!
    exit /b %ERRORLEVEL%
)

echo 构建完成! 应用已打包到 release 目录. 