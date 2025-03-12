// src/renderer/api/tagsdb.js
export const worksListDB = {
    // ... 原有 query 方法和其他工具方法 ...
    query: (sql, params = []) => {
        return window.ipcRenderer.invoke('db:query', sql, params);
    },

    /* 闭包表专用方法 */

    /**
     * 添加闭包关系（创建新节点时使用）
     * @param {number} newId 新节点ID
     * @param {number} parentId 父节点ID (0表示根节点)
     * @param {number} categoryId 分类ID
     */
    async addNewWork(newId, parentId, categoryId) {
        try {
            await this.query("BEGIN TRANSACTION");

            // 插入自身关系 (depth=0)
            await this.query(
                `INSERT INTO tag_closure 
         (ancestor, descendant, depth, category_id)
         VALUES (?, ?, 0, ?)`,
                [newId, newId, categoryId]
            );

            if (parentId !== 0) {
                // 继承父级关系 (depth+1)
                await this.query(
                    `INSERT INTO tag_closure (ancestor, descendant, depth, category_id)
           SELECT ancestor, ?, depth + 1, ?
           FROM tag_closure
           WHERE descendant = ?`,
                    [newId, categoryId, parentId]
                );
            }

            await this.query("COMMIT");
        } catch (err) {
            await this.query("ROLLBACK");
            throw err;
        }
    },

    /**
     * 删除节点的所有闭包关系
     * @param {number} tagId 要删除的节点ID
     */
    async deleteClosureRelations(tagId) {
        return this.query(
            `DELETE FROM tag_closure 
       WHERE descendant = ? OR ancestor = ?`,
            [tagId, tagId]
        );
    },

    /**
     * 获取节点的所有祖先（包含自身）
     * @param {number} tagId 目标节点ID
     * @returns {Promise<Array<{ancestor: number, depth: number}>>}
     */
    async getAncestors(tagId) {
        return this.query(
            `SELECT ancestor, depth 
       FROM tag_closure
       WHERE descendant = ?
       ORDER BY depth DESC`,
            [tagId]
        );
    },

    /**
     * 获取节点的所有后代（包含自身）
     * @param {number} tagId 目标节点ID
     * @returns {Promise<Array<{descendant: number, depth: number}>>}
     */
    async getDescendants(tagId) {
        return this.query(
            `SELECT descendant, depth 
       FROM tag_closure
       WHERE ancestor = ?
       ORDER BY depth ASC`,
            [tagId]
        );
    },

    /**
     * 检查两个节点是否存在祖先-后代关系
     * @param {number} ancestorId 祖先ID
     * @param {number} descendantId 后代ID
     * @returns {Promise<boolean>}
     */
    async checkRelationship(ancestorId, descendantId) {
        const result = await this.query(
            `SELECT 1 FROM tag_closure
       WHERE ancestor = ? AND descendant = ?
       LIMIT 1`,
            [ancestorId, descendantId]
        );
        return result.length > 0;
    },

    /**
     * 移动节点到新父节点
     * @param {number} tagId 要移动的节点ID
     * @param {number} newParentId 新父节点ID (0表示根节点)
     */
    async moveTag(tagId, newParentId) {
        try {
            await this.query("BEGIN TRANSACTION");

            // 删除旧关系（保留自身关系）
            await this.query(
                `DELETE FROM tag_closure
         WHERE descendant IN (
           SELECT descendant FROM tag_closure WHERE ancestor = ?
         )
         AND ancestor IN (
           SELECT ancestor FROM tag_closure WHERE descendant = ? AND ancestor != descendant
         )`,
                [tagId, tagId]
            );

            if (newParentId !== 0) {
                // 插入新关系
                await this.query(
                    `INSERT INTO tag_closure (ancestor, descendant, depth, category_id)
           SELECT super.ancestor, sub.descendant, super.depth + sub.depth + 1, sub.category_id
           FROM tag_closure AS super
           CROSS JOIN tag_closure AS sub
           WHERE super.descendant = ?
             AND sub.ancestor = ?`,
                    [newParentId, tagId]
                );
            }

            await this.query("COMMIT");
        } catch (err) {
            await this.query("ROLLBACK");
            throw err;
        }
    }
};
