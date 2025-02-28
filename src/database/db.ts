// src/renderer/api/db.js
export const db = {
    // 通用查询方法（支持事务）
    query: (sql, params = []) => {
        return window.ipcRenderer.invoke('db:query', sql, params);
    },

    // 创建笔记（事务版）
    createNote: async (title, content) => {
        return db.query(`
      BEGIN TRANSACTION;
      INSERT INTO notes_metadata (title) VALUES (?);
      INSERT INTO notes_content (note_id, content) 
      VALUES (last_insert_rowid(), ?);
      COMMIT;
    `, [title, content]);
    },

    // 渲染进程中的db.createNoteSafe方法
    createNoteSafe: async (title, content) => {
        const metaResult = await db.query(
            'INSERT INTO notes_metadata (title) VALUES (?) RETURNING id',
            [title]
        );
        // metaResult 现在是数组，例如 [{ id: 123 }]
        const noteId = metaResult[0].id;

        await db.query(
            'INSERT INTO notes_content (note_id, content) VALUES (?, ?)',
            [noteId, content]
        );
        return noteId;
    }

};
