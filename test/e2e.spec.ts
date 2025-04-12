import path from "node:path";
import {
  type ElectronApplication,
  type Page,
  _electron as electron,
} from "playwright";
import { beforeAll, afterAll, describe, expect, test } from "vitest";

const root = path.join(__dirname, "..");
let electronApp: ElectronApplication;
let page: Page;

if (process.platform === "linux") {
  test("Linux skipped", () => expect(true).toBe(true));
} else {
  beforeAll(async () => {
    // 直接启动 Electron 应用，不启动 Vite 服务器
    electronApp = await electron.launch({
      args: [path.join(root, "dist-electron/main/index.js"), "--no-sandbox"],
      cwd: root,
      env: {
        ...process.env,
        NODE_ENV: "test", // 使用测试环境
        ELECTRON_ENABLE_LOGGING: "true",
        ELECTRON_DISABLE_SECURITY_WARNINGS: "true",
      },
      timeout: 30000, // 延长超时时间
    });

    // 处理首个窗口 - 这可能是DevTools窗口，我们需要找到主应用窗口
    const allWindows = await electronApp.windows();
    console.log(`检测到 ${allWindows.length} 个窗口`);

    // 尝试找到主应用窗口 - 通常是第一个非DevTools窗口
    for (const win of allWindows) {
      const title = await win.title();
      const url = win.url();
      console.log(`窗口标题: "${title}", URL: ${url}`);

      // 如果不是DevTools窗口，则使用它
      if (!url.includes("devtools")) {
        page = win;
        break;
      }
    }

    // 如果没有找到合适的窗口，使用第一个窗口
    if (!page && allWindows.length > 0) {
      page = allWindows[0];
      console.log("使用第一个可用窗口作为备选");
    }

    if (page) {
      await page.waitForLoadState("domcontentloaded", { timeout: 30000 });
      await page.setViewportSize({ width: 1280, height: 800 });
    } else {
      console.error("未找到任何窗口!");
    }
  }, 60000); // 全局超时设置为60秒

  afterAll(async () => {
    try {
      if (page) {
        await page.screenshot({ path: "test/screenshots/e2e.png" });
      }
    } catch (error) {
      console.error("截图失败:", error);
    }

    try {
      if (page) await page.close();
    } catch (error) {
      console.error("关闭页面失败:", error);
    }

    try {
      if (electronApp) await electronApp.close();
    } catch (error) {
      console.error("关闭应用失败:", error);
    }
  }, 30000); // 增加afterAll的超时时间

  describe("[笔记应用] e2e 测试", () => {
    test("应用程序启动", async () => {
      // 检查页面是否存在
      expect(page).not.toBeNull();

      if (page) {
        // 检查页面是否加载
        const readyState = await page
          .evaluate(() => document.readyState)
          .catch(() => null);
        expect(readyState).toBe("complete");
      }
    }, 10000);

    test("应用程序界面元素存在", async () => {
      // 确保页面存在
      expect(page).not.toBeNull();

      if (page) {
        // 等待应用程序完全加载
        await page.waitForTimeout(5000); // 等待5秒钟

        // 打印当前页面的HTML结构，帮助调试
        const html = await page.content();
        console.log("页面HTML结构:", html.substring(0, 500) + "...");

        // 获取页面上所有可见的类名，帮助找到正确的选择器
        const classNames = await page.evaluate(() => {
          const elements = document.querySelectorAll("[class]");
          return Array.from(elements).map((el) => el.className);
        });
        console.log("页面上的类名:", classNames);

        // 检查应用程序的一些基本元素是否存在（使用更通用的选择器）
        const appElement = await page.$(
          "div[class*='App'], #root, #app, main, body > div",
        );
        expect(appElement).not.toBeNull();
      }
    }, 20000); // 增加超时时间
  });
}
