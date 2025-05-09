import { initDatabase } from "../../database";
import { IpcMain } from "electron";

export class DatabaseManager {
  private db;

  constructor() {
    this.db = initDatabase();
  }

  setupIpcHandlers(ipcMain: IpcMain) {
    ipcMain.handle("db:query", async (_, sql: string, params: any) => {
      try {
        const stmt = this.db.prepare(sql);

        if (sql.trim().toUpperCase().startsWith("SELECT")) {
          return stmt.all(params);
        } else {
          const result = stmt.run(params);
          return {
            lastInsertRowid: result.lastInsertRowid,
            changes: result.changes,
          };
        }
      } catch (err: any) {
        console.error("数据库错误:", err.message);
        throw new Error(`数据库错误: ${err.message}`);
      }
    });
  }
}
