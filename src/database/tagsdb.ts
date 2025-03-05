// src/renderer/api/tagsdb.js
export const tagsdb = {
    // ... 其他现有方法 ...
    query: (sql, params = []) => {
        return window.ipcRenderer.invoke('db:query', sql, params);
    },
    /**
     * 快速重新索引（仅影响必要节点）
     * @param {number} parentId 父级ID
     * @param {number} startOrder 起始排序值
     */
    async quickReindex(parentId, startOrder) {
        await this.query('BEGIN TRANSACTION');
        const BASE_GAP = 1000;

        try {
            // 获取需要重新排序的节点
            const nodes = await this.query(
                `SELECT id 
                 FROM tags 
                 WHERE parent_id = ? AND sort_order >= ?
                 ORDER BY sort_order ASC`,
                [parentId, startOrder]
            );

            // 批量更新排序值
            let currentOrder = startOrder + BASE_GAP;
            const updates = nodes.map(node => ({
                id: node.id,
                order: currentOrder += BASE_GAP
            }));

            await Promise.all(
                updates.map(item =>
                    this.query(
                        `UPDATE tags SET sort_order = ? WHERE id = ?`,
                        [item.order, item.id]
                    )
                )
            );

            await this.query('COMMIT');
        } catch (err) {
            await this.query('ROLLBACK');
            throw err;
        }
    },
    // 只传入parentID就代表是新增，插入到同数据parentID的最后面，就是同一个parentID的数据的最大的sort order的基础上+1000
    // 传入item.id就代表是拖拽排序：放到制定id后面，比如查询parentId9拖入itemlist，其中一个id11的item calculateSortOrder（9，11）
    //     有比同一个parentID里面比指定id更大的item，拿到更大的item的sort order-1作为插入的sort order
    //         如果更大item的sort order比指定id的sort order直接的间距小于10，那么重新排序，从新插入的数据开始（指定id之后），将新插入数据和后面的数据都基于指定id+1000递增
    //     没有比同一个parentID里面比指定id更大的item，就拿到指定id的sort order+1000作为插入的sort order
    async calculateSortOrder(parentId, siblingId = null) {
        const BASE_GAP = 1000;
        const SAFE_GAP = 50;

        // 场景1：直接插入到最后
        if (!siblingId) {
            const [maxResult] = await this.query(
                `SELECT COALESCE(MAX(sort_order), 0) + ${BASE_GAP} AS new_order 
         FROM tags 
         WHERE parent_id = ?`,
                [parentId]
            );
            return maxResult.new_order;
        }

        // 场景2：拖拽排序
        const [current] = await this.query(
            `SELECT sort_order FROM tags WHERE id = ?`,
            [siblingId]
        );

        if (!current) throw new Error('参考节点不存在');

        // 查找下一个相邻节点
        const [next] = await this.query(
            `SELECT MIN(sort_order) AS next_order 
           FROM tags 
           WHERE parent_id = ? AND sort_order > ?`,
            [parentId, current.sort_order]
        );

        let newOrder;
        if (next?.next_order) {
            // 存在后续节点
            const gap = next.next_order - current.sort_order;

            if (gap > SAFE_GAP) {
                newOrder = current.sort_order + Math.floor(gap / 2);
            } else {
                // 触发重新索引
                await this.quickReindex(parentId, current.sort_order);
                newOrder = current.sort_order + BASE_GAP;
            }
        } else {
            // 无后续节点
            newOrder = current.sort_order + BASE_GAP;
        }

        return newOrder;
    },
    // 创建标签（处理闭包表）
    // 修复后的创建标签方法
    createTag: async (categoryId, label, parentId = 0, icon = 'tag', color = '#3498db') => {
        const categoryIdNum = Number(categoryId);
        const parentIdNum = Number(parentId);
        const maxSort=await tagsdb.calculateSortOrder(parentId)
        if (parentIdNum === 0) {
            // 无父标签插入
            const insertResult = await tagsdb.query(
                `INSERT INTO tags (category_id, parent_id, label, icon, color,sort_order)
                 VALUES (?, ?, ?, ?, ?,?)`,
                [categoryIdNum, parentIdNum, label, icon, color, maxSort]
            );

            await tagsdb.query(
                `INSERT INTO tag_closure (ancestor, descendant, category_id)
                 VALUES (?, ?, ?)`,
                [insertResult.lastInsertRowid, insertResult.lastInsertRowid, categoryIdNum]
            );

            return insertResult.lastInsertRowid;
        } else {
            // 有父标签插入（使用显式事务控制）
            try {
                await tagsdb.query('BEGIN TRANSACTION');

                // 插入新标签
                const insertResult = await tagsdb.query(
                    `INSERT INTO tags (category_id, parent_id, label, icon, color,sort_order)
                     VALUES (?, ?, ?, ?, ?,?)`,
                    [categoryIdNum, parentIdNum, label, icon, color,maxSort]
                );
                const newTagId = insertResult.lastInsertRowid;

                // 继承父级关系
                await tagsdb.query(
                    `INSERT INTO tag_closure (ancestor, descendant, depth, category_id)
                     SELECT ancestor, ?, depth + 1, ?
                     FROM tag_closure
                     WHERE descendant = ?`,
                    [newTagId, categoryIdNum, parentIdNum]  // 正确参数顺序
                );
                // 添加自身关系
                await tagsdb.query(
                    `INSERT INTO tag_closure (ancestor, descendant, depth, category_id)
                     VALUES (?, ?, 0, ?)`,
                    [newTagId, newTagId, categoryIdNum]
                );

                await tagsdb.query('COMMIT');
                return newTagId;
            } catch (err) {
                await tagsdb.query('ROLLBACK');
                throw err;
            }
        }
    },

    // 根据ID获取标签
    getTagById: async (tagId) => {
        return tagsdb.query('SELECT * FROM tags WHERE category_id = ?', [tagId]);
    },

    // 更新标签信息（不处理parent_id变更）
    updateTag: async (tagId, updates) => {
        const validFields = ['label', 'icon', 'color', 'parent_id','sort_order'];
        const setClauses = [];
        const params = [];

        for (const [field, value] of Object.entries(updates)) {
            if (validFields.includes(field)) {
                setClauses.push(`${field} = ?`);
                params.push(value);
            }
        }

        if (setClauses.length === 0) {
            throw new Error('No valid fields to update');
        }

        params.push(tagId);
        const sql = `UPDATE tags
                     SET ${setClauses.join(', ')}
                     WHERE id = ?`;
        return tagsdb.query(sql, params);
    },

    // 删除标签（级联删除由外键处理）
    deleteTag: async (tagId) => {
        return tagsdb.query('DELETE FROM tags WHERE id = ?', [tagId]);
    },

    // 获取分类下的所有标签（平铺结构）
    getTagsByCategory: async (categoryId) => {
        return tagsdb.query(`
            SELECT t.*, tc.depth
            FROM tags t
                     JOIN tag_closure tc ON t.id = tc.descendant
            WHERE t.category_id = ?
            GROUP BY t.id
            ORDER BY tc.depth, t.name
        `, [categoryId]);
    },

    // 获取分类下的标签树形结构
    getTagTree: async (categoryId) => {
        const rows = await tagsdb.query(`
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
        `, [categoryId, categoryId]);

        // 构建树形结构
        const map = new Map();
        const tree = [];

        rows.forEach(row => {
            map.set(row.id, {...row, children: []});
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
