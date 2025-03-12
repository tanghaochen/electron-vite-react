// src/renderer/api/tagsdb.js
export const tagsdb = {
  // ... 其他现有方法 ...
  query: (sql, params = []) => {
    return window.ipcRenderer.invoke("db:query", sql, params);
  },

  /**
   * 创建标签（处理闭包表）
   */
  createTag: async (
      categoryId,
      label,
      parentId = 0,
      icon = "tag",
      color = "#3498db",
  ) => {
    const categoryIdNum = Number(categoryId);
    const parentIdNum = Number(parentId);

    // 修复点1：使用 tagsdb.query 替代 this.query
    const [maxResult] = await tagsdb.query(
        `SELECT COALESCE(MAX(sort_order), 0) AS max_order
         FROM tags
         WHERE parent_id = ?`,
        [parentIdNum]
    );
    const newSortOrder = maxResult.max_order + 1;

    if (parentIdNum === 0) {
      // 无父标签插入
      const insertResult = await tagsdb.query( // 修复点2：统一使用 tagsdb.query
          `INSERT INTO tags (category_id, parent_id, label, icon, color, sort_order)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [categoryIdNum, parentIdNum, label, icon, color, newSortOrder],
      );

      await tagsdb.query( // 修复点3：保持统一调用方式
          `INSERT INTO tag_closure (ancestor, descendant, category_id)
           VALUES (?, ?, ?)`,
          [insertResult.lastInsertRowid, insertResult.lastInsertRowid, categoryIdNum],
      );

      return insertResult.lastInsertRowid;
    } else {
      // 有父标签插入（使用显式事务控制）
      try {
        await tagsdb.query("BEGIN TRANSACTION");

        const insertResult = await tagsdb.query(
            `INSERT INTO tags (category_id, parent_id, label, icon, color, sort_order)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [categoryIdNum, parentIdNum, label, icon, color, newSortOrder],
        );
        const newTagId = insertResult.lastInsertRowid;

        await tagsdb.query(
            `INSERT INTO tag_closure (ancestor, descendant, depth, category_id)
             SELECT ancestor, ?, depth + 1, ?
             FROM tag_closure
             WHERE descendant = ?`,
            [newTagId, categoryIdNum, parentIdNum],
        );

        await tagsdb.query(
            `INSERT INTO tag_closure (ancestor, descendant, depth, category_id)
             VALUES (?, ?, 0, ?)`,
            [newTagId, newTagId, categoryIdNum],
        );

        await tagsdb.query("COMMIT");
        return newTagId;
      } catch (err) {
        await tagsdb.query("ROLLBACK");
        throw err;
      }
    }
  },
  /**
   * 批量更新排序序号
   * @param {number} parentId 父节点ID
   * @param {number[]} orderedIds 排序后的子节点ID数组
   */
  async updateSortOrders(parentId, orderedIds) {
    await this.query("BEGIN TRANSACTION");
    try {
      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i];
        await this.query(
            "UPDATE tags SET sort_order = ? WHERE id = ? AND parent_id = ?",
            [i, id, parentId]
        );
      }
      await this.query("COMMIT");
    } catch (err) {
      await this.query("ROLLBACK");
      throw err;
    }
  },
  // 根据ID获取标签
  getTagById: async (tagId) => {
    return tagsdb.query("SELECT * FROM tags WHERE category_id = ?", [tagId]);
  },

  // 更新标签信息（不处理parent_id变更）
  updateTag: async (tagId, updates) => {
    const validFields = ["label", "icon", "color", "parent_id", "sort_order"];
    const setClauses = [];
    const params = [];

    for (const [field, value] of Object.entries(updates)) {
      if (validFields.includes(field)) {
        setClauses.push(`${field} = ?`);
        params.push(value);
      }
    }

    if (setClauses.length === 0) {
      throw new Error("No valid fields to update");
    }

    params.push(tagId);
    const sql = `UPDATE tags
                     SET ${setClauses.join(", ")}
                     WHERE id = ?`;
    return tagsdb.query(sql, params);
  },

  // 删除标签（级联删除由外键处理）
  deleteTag: async (tagId) => {
    return tagsdb.query("DELETE FROM tags WHERE id = ?", [tagId]);
  },

  // 获取分类下的所有标签（平铺结构）
  getTagsByCategory: async (categoryId) => {
    return tagsdb.query(
      `
            SELECT t.*, tc.depth
            FROM tags t
                     JOIN tag_closure tc ON t.id = tc.descendant
            WHERE t.category_id = ?
            GROUP BY t.id
            ORDER BY tc.depth, t.name
        `,
      [categoryId],
    );
  },

  // 获取分类下的标签树形结构
  getTagTree: async (categoryId) => {
    const rows = await tagsdb.query(
      `
            WITH RECURSIVE tag_hierarchy AS (SELECT t.id,
                                                    t.name,
                                                    t.parent_id,
                                                    0    AS level,
                                                    t.id AS root_id
                                             FROM tags t
                                             WHERE t.parent_id = 0
                                               AND t.category_id = ?

                                             UNION ALL

                                             SELECT child.id,
                                                    child.name,
                                                    child.parent_id,
                                                    parent.level + 1 AS level,
                                                    parent.root_id
                                             FROM tags child
                                                      JOIN tag_hierarchy parent
                                                           ON child.parent_id = parent.id
                                             WHERE child.category_id = ?)
            SELECT *
            FROM tag_hierarchy
            ORDER BY root_id, level, name;
        `,
      [categoryId, categoryId],
    );

    // 构建树形结构
    const map = new Map();
    const tree = [];

    rows.forEach((row) => {
      map.set(row.id, { ...row, children: [] });
      if (row.parent_id === 0) {
        tree.push(map.get(row.id));
      } else {
        const parent = map.get(row.parent_id);
        if (parent) {
          parent.children.push(map.get(row.id));
        }
      }
    });

    return tree;
  },
};
