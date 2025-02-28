// src/main/database/init.js
import path from 'path';
import { app } from 'electron';
import Database from 'better-sqlite3';
import fs from 'fs';

// 确保testdata目录存在
const testDataPath = path.resolve('testdata');
if (!fs.existsSync(testDataPath)) {
    fs.mkdirSync(testDataPath, { recursive: true });
}

const dbPath = path.join(testDataPath, 'notes.db');

let dbInstance = null;

export function initDatabase() {
    if (dbInstance) return dbInstance;

    console.log('数据库路径:', dbPath);

    dbInstance = new Database(dbPath, {
        verbose: process.env.NODE_ENV === 'development' ? console.log : null
    });

    try {
        // 第一步：基础配置
        dbInstance.pragma('journal_mode = WAL');
        dbInstance.pragma('foreign_keys = ON');
        dbInstance.pragma('busy_timeout = 5000');

        // 第二步：执行迁移
        executeMigrations();

        // 第三步：验证表结构
        verifyTables();

        return dbInstance;
    } catch (err) {
        console.error('数据库初始化失败:', err);
        if (dbInstance) dbInstance.close();
        dbInstance = null;
        throw err;
    }
}

function executeMigrations() {
    const expectedTables = [
        'schema_version',
        'tags',
        'tag_closure',
        'notes_metadata',
        'notes_content',
        'note_tags',
        'notes_fts'
    ];

    dbInstance.transaction(() => {
        // 检查是否存在版本表
        const hasSchemaVersion = dbInstance
            .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_version'")
            .pluck()
            .get();

        if (!hasSchemaVersion) {
            console.log('执行初始迁移...');
            dbInstance.exec(`
        CREATE TABLE schema_version (
          version INTEGER PRIMARY KEY
        );

        CREATE TABLE tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          parent_id INTEGER DEFAULT 0,
          name TEXT NOT NULL,
          color TEXT DEFAULT '#3498db',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(name, parent_id)
        );

        CREATE TABLE tag_closure (
          ancestor INTEGER NOT NULL,
          descendant INTEGER NOT NULL,
          depth INTEGER NOT NULL,
          PRIMARY KEY (ancestor, descendant),
          FOREIGN KEY(ancestor) REFERENCES tags(id),
          FOREIGN KEY(descendant) REFERENCES tags(id)
        );

        CREATE TABLE notes_metadata (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_pinned BOOLEAN DEFAULT 0
        );

        CREATE TABLE notes_content (
          note_id INTEGER PRIMARY KEY,
          content TEXT NOT NULL,
          FOREIGN KEY(note_id) REFERENCES notes_metadata(id)
        );

        CREATE TABLE note_tags (
          note_id INTEGER NOT NULL,
          tag_id INTEGER NOT NULL,
          PRIMARY KEY (note_id, tag_id),
          FOREIGN KEY(note_id) REFERENCES notes_metadata(id) ON DELETE CASCADE,
          FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
        );

        CREATE VIRTUAL TABLE notes_fts USING fts5(
          title,
          content,
          content_rowid='note_id'
        );

        INSERT INTO schema_version (version) VALUES (1);
      `);

            // 插入测试数据
            dbInstance.exec(`
        INSERT INTO tags (name, parent_id) VALUES 
          ('语言学习', 0),
          ('英语', 1),
          ('日语', 1);
          
        INSERT INTO tag_closure (ancestor, descendant, depth) VALUES
          (1,1,0),
          (1,2,1),
          (1,3,1),
          (2,2,0),
          (3,3,0);
      `);
        } else {
            console.log('检测到已有数据库，跳过初始迁移');
        }
    })();
}

function verifyTables() {
    console.log('验证表结构...');

    const tables = dbInstance
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all()
        .map(t => t.name);

    const requiredTables = [
        'schema_version',
        'tags',
        'tag_closure',
        'notes_metadata',
        'notes_content',
        'note_tags',
        'notes_fts'
    ];

    requiredTables.forEach(table => {
        if (!tables.includes(table)) {
            throw new Error(`缺失关键表: ${table}`);
        }
    });

    console.log('表结构验证通过，发现以下表:', tables);
}

// 调试用：打印数据库信息
export function debugDatabase() {
    if (!dbInstance) return;

    console.log('--- 数据库调试信息 ---');
    console.log('路径:', dbPath);
    console.log('版本:', dbInstance.prepare('SELECT sqlite_version()').pluck().get());

    const tables = dbInstance
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all();

    console.log('所有表:', tables.map(t => t.name));

    tables.forEach(table => {
        const columns = dbInstance
            .prepare(`PRAGMA table_info(${table.name})`)
            .all();
        console.log(`\n表结构 ${table.name}:`, columns);
    });
}
