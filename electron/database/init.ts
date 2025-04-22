/**
 * 数据库初始化模块
 * 负责创建和管理SQLite数据库，包括：
 * 1. 数据库文件创建和连接
 * 2. 数据库表结构迁移
 * 3. 表结构验证
 * 4. 数据库调试功能
 */

// 导入必要的模块
import path from "path";
import { app } from "electron";
import Database from "better-sqlite3";
import fs from "fs";

// 确保testdata目录存在
// 这个目录用于存储数据库文件
const testDataPath = path.resolve("testdata");
if (!fs.existsSync(testDataPath)) {
  fs.mkdirSync(testDataPath, { recursive: true });
}

// 定义数据库文件路径
const dbPath = path.join(testDataPath, "notes.db");

// 全局数据库实例变量
let dbInstance: Database.Database | null = null;

/**
 * 迁移脚本类型定义
 * 每个迁移脚本包含：
 * - version: 版本号
 * - up: 升级函数，执行数据库结构变更
 * - down: 降级函数，用于回滚变更（可选）
 */
interface Migration {
  version: number;
  up: (db: Database.Database) => void;
  down?: (db: Database.Database) => void;
}

/**
 * 数据库迁移脚本列表
 * 每个版本对应一个迁移脚本，按版本号顺序执行
 */
const migrations: Migration[] = [
  {
    version: 1,
    up: (db) => {
      // 初始版本的表结构
      // 创建所有基础表
      db.exec(`
        // 版本控制表，记录当前数据库版本
        CREATE TABLE schema_version (
          version INTEGER PRIMARY KEY
        );

        // 分类表，用于管理笔记分类
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

        // 用户偏好设置表
        CREATE TABLE user_preferences (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id    TEXT NOT NULL DEFAULT '',
          settings_json TEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        // 标签表，用于管理笔记标签
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

        // 标签层级关系表，用于实现标签的树形结构
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

        // 笔记元数据表，存储笔记的基本信息
        CREATE TABLE notes_metadata (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          tags_id    INTEGER NOT NULL DEFAULT 0,
          title      TEXT NOT NULL DEFAULT '',
          sort_order INTEGER DEFAULT 0,
          icon       TEXT NOT NULL DEFAULT '',
          img        TEXT NOT NULL DEFAULT '',
          desc       TEXT NOT NULL DEFAULT '',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_pinned  BOOLEAN DEFAULT 0
        );

        // 笔记内容表，存储笔记的具体内容
        CREATE TABLE notes_content (
          note_id    INTEGER PRIMARY KEY,
          content    TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (note_id) REFERENCES notes_metadata(id)
        );

        // 笔记-标签关联表，实现笔记和标签的多对多关系
        CREATE TABLE note_tags (
          note_id INTEGER NOT NULL,
          tag_id  INTEGER NOT NULL,
          PRIMARY KEY (note_id, tag_id),
          FOREIGN KEY (note_id) REFERENCES notes_metadata(id) ON DELETE CASCADE,
          FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        );

        // 全文搜索表，用于实现笔记的全文搜索功能
        CREATE VIRTUAL TABLE notes_fts USING fts5(
          title,
          content,
          content_rowid='note_id'
        );

        // 初始化版本号
        INSERT INTO schema_version (version) VALUES (1);
      `);
    },
  },
  {
    version: 2,
    up: (db) => {
      // 示例：添加新字段
      db.exec(`
        -- 第一步：添加不带默认值的列
        ALTER TABLE notes_metadata ADD COLUMN is_archived BOOLEAN;
        ALTER TABLE notes_metadata ADD COLUMN last_viewed_at DATETIME;
        
        -- 第二步：更新所有现有记录
        UPDATE notes_metadata SET is_archived = 0 WHERE is_archived IS NULL;
        UPDATE notes_metadata SET last_viewed_at = datetime('now') WHERE last_viewed_at IS NULL;
      `);
    },
    down: (db) => {
      // 回滚操作
      db.exec(`
        CREATE TABLE notes_metadata_backup AS SELECT id, tags_id, title, sort_order, icon, img, desc, created_at, updated_at, is_pinned FROM notes_metadata;
        DROP TABLE notes_metadata;
        ALTER TABLE notes_metadata_backup RENAME TO notes_metadata;
      `);
    },
  },
  {
    version: 3,
    up: (db) => {
      // 添加notes_content表的updated_at字段
      db.exec(`
        -- 第一步：添加不带默认值的列
        ALTER TABLE notes_content ADD COLUMN updated_at DATETIME;
        
        -- 第二步：更新所有现有记录的updated_at为当前时间
        UPDATE notes_content SET updated_at = datetime('now') WHERE updated_at IS NULL;
      `);
    },
    down: (db) => {
      // 回滚操作：创建临时表，复制数据，删除原表，重命名临时表
      db.exec(`
        CREATE TABLE notes_content_backup AS 
          SELECT note_id, content 
          FROM notes_content;
        DROP TABLE notes_content;
        CREATE TABLE notes_content (
          note_id INTEGER PRIMARY KEY,
          content TEXT NOT NULL,
          FOREIGN KEY (note_id) REFERENCES notes_metadata(id)
        );
        INSERT INTO notes_content (note_id, content)
          SELECT note_id, content FROM notes_content_backup;
        DROP TABLE notes_content_backup;
      `);
    },
  },
];

