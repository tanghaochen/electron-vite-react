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
import { migrations } from "./migrations/index";
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
