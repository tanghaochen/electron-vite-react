import { BrowserWindow, screen, session, shell } from "electron";
import path from "path";

export class WindowManager {
  private win: BrowserWindow | null = null;
  private win2 = null;
  private preload: string;
  private indexHtml: string;
  private viteDevServerUrl: string | undefined;

  constructor(preload: string, indexHtml: string, viteDevServerUrl?: string) {
    this.preload = preload;
    this.indexHtml = indexHtml;
    this.viteDevServerUrl = viteDevServerUrl;
  }

  async createMainWindow() {
    // 获取所有显示器
    const displays = screen.getAllDisplays();
    // 获取主显示器
    const primaryDisplay = screen.getPrimaryDisplay();
    // 获取主显示器之外的第一个显示器（如果存在）
    const externalDisplay = displays.find(
      (display) => display.id !== primaryDisplay.id,
    );

    // 窗口配置
    this.win = new BrowserWindow({
      title: "Main window",
      icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
      // 如果有外部显示器，则在外部显示器上显示
      x: externalDisplay ? externalDisplay.bounds.x + 50 : 850,
      y: externalDisplay ? externalDisplay.bounds.y + 50 : 500,
      width: externalDisplay ? externalDisplay.bounds.width - 100 : 1200,
      height: externalDisplay ? externalDisplay.bounds.height - 100 : 800,
      autoHideMenuBar: true,
      // 取消置顶
      alwaysOnTop: false,
      webPreferences: {
        devTools: true,
        preload: this.preload,
        sandbox: true,
        webSecurity: false,
        experimentalFeatures: true,
      },
    });

    // 如果有外部显示器，设置全屏
    if (externalDisplay) {
      console.log("检测到外部显示器，设置窗口在外部显示器上");
      console.log("外部显示器信息:", externalDisplay.bounds);

      // 先移动窗口到外部显示器
      this.win.setBounds({
        x: externalDisplay.bounds.x,
        y: externalDisplay.bounds.y,
        width: externalDisplay.bounds.width,
        height: externalDisplay.bounds.height,
      });

      // 然后设置全屏
      // setTimeout(() => {
      //   this.win.setFullScreen(true);
      // }, 500);
    }

    if (this.viteDevServerUrl) {
      this.win.loadURL(this.viteDevServerUrl);
      this.win.webContents.openDevTools();
    } else {
      this.win.loadFile(this.indexHtml);
    }

    // 加载扩展
    session.defaultSession
      .loadExtension(
        "C:/Users/tang/AppData/Local/Microsoft/Edge/User Data/Default/Extensions/gpphkfbcpidddadnkolkpfckpihlkkil/6.1.1_0",
        {
          allowFileAccess: true,
        },
      )
      .then((rest) => {
        console.log(JSON.stringify(rest));
      });

    // 打开开发者工具
    this.win.webContents.openDevTools();

    this.win.webContents.on("did-finish-load", () => {
      this.win?.webContents.send(
        "main-process-message",
        new Date().toLocaleString(),
      );
    });

    // 设置链接处理
    this.win.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith("https:")) shell.openExternal(url);
      return { action: "deny" };
    });

    // 创建第二个窗口
    this.setupSecondaryWindow();

    return this.win;
  }

  private setupSecondaryWindow() {
    // 窗口创建在鼠标位置，支持跨屏
    setInterval(() => {
      if (this.win2) return;
      const globelMousePoint = screen.getCursorScreenPoint();
      this.win2 = new BrowserWindow({
        title: "Dashboard",
        frame: true,
        autoHideMenuBar: true,
        width: 940,
        height: 550,
        show: false,
        alwaysOnTop: true,
        webPreferences: {
          preload: this.preload,
        },
      });
      this.win2.webContents.openDevTools();
      if (this.viteDevServerUrl)
        this.win2.loadURL(this.viteDevServerUrl + "dashboard");
      this.win2.on("closed", () => {
        this.win2 = undefined;
      });
    }, 1);
  }

  getMainWindow() {
    return this.win;
  }

  getSecondaryWindow() {
    return this.win2;
  }

  showSecondaryWindowAtCursor() {
    if (!this.win2 || this.win2.isDestroyed()) return;

    const globelMousePoint = screen.getCursorScreenPoint();
    this.win2.setPosition(
      parseInt(globelMousePoint.x.toString()),
      parseInt(globelMousePoint.y.toString()),
    );
    this.win2.setAlwaysOnTop(true);
    this.win2.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    this.win2.focus();
    this.win2.show();
  }

  createChildWindow(hash: string) {
    const childWindow = new BrowserWindow({
      webPreferences: {
        preload: this.preload,
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    if (this.viteDevServerUrl) {
      childWindow.loadURL(`${this.viteDevServerUrl}#${hash}`);
    } else {
      childWindow.loadFile(this.indexHtml, { hash });
    }

    return childWindow;
  }
}
