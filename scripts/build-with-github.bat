@echo off
echo 正在构建应用并设置 GitHub 更新服务器...

REM 设置 GitHub Token 环境变量（请替换为你的实际token）
echo 请先在 GitHub 上创建个人访问令牌(Personal Access Token)
echo 访问 https://github.com/settings/tokens 创建一个具有 repo 权限的令牌
set /p GH_TOKEN="请输入你的GitHub Token: "

REM 执行构建命令
echo 正在执行构建...
pnpm run build:win

echo 构建完成！
echo 请记得在 GitHub 上创建发布版本，并上传构建好的安装包。
echo 发布过程：
echo 1. 访问 https://github.com/tanghaochen/electron-vite-react/releases
echo 2. 点击 "Draft a new release"
echo 3. 填写版本号（如 v2.2.2），确保与 package.json 中的版本一致
echo 4. 上传构建好的安装包（位于 release 文件夹）
echo 5. 点击 "Publish release"

pause 