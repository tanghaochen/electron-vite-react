// electron/database/operations.ts
import { dbInstance } from "./init";

export class DatabaseOperations {
  /**
   * 添加表字段
   * @param tableName 表名
   * @param columnDef 字段定义，如 "is_archived BOOLEAN DEFAULT 0"
   */
  static async addColumn(tableName: string, columnDef: string) {
    dbInstance.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnDef}`);
  }

  /**
   * 删除表字段（通过创建新表实现）
   * @param tableName 表名
   * @param excludeColumns 要删除的字段数组
   */
  static async dropColumns(tableName: string, excludeColumns: string[]) {
    // 获取表的所有字段
    const tableInfo = dbInstance
      .prepare(`PRAGMA table_info(${tableName})`)
      .all();

    // 过滤出要保留的字段
    const keepColumns = tableInfo
      .map((col: any) => col.name)
      .filter((name) => !excludeColumns.includes(name));

    // 创建新表语句
    dbInstance.exec(`
      CREATE TABLE ${tableName}_new AS 
      SELECT ${keepColumns.join(", ")} 
      FROM ${tableName};
      
      DROP TABLE ${tableName};
      
      ALTER TABLE ${tableName}_new RENAME TO ${tableName};
    `);
  }

  /**
   * 修改表字段（通过创建新表实现）
   * @param tableName 表名
   * @param oldColumnName 原字段名
   * @param newColumnDef 新字段定义
   */
  static async modifyColumn(
    tableName: string,
    oldColumnName: string,
    newColumnDef: string,
  ) {
    // 获取表的所有字段
    const tableInfo = dbInstance
      .prepare(`PRAGMA table_info(${tableName})`)
      .all();

    // 构建新表的字段定义
    const columns = tableInfo.map((col: any) => {
      if (col.name === oldColumnName) {
        return newColumnDef;
      }
      return `${col.name} ${col.type}`;
    });

    dbInstance.exec(`
      CREATE TABLE ${tableName}_new (
        ${columns.join(",\n")}
      );
      
      INSERT INTO ${tableName}_new 
      SELECT * FROM ${tableName};
      
      DROP TABLE ${tableName};
      
      ALTER TABLE ${tableName}_new RENAME TO ${tableName};
    `);
  }

  /**
   * 查询表结构
   * @param tableName 表名
   */
  static async getTableInfo(tableName: string) {
    return dbInstance.prepare(`PRAGMA table_info(${tableName})`).all();
  }
}
