import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  session,
  screen,
  clipboard,
  globalShortcut,
  net,
} from "electron";
import fs from "fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import {
  installExtension,
  REDUX_DEVTOOLS,
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import { getSelectionText, copy } from "@xitanggg/node-selection";
import { keyboard, Key } from "@nut-tree/nut-js";
import ClipboardListener from "clipboard-event";

import { update } from "./update";
import { initDatabase } from "../database/init";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
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

let win: BrowserWindow | null = null;
let win2 = null;

const preload = path.join(__dirname, "../preload/index.mjs");
const indexHtml = path.join(RENDERER_DIST, "index.html");

async function createWindow() {
  win = new BrowserWindow({
    title: "Main window",
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    x: 850,
    y: 500,
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    webPreferences: {
      devTools: true,
      preload,
      sandbox: true, // 强制沙箱模式
      webSecurity: false, // 仅开发环境关闭安全限制
      experimentalFeatures: true, // 启用实验功能
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
    },
  });

  if (VITE_DEV_SERVER_URL) {
    // #298
    win.loadURL(VITE_DEV_SERVER_URL);
    // Open devTool if the app is not packaged
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }
  // 窗口创建在鼠标位置，支持跨屏
  setInterval(() => {
    if (win2) return;
    const globelMousePoint = screen.getCursorScreenPoint();
    win2 = new BrowserWindow({
      title: "Main window",
      frame: true,
      autoHideMenuBar: true,
      width: 940,
      height: 550,
      show: false,
      alwaysOnTop: true,
      webPreferences: {
        preload,
        // contextIsolation: false,
        // webSecurity: false,
        // backgroundThrottling: false,
        // nodeIntegration: true,
      },
    });
    win2.webContents.openDevTools();
    if (VITE_DEV_SERVER_URL) win2.loadURL(VITE_DEV_SERVER_URL + "dashboard");
    win2.on("closed", () => {
      win2 = undefined;
    });
    // 打包后，失焦隐藏
    // win2.on("blur", () => {
    //     win2.hide();
    // });
  }, 1);
  // 加载扩展
  session.defaultSession
    .loadExtension(
      "C:/Users/tang/AppData/Local/Microsoft/Edge/User Data/Default/Extensions/gpphkfbcpidddadnkolkpfckpihlkkil/6.1.1_0",
      {
        allowFileAccess: true,
      },
    )
    .then((rest) => {
      // ...
      console.log(JSON.stringify(rest));
    });
  // 打开开发者工具
  win.webContents.openDevTools();

  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });

  // Auto update
  //   update(win);
}

function launchExtensionBackgroundWorkers(sessions = session.defaultSession) {
  return Promise.all(
    sessions.getAllExtensions().map(async (extension) => {
      const manifest = extension.manifest;
      if (
        manifest.manifest_version === 3 &&
        manifest?.background?.service_worker
      ) {
        await sessions.serviceWorkers.startWorkerForScope(extension.url);
      }
    }),
  );
}

// 添加错误处理
app.whenReady().then(async () => {
  const db = initDatabase();
  // 暴露数据库操作接口
  // 主进程代码（如 electron-main.js）
  // electron-main/db.js
  ipcMain.handle("db:query", async (_, sql, params) => {
    try {
      const stmt = db.prepare(sql);

      if (sql.trim().toUpperCase().startsWith("SELECT")) {
        return stmt.all(params);
      } else {
        const result = stmt.run(params);
        return {
          lastInsertRowid: result.lastInsertRowid,
          changes: result.changes,
        };
      }
    } catch (err) {
      console.error("Database Error:", err.message);
      throw new Error(`Database Error: ${err.message}`);
    }
  });

  // 添加下载图片的IPC处理程序
  ipcMain.handle("download-image", async (_, imageUrl) => {
    try {
      // 创建保存图片的目录
      const userDataPath = app.getPath("userData");
      const imagesDir = path.join(userDataPath, "images");

      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }

      // 为图片生成唯一文件名
      const filename = `${Date.now()}-${path.basename(imageUrl).split("?")[0]}`;
      const localPath = path.join(imagesDir, filename);

      // 使用Electron的net模块下载图片
      const response = await net.fetch(imageUrl);
      if (!response.ok) throw new Error(`下载失败: ${response.status}`);

      // 将响应转换为Buffer并写入文件
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(localPath, buffer);

      console.log(`图片已下载到: ${localPath}`);
      return localPath;
    } catch (error) {
      console.error("下载图片失败:", error);
      throw error;
    }
  });

  // 创建窗口
  installExtension(REACT_DEVELOPER_TOOLS)
    .then((ext) => console.log(`Added Extension:  ${ext.name}`))
    .catch((err) => console.log("An error occurred: ", err));

  installExtension(REDUX_DEVTOOLS)
    .then((name) => console.log(`Added Extension: ${name}`))
    .catch((err) => console.log("An error occurred: ", err));
  // const modifier = isMacOS ? Key.LeftSuper : Key.LeftControl;
  const modifier = Key.LeftControl;

  async function simulateCopy() {
    await keyboard.pressKey(modifier, Key.C);
    await keyboard.releaseKey(modifier, Key.C);
  }

  function getSelectedContent(clipboard) {
    return new Promise(async (resolve) => {
      // 先清空剪贴板
      clipboard.clear();
      // 再执行模拟复制
      await simulateCopy();
      // 延时一定时间才能从剪切板内读取到内容
      setTimeout(() => {
        // 获取剪贴板中的内容
        const text = clipboard.readText("clipboard") || "";
        resolve({
          text,
        });
        // ...
      }, 0);
    });
  }

  createWindow();
  const isResgist = globalShortcut.isRegistered("CommandOrControl+Shift+F1");
  // Register a 'CommandOrControl+X' shortcut listenerjava.
  const ret =
    (!isResgist &&
      globalShortcut.register("CommandOrControl+Space", async () => {
        // const copyText = copy();
        // 主动发送给渲染进程（关键代码）
        if (win2 && !win2.isDestroyed()) {
          // 获取剪贴板内容
          const clipboardContent = await getSelectedContent(clipboard);
          console.log("clipboardContent", clipboardContent);
          win2.webContents.send("clipboard-update", clipboardContent);
        }
        // 将像素位置转换成 windows 屏幕缩放比例后的实际坐标。
        const globelMousePoint = screen.getCursorScreenPoint();
        // 设置窗口位置
        win2.setPosition(
          parseInt(globelMousePoint.x),
          parseInt(globelMousePoint.y),
        );
        win2.setAlwaysOnTop(true);
        win2.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
        win2.focus();
        win2.show();
      })) ||
    null;
});

app.on("will-quit", () => {
  // 注销所有快捷键
  globalShortcut.unregisterAll();
});
app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// New window example arg: new windows url
ipcMain.handle("open-win", (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});
