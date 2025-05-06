// src/renderer/api/tagsdb.js
interface NoteContent {
  note_id: number;
  content: string;
}

export const noteContentDB = {
  // 复用通用查询方法
  query: <T = any>(sql: string, params: any[] = []) => {
    return window.ipcRenderer.invoke("db:query", sql, params) as Promise<T>;
  },

  /**
   * 创建/更新笔记内容（使用 INSERT OR REPLACE 实现upsert）
   * @param {number} noteId - 关联的元数据ID
   * @param {string} content - HTML内容字符串
   * @returns {Promise<void>}
   */
  updateContent: async (noteId: number, content: string | object) => {
    if (!content) throw new Error("content 不能为空");

    // 自动序列化JSON对象
    const contentString =
      typeof content === "object" ? JSON.stringify(content) : content;

    await noteContentDB.query(
      `INSERT INTO notes_content (note_id, content)
       VALUES (?, ?)
       ON CONFLICT(note_id) DO UPDATE SET content = excluded.content`,
      [noteId, contentString],
    );
  },

  /**
   * 获取笔记内容
   * @param {number} noteId - 笔记ID
   * @returns {Promise<string|null>} 内容HTML字符串
   */
  getContentByNoteId: async (noteId: number, parseJson = false) => {
    const result = await noteContentDB.query<{ content: string }[]>(
      "SELECT content FROM notes_content WHERE note_id = ?",
      [noteId],
    );

    const content = result[0]?.content || null;

    if (content && parseJson) {
      try {
        return JSON.parse(content);
      } catch (error) {
        console.warn("内容不是有效的JSON格式:", error);
        return content;
      }
    }

    console.log("getContentByNoteId", content);

    return content;
  },

  /**
   * 获取所有笔记内容
   * @returns {Promise<Array<NoteContent>>} 所有笔记内容数组
   */
  getAllContents: async () => {
    return noteContentDB.query<NoteContent[]>(
      "SELECT note_id, content FROM notes_content ORDER BY note_id",
    );
  },

  /**
   * 删除笔记内容
   * @param {number} noteId - 笔记ID
   */
  deleteContent: async (noteId: number) => {
    await noteContentDB.query("DELETE FROM notes_content WHERE note_id = ?", [
      noteId,
    ]);
  },

  /**
   * 检查是否存在内容记录
   * @param {number} noteId
   * @returns {Promise<boolean>}
   */
  exists: async (noteId: number) => {
    const result = await noteContentDB.query<{ "1": number }[]>(
      "SELECT 1 FROM notes_content WHERE note_id = ? LIMIT 1",
      [noteId],
    );
    return result.length > 0;
  },
};
