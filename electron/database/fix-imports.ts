/**
 * 这个文件用于修复 ESM 模式下 better-sqlite3 的导入问题
 */
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { app } from "electron";

// 创建require函数，用于导入CJS模块
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// 获取应用根目录
const appRoot = path.join(__dirname, "../..");

// 使用绝对路径导入better-sqlite3
// 这确保Electron能在运行时找到正确的原生模块
const modulePath = path.join(appRoot, "node_modules", "better-sqlite3");
const BetterSqlite3 = require(modulePath);

// 导出模块
export default BetterSqlite3;
// 导出命名空间以兼容类型定义
export const Database = BetterSqlite3;
