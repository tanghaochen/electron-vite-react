import { app, Tray, Menu, nativeImage, BrowserWindow } from "electron";
import path from "node:path";

export class TrayManager {
  private tray: Tray | null = null;

  constructor() {}

  /**
   * 初始化系统托盘
   * @param iconPath 托盘图标路径
   * @param mainWindow 主窗口引用
   */
  public createTray(iconPath: string, mainWindow?: BrowserWindow): void {
    try {
      // 创建托盘图标
      const icon = nativeImage.createFromPath(iconPath);
      this.tray = new Tray(icon);

      // 设置托盘菜单
      const contextMenu = Menu.buildFromTemplate([
        {
          label: "显示/隐藏窗口",
          click: () => {
            if (mainWindow) {
              if (mainWindow.isVisible()) {
                mainWindow.hide();
              } else {
                mainWindow.show();
                mainWindow.focus();
              }
            }
          },
        },
        { type: "separator" },
        {
          label: "退出",
          click: () => {
            app.quit();
          },
        },
      ]);

      // 设置托盘属性
      this.tray.setToolTip("Electron应用");
      this.tray.setContextMenu(contextMenu);

      // 点击托盘图标时显示/隐藏主窗口
      if (mainWindow) {
        this.tray.on("click", () => {
          if (mainWindow.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow.show();
            mainWindow.focus();
          }
        });
      }

      console.log("系统托盘创建成功");
    } catch (error) {
      console.error("创建系统托盘时出错:", error);
    }
  }

  /**
   * 销毁托盘
   */
  public destroyTray(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}
