// 导入词库数据库操作类
import { worksListDB } from "@/database/worksLists";

// 词库状态管理类 - 使用单例模式确保全局只有一个实例
class WorksStateManager {
  // 私有静态实例变量，用于存储单例
  private static instance: WorksStateManager;
  // 存储词库列表数据
  private worksList: any[] = [];
  // 存储所有监听器函数
  private listeners: ((worksList: any[]) => void)[] = [];

  // 私有构造函数，防止外部直接实例化
  private constructor() {}

  // 获取单例实例的静态方法
  public static getInstance(): WorksStateManager {
    // 如果实例不存在，则创建一个新实例
    if (!WorksStateManager.instance) {
      WorksStateManager.instance = new WorksStateManager();
    }
    // 返回实例
    return WorksStateManager.instance;
  }

  // 更新词库列表数据
  public async updateWorksList(tagId: number) {
    try {
      // 从数据库获取指定标签ID下的所有词库
      const worksListRes = await worksListDB.getMetadataByTagId(tagId);
      if (worksListRes) {
        // 对词库列表按排序字段进行排序
        this.worksList = worksListRes.sort(
          (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
        );
        // 通知所有监听器数据已更新
        this.notifyListeners();
      }
    } catch (error) {
      console.error("更新词库列表失败:", error);
    }
  }

  // 从词库列表中移除指定ID的词库
  public removeWorksItem(itemId: number) {
    console.log("移除词库", itemId, this.worksList);
    // 过滤掉指定ID的词库
    this.worksList = this.worksList.filter((item) => item.id !== itemId);
    // 通知所有监听器数据已更新
    this.notifyListeners();
  }

  // 获取当前词库列表
  public getWorksList(): any[] {
    return this.worksList;
  }

  // 添加数据变化监听器
  public addListener(listener: (worksList: any[]) => void) {
    // 将监听器添加到监听器数组
    this.listeners.push(listener);
    // 返回一个取消监听的函数
    return () => {
      // 从监听器数组中移除该监听器
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // 通知所有监听器数据已更新
  private notifyListeners() {
    // 遍历所有监听器并调用它们，传入最新的词库列表数据
    this.listeners.forEach((listener) => listener(this.worksList));
  }
}

// 导出单例实例
export const worksStateManager = WorksStateManager.getInstance();
