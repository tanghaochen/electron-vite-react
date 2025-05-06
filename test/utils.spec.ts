import { describe, expect, test } from "vitest";

// 一个简单的工具函数示例
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

describe("工具函数测试", () => {
  test("formatDate 函数测试", () => {
    // 测试用例1：测试当前日期格式化
    const today = new Date();
    const formattedDate = formatDate(today);
    expect(formattedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // 测试用例2：测试特定日期格式化
    const testDate = new Date("2024-01-01");
    expect(formatDate(testDate)).toBe("2024-01-01");

    // 测试用例3：测试月份和日期补零
    const dateWithSingleDigit = new Date("2024-09-05");
    expect(formatDate(dateWithSingleDigit)).toBe("2024-09-05");
  });
});
