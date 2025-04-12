// src/renderer/api/tagsdb.js
export const tagsdb = {
  // ... 其他现有方法 ...
  query: (sql, params = []) => {
    return window.ipcRenderer.invoke("db:query", sql, params);
  },

  /**
   * 创建标签（处理闭包表）
   * @param {number} categoryId - 分类ID
   * @param {string} label - 标签名称
   * @param {number} [parentId=0] - 父标签ID，0表示顶级标签
   * @param {string} [icon="tag"] - 标签图标
   * @param {string} [color="#3498db"] - 标签颜色
   * @returns {Promise<number>} - 返回新创建的标签ID
   * @example
   * // 创建顶级标签
   * const newTagId = await tagsdb.createTag(1, "新标签");
   *
   * // 创建子标签
   * const childTagId = await tagsdb.createTag(1, "子标签", parentId);
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

    // 验证分类ID是否存在
    const categoryExists = await tagsdb.query(
      "SELECT 1 FROM categories WHERE id = ? LIMIT 1",
      [categoryIdNum],
    );

    if (categoryExists.length === 0) {
      throw new Error(`分类ID ${categoryIdNum} 不存在`);
    }

    // 如果有父标签，验证父标签是否存在且属于同一分类
    if (parentIdNum !== 0) {
      const parentExists = await tagsdb.query(
        "SELECT 1 FROM tags WHERE id = ? AND category_id = ? LIMIT 1",
        [parentIdNum, categoryIdNum],
      );

      if (parentExists.length === 0) {
        throw new Error(
          `父标签ID ${parentIdNum} 不存在或不属于分类 ${categoryIdNum}`,
        );
      }
    }

    // 获取同级标签中的最大排序值
    const [maxResult] = await tagsdb.query(
      `SELECT COALESCE(MAX(sort_order), 0) AS max_order
         FROM tags
         WHERE parent_id = ? AND category_id = ?`,
      [parentIdNum, categoryIdNum],
    );
    const newSortOrder = maxResult.max_order + 1;

    try {
      // 开始事务
      await tagsdb.query("BEGIN TRANSACTION");

      // 插入标签记录
      const insertResult = await tagsdb.query(
        `INSERT INTO tags (category_id, parent_id, label, icon, color, sort_order)
             VALUES (?, ?, ?, ?, ?, ?)`,
        [categoryIdNum, parentIdNum, label, icon, color, newSortOrder],
      );

      const newTagId = insertResult.lastInsertRowid;

      if (parentIdNum === 0) {
        // 无父标签，只需插入自身的闭包记录
        await tagsdb.query(
          `INSERT INTO tag_closure (ancestor, descendant, depth, category_id)
                 VALUES (?, ?, 0, ?)`,
          [newTagId, newTagId, categoryIdNum],
        );
      } else {
        // 有父标签，需要复制父标签的所有闭包记录
        await tagsdb.query(
          `INSERT INTO tag_closure (ancestor, descendant, depth, category_id)
                 SELECT ancestor, ?, depth + 1, ?
                 FROM tag_closure
                 WHERE descendant = ?`,
          [newTagId, categoryIdNum, parentIdNum],
        );

        // 添加自身的闭包记录
        await tagsdb.query(
          `INSERT INTO tag_closure (ancestor, descendant, depth, category_id)
                 VALUES (?, ?, 0, ?)`,
          [newTagId, newTagId, categoryIdNum],
        );
      }

      // 提交事务
      await tagsdb.query("COMMIT");
      return newTagId;
    } catch (err) {
      // 回滚事务
      await tagsdb.query("ROLLBACK");
      console.error("创建标签失败:", err);

      // 提供更详细的错误信息
      if (err.message.includes("FOREIGN KEY constraint failed")) {
        throw new Error(`外键约束失败: 分类ID ${categoryIdNum} 可能不存在`);
      } else if (err.message.includes("UNIQUE constraint failed")) {
        throw new Error(`唯一约束失败: 可能存在同名标签`);
      }

      throw err;
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
          [i, id, parentId],
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
