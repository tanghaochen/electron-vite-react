/**
 * 简化版数据库模块
 * 用于开发环境，确保项目可以正常启动
 */
import path from "path";
import fs from "fs";
import { app } from "electron";

// 创建一个内存数据库模拟对象
class MockDatabase {
  private data: Map<string, any> = new Map();
  private statements: Map<string, any> = new Map();

  prepare(sql: string) {
    console.log(`准备SQL: ${sql}`);
    const statementId = Math.random().toString(36).substring(2);

    return {
      run: (params?: any) => {
        console.log(`执行SQL: ${sql}`, params);
        return { lastInsertRowid: 1, changes: 1 };
      },
      get: (params?: any) => {
        console.log(`获取SQL: ${sql}`, params);
        if (sql.includes("sqlite_version()")) {
          return "3.36.0 (模拟版)";
        }
        if (sql.includes("integrity_check")) {
          return "ok";
        }
        return null;
      },
      all: (params?: any) => {
        console.log(`获取全部SQL: ${sql}`, params);
        if (sql.includes("sqlite_master")) {
          return [
            { name: "schema_version" },
            { name: "tags" },
            { name: "tag_closure" },
            { name: "notes_metadata" },
            { name: "notes_content" },
            { name: "note_tags" },
            { name: "notes_fts" },
          ];
        }
        return [];
      },
      pluck: () => {
        return {
          get: (params?: any) => {
            if (sql.includes("schema_version")) {
              return 1;
            }
            if (sql.includes("integrity_check")) {
              return "ok";
            }
            if (sql.includes("sqlite_master")) {
              return 1; // 表存在
            }
            return null;
          },
        };
      },
    };
  }

  transaction(fn: Function) {
    console.log("开始事务");
    return () => {
      console.log("执行事务");
      fn();
      console.log("提交事务");
    };
  }

  pragma(statement: string) {
    console.log(`设置PRAGMA: ${statement}`);
    return null;
  }

  close() {
    console.log("关闭数据库连接");
  }
}

// 全局数据库实例
let dbInstance: MockDatabase | null = null;

/**
 * 初始化简化版数据库
 * @returns 数据库实例
 */
export function initDatabase() {
  // 如果数据库已经初始化，直接返回实例
  if (dbInstance) return dbInstance;

  console.log("初始化简化版数据库...");

  // 创建模拟数据库
  dbInstance = new MockDatabase();

  // 模拟初始化
  dbInstance.pragma("journal_mode = WAL");
  dbInstance.pragma("foreign_keys = ON");
  dbInstance.pragma("busy_timeout = 5000");

  console.log("简化版数据库初始化完成");
  return dbInstance;
}

export function createBackup() {
  console.log("模拟数据库备份");
  return Promise.resolve("backup-mock.db");
}

export function cleanupOldBackups() {
  console.log("模拟清理旧备份");
}

export function restoreFromBackup() {
  console.log("模拟从备份恢复");
  return Promise.resolve();
}

export function debugDatabase() {
  console.log("模拟数据库调试信息");
}
