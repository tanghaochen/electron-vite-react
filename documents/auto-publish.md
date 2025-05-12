# 自动发布到 GitHub Releases 指南

本文档详细介绍如何使用 GitHub Actions 自动构建并发布 Electron 应用到 GitHub Releases。

## 全自动发布流程

本项目已配置全自动发布流程，只需将代码推送到主分支（main）即可触发完整的发布流程：

1. GitHub Actions 自动检测代码变更
2. 自动增加版本号（补丁版本+1）
3. 自动创建新版本提交和标签
4. 自动构建应用
5. 自动发布到 GitHub Releases

## 具体步骤说明

### 1. 推送代码到主分支

只需将你的代码变更推送到 main 分支：

```bash
git push origin main
```

系统会自动处理以下工作：

- 自动增加 package.json 中的补丁版本号（如 2.2.1 → 2.2.2）
- 自动创建版本提交和标签
- 自动构建并发布新版本

### 2. 查看构建状态

你可以在这里查看构建状态：
https://github.com/tanghaochen/electron-vite-react/actions

### 3. 查看发布版本

构建完成后，你可以在这里查看发布的版本：
https://github.com/tanghaochen/electron-vite-react/releases

## 手动控制版本号

如果你需要手动控制版本号（例如进行主版本或次版本升级），你仍然可以使用原来的发布脚本：

```bash
pnpm release
```

这个命令会：

- 提示你输入新版本号
- 自动更新 package.json 中的版本号
- 创建提交和标签
- 推送到 GitHub，触发自动构建和发布

## 故障排除

如果遇到自动发布问题，请检查：

1. **GitHub Actions 权限**

   - 确保仓库设置中的 Actions 权限已启用
   - 前往 Settings -> Actions -> General，确保 "Allow all actions and reusable workflows" 已选中
   - 确保 Workflow permissions 设置为 "Read and write permissions"

2. **自动提交问题**

   - 如果 GitHub Actions 无法推送更改，请检查 Workflow permissions
   - 前往 Settings -> Actions -> General -> Workflow permissions，设置为 "Read and write permissions"

3. **构建失败**

   - 查看 GitHub Actions 日志了解详细错误
   - 最常见的问题是依赖安装失败或构建脚本错误

4. **防止循环触发**
   - 工作流配置中已排除 package.json 变更触发，以防止版本更新形成无限循环

## 手动发布备选方案

如果自动发布遇到问题，你仍然可以使用以下命令手动构建：

```bash
# Windows
scripts/build-with-github.bat

# Linux/macOS
scripts/build-with-github.sh
```

然后手动上传构建文件到 GitHub Releases。
