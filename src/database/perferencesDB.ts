// user_preferences 用户偏好设置表
export const preferencesDB = {
  // 复用通用查询方法
  query: (sql: string, params: any[] = []) => {
    return window.ipcRenderer.invoke("db:query", sql, params);
  },

  /**
   * 创建默认设置对象
   */
  createDefaultSettings: () => {
    return {
      tagsTreeState: {
        focusedItem: "",
        expandedItems: [],
        selectedItems: [],
      },
      tabsByOpen: [],
      activeTab: "",
    };
  },

  /**
   * 验证设置对象的基本结构
   */
  validateSettings: (settings: any) => {
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
      return false;
    }

    // 检查是否为空对象
    if (Object.keys(settings).length === 0) {
      return false;
    }

    // 验证必要字段
    const requiredFields = ["tagsTreeState", "tabsByOpen", "activeTab"];
    const missingFields = requiredFields.filter(
      (field) => !(field in settings),
    );

    if (missingFields.length > 0) {
      console.warn(`设置缺少以下必要字段: ${missingFields.join(", ")}`);
    }

    return true;
  },

  /**
   * 创建或更新偏好设置
   */
  updatePreferences: async (settings: any) => {
    if (!settings || typeof settings !== "object") {
      throw new Error("settings 必须是一个对象");
    }

    if (Array.isArray(settings)) {
      throw new Error("settings 不能是数组，必须是对象");
    }

    // 获取当前设置
    const currentSettings = await preferencesDB.getPreferences();

    // 合并设置
    const mergedSettings = {
      ...preferencesDB.createDefaultSettings(),
      ...(currentSettings || {}),
      ...settings,
      // 对于嵌套对象，需要特殊处理
      tagsTreeState: {
        ...(currentSettings?.tagsTreeState || {}),
        ...(settings.tagsTreeState || {}),
      },
    };

    // 序列化设置对象为JSON字符串
    const settingsJson = JSON.stringify(mergedSettings);

    // 先删除所有数据，确保只保留一条记录
    await preferencesDB.query("DELETE FROM user_preferences");

    // 插入新数据
    const result = await preferencesDB.query(
      `INSERT INTO user_preferences (settings_json, updated_at)
       VALUES (?, CURRENT_TIMESTAMP)`,
      [settingsJson],
    );

    return result.lastInsertRowid || result.changes;
  },

  /**
   * 获取偏好设置
   */
  getPreferences: async () => {
    const result = await preferencesDB.query(
      "SELECT settings_json FROM user_preferences LIMIT 1",
    );

    if (result.length === 0) {
      // 如果没有数据，返回默认设置
      return preferencesDB.createDefaultSettings();
    }

    try {
      return JSON.parse(result[0].settings_json);
    } catch (error) {
      console.error("解析设置JSON失败:", error);
      return preferencesDB.createDefaultSettings();
    }
  },

  /**
   * 重置偏好设置为默认值
   */
  resetPreferences: async () => {
    const defaultSettings = preferencesDB.createDefaultSettings();
    return preferencesDB.updatePreferences(defaultSettings);
  },

  /**
   * 更新特定设置项
   */
  updateSetting: async (key: string, value: any) => {
    if (!key) throw new Error("key 不能为空");

    const currentSettings = await preferencesDB.getPreferences();
    currentSettings[key] = value;
    return preferencesDB.updatePreferences(currentSettings);
  },
};
