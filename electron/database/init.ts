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
import Database, { Database as DatabaseType } from "./fix-imports.js";
import fs from "fs";
import { migrations } from "./migrations/index";
import crypto from "crypto";
import { createGzip } from "zlib";
import { pipeline } from "stream/promises";

// 根据环境确定数据库存储路径
const getDatabasePath = () => {
  if (process.env.NODE_ENV === "development") {
    // 开发环境：使用项目根目录下的 testdata
    return path.resolve("testdata");
  } else {
    // 生产环境：使用系统文档目录
    const appName = "CPNotes"; // 您的应用名称
    const userDataPath = path.join(app.getPath("documents"), appName);
    return userDataPath;
  }
};

// 确保数据库目录存在
const testDataPath = getDatabasePath();
if (!fs.existsSync(testDataPath)) {
  fs.mkdirSync(testDataPath, { recursive: true });
}

// 确保backups目录存在
const backupPath = path.join(testDataPath, "backups");
if (!fs.existsSync(backupPath)) {
  fs.mkdirSync(backupPath, { recursive: true });
}

// 备份配置
const BACKUP_CONFIG = {
  maxBackups: 30, // 保留30天的备份
  encryptionKey:
    process.env.DB_BACKUP_KEY || crypto.randomBytes(32).toString("hex"),
  compressionLevel: 9, // 最高压缩级别
  backupInterval: 24 * 60 * 60 * 1000, // 24小时
  integrityCheck: true, // 启用完整性检查
};

// 定义数据库文件路径
const dbPath = path.join(testDataPath, "notes.db");

// 全局数据库实例变量
let dbInstance: ReturnType<typeof Database> | null = null;

/**
 * 创建加密的数据库备份
 * @param {string} backupName - 备份文件名（可选）
 * @returns {Promise<string>} 备份文件路径
 */
export async function createBackup(backupName?: string): Promise<string> {
  if (!dbInstance) {
    throw new Error("数据库未初始化");
  }

  // 确保数据库已保存所有更改
  dbInstance.prepare("PRAGMA wal_checkpoint(FULL)").run();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFileName = backupName
    ? `${backupName}.db.gz.enc`
    : `backup-${timestamp}.db.gz.enc`;

  const backupFilePath = path.join(backupPath, backupFileName);

  // 创建加密和压缩流
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    Buffer.from(BACKUP_CONFIG.encryptionKey, "hex"),
    iv,
  );
  const gzip = createGzip({ level: BACKUP_CONFIG.compressionLevel });

  // 写入IV到文件头部
  await fs.promises.writeFile(backupFilePath, iv);

  // 创建备份流
  const readStream = fs.createReadStream(dbPath);
  const writeStream = fs.createWriteStream(backupFilePath, { flags: "a" });

  // 执行加密和压缩
  await pipeline(readStream, gzip, cipher, writeStream);

  // 验证备份完整性
  if (BACKUP_CONFIG.integrityCheck) {
    await verifyBackupIntegrity(backupFilePath);
  }

  console.log(`数据库备份已创建: ${backupFilePath}`);
  return backupFilePath;
}

/**
 * 验证备份文件完整性
 * @param {string} backupFilePath - 备份文件路径
 */
async function verifyBackupIntegrity(backupFilePath: string): Promise<void> {
  try {
    // 读取前16字节作为IV
    const buffer = await fs.promises.readFile(backupFilePath);
    const iv = buffer.subarray(0, 16);
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      Buffer.from(BACKUP_CONFIG.encryptionKey, "hex"),
      iv,
    );
    const gzip = createGzip();

    const tempPath = backupFilePath + ".temp";
    const readStream = fs.createReadStream(backupFilePath, { start: 16 });
    const writeStream = fs.createWriteStream(tempPath);

    await pipeline(readStream, decipher, gzip, writeStream);

    // 验证SQLite数据库完整性
    const tempDb = new Database(tempPath);
    const integrityCheck = tempDb
      .prepare("PRAGMA integrity_check")
      .pluck()
      .get();
    tempDb.close();

    if (integrityCheck !== "ok") {
      throw new Error(`备份完整性检查失败: ${integrityCheck}`);
    }

    await fs.promises.unlink(tempPath);
  } catch (error) {
    console.error("备份验证失败:", error);
    throw error;
  }
}

/**
 * 从加密备份恢复数据库
 * @param {string} backupFilePath - 备份文件路径
 */
export async function restoreFromBackup(backupFilePath: string): Promise<void> {
  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`备份文件不存在: ${backupFilePath}`);
  }

  // 关闭当前数据库连接
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }

  // 读取IV
  const buffer = await fs.promises.readFile(backupFilePath);
  const iv = buffer.subarray(0, 16);
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(BACKUP_CONFIG.encryptionKey, "hex"),
    iv,
  );
  const gzip = createGzip();

  // 创建临时文件
  const tempPath = dbPath + ".temp";
  const readStream = fs.createReadStream(backupFilePath, { start: 16 });
  const writeStream = fs.createWriteStream(tempPath);

  // 解密和解压
  await pipeline(readStream, decipher, gzip, writeStream);

  // 验证恢复的数据库完整性
  const tempDb = new Database(tempPath);
  const integrityCheck = tempDb.prepare("PRAGMA integrity_check").pluck().get();
  tempDb.close();

  if (integrityCheck !== "ok") {
    throw new Error(`恢复的数据库完整性检查失败: ${integrityCheck}`);
  }

  // 替换原数据库文件
  await fs.promises.rename(tempPath, dbPath);

  console.log(`数据库已从备份恢复: ${backupFilePath}`);

  // 重新初始化数据库
  initDatabase();
}

/**
 * 清理旧备份
 * @param {number} maxBackups - 保留的最大备份数量
 */
export function cleanupOldBackups(
  maxBackups: number = BACKUP_CONFIG.maxBackups,
): void {
  const backups = fs
    .readdirSync(backupPath)
    .filter((file) => file.endsWith(".db.gz.enc"))
    .map((file) => ({
      name: file,
      path: path.join(backupPath, file),
      time: fs.statSync(path.join(backupPath, file)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time);

  if (backups.length > maxBackups) {
    backups.slice(maxBackups).forEach((backup) => {
      fs.unlinkSync(backup.path);
      console.log(`已删除旧备份: ${backup.name}`);
    });
  }
}

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

    // 创建初始备份
    createBackup("initial-backup").catch((err) => {
      console.error("初始备份创建失败:", err);
    });

    // 设置自动备份（每天一次）
    setInterval(() => {
      createBackup()
        .then(() => cleanupOldBackups())
        .catch((err) => {
          console.error("自动备份失败:", err);
        });
    }, BACKUP_CONFIG.backupInterval);

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
    .map((t: { name: string }) => t.name);

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
    tables.map((t: { name: string }) => t.name),
  );

  // 打印每个表的结构
  tables.forEach((table: { name: string }) => {
    const columns = dbInstance
      .prepare(`PRAGMA table_info(${table.name})`)
      .all();
    console.log(`\n表结构 ${table.name}:`, columns);
  });
}
