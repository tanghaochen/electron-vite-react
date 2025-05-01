import { useEffect } from "react";
import { noteContentDB } from "../database/noteContentDB";

const DatabaseTest = () => {
  useEffect(() => {
    const testDatabase = async () => {
      try {
        console.group("数据库测试开始");

        // 测试 noteContentDB
        console.group("noteContentDB 测试");
        try {
          const testContent = "<p>这是一个测试笔记内容</p>";

          // 测试 create
          console.group("create 测试");
          const noteId = await noteContentDB.create(testContent);
          console.log("✅ 创建笔记成功，ID:", noteId);
          console.groupEnd();

          // 测试 getContentByNoteId
          console.group("getContentByNoteId 测试");
          const content = await noteContentDB.getContentByNoteId(noteId);
          console.log("✅ 获取笔记内容成功:", content);
          console.groupEnd();

          // 测试 exists
          console.group("exists 测试");
          const exists = await noteContentDB.exists(noteId);
          console.log("✅ 笔记存在检查成功:", exists);
          console.groupEnd();

          // 测试 updateContent
          console.group("updateContent 测试");
          const updatedContent = "<p>这是更新后的测试笔记内容</p>";
          await noteContentDB.updateContent(noteId, updatedContent);
          console.log("✅ 笔记内容更新成功");

          // 验证更新后的内容
          const newContent = await noteContentDB.getContentByNoteId(noteId);
          console.log("✅ 更新后的内容:", newContent);
          console.groupEnd();

          // 测试 deleteContent
          console.group("deleteContent 测试");
          await noteContentDB.deleteContent(noteId);
          console.log("✅ 笔记删除成功");
          console.groupEnd();

          // 测试删除后的 exists
          console.group("删除后 exists 测试");
          const existsAfterDelete = await noteContentDB.exists(noteId);
          console.log("✅ 删除后存在检查成功:", existsAfterDelete);
          console.groupEnd();
        } catch (error) {
          console.error("❌ noteContentDB 测试失败:", error);
        }
        console.groupEnd();

        // 在这里添加其他数据库模块的测试
        // 例如：tagsDB, notesDB 等

        console.groupEnd();
        console.log("✅ 所有数据库测试完成");
      } catch (error) {
        console.error("❌ 数据库测试发生错误:", error);
      }
    };

    testDatabase();
  }, []);

  return null;
};

export default DatabaseTest;