/**
 * 初始化数据库
 * 1. 创建数据库连接
 * 2. 配置数据库参数
 * 3. 执行迁移脚本
 * 4. 验证表结构
 * @returns {Database.Database} 数据库实例
 */
export function initDatabase() {
  // 如果数据库已经初始化，直接返回实例
  if (dbInstance) return dbInstance;

  console.log("数据库路径:", dbPath);

  // 创建数据库连接
  dbInstance = new Database(dbPath, {
    verbose: process.env.NODE_ENV === "development" ? console.log : null,
  });

  try {
    // 配置数据库参数
    dbInstance.pragma("journal_mode = WAL"); // 使用WAL模式提高并发性能
    dbInstance.pragma("foreign_keys = ON"); // 启用外键约束
    dbInstance.pragma("busy_timeout = 5000"); // 设置超时时间

    // 执行迁移脚本
    executeMigrations();

    // 验证表结构
    verifyTables();

    return dbInstance;
  } catch (err) {
    console.error("数据库初始化失败:", err);
    if (dbInstance) dbInstance.close();
    dbInstance = null;
    throw err;
  }
}

/**
 * 执行数据库迁移
 * 1. 检查当前数据库版本
 * 2. 执行未应用的迁移脚本
 */
function executeMigrations() {
  dbInstance.transaction(() => {
    // 检查是否存在版本表
    const hasSchemaVersion = dbInstance
      .prepare(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_version'",
      )
      .pluck()
      .get();

    if (!hasSchemaVersion) {
      // 如果是新数据库，执行初始迁移
      migrations[0].up(dbInstance);
    } else {
      // 获取当前版本号
      const currentVersion = dbInstance
        .prepare("SELECT version FROM schema_version")
        .pluck()
        .get() as number;

      // 找出需要执行的迁移脚本
      const pendingMigrations = migrations.filter(
        (m) => m.version > currentVersion,
      );

      // 按顺序执行迁移
      for (const migration of pendingMigrations) {
        console.log(`执行迁移到版本 ${migration.version}...`);
        migration.up(dbInstance);

        // 更新版本号
        dbInstance
          .prepare("UPDATE schema_version SET version = ?")
          .run(migration.version);
      }
    }
  })();
}

/**
 * 验证数据库表结构
 * 检查所有必需的表是否都存在
 */
function verifyTables() {
  console.log("验证表结构...");

  // 获取所有表名
  const tables = dbInstance
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all()
    .map((t) => t.name);

  // 定义必需的表
  const requiredTables = [
    "schema_version",
    "tags",
    "tag_closure",
    "notes_metadata",
    "notes_content",
    "note_tags",
    "notes_fts",
  ];

  // 检查每个必需的表是否存在
  requiredTables.forEach((table) => {
    if (!tables.includes(table)) {
      throw new Error(`缺失关键表: ${table}`);
    }
  });

  console.log("表结构验证通过，发现以下表:", tables);
}

/**
 * 调试函数：打印数据库信息
 * 用于开发调试，显示数据库的基本信息和表结构
 */
export function debugDatabase() {
  if (!dbInstance) return;

  console.log("--- 数据库调试信息 ---");
  console.log("路径:", dbPath);
  console.log(
    "版本:",
    dbInstance.prepare("SELECT sqlite_version()").pluck().get(),
  );

  // 获取并打印所有表名
  const tables = dbInstance
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all();

  console.log(
    "所有表:",
    tables.map((t) => t.name),
  );

  // 打印每个表的结构
  tables.forEach((table) => {
    const columns = dbInstance
      .prepare(`PRAGMA table_info(${table.name})`)
      .all();
    console.log(`\n表结构 ${table.name}:`, columns);
  });
}
