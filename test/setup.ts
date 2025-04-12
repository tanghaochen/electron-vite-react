// 设置测试环境
import { vi } from "vitest";

// 模拟Electron的IPC
vi.mock("electron", () => {
  return {
    ipcRenderer: {
      on: vi.fn(),
      send: vi.fn(),
      off: vi.fn(),
    },
    clipboard: {
      readText: vi.fn(),
      writeText: vi.fn(),
    },
  };
});

// 其他全局设置
