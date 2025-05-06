// 设置测试环境
import { vi } from "vitest";
import { beforeAll } from "vitest";
import { ipcRenderer } from "electron";
import path from "path";
import fs from "fs";

// 确保使用与开发环境相同的数据库文件
const testDataPath = path.resolve("testdata");
if (!fs.existsSync(testDataPath)) {
  fs.mkdirSync(testDataPath, { recursive: true });
}

// 设置环境变量
process.env.NODE_ENV = "test";
process.env.APP_ROOT = path.resolve(__dirname, "..");

// 模拟Electron的IPC
const mockIpcRenderer = {
  on: vi.fn(),
  send: vi.fn(),
  off: vi.fn(),
  invoke: vi.fn().mockImplementation((channel, ...args) => {
    if (channel === "db:query") {
      const [sql, params] = args;
      if (sql.includes("SELECT")) {
        const noteId = params[0];
        return Promise.resolve([
          {
            content:
              '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"1111111废物放弃我dadsfas32141212344323434323334234dsfasd"}]}]}',
          },
        ]);
      }
      return Promise.resolve([]);
    }
    return Promise.resolve();
  }),
};

vi.mock("electron", () => ({
  ipcRenderer: mockIpcRenderer,
}));

// 设置全局 window 对象
(global as any).window = {
  ipcRenderer: mockIpcRenderer,
};
