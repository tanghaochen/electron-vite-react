// 设置测试环境
import { vi, expect, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";

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

// 每个测试后清理
afterEach(() => {
  cleanup();
});
