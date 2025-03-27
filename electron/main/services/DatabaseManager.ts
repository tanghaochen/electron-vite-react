import { initDatabase } from "../../database/init";

export class DatabaseManager {
  private db;

  constructor() {
    this.db = initDatabase();
  }

  setupIpcHandlers(ipcMain) {
    ipcMain.handle("db:query", async (_, sql, params) => {
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
      } catch (err) {
        console.error("数据库错误:", err.message);
        throw new Error(`数据库错误: ${err.message}`);
      }
    });
  }
}
