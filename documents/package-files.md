# Electron 应用打包文件说明

本文档解释 electron-builder 打包过程中生成的各种文件及其用途。

## 打包后的文件概览

打包完成后，release 目录下通常会有以下文件：

```
release/
└── 版本号/
    ├── ElectronViteReact_版本号.exe           # Windows安装程序
    ├── latest.yml                           # 更新信息文件
    ├── ElectronViteReact_版本号.exe.blockmap  # 差量更新文件
    ├── builder-debug.yml                    # 构建调试信息
    ├── builder-effective-config.yaml        # 实际构建配置
    └── win-unpacked/                        # 解包后的应用目录
```

## 各文件用途说明

### 1. 需要分发给用户的文件

对于最终用户，只需要提供以下文件：

- **ElectronViteReact\_版本号.exe**：
  - 这是安装程序，用户只需下载并运行这个文件即可安装应用
  - 文件较大（通常>100MB），包含完整的应用程序

### 2. 自动更新相关文件

如果你的应用支持自动更新功能，则需要这些文件：

- **latest.yml**：

  - 包含当前版本信息、更新 URL、哈希校验值等
  - 用于检测新版本和验证下载完整性
  - 体积很小（通常<1KB）

- **ElectronViteReact\_版本号.exe.blockmap**：
  - 用于差量更新的块映射文件
  - 允许应用只下载有变化的部分，而不是整个安装包
  - 显著提高更新速度，降低带宽需求

### 3. 开发者使用的文件

这些文件通常不需要分发，仅供开发者参考：

- **builder-debug.yml**：

  - 包含构建过程的详细日志
  - 用于调试构建问题

- **builder-effective-config.yaml**：

  - 显示实际使用的构建配置
  - 包含合并默认值后的完整配置信息

- **win-unpacked/**：
  - 包含解包后的应用程序文件
  - 可用于测试但不需要分发
  - 包含应用程序所有资源和依赖

## 不同发布场景下需要的文件

### 1. 只分发安装程序（无自动更新）

如果你只想让用户手动下载并安装新版本，只需上传：

- **ElectronViteReact\_版本号.exe**

### 2. 支持自动更新（通过 GitHub）

如果你使用 GitHub 作为更新服务器，需要上传：

- **ElectronViteReact\_版本号.exe**
- **latest.yml**
- **ElectronViteReact\_版本号.exe.blockmap** (可选但推荐)

### 3. 支持自动更新（通过自定义服务器）

如果你使用自己的服务器作为更新源，需要上传：

- **ElectronViteReact\_版本号.exe**
- **latest.yml**
- **ElectronViteReact\_版本号.exe.blockmap** (可选但推荐)

## 其他平台的文件

各平台对应的主要文件：

- **Windows**: `.exe` 和 `latest.yml`
- **macOS**: `.dmg`/`.zip` 和 `latest-mac.yml`
- **Linux**: `.AppImage`/`.deb` 和 `latest-linux.yml`

## 小结

- 给普通用户：只需提供 `.exe` 安装文件
- 支持自动更新：需要 `.exe` + `.yml` + `.blockmap`
- 其他文件主要用于开发者调试和测试
