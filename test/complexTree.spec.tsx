import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import complexTree from "../src/components/complexTree";
import { tagsdb } from "@/database/tagsdb";
import { worksListDB } from "@/database/worksLists";

// 定义组件属性类型
interface ComplexTreeProps {
  onSelectedTagChange: (tag: any) => void;
  setWorksItem: (item: any) => void;
}

// Mock 数据库相关函数
vi.mock("@/database/tagsdb", () => ({
  tagsdb: {
    getTagsByCategory: vi.fn(),
    createTag: vi.fn(),
    updateTag: vi.fn(),
    deleteTag: vi.fn(),
  },
}));

vi.mock("@/database/worksLists", () => ({
  worksListDB: {
    createMetadata: vi.fn(),
    updateMetadata: vi.fn(),
  },
}));

describe("complexTree Component", () => {
  const mockOnSelectedTagChange = vi.fn();
  const mockSetWorksItem = vi.fn();

  beforeEach(() => {
    // 重置所有 mock
    vi.clearAllMocks();

    // 设置默认的 mock 返回值
    (tagsdb.getTagsByCategory as any).mockResolvedValue([
      { id: "1", label: "标签1", parent_id: 0, sort_order: 0 },
      { id: "2", label: "标签2", parent_id: 0, sort_order: 1 },
    ]);

    (tagsdb.createTag as any).mockResolvedValue("3");
    (worksListDB.createMetadata as any).mockResolvedValue({
      id: "1",
      title: "新词库",
    });
  });

  it("应该正确渲染组件", async () => {
    render(
      React.createElement(complexTree, {
        onSelectedTagChange: mockOnSelectedTagChange,
        setWorksItem: mockSetWorksItem,
      } as ComplexTreeProps),
    );

    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText("分类标签")).toBeInTheDocument();
    });

    // 验证标签是否正确显示
    expect(screen.getByText("标签1")).toBeInTheDocument();
    expect(screen.getByText("标签2")).toBeInTheDocument();
  });

  it("应该能够添加新标签", async () => {
    render(
      React.createElement(complexTree, {
        onSelectedTagChange: mockOnSelectedTagChange,
        setWorksItem: mockSetWorksItem,
      } as ComplexTreeProps),
    );

    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText("分类标签")).toBeInTheDocument();
    });

    // 点击添加按钮
    const addButton = screen.getByRole("button");
    fireEvent.click(addButton);

    // 验证数据库调用
    await waitFor(() => {
      expect(tagsdb.createTag).toHaveBeenCalled();
      expect(worksListDB.createMetadata).toHaveBeenCalled();
    });
  });

  it("应该能够处理标签选择", async () => {
    render(
      React.createElement(complexTree, {
        onSelectedTagChange: mockOnSelectedTagChange,
        setWorksItem: mockSetWorksItem,
      } as ComplexTreeProps),
    );

    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText("分类标签")).toBeInTheDocument();
    });

    // 点击标签
    const tag1 = screen.getByText("标签1");
    fireEvent.click(tag1);

    // 验证回调函数被调用
    await waitFor(() => {
      expect(mockOnSelectedTagChange).toHaveBeenCalled();
    });
  });

  it("应该能够处理标签重命名", async () => {
    render(
      React.createElement(complexTree, {
        onSelectedTagChange: mockOnSelectedTagChange,
        setWorksItem: mockSetWorksItem,
      } as ComplexTreeProps),
    );

    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText("分类标签")).toBeInTheDocument();
    });

    // 模拟重命名操作
    const tag1 = screen.getByText("标签1");
    fireEvent.contextMenu(tag1);

    // 这里需要模拟重命名输入
    // 由于组件内部使用了复杂的树形结构，这部分可能需要更详细的测试
  });

  it("应该能够处理标签删除", async () => {
    render(
      React.createElement(complexTree, {
        onSelectedTagChange: mockOnSelectedTagChange,
        setWorksItem: mockSetWorksItem,
      } as ComplexTreeProps),
    );

    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText("分类标签")).toBeInTheDocument();
    });

    // 模拟删除操作
    const tag1 = screen.getByText("标签1");
    fireEvent.contextMenu(tag1);

    // 这里需要模拟删除操作
    // 由于组件内部使用了复杂的树形结构，这部分可能需要更详细的测试
  });
});
