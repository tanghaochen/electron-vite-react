// electron/database/operations.ts
import { dbInstance } from "./init";

export class DatabaseOperations {
  /**
   * ��ӱ��ֶ�
   * @param tableName ����
   * @param columnDef �ֶζ��壬�� "is_archived BOOLEAN DEFAULT 0"
   */
  static async addColumn(tableName: string, columnDef: string) {
    dbInstance.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnDef}`);
  }

  /**
   * ɾ�����ֶΣ�ͨ�������±�ʵ�֣�
   * @param tableName ����
   * @param excludeColumns Ҫɾ�����ֶ�����
   */
  static async dropColumns(tableName: string, excludeColumns: string[]) {
    // ��ȡ��������ֶ�
    const tableInfo = dbInstance
      .prepare(`PRAGMA table_info(${tableName})`)
      .all();

    // ���˳�Ҫ�������ֶ�
    const keepColumns = tableInfo
      .map((col: any) => col.name)
      .filter((name) => !excludeColumns.includes(name));

    // �����±����
    dbInstance.exec(`
      CREATE TABLE ${tableName}_new AS 
      SELECT ${keepColumns.join(", ")} 
      FROM ${tableName};
      
      DROP TABLE ${tableName};
      
      ALTER TABLE ${tableName}_new RENAME TO ${tableName};
    `);
  }

  /**
   * �޸ı��ֶΣ�ͨ�������±�ʵ�֣�
   * @param tableName ����
   * @param oldColumnName ԭ�ֶ���
   * @param newColumnDef ���ֶζ���
   */
  static async modifyColumn(
    tableName: string,
    oldColumnName: string,
    newColumnDef: string,
  ) {
    // ��ȡ��������ֶ�
    const tableInfo = dbInstance
      .prepare(`PRAGMA table_info(${tableName})`)
      .all();

    // �����±���ֶζ���
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
   * ��ѯ��ṹ
   * @param tableName ����
   */
  static async getTableInfo(tableName: string) {
    return dbInstance.prepare(`PRAGMA table_info(${tableName})`).all();
  }
}
