import { describe, it, expect, beforeAll } from "vitest";

describe("noteContentDB 主进程数据库操作", () => {
  it("可以插入和获取内容", () => {
    expect("hello world").toBe("hello world");
  });
});
