import { describe, it, expect, vi, beforeEach } from "vitest";
import { noteContentDB } from "../noteContentDB";
import fs from "fs";
import path from "path";
import util from "util";

// 自定义输出函数
function logData(label: string, data: any) {
  const output = util.inspect(
    { [label]: data },
    {
      colors: true,
      depth: null,
      maxArrayLength: null,
      maxStringLength: null,
      breakLength: 80,
    },
  );
  console.log(output);
}

// Mock IPC调用
const mockIpcInvoke = vi.fn();
vi.stubGlobal("window", {
  ipcRenderer: {
    invoke: mockIpcInvoke,
  },
});

describe("noteContentDB", () => {
  beforeEach(() => {
    // 重置mock
    mockIpcInvoke.mockReset();
  });

  it("应该能够获取到 noteId 为 5 的笔记内容", async () => {
    const expectedContent =
      '{"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":null},"content":[{"type":"text","text":"1111111废物放弃我dadsfas32141212344323434323334234dsfasd"}]}]}';

    // Mock updateContent的响应
    mockIpcInvoke.mockResolvedValueOnce({ changes: 1 });

    // Mock getContentByNoteId的响应
    mockIpcInvoke.mockResolvedValueOnce([{ content: expectedContent }]);

    // 先更新内容
    await noteContentDB.updateContent(5, expectedContent);

    // 获取笔记内容
    const content = await noteContentDB.getContentByNoteId(5);
    logData("获取到的内容", content);

    // 验证内容
    expect(content).toBe(expectedContent);

    // 验证IPC调用次数
    expect(mockIpcInvoke).toHaveBeenCalledTimes(2);

    // 验证调用参数
    const calls = mockIpcInvoke.mock.calls;

    // 验证第一次调用 - updateContent
    expect(calls[0][0]).toBe("db:query");
    expect(calls[0][1]).toContain("INSERT INTO notes_content");
    expect(calls[0][2]).toEqual([5, expectedContent]);

    // 验证第二次调用 - getContentByNoteId
    expect(calls[1][0]).toBe("db:query");
    expect(calls[1][1]).toContain("SELECT content FROM notes_content");
    expect(calls[1][2]).toEqual([5]);
  });

  it("应该能够获取所有笔记内容", async () => {
    // 模拟数据库中的多条记录
    const mockContents = [
      {
        note_id: 1,
        content: '{"type":"doc","content":[{"type":"text","text":"笔记1"}]}',
      },
      {
        note_id: 2,
        content: '{"type":"doc","content":[{"type":"text","text":"笔记2"}]}',
      },
      {
        note_id: 3,
        content: '{"type":"doc","content":[{"type":"text","text":"笔记3"}]}',
      },
    ];

    // Mock getAllContents的响应
    mockIpcInvoke.mockResolvedValueOnce(mockContents);

    // 获取所有笔记内容
    const contents = await noteContentDB.getAllContents();
    logData("获取到的所有内容", contents);

    // 验证内容
    expect(contents).toEqual(mockContents);

    // 验证IPC调用
    expect(mockIpcInvoke).toHaveBeenCalledTimes(1);
    expect(mockIpcInvoke).toHaveBeenCalledWith(
      "db:query",
      "SELECT note_id, content FROM notes_content ORDER BY note_id",
      [],
    );
  });
});
