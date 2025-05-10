# 自动更新功能使用说明

本应用基于 Electron 的 `electron-updater` 模块实现了自动更新功能，可以帮助用户获取最新版本的应用。

## 更新原理

应用通过连接到 GitHub Releases 检查是否有新版本可用。如果有新版本，会通知用户并提供下载选项。

## 配置说明

### 发布渠道配置

在 `electron-builder.json` 文件中配置了发布渠道信息：

```json
"publish": [
  {
    "provider": "github",
    "owner": "your-github-username",
    "repo": "electron-vite-react",
    "private": false,
    "releaseType": "release"
  }
]
```

发布前需要修改以下配置：

1. `owner`: 改为您的 GitHub 用户名
2. `repo`: 改为您的仓库名称
3. `private`: 如果是私有仓库，设置为 `true`

### 使用 GitHub Token

对于私有仓库或需要更高频率限制的公共仓库，建议使用 GitHub Token。

在构建时可以通过环境变量设置：

```
export GH_TOKEN=your_github_token
npm run build
```

或在 Windows 上：

```
set GH_TOKEN=your_github_token
npm run build
```

## 版本管理

应用版本号在 `package.json` 文件中的 `version` 字段定义。每次发布新版本时，需要更新这个版本号。

遵循 [语义化版本](https://semver.org/) 规范：

- MAJOR: 不兼容的 API 变更
- MINOR: 向下兼容的功能性新增
- PATCH: 向下兼容的问题修正

## 发布流程

1. 更新 `package.json` 中的版本号
2. 构建应用：`npm run build` 或 `pnpm build`
3. 在 GitHub 上创建一个新的 Release
4. 上传构建的安装包到 Release
5. 发布 Release

## 用户体验

用户在应用启动时会自动检查更新。当有新版本可用时：

1. 通知栏会显示更新提示
2. 点击"下载更新"按钮开始下载
3. 下载完成后，可以选择"立即安装"或稍后安装

## 预发布版本

默认情况下，应用只会提示安装正式发布版本。如需启用预发布版本（beta、alpha 等），需要在代码中设置：

```javascript
autoUpdater.allowPrerelease = true;
```

## 故障排查

如果更新过程中遇到问题：

1. 检查应用日志文件，日志位置：

   - Windows: `%USERPROFILE%\AppData\Roaming\{app name}\logs\main.log`
   - macOS: `~/Library/Logs/{app name}/main.log`
   - Linux: `~/.config/{app name}/logs/main.log`

2. 常见问题：
   - 网络连接问题：确认能够访问 GitHub
   - 版本号问题：确保新版本的版本号大于当前版本
   - 签名问题：确保应用是正确签名的

## 手动更新

如果自动更新失败，用户始终可以通过以下方式手动更新：

1. 访问应用的 GitHub Release 页面
2. 下载最新版本的安装包
3. 安装新版本（无需卸载旧版本）
