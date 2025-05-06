import { initDatabase } from "../init";

const db = initDatabase();

export const noteContentDB = {
  /**
   * 创建/更新笔记内容
   */
  updateContent: (noteId: number, content: string | object) => {
    if (!content) throw new Error("content 不能为空");
    const contentString =
      typeof content === "object" ? JSON.stringify(content) : content;
    db.prepare(
      `INSERT INTO notes_content (note_id, content)
       VALUES (?, ?)
       ON CONFLICT(note_id) DO UPDATE SET content = excluded.content`,
    ).run(noteId, contentString);
  },

  /**
   * 获取笔记内容
   */
  getContentByNoteId: (
    noteId: number,
    parseJson = false,
  ): string | object | null => {
    const row = db
      .prepare("SELECT content FROM notes_content WHERE note_id = ?")
      .get(noteId);
    const content = row?.content || null;
    if (content && parseJson) {
      try {
        return JSON.parse(content);
      } catch (error) {
        console.warn("内容不是有效的JSON格式:", error);
        return content;
      }
    }
    return content;
  },

  /**
   * 删除笔记内容
   */
  deleteContent: (noteId: number) => {
    db.prepare("DELETE FROM notes_content WHERE note_id = ?").run(noteId);
  },

  /**
   * 检查是否存在内容记录
   */
  exists: (noteId: number): boolean => {
    const row = db
      .prepare("SELECT 1 FROM notes_content WHERE note_id = ? LIMIT 1")
      .get(noteId);
    return !!row;
  },
};
