import { app, ipcMain, dialog } from "electron";
import { createRequire } from "node:module";
import type {
  ProgressInfo,
  UpdateDownloadedEvent,
  UpdateInfo,
} from "electron-updater";
import log from "electron-log";
// sqlite.test.js
// import { DatabaseSync } from 'node:sqlite'
const { autoUpdater } = createRequire(import.meta.url)("electron-updater");

// 配置日志
log.transports.file.level = "debug";
autoUpdater.logger = log;
log.info("应用自动更新模块初始化");

export function update(win: Electron.BrowserWindow) {
  // 自动更新配置
  autoUpdater.autoDownload = false; // 不自动下载，通过用户触发
  autoUpdater.disableWebInstaller = false; // 允许Web安装
  autoUpdater.allowDowngrade = false; // 不允许降级
  autoUpdater.allowPrerelease = false; // 默认不使用预发布版本

  // 如果使用GitHub作为更新服务器，配置token以避免API速率限制
  if (process.env.GH_TOKEN) {
    log.info("配置 GitHub Token");
    autoUpdater.requestHeaders = {
      Authorization: `token ${process.env.GH_TOKEN}`,
    };
  }

  // 检查更新日志
  autoUpdater.on("checking-for-update", () => {
    log.info("正在检查更新...");
    win.webContents.send("update-checking");
  });

  // 有可用更新
  autoUpdater.on("update-available", (arg: UpdateInfo) => {
    log.info("发现新版本:", arg.version);
    win.webContents.send("update-can-available", {
      update: true,
      version: app.getVersion(),
      newVersion: arg?.version,
      releaseNotes: arg?.releaseNotes,
      releaseDate: arg?.releaseDate,
    });
  });

  // 没有可用更新
  autoUpdater.on("update-not-available", (arg: UpdateInfo) => {
    log.info("没有可用更新，当前是最新版本");
    win.webContents.send("update-can-available", {
      update: false,
      version: app.getVersion(),
      newVersion: arg?.version,
    });
  });

  // 更新下载进度
  autoUpdater.on("download-progress", (progressInfo: ProgressInfo) => {
    log.debug(`下载进度: ${progressInfo.percent.toFixed(2)}%`);
    win.webContents.send("download-progress", progressInfo);
  });

  // 更新错误
  autoUpdater.on("error", (err: Error) => {
    log.error("更新错误:", err);
    win.webContents.send("update-error", {
      message: err.message || "更新过程中发生未知错误",
      error: err,
    });

    // 显示错误对话框
    dialog.showErrorBox(
      "更新错误",
      `更新应用程序时发生错误: ${err.message || "未知错误"}`,
    );
  });

  // 更新下载完成
  autoUpdater.on("update-downloaded", (info: UpdateDownloadedEvent) => {
    log.info("更新下载完成，准备安装", info);
    win.webContents.send("update-downloaded", info);

    // 可选：提示用户是否立即重启安装
    const dialogOpts: Electron.MessageBoxOptions = {
      type: "info",
      buttons: ["稍后重启", "立即重启"],
      title: "应用更新",
      message: "更新已下载",
      detail: `新版本 ${info.version} 已下载完成，重启应用以完成安装`,
    };

    dialog.showMessageBox(dialogOpts).then((returnValue) => {
      if (returnValue.response === 1) {
        autoUpdater.quitAndInstall(false, true);
      }
    });
  });

  // 检查更新 IPC 处理
  ipcMain.handle("check-update", async () => {
    if (!app.isPackaged) {
      const error = new Error("自动更新功能仅在打包后的应用中可用");
      log.warn(error.message);
      return { message: error.message, error };
    }

    try {
      log.info("正在检查更新...");
      const result = await autoUpdater.checkForUpdatesAndNotify();
      log.info("检查更新结果:", result);
      return result;
    } catch (error) {
      log.error("检查更新失败:", error);
      return { message: "网络错误或更新服务器无法访问", error };
    }
  });

  // 开始下载更新
  ipcMain.handle("start-download", (event: Electron.IpcMainInvokeEvent) => {
    log.info("开始下载更新...");

    startDownload(
      (error, progressInfo) => {
        if (error) {
          // 反馈下载错误消息
          log.error("下载更新过程中出错:", error);
          event.sender.send("update-error", { message: error.message, error });
        } else if (progressInfo) {
          // 反馈更新进度
          event.sender.send("download-progress", progressInfo);
        }
      },
      (updateDownloadedEvent) => {
        // 反馈更新下载完成消息
        log.info("更新下载完成");
        event.sender.send("update-downloaded", updateDownloadedEvent);
      },
    );
  });

  // 安装更新 IPC 处理
  ipcMain.handle("quit-and-install", () => {
    log.info("正在退出并安装更新...");
    autoUpdater.quitAndInstall(false, true);
  });

  // 切换是否使用预发布版本
  ipcMain.handle("toggle-prerelease", (_, usePrerelease: boolean) => {
    log.info(`${usePrerelease ? "启用" : "禁用"}预发布版本`);
    autoUpdater.allowPrerelease = usePrerelease;
    // 切换后重新检查更新
    return autoUpdater.checkForUpdatesAndNotify();
  });
}

// 开始下载函数
function startDownload(
  callback: (error: Error | null, info: ProgressInfo | null) => void,
  complete: (event: UpdateDownloadedEvent) => void,
) {
  autoUpdater.on("download-progress", (info: ProgressInfo) =>
    callback(null, info),
  );
  autoUpdater.on("error", (error: Error) => callback(error, null));
  autoUpdater.on("update-downloaded", complete);

  try {
    autoUpdater.downloadUpdate().catch((err: Error) => {
      callback(err, null);
    });
  } catch (err: unknown) {
    callback(err instanceof Error ? err : new Error(String(err)), null);
  }
}

// 导出autoUpdater以便在需要时直接访问
export { autoUpdater };
