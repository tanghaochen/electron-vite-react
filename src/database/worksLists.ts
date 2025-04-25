// src/renderer/api/tagsdb.js
export const worksListDB = {
  // 通用查询方法
  query: (sql, params = []) => {
    return window.ipcRenderer.invoke("db:query", sql, params);
  },

  /**
   * 创建元数据
   * @param {Object} data - 字段数据 {title, index, icon, img, desc, is_pinned}
   * @returns {Promise<number>} 新插入记录的ID
   */
  createMetadata: async (data) => {
    const validColumns = ["title", "index", "icon", "img", "desc", "tags_id"];
    const filteredData = Object.entries(data)
      .filter(([key]) => validColumns.includes(key))
      .reduce((acc, [key, value]) => {
        const dbKey = key === "index" ? "sort_order" : key; // 关键映射
        acc[key] = value;
        return acc;
      }, {});

    if (Object.keys(filteredData).length === 0) {
      throw new Error("必须提供至少一个有效字段");
    }

    const columns = Object.keys(filteredData).join(", ");
    const placeholders = Object.keys(filteredData)
      .map(() => "?")
      .join(", ");

    // 修改点：移除 RETURNING 子句
    const result = await worksListDB.query(
      `INSERT INTO notes_metadata (${columns}) VALUES (${placeholders})`,
      Object.values(filteredData),
    );

    // 修改点：通过lastInsertRowid获取ID
    return {
      id: result.lastInsertRowid,
      ...filteredData, // 携带其他字段
    };
  },

  /**
   * 通过ID获取元数据
   * @param {number} id - 记录ID
   * @returns {Promise<Object|null>} 元数据对象
   */
  getMetadataByTagId: async (tagID) => {
    const result = await worksListDB.query(
      "SELECT * FROM notes_metadata WHERE tags_id = ?",
      [tagID],
    );
    return result || [];
  },

  /**
   * 获取所有元数据（按创建时间倒序）
   * @returns {Promise<Array>} 元数据数组
   */
  getAllMetadata: async () => {
    return worksListDB.query(`
      SELECT *, 
        datetime(created_at, 'localtime') as formatted_created,
        datetime(updated_at, 'localtime') as formatted_updated
      FROM notes_metadata 
      ORDER BY is_pinned DESC, created_at DESC
    `);
  },

  /**
   * 更新元数据
   * @param {number} id - 记录ID
   * @param {Object} data - 要更新的字段
   */
  updateMetadata: async (id, data) => {
    const validColumns = [
      "title",
      "tags_id",
      "icon",
      "img",
      "desc",
      "sort_order",
    ];
    const filteredData = Object.entries(data)
      .filter(([key]) => validColumns.includes(key))
      .reduce((acc, [key, value]) => {
        // 处理布尔值转换
        acc[key] = typeof value === "boolean" ? (value ? 1 : 0) : value;
        return acc;
      }, {});

    if (Object.keys(filteredData).length === 0) {
      throw new Error("必须提供至少一个有效字段");
    }

    const setClause = Object.keys(filteredData)
      .map((key) => `${key} = ?`)
      .join(", ");

    await worksListDB.query(
      `UPDATE notes_metadata 
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [...Object.values(filteredData), id],
    );
  },

  /**
   * 删除元数据
   * @param {number} id - 记录ID
   */
  deleteMetadata: async (id) => {
    await worksListDB.query("DELETE FROM notes_metadata WHERE id = ?", [id]);
  },

  /**
   * 切换置顶状态
   * @param {number} id - 记录ID
   * @param {boolean} isPinned - 新的置顶状态
   */
  togglePin: async (id, isPinned) => {
    await worksListDB.query(
      "UPDATE notes_metadata SET is_pinned = ? WHERE id = ?",
      [isPinned ? 1 : 0, id],
    );
  },

  /**
   * 搜索元数据（标题和描述）
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<Array>} 搜索结果
   */
  searchMetadata: async (keyword) => {
    return worksListDB.query(
      `
      SELECT * FROM notes_metadata 
      WHERE title LIKE ? OR desc LIKE ?
      ORDER BY created_at DESC`,
      [`%${keyword}%`, `%${keyword}%`],
    );
  },
};
