import {app, BrowserWindow, shell, ipcMain, session, screen} from "electron";
import fs from "fs";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import path from "node:path";
import os from "node:os";
import {
    installExtension,
    REDUX_DEVTOOLS,
    REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";

import {update} from "./update";

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
    // setInterval(() => {
    //   console.log("000", process.env.VITE_DEV_SERVER_URL);
    //   const globelMousePoint = screen.getCursorScreenPoint();
    //   console.log("globel", globelMousePoint);

    //   const win2 = new BrowserWindow({
    //     title: "Main window",
    //     icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    //     x: globelMousePoint.x,
    //     y: globelMousePoint.y,
    //     webPreferences: {
    //       preload,
    //       // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
    //       // nodeIntegration: true,

    //       // Consider using contextBridge.exposeInMainWorld
    //       // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
    //       // contextIsolation: false,
    //     },
    //   });
    //   if (VITE_DEV_SERVER_URL) win2.loadURL(VITE_DEV_SERVER_URL);
    //   setTimeout(function () {
    //     win2.close();
    //   }, 1000);
    // }, 5000);
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
      return {action: "deny"};
  });

  // Auto update
    update(win);
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
    // 创建窗口
    // await installExtension("fmkadmapgofadopljbjfkapdkoienihi");
    // await updateExtensions();
    // await launchExtensionBackgroundWorkers();
    installExtension(REACT_DEVELOPER_TOOLS)
        .then((ext) => console.log(`Added Extension:  ${ext.name}`))
        .catch((err) => console.log("An error occurred: ", err));

    installExtension(REDUX_DEVTOOLS)
        .then((name) => console.log(`Added Extension: ${name}`))
        .catch((err) => console.log("An error occurred: ", err));

    createWindow();
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
      childWindow.loadFile(indexHtml, {hash: arg});
  }
});
