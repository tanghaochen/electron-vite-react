import { TreeItemIndex, TreeItem as ComplexTreeItem } from "react-complex-tree";

export interface TreeItem {
  id: number;
  label: string;
  parent_id: number | null;
  sort_order: number;
}

// 扩展 ComplexTreeItem 以包含我们需要的额外属性
export interface TreeNode extends Omit<ComplexTreeItem<any>, "data"> {
  index: TreeItemIndex;
  label: string;
  children: TreeItemIndex[];
  isFolder: boolean;
  parent_id?: number;
  sort_order?: number;
  data?: any; // 添加 data 属性以满足 ComplexTreeItem 的要求
}

export interface TreeData {
  [key: TreeItemIndex]: TreeNode;
}

export interface TreeState {
  focusedItem?: TreeItemIndex;
  expandedItems: TreeItemIndex[];
  selectedItems: TreeItemIndex[];
  activeTab?: TreeItemIndex;
}

export interface Preferences {
  tagsTreeState: TreeState;
  tabsByOpen: TreeItemIndex[];
  activeTab: TreeItemIndex;
}
