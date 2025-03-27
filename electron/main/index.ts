import { app, ipcMain, BrowserWindow } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
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
function setupIpcHandlers(imageManager, dbManager, windowManager) {
  // 设置数据库IPC处理程序
  dbManager.setupIpcHandlers(ipcMain);

  // 设置图片下载IPC处理程序
  ipcMain.handle("download-image", async (_, imageUrl) => {
    return imageManager.downloadImage(imageUrl);
  });

  // 处理新窗口
  ipcMain.handle("open-win", (_, arg) => {
    return windowManager.createChildWindow(arg);
  });
}

// 设置应用程序事件
function setupAppEvents(windowManager, shortcutManager) {
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
