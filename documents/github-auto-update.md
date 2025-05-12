# 使用 GitHub 作为 Electron 应用的自动更新服务器

本文档详细介绍如何使用 GitHub Releases 作为 Electron 应用的自动更新服务器。

## 1. 前置条件

- 拥有一个 GitHub 账号
- 已创建用于托管应用的 GitHub 仓库
- 本地应用使用 electron-builder 进行打包

## 2. 修改 electron-builder 配置

在项目的 `electron-builder.json` 文件中，配置 `publish` 字段：

```json
"publish": [
  {
    "provider": "github",
    "owner": "你的GitHub用户名",
    "repo": "你的仓库名称"
  }
]
```

将 `owner` 和 `repo` 替换为你实际的 GitHub 用户名和仓库名称。

## 3. 创建 GitHub Token (推荐)

为了避免 GitHub API 的请求限制，建议创建一个具有 `repo` 权限的个人访问令牌（Personal Access Token）：

1. 访问 GitHub 个人设置中的 [Personal access tokens](https://github.com/settings/tokens)
2. 点击 "Generate new token"，选择 "Fine-grained tokens"
3. 为令牌提供一个描述性名称，如 "Electron Auto Update"
4. 选择适当的过期时间
5. 在权限部分，为你的仓库选择 "Contents: Read & write" 权限
6. 生成并保存令牌

## 4. 配置 GitHub Token

在你的打包脚本或 CI/CD 流程中设置环境变量：

```bash
# Windows
set GH_TOKEN=你的GitHub令牌

# macOS/Linux
export GH_TOKEN=你的GitHub令牌
```

然后在 `electron/main/update.ts` 中配置令牌：

```typescript
// 如果使用GitHub作为更新服务器，可以配置token以避免API速率限制
if (process.env.GH_TOKEN) {
  autoUpdater.requestHeaders = {
    Authorization: `token ${process.env.GH_TOKEN}`,
  };
}
```

## 5. 发布新版本

1. 更新 `package.json` 中的版本号
2. 构建你的应用：

```bash
# 使用 npm
npm run build

# 使用 pnpm
pnpm build
```

3. 在 GitHub 上创建一个新的 Release：
   - 创建一个新的 tag，格式为 `v版本号`，例如 `v1.0.1`
   - 上传构建好的安装包到 Release
   - 发布 Release

## 6. 测试自动更新

1. 确保用户使用的是旧版本应用
2. 发布新版本到 GitHub
3. 当用户打开应用时，应该会收到更新通知

## 7. 注意事项

- 对于 Windows，更新包需要是 `.exe` 或 `.nsis` 文件
- 对于 macOS，更新包通常是 `.dmg` 或 `.zip` 文件
- 对于 Linux，更新包通常是 `.AppImage` 文件
- 版本号必须符合 [语义化版本](https://semver.org/) 规范，例如 `1.0.0`，`1.2.3` 等

## 8. 通过 GitHub Actions 自动发布

可以设置 GitHub Actions 工作流来自动构建和发布你的应用：

```yaml
name: Build and Release

on:
  push:
    tags:
      - "v*"

jobs:
  release:
    runs-on: ${{ matrix.os }}

    strategy:
      matrix:
        os: [windows-latest]

    steps:
      - name: Check out Git repository
        uses: actions/checkout@v3

      - name: Install Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Build and release
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: pnpm run build
```

这个工作流将在你推送新标签时自动构建并发布应用。

## 9. 故障排除

1. **更新检查失败**

   - 确认网络连接正常
   - 验证 GitHub 令牌是否有效
   - 检查 electron-log 日志中的详细错误信息

2. **下载更新失败**

   - 检查应用日志中的错误信息
   - 确认 GitHub Release 资源是公开可访问的

3. **安装更新失败**
   - 确保应用有足够的权限安装更新
   - 在 Windows 上，考虑以管理员身份运行应用

## 更多资源

- [electron-builder 文档](https://www.electron.build/)
- [electron-updater 文档](https://www.electron.build/auto-update)
- [GitHub Release API](https://docs.github.com/en/rest/reference/releases)
