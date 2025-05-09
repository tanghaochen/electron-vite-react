/**
 * 这个脚本用于开发环境下启动Electron应用
 * 它会独立启动Vite服务器和Electron进程，避免vite-plugin-electron的问题
 */
import { spawn, exec } from "child_process";
import { createServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import fs from "fs";
import net from "net";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const rootDir = path.resolve(__dirname, "..");
const electronPath = require("electron");

// 设置Windows代码页为UTF-8
if (process.platform === "win32") {
  exec("chcp 65001");
}

// 检查端口是否被占用
async function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net
      .createServer()
      .once("error", () => resolve(true))
      .once("listening", () => {
        server.close();
        resolve(false);
      })
      .listen(port);
  });
}

// 杀死指定端口的进程（仅适用于Windows）
async function killProcessOnPort(port) {
  if (process.platform === "win32") {
    return new Promise((resolve) => {
      exec(
        `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /F /PID %a`,
        (error) => {
          resolve();
        },
      );
    });
  }
}

// 找一个可用的端口
async function findAvailablePort(startPort) {
  let port = startPort;
  while (await isPortInUse(port)) {
    console.log(`端口 ${port} 已被占用，尝试下一个端口...`);
    port++;
  }
  return port;
}

// 启动Vite开发服务器
async function startViteServer() {
  const port = await findAvailablePort(5173);

  // 确保端口未被占用
  if (await isPortInUse(port)) {
    await killProcessOnPort(port);
  }

  try {
    const server = await createServer({
      configFile: path.resolve(rootDir, "vite.config.ts"),
      root: rootDir,
      server: {
        port,
      },
      clearScreen: false,
    });

    await server.listen();
    const serverUrl = server.resolvedUrls.local[0];
    console.log(`Vite开发服务器已启动: ${serverUrl}`);

    return { server, url: serverUrl };
  } catch (error) {
    console.error("启动Vite服务器失败:", error);
    process.exit(1);
  }
}

// 启动Electron应用
function startElectron(viteServerUrl) {
  console.log("正在启动Electron应用...");

  // 设置环境变量
  const env = {
    ...process.env,
    VITE_DEV_SERVER_URL: viteServerUrl,
    NODE_ENV: "development",
  };

  // 启动Electron
  const electronProcess = spawn(electronPath, ["dist-electron/main/index.js"], {
    stdio: "inherit",
    env,
  });

  // 监听进程退出
  electronProcess.on("close", (code) => {
    console.log(`Electron应用已退出，代码: ${code}`);
  });

  // 监听错误
  electronProcess.on("error", (err) => {
    console.error("启动Electron进程时出错:", err);
  });

  return electronProcess;
}

// 主函数
async function main() {
  console.log("开始启动开发环境...");

  try {
    // 1. 启动Vite服务器
    const { server, url } = await startViteServer();

    // 2. 等待一些时间确保Vite服务器完全启动
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 3. 启动Electron应用
    const electronProcess = startElectron(url);

    // 4. 处理终止信号
    const cleanup = () => {
      console.log("正在关闭应用程序...");

      // 关闭Electron进程
      if (electronProcess && !electronProcess.killed) {
        electronProcess.kill();
      }

      // 关闭Vite服务器
      server.close();

      process.exit(0);
    };

    // 监听终止信号
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
    process.on("exit", cleanup);
  } catch (error) {
    console.error("启动开发环境时出错:", error);
    process.exit(1);
  }
}

// 执行主函数
main().catch((error) => {
  console.error("执行主函数时出错:", error);
  process.exit(1);
});
