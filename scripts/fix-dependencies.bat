@echo off
echo 开始修复依赖问题...

REM 删除node_modules和Vite缓存
IF EXIST node_modules\better-sqlite3 (
    echo 删除better-sqlite3依赖...
    rmdir /s /q node_modules\better-sqlite3
)

IF EXIST node_modules\.vite (
    echo 删除Vite缓存...
    rmdir /s /q node_modules\.vite
)

echo 使用npm重新安装better-sqlite3...
call npm install better-sqlite3 --force

echo 重建better-sqlite3...
call npx electron-rebuild -f -w better-sqlite3

echo 修复完成!
echo.
echo 请使用 pnpm run dev 启动开发环境
echo 或使用 pnpm run build:win-force 打包应用 