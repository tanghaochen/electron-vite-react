// user_preferences 用户偏好设置表
export const preferencesDB = {
  // 复用通用查询方法
  query: (sql, params = []) => {
    return window.ipcRenderer.invoke("db:query", sql, params);
  },

  /**
   * 创建或更新偏好设置
   * @param {object} settings - 设置对象
   * @param {string} [userId] - 可选的用户ID，未登录用户可不提供
   * @returns {Promise<number>} - 返回更新的行ID
   */
  updatePreferences: async (settings, userId = "default") => {
    if (!settings || typeof settings !== "object")
      throw new Error("settings 必须是一个对象");

    // 序列化设置对象为JSON字符串
    const settingsJson = JSON.stringify(settings);

    const result = await preferencesDB.query(
      `INSERT INTO user_preferences (user_id, settings_json, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET 
       settings_json = excluded.settings_json,
       updated_at = CURRENT_TIMESTAMP`,
      [userId, settingsJson],
    );

    return result.lastInsertRowid || result.changes;
  },

  /**
   * 获取偏好设置
   * @param {string} [userId] - 可选的用户ID，未登录用户可不提供
   * @returns {Promise<object|null>} - 返回设置对象或null
   */
  getPreferences: async (userId = "default") => {
    const result = await preferencesDB.query(
      "SELECT settings_json FROM user_preferences WHERE user_id = ?",
      [userId],
    );

    if (result.length === 0) return null;

    try {
      return JSON.parse(result[0].settings_json);
    } catch (error) {
      console.error("解析设置JSON失败:", error);
      return null;
    }
  },

  /**
   * 删除偏好设置
   * @param {string} [userId] - 可选的用户ID，未登录用户可不提供
   * @returns {Promise<boolean>} - 返回是否成功删除
   */
  deletePreferences: async (userId = "default") => {
    const result = await preferencesDB.query(
      "DELETE FROM user_preferences WHERE user_id = ?",
      [userId],
    );

    return result.changes > 0;
  },

  /**
   * 检查是否有偏好设置
   * @param {string} [userId] - 可选的用户ID，未登录用户可不提供
   * @returns {Promise<boolean>} - 返回是否存在设置
   */
  hasPreferences: async (userId = "default") => {
    const result = await preferencesDB.query(
      "SELECT 1 FROM user_preferences WHERE user_id = ? LIMIT 1",
      [userId],
    );

    return result.length > 0;
  },

  /**
   * 更新特定设置项
   * @param {string} key - 设置键
   * @param {any} value - 设置值
   * @param {string} [userId] - 可选的用户ID，未登录用户可不提供
   * @returns {Promise<boolean>} - 返回是否成功更新
   */
  updateSetting: async (key, value, userId = "default") => {
    if (!key) throw new Error("key 不能为空");

    // 先获取当前设置
    const currentSettings = (await preferencesDB.getPreferences(userId)) || {};

    // 更新特定设置项
    currentSettings[key] = value;

    // 保存更新后的设置
    await preferencesDB.updatePreferences(currentSettings, userId);

    return true;
  },

  /**
   * 获取所有用户的偏好设置
   * @returns {Promise<Array>} - 返回所有用户设置数组
   */
  getAllPreferences: async () => {
    const results = await preferencesDB.query(
      "SELECT id, user_id, settings_json, updated_at FROM user_preferences",
    );

    return results.map((row) => ({
      id: row.id,
      userId: row.user_id,
      settings: JSON.parse(row.settings_json),
      updatedAt: row.updated_at,
    }));
  },

  /**
   * 获取应用程序全局设置（不与用户关联）
   * @returns {Promise<object|null>} - 返回全局设置对象或null
   */
  getGlobalSettings: async () => {
    return preferencesDB.getPreferences("global");
  },

  /**
   * 更新应用程序全局设置
   * @param {object} settings - 设置对象
   * @returns {Promise<number>} - 返回更新的行ID
   */
  updateGlobalSettings: async (settings) => {
    return preferencesDB.updatePreferences(settings, "global");
  },

  /**
   * 合并用户设置与默认设置
   * @param {string} [userId] - 可选的用户ID
   * @param {object} defaultSettings - 默认设置对象
   * @returns {Promise<object>} - 返回合并后的设置
   */
  getSettingsWithDefaults: async (userId = "default", defaultSettings = {}) => {
    const userSettings = await preferencesDB.getPreferences(userId);
    return { ...defaultSettings, ...(userSettings || {}) };
  },
};
