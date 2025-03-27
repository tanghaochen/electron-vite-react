import { app, ipcMain, BrowserWindow } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import {
  installExtension,
  REDUX_DEVTOOLS,
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";

import { ImageManager } from "./services/ImageManager";
import { DatabaseManager } from "./services/DatabaseManager";
import { WindowManager } from "./services/WindowManager";
import { ShortcutManager } from "./services/ShortcutManager";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 环境配置
process.env.APP_ROOT = path.join(__dirname, "../..");

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// 预加载脚本和HTML文件路径
const preload = path.join(__dirname, "../preload/index.mjs");
const indexHtml = path.join(RENDERER_DIST, "index.html");

// 应用程序初始化
async function initApp() {
  // 创建服务实例
  const imageManager = new ImageManager();
  const dbManager = new DatabaseManager();
  const windowManager = new WindowManager(
    preload,
    indexHtml,
    VITE_DEV_SERVER_URL,
  );
  const shortcutManager = new ShortcutManager(windowManager);

  // 设置IPC处理程序
  setupIpcHandlers(imageManager, dbManager, windowManager);

  // 创建主窗口
  await windowManager.createMainWindow();

  // 设置全局快捷键
  shortcutManager.setupGlobalShortcuts();

  // 设置应用程序事件
  setupAppEvents(windowManager, shortcutManager);

  // 安装开发工具扩展
  if (VITE_DEV_SERVER_URL) {
    installDevExtensions();
  }
}

// 设置IPC处理程序
function setupIpcHandlers(
  imageManager: ImageManager,
  dbManager: DatabaseManager,
  windowManager: WindowManager,
) {
  // 设置数据库IPC处理程序
  dbManager.setupIpcHandlers(ipcMain);

  // 设置图片下载IPC处理程序
  ipcMain.handle(
    "download-image",
    async (_, url, referer?: string, originalUrl?: string) => {
      try {
        console.log("开始下载图片:", url);

        // 创建下载目录
        const downloadDir = path.join(
          app.getPath("userData"),
          "downloaded_images",
        );
        if (!fs.existsSync(downloadDir)) {
          fs.mkdirSync(downloadDir, { recursive: true });
        }

        // 生成唯一文件名，移除查询参数
        let fileName;
        if (url.startsWith("data:") || url.startsWith("blob:")) {
          fileName = `img_${Date.now()}_${Math.floor(
            Math.random() * 10000,
          )}.png`;
        } else {
          // 从URL中提取文件名，并移除查询参数
          const urlObj = new URL(url);
          const pathName = urlObj.pathname;
          const baseName = path.basename(pathName).split("?")[0];

          // 确保文件名有扩展名
          const ext = path.extname(baseName) || ".jpg";
          fileName = `img_${Date.now()}_${Math.floor(
            Math.random() * 10000,
          )}${ext}`;
        }

        const filePath = path.join(downloadDir, fileName);

        // 如果是data URL或blob URL
        if (url.startsWith("data:") || url.startsWith("blob:")) {
          const response = await fetch(url);
          const buffer = await response.arrayBuffer();
          fs.writeFileSync(filePath, Buffer.from(buffer));
          console.log("图片已保存到:", filePath);
          return filePath;
        }

        // 设置请求选项，包括referer
        const options: { headers: Record<string, string> } = {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        };

        // 如果提供了referer，添加到请求头
        if (referer) {
          options.headers["Referer"] = referer;
          console.log("设置Referer:", referer);
        }

        // 如果提供了原始页面URL，添加到请求头
        if (originalUrl) {
          options.headers["Origin"] = new URL(originalUrl).origin;
          console.log("设置Origin:", options.headers["Origin"]);
        }

        // 对于微信图片，特殊处理
        if (url.includes("mmbiz.qpic.cn") || url.includes("mmbiz.qlogo.cn")) {
          // 移除查询参数
          const cleanUrl = url.split("?")[0];
          url = cleanUrl;
          console.log("处理微信图片URL:", url);
        }

        // 下载图片
        const response = await fetch(url, options);

        if (!response.ok) {
          throw new Error(
            `图片下载失败: ${response.status} ${response.statusText}`,
          );
        }

        const buffer = await response.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(buffer));

        console.log("图片已保存到:", filePath);
        return filePath;
      } catch (error) {
        console.error("下载图片失败:", error);
        throw error;
      }
    },
  );

  // 添加save-blob-image处理程序
  ipcMain.handle("save-blob-image", async (_, blob) => {
    try {
      console.log("开始保存Blob图片");

      // 创建下载目录
      const downloadDir = path.join(
        app.getPath("userData"),
        "downloaded_images",
      );
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      // 生成唯一文件名
      const fileName = `img_${Date.now()}_${Math.floor(
        Math.random() * 10000,
      )}.png`;
      const filePath = path.join(downloadDir, fileName);

      // 将blob数据写入文件
      const buffer = Buffer.from(await blob.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      console.log("Blob图片已保存到:", filePath);
      return filePath;
    } catch (error) {
      console.error("保存Blob图片失败:", error);
      throw error;
    }
  });

  // 处理新窗口
  ipcMain.handle("open-win", (_, arg) => {
    return windowManager.createChildWindow(arg);
  });
}

// 设置应用程序事件
function setupAppEvents(
  windowManager: WindowManager,
  shortcutManager: ShortcutManager,
) {
  app.on("will-quit", () => {
    shortcutManager.unregisterAll();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("second-instance", () => {
    const mainWindow = windowManager.getMainWindow();
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on("activate", () => {
    const allWindows = BrowserWindow.getAllWindows();
    if (allWindows.length) {
      allWindows[0].focus();
    } else {
      windowManager.createMainWindow();
    }
  });
}

// 安装开发工具扩展
function installDevExtensions() {
  installExtension(REACT_DEVELOPER_TOOLS)
    .then((ext) => console.log(`已添加扩展: ${ext.name}`))
    .catch((err) => console.log("发生错误: ", err));

  installExtension(REDUX_DEVTOOLS)
    .then((name) => console.log(`已添加扩展: ${name}`))
    .catch((err) => console.log("发生错误: ", err));
}

// 启动应用
app.whenReady().then(initApp);
