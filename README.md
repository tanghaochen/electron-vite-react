# electron-vite-react

[![awesome-vite](https://awesome.re/mentioned-badge.svg)](https://github.com/vitejs/awesome-vite)
![GitHub stars](https://img.shields.io/github/stars/caoxiemeihao/vite-react-electron?color=fa6470)
![GitHub issues](https://img.shields.io/github/issues/caoxiemeihao/vite-react-electron?color=d8b22d)
![GitHub license](https://img.shields.io/github/license/caoxiemeihao/vite-react-electron)
[![Required Node.JS >= 14.18.0 || >=16.0.0](https://img.shields.io/static/v1?label=node&message=14.18.0%20||%20%3E=16.0.0&logo=node.js&color=3f893e)](https://nodejs.org/about/releases)

English | [简体中文](README.zh-CN.md)

## 👀 Overview

📦 Ready out of the box  
🎯 Based on the official [template-react-ts](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts), project structure will be familiar to you  
🌱 Easily extendable and customizable  
💪 Supports Node.js API in the renderer process  
🔩 Supports C/C++ native addons  
🐞 Debugger configuration included  
🖥 Easy to implement multiple windows

## 🛫 Quick Setup

```sh
# clone the project
git clone https://github.com/electron-vite/electron-vite-react.git

# enter the project directory
cd electron-vite-react

# install dependency
npm install

# develop
npm run dev
```

## 🐞 Debug

![electron-vite-react-debug.gif](/electron-vite-react-debug.gif)

## 📂 Directory structure

Familiar React application structure, just with `electron` folder on the top :wink:  
_Files in this folder will be separated from your React application and built into `dist-electron`_

```tree
├── electron                                 Electron-related code
│   ├── main                                 Main-process source code
│   └── preload                              Preload-scripts source code
│
├── release                                  Generated after production build, contains executables
│   └── {version}
│       ├── {os}-{os_arch}                   Contains unpacked application executable
│       └── {app_name}_{version}.{ext}       Installer for the application
│
├── public                                   Static assets
└── src                                      Renderer source code, your React application
```

<!--
## 🚨 Be aware

This template integrates Node.js API to the renderer process by default. If you want to follow **Electron Security Concerns** you might want to disable this feature. You will have to expose needed API by yourself.

To get started, remove the option as shown below. This will [modify the Vite configuration and disable this feature](https://github.com/electron-vite/vite-plugin-electron-renderer#config-presets-opinionated).

```diff
# vite.config.ts

export default {
  plugins: [
    ...
-   // Use Node.js API in the Renderer-process
-   renderer({
-     nodeIntegration: true,
-   }),
    ...
  ],
}
```
-->

## 🔧 Additional features

1. electron-updater 👉 [see docs](src/components/update/README.md)
1. playwright

## ❔ FAQ

- [C/C++ addons, Node.js modules - Pre-Bundling](https://github.com/electron-vite/vite-plugin-electron-renderer#dependency-pre-bundling)
- [dependencies vs devDependencies](https://github.com/electron-vite/vite-plugin-electron-renderer#dependencies-vs-devdependencies)

## 应用自动更新配置说明

此项目使用`electron-updater`实现自动更新功能。支持多种更新服务器配置方式。

### 通用服务器更新配置

通用服务器方式适合使用自己的文件服务器或者云存储托管更新文件：

```json
"publish": [
  {
    "provider": "generic",
    "url": "https://your-update-server.com/updates/",
    "channel": "latest"
  }
]
```

### GitHub 更新服务器配置 (推荐)

使用 GitHub Releases 作为免费更新服务器是最简单的方式：

```json
"publish": [
  {
    "provider": "github",
    "owner": "tanghaochen",
    "repo": "electron-vite-react"
  }
]
```

### 全自动发布流程

本项目配置了全自动发布流程，只需将代码推送到 main 分支即可：

```bash
git push origin main
```

系统会自动：

1. 增加版本号
2. 创建标签
3. 构建应用
4. 发布到 GitHub Releases

详细说明请参考: [documents/auto-publish.md](documents/auto-publish.md)

### 打包文件说明

打包后会生成多个文件，但最终用户只需要下载 `.exe` 安装程序即可。其他文件（如 `.yml` 和 `.blockmap`）是用于自动更新功能的。

默认配置下，GitHub Actions 会发布所有相关文件到 GitHub Releases。如果只想提供安装程序而不需要自动更新功能，可以修改 `.github/workflows/build-and-release.yml` 文件。

详细文件说明请参考: [documents/package-files.md](documents/package-files.md)

### 故障排查

如果自动更新遇到问题：

1. 检查应用日志：

   - Windows: `%USERPROFILE%\AppData\Roaming\ElectronViteReact\logs\main.log`
   - macOS: `~/Library/Logs/ElectronViteReact/main.log`
   - Linux: `~/.config/ElectronViteReact/logs/main.log`

2. 确保更新服务器 URL 正确配置
3. 确保更新文件（YML 和安装包）可以通过配置的 URL 访问
4. 确保新版本号大于当前版本号（在`package.json`中设置）

更多信息请参考[electron-builder 自动更新文档](https://www.electron.build/auto-update)
