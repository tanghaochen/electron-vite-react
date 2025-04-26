// ����ʿ����ݿ������
import { worksListDB } from "@/database/worksLists";

// �ʿ�״̬������ - ʹ�õ���ģʽȷ��ȫ��ֻ��һ��ʵ��
class WorksStateManager {
  // ˽�о�̬ʵ�����������ڴ洢����
  private static instance: WorksStateManager;
  // �洢�ʿ��б�����
  private worksList: any[] = [];
  // �洢���м���������
  private listeners: ((worksList: any[]) => void)[] = [];

  // ˽�й��캯������ֹ�ⲿֱ��ʵ����
  private constructor() {}

  // ��ȡ����ʵ���ľ�̬����
  public static getInstance(): WorksStateManager {
    // ���ʵ�������ڣ��򴴽�һ����ʵ��
    if (!WorksStateManager.instance) {
      WorksStateManager.instance = new WorksStateManager();
    }
    // ����ʵ��
    return WorksStateManager.instance;
  }

  // ���´ʿ��б�����
  public async updateWorksList(tagId: number) {
    try {
      // �����ݿ��ȡָ����ǩID�µ����дʿ�
      const worksListRes = await worksListDB.getMetadataByTagId(tagId);
      if (worksListRes) {
        // �Դʿ��б������ֶν�������
        this.worksList = worksListRes.sort(
          (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
        );
        // ֪ͨ���м����������Ѹ���
        this.notifyListeners();
      }
    } catch (error) {
      console.error("���´ʿ��б�ʧ��:", error);
    }
  }

  // �Ӵʿ��б����Ƴ�ָ��ID�Ĵʿ�
  public removeWorksItem(itemId: number) {
    console.log("�Ƴ��ʿ�", itemId, this.worksList);
    // ���˵�ָ��ID�Ĵʿ�
    this.worksList = this.worksList.filter((item) => item.id !== itemId);
    // ֪ͨ���м����������Ѹ���
    this.notifyListeners();
  }

  // ��ȡ��ǰ�ʿ��б�
  public getWorksList(): any[] {
    return this.worksList;
  }

  // ������ݱ仯������
  public addListener(listener: (worksList: any[]) => void) {
    // ����������ӵ�����������
    this.listeners.push(listener);
    // ����һ��ȡ�������ĺ���
    return () => {
      // �Ӽ������������Ƴ��ü�����
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // ֪ͨ���м����������Ѹ���
  private notifyListeners() {
    // �������м��������������ǣ��������µĴʿ��б�����
    this.listeners.forEach((listener) => listener(this.worksList));
  }
}

// ��������ʵ��
export const worksStateManager = WorksStateManager.getInstance();
