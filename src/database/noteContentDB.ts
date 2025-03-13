// src/renderer/api/tagsdb.js
export const noteContentDB = {
    // 复用通用查询方法
    query: (sql, params = []) => {
        return window.ipcRenderer.invoke('db:query', sql, params);
    },

    /**
     * 创建/更新笔记内容（使用 INSERT OR REPLACE 实现upsert）
     * @param {number} noteId - 关联的元数据ID
     * @param {string} content - HTML内容字符串
     * @returns {Promise<void>}
     */
    createOrUpdateContent: async (noteId, content) => {
        if (!noteId || !content) {
            throw new Error('必须提供 noteId 和 content');
        }

        await noteContentDB.query(
            `INSERT OR REPLACE INTO notes_content (note_id, content)
             VALUES (?, ?)`,
            [noteId, content]
        );
    },

    /**
     * 获取笔记内容
     * @param {number} noteId - 笔记ID
     * @returns {Promise<string|null>} 内容HTML字符串
     */
    getContentByNoteId: async (noteId) => {
        const result = await noteContentDB.query(
            'SELECT content FROM notes_content WHERE note_id = ?',
            [noteId]
        );
        return result[0]?.content || null;
    },

    /**
     * 智能更新笔记内容（自动处理存在性检查）
     * @param {number} noteId - 笔记ID
     * @param {string} content - 新的HTML内容
     */
    updateContent: async (noteId, content) => {
        if (!content) throw new Error('content 不能为空');

        // 使用 SQLite 的 ON CONFLICT 语法实现 upsert
        await noteContentDB.query(
            `INSERT INTO notes_content (note_id, content)
             VALUES (?, ?)
             ON CONFLICT(note_id) DO UPDATE SET content = excluded.content`,
            [noteId, content]
        );
    },
    /**
     * 删除笔记内容
     * @param {number} noteId - 笔记ID
     */
    deleteContent: async (noteId) => {
        await noteContentDB.query(
            'DELETE FROM notes_content WHERE note_id = ?',
            [noteId]
        );
    },

    /**
     * 检查是否存在内容记录
     * @param {number} noteId
     * @returns {Promise<boolean>}
     */
    exists: async (noteId) => {
        const result = await noteContentDB.query(
            'SELECT 1 FROM notes_content WHERE note_id = ? LIMIT 1',
            [noteId]
        );
        return result.length > 0;
    }
};
