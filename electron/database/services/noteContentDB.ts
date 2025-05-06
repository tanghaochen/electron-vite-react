import { initDatabase } from "../init";

const db = initDatabase();

export const noteContentDB = {
  /**
   * ����/���±ʼ�����
   */
  updateContent: (noteId: number, content: string | object) => {
    if (!content) throw new Error("content ����Ϊ��");
    const contentString =
      typeof content === "object" ? JSON.stringify(content) : content;
    db.prepare(
      `INSERT INTO notes_content (note_id, content)
       VALUES (?, ?)
       ON CONFLICT(note_id) DO UPDATE SET content = excluded.content`,
    ).run(noteId, contentString);
  },

  /**
   * ��ȡ�ʼ�����
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
        console.warn("���ݲ�����Ч��JSON��ʽ:", error);
        return content;
      }
    }
    return content;
  },

  /**
   * ɾ���ʼ�����
   */
  deleteContent: (noteId: number) => {
    db.prepare("DELETE FROM notes_content WHERE note_id = ?").run(noteId);
  },

  /**
   * ����Ƿ�������ݼ�¼
   */
  exists: (noteId: number): boolean => {
    const row = db
      .prepare("SELECT 1 FROM notes_content WHERE note_id = ? LIMIT 1")
      .get(noteId);
    return !!row;
  },
};
