/**
 * 迁移脚本类型定义
 * 每个迁移脚本包含：
 * - version: 版本号
 * - up: 升级函数，执行数据库结构变更
 * - down: 降级函数，用于回滚变更（可选）
 */
import Database from "better-sqlite3";

interface Migration {
  version: number;
  up: (db: Database.Database) => void;
  down?: (db: Database.Database) => void;
}

/**
 * 数据库迁移脚本列表
 * 每个版本对应一个迁移脚本，按版本号顺序执行
 * Q: 如何新增一个迁移脚本？
 * 1. 需要新建一条version数据， 而不是在已有数据上修改
 */
export const migrations: Migration[] = [
  {
    version: 1,
    up: (db) => {
      // 初始版本的表结构
      // 创建所有基础表
      db.exec(`
        -- 版本控制表，记录当前数据库版本
        CREATE TABLE schema_version (
          version INTEGER PRIMARY KEY
        );

        -- 分类表，用于管理笔记分类
        CREATE TABLE categories (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          uuid       TEXT NOT NULL UNIQUE DEFAULT (LOWER(HEX(RANDOMBLOB(16)))),
          name       TEXT NOT NULL UNIQUE,
          icon       TEXT NOT NULL DEFAULT 'folder',
          sort_order INTEGER DEFAULT 0,
          color      TEXT DEFAULT '#3498db',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- 用户偏好设置表
        CREATE TABLE user_preferences (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id    TEXT NOT NULL DEFAULT '',
          settings_json TEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 标签表，用于管理笔记标签
        CREATE TABLE tags (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          uuid        TEXT NOT NULL UNIQUE DEFAULT (LOWER(HEX(RANDOMBLOB(16)))),
          category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
          parent_id   INTEGER DEFAULT 0,
          name        TEXT NOT NULL DEFAULT '',
          label       TEXT NOT NULL DEFAULT '',
          icon        TEXT NOT NULL DEFAULT 'tag',
          color       TEXT DEFAULT '#3498db',
          lft         INTEGER DEFAULT 0,
          rgt         INTEGER DEFAULT 0,
          sort_order  INTEGER DEFAULT 0,
          created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- 标签层级关系表，用于实现标签的树形结构
        CREATE TABLE tag_closure (
          ancestor    INTEGER NOT NULL,
          descendant  INTEGER NOT NULL,
          depth       INTEGER NOT NULL DEFAULT 0,
          category_id INTEGER NOT NULL,
          PRIMARY KEY (ancestor, descendant),
          FOREIGN KEY (ancestor) REFERENCES tags(id) ON DELETE CASCADE,
          FOREIGN KEY (descendant) REFERENCES tags(id) ON DELETE CASCADE,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
        );

        -- 笔记元数据表，存储笔记的基本信息
        CREATE TABLE notes_metadata (
          id             INTEGER PRIMARY KEY AUTOINCREMENT,
          tags_id        INTEGER NOT NULL DEFAULT 0,
          title          TEXT NOT NULL DEFAULT '',
          sort_order     INTEGER DEFAULT 0,
          icon           TEXT NOT NULL DEFAULT '',
          img            TEXT NOT NULL DEFAULT '',
          desc           TEXT NOT NULL DEFAULT '',
          created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_pinned      BOOLEAN DEFAULT 0,
          is_archived    BOOLEAN DEFAULT 0,
          last_viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- 笔记内容表，存储笔记的具体内容
        CREATE TABLE notes_content (
          note_id    INTEGER PRIMARY KEY,
          content    TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (note_id) REFERENCES notes_metadata(id)
        );

        -- 笔记-标签关联表，实现笔记和标签的多对多关系
        CREATE TABLE note_tags (
          note_id INTEGER NOT NULL,
          tag_id  INTEGER NOT NULL,
          PRIMARY KEY (note_id, tag_id),
          FOREIGN KEY (note_id) REFERENCES notes_metadata(id) ON DELETE CASCADE,
          FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        );

        -- 全文搜索表，用于实现笔记的全文搜索功能
        CREATE VIRTUAL TABLE notes_fts USING fts5(
          title,
          content,
          content_rowid='note_id'
        );

        -- 初始化版本号
        INSERT INTO schema_version (version) VALUES (1);

        -- 添加默认分类
        INSERT INTO categories (id, name, icon, color) 
        VALUES (1, '默认分类', 'folder', '#3498db');
      `);
    },
  },
];
