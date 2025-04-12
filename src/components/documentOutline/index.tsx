import React, { useEffect, useState, useRef } from "react";
import {
  Tree,
  UncontrolledTreeEnvironment,
  TreeDataProvider,
  TreeItemIndex,
  TreeItem,
  Disposable,
} from "react-complex-tree";
import "react-complex-tree/lib/style-modern.css";
import "./styles.scss";
import { debounce } from "lodash";

// 自定义数据提供者实现
class DocumentOutlineDataProvider implements TreeDataProvider {
  private data: Record<TreeItemIndex, TreeItem> = {
    root: {
      index: "root",
      isFolder: true,
      children: [],
      label: "目录",
    },
  };

  private treeChangeListeners: ((changedItemIds: TreeItemIndex[]) => void)[] =
    [];

  constructor(headings = []) {
    this.updateHeadings(headings);
  }

  public async getTreeItem(itemId: TreeItemIndex) {
    return this.data[itemId];
  }

  public async getTreeItems(itemIds: TreeItemIndex[]) {
    return itemIds.map((id) => this.data[id]);
  }

  public async onChangeItemChildren(
    itemId: TreeItemIndex,
    newChildren: TreeItemIndex[],
  ) {
    this.data[itemId].children = newChildren;
    this.treeChangeListeners.forEach((listener) => listener([itemId]));
  }

  public onDidChangeTreeData(
    listener: (changedItemIds: TreeItemIndex[]) => void,
  ): Disposable {
    this.treeChangeListeners.push(listener);
    return {
      dispose: () =>
        this.treeChangeListeners.splice(
          this.treeChangeListeners.indexOf(listener),
          1,
        ),
    };
  }

  public async onRenameItem(item: TreeItem, name: string): Promise<void> {
    console.log("onRenameItem", this.data);
    this.data[item.index].label = name;
    this.treeChangeListeners.forEach((listener) => listener([item.index]));
  }

  // 更新单个标题
  public updateHeadingItem(heading) {
    const id = heading.id;

    // 如果项目不存在，需要创建并添加到树结构中
    if (!this.data[id]) {
      this.data[id] = {
        index: id,
        label: heading.text || "未命名标题",
        level: heading.level,
        position: heading.position,
        children: [],
        isFolder: false,
      };

      // 找到合适的父节点
      let parentId = "root";
      for (let l = heading.level - 1; l > 0; l--) {
        // 查找最近的上级标题
        const possibleParents = Object.values(this.data).filter(
          (item) => item.level === l && item.position < heading.position,
        );

        if (possibleParents.length > 0) {
          // 找到位置最近的父节点
          const closestParent = possibleParents.reduce((prev, current) =>
            current.position > prev.position ? current : prev,
          );
          parentId = closestParent.index;
          break;
        }
      }

      // 添加到父节点
      if (!this.data[parentId].children) {
        this.data[parentId].children = [];
      }
      this.data[parentId].children.push(id);

      // 通知父节点变化
      this.treeChangeListeners.forEach((listener) => listener([parentId]));
    } else {
      // 如果项目已存在，只更新标签
      const oldLabel = this.data[id].label;
      const newLabel = heading.text || "未命名标题";

      if (oldLabel !== newLabel) {
        this.data[id].label = newLabel;
        // 通知项目变化
        this.treeChangeListeners.forEach((listener) => listener([id]));
      }
    }
  }

  // 更新标题数据
  public updateHeadings(headings) {
    if (headings.length === 0) {
      // 如果没有标题，重置为只有根节点的树
      this.data = {
        root: {
          index: "root",
          isFolder: true,
          children: [],
          label: "目录",
        },
      };
      this.treeChangeListeners.forEach((listener) => listener(["root"]));
      return;
    }
    // 获取当前存在的标题ID
    const existingIds = new Set(Object.keys(this.data));
    existingIds.delete("root"); // 排除根节点

    // 新标题的ID集合
    const newIds = new Set(headings.map((h) => h.id));

    // 找出需要删除的标题
    const idsToRemove = [...existingIds].filter((id) => !newIds.has(id));

    // 删除不再存在的标题
    if (idsToRemove.length > 0) {
      idsToRemove.forEach((id) => {
        // 从父节点的children中移除
        Object.values(this.data).forEach((item) => {
          if (item.children && item.children.includes(id)) {
            item.children = item.children.filter((childId) => childId !== id);
            // 如果没有子节点了，设置isFolder为false
            if (item.children.length === 0 && item.index !== "root") {
              item.isFolder = false;
            }
            // 通知父节点变化
            this.treeChangeListeners.forEach((listener) =>
              listener([item.index]),
            );
          }
        });

        // 删除节点
        delete this.data[id];
      });
    }

    // 构建树结构
    let lastNodeByLevel = {};
    lastNodeByLevel[0] = "root";

    // 首先确保根节点存在
    if (!this.data.root) {
      this.data.root = {
        index: "root",
        isFolder: true,
        children: [],
        label: "目录",
      };
    }

    // 重置根节点的子节点
    this.data.root.children = [];

    // 按位置排序标题
    const sortedHeadings = [...headings].sort(
      (a, b) => a.position - b.position,
    );

    // 更新或创建标题节点
    sortedHeadings.forEach((heading) => {
      const level = heading.level;
      const id = heading.id;

      // 更新或创建节点
      if (!this.data[id]) {
        this.data[id] = {
          index: id,
          label: heading.text || "未命名标题",
          level,
          position: heading.position,
          children: [],
          isFolder: false,
        };
      } else {
        // 更新现有节点
        this.data[id].label = heading.text || "未命名标题";
        this.data[id].level = level;
        this.data[id].position = heading.position;
      }

      // 找到合适的父节点
      let parentId = "root";
      for (let l = level - 1; l > 0; l--) {
        if (lastNodeByLevel[l]) {
          parentId = lastNodeByLevel[l];
          break;
        }
      }

      // 添加到父节点的子节点列表
      if (!this.data[parentId].children) {
        this.data[parentId].children = [];
      }

      // 避免重复添加
      if (!this.data[parentId].children.includes(id)) {
        this.data[parentId].children.push(id);
        this.data[parentId].isFolder = true;
      }

      // 更新当前级别的最后节点
      lastNodeByLevel[level] = id;

      // 清除所有更高级别的最后节点
      for (let l = level + 1; l <= 6; l++) {
        delete lastNodeByLevel[l];
      }
    });

    // 通知所有监听器数据已更新
    this.treeChangeListeners.forEach((listener) => listener(["root"]));
  }

  // 获取数据（用于调试）
  public getData() {
    return this.data;
  }

  // 清除数据
  public clearData() {
    this.data = {
      root: {
        index: "root",
        isFolder: true,
        children: [],
        label: "目录",
      },
    };
    // this.data.root.children = [];
    console.log("clearData", this.data);
    this.treeChangeListeners.forEach((listener) => listener(["root"]));
  }
}

export default function DocumentOutline({
  editor,
  activeTabsItem,
  richTextEditorEleRef,
}) {
  const [headings, setHeadings] = useState([]);
  const [expandedItems, setExpandedItems] = useState(["root"]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [activeHeading, setActiveHeading] = useState(null);
  const lastActiveTabsItemRef = useRef(null);
  const lastEditorRef = useRef(null);
  const observerRef = useRef(null);
  const treeRef = useRef(null);
  const dataProviderRef = useRef(new DocumentOutlineDataProvider());
  // 提取标题的函数
  const updateHeadings = debounce(() => {
    if (!editor || editor.isDestroyed) return;

    try {
      const headingsList = [];
      const content = editor.getJSON();

      if (content && content.content) {
        // 查找文档中实际存在的标题元素
        const headingElements = document
          .querySelector(".react-tabs__tab-panel--selected")
          .querySelectorAll(
            ".ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror h6, .ProseMirror [role='heading']",
          );

        // 创建DOM元素到位置的映射
        const elementPositionMap = new Map();

        content.content.forEach((node, index) => {
          if (node.type === "heading" || node.type === "headingWithId") {
            const level = node.attrs ? node.attrs.level : 1;
            let text = "";

            if (node.content) {
              node.content.forEach((textNode) => {
                if (textNode.text) {
                  text += textNode.text;
                }
              });
            }

            elementPositionMap.set(text.trim(), index);
          }
        });
        headingsList.length = 0;
        // 从DOM中获取实际ID
        headingElements.forEach((element, idx) => {
          const text = element.textContent.trim();
          const level = parseInt(element.tagName.substring(1)) || 1;
          const id =
            element.id ||
            element.getAttribute("data-heading-id") ||
            `heading-${idx}`;
          const position = elementPositionMap.get(text) || idx;

          headingsList.push({
            id,
            level,
            text,
            position,
          });
        });
      }
      setHeadings(headingsList);

      // 更新数据提供者
      dataProviderRef.current.updateHeadings(headingsList);

      // 更新后重新设置 IntersectionObserver
      setTimeout(() => {
        setupIntersectionObserver();
        treeRef.current?.expandAll("root");
      }, 50);
    } catch (error) {
      console.error("更新标题时出错:", error);
    }
  }, 10);

  // 检测标签页和编辑器变化
  useEffect(() => {
    const tabIdChanged =
      activeTabsItem?.value !== lastActiveTabsItemRef.current?.value;
    if (tabIdChanged) {
      dataProviderRef.current.updateHeadings([]);
    }

    const editorChanged = editor !== lastEditorRef.current;

    if (tabIdChanged || editorChanged) {
      // 更新引用
      lastActiveTabsItemRef.current = activeTabsItem;
      lastEditorRef.current = editor;

      // 重置状态
      setSelectedItems([]);
      setActiveHeading(null);
      setExpandedItems(["root"]);
      console.log("检测标签页和编辑器变化");
      // 更新标题
      updateHeadings();
    }
  }, [activeTabsItem, editor]);

  // 监听编辑器变化
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    // 监听编辑器变化
    const onUpdate = debounce(() => {
      console.log("onUpdate");
      updateHeadings();
    }, 100);

    editor.on("update", onUpdate);

    // 初始化
    updateHeadings();

    return () => {
      // 清理
      editor.off("update", onUpdate);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [editor]);

  // 设置 IntersectionObserver
  const setupIntersectionObserver = () => {
    // 清理旧的观察者
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // 创建新的观察者
    const observer = new IntersectionObserver(
      (entries) => {
        // 找到第一个可见的标题
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id =
              entry.target.id || entry.target.getAttribute("data-heading-id");
            if (id && id !== activeHeading) {
              setTimeout(() => {
                setSelectedItems([id]);
                setActiveHeading(id);
                ensureItemExpanded(id);
              }, 0);
              break;
            }
          }
        }
      },
      {
        root:
          document.querySelector(".ProseMirror-wrapper") ||
          document.querySelector(".tiptap-container"),
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: "-10% 0px -10% 0px",
      },
    );

    // 存储观察者引用
    observerRef.current = observer;

    // 获取所有标题元素
    setTimeout(() => {
      const headingElements = document.querySelectorAll(
        ".ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror h6, .ProseMirror [role='heading']",
      );

      // 观察所有标题元素
      headingElements.forEach((element) => {
        observer.observe(element);
      });
    }, 100);
  };

  // 确保高亮的项目在展开状态
  const ensureItemExpanded = (itemId) => {
    // 找到该标题的所有父节点
    const parentIds = [];
    let currentNode = itemId;

    // 遍历树结构找到所有父节点
    const data = dataProviderRef.current.getData();
    for (const nodeId in data) {
      if (
        data[nodeId].children &&
        data[nodeId].children.includes(currentNode)
      ) {
        parentIds.push(nodeId);
        currentNode = nodeId;
        if (nodeId === "root") break;
      }
    }

    // 展开所有父节点
    if (parentIds.length > 0) {
      const newExpandedItems = [...expandedItems];
      parentIds.forEach((id) => {
        if (!newExpandedItems.includes(id)) {
          newExpandedItems.push(id);
        }
      });
      setExpandedItems(newExpandedItems);
    }
  };

  // 点击目录项滚动到对应位置
  const handleSelectItems = (items) => {
    setSelectedItems(items);

    // 如果选择了非根节点，滚动到对应位置
    if (items.length === 1 && items[0] !== "root") {
      const element = document.getElementById(items[0]);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <div className="document-outline overflow-auto">
      <div className="outline-header">
        <h3 className="text-zinc-800 font-bold p-4">文档目录</h3>
      </div>
      {headings.length > 0 ? (
        <UncontrolledTreeEnvironment
          defaultInteractionMode={"click-arrow-to-expand"}
          dataProvider={dataProviderRef.current}
          canDragAndDrop={false}
          canDropOnFolder={false}
          canReorderItems={false}
          disableMultiselect
          getItemTitle={(item) => item.label}
          viewState={{
            ["outline"]: {
              expandedItems,
              selectedItems,
            },
          }}
          onExpandItem={(item) =>
            setExpandedItems([...expandedItems, item.index])
          }
          onCollapseItem={(item) =>
            setExpandedItems(
              expandedItems.filter(
                (expandedItemIndex) => expandedItemIndex !== item.index,
              ),
            )
          }
          onSelectItems={handleSelectItems}
          renderItemTitle={({ item }) => (
            <a
              href={item.index !== "root" ? `#${item.index}` : "#"}
              className={`outline-item level-${item.level || 0} ${
                selectedItems.includes(item.index) ? "active" : ""
              }`}
              onClick={(e) => {
                console.log("item", item);
                // 不阻止默认行为，让浏览器处理锚点跳转
                if (item.index === "root") {
                  e.preventDefault(); // 只有根节点阻止默认行为
                } else {
                  // 更新选中状态
                  setSelectedItems([item.index]);
                  setActiveHeading(item.index);
                }
              }}
              style={{
                textDecoration: "none",
                fontWeight: selectedItems.includes(item.index)
                  ? "bold"
                  : "normal",
                display: "block",
                padding: "4px 8px",
                cursor: "pointer",
                borderRadius: "4px",
              }}
            >
              {item.label}
            </a>
          )}
        >
          <Tree
            treeId="outline"
            rootItem="root"
            ref={treeRef}
            treeLabel="文档目录"
          />
        </UncontrolledTreeEnvironment>
      ) : (
        <div className="empty-outline">
          <p className="text-zinc-500 text-center p-4">没有可用的目录</p>
        </div>
      )}
    </div>
  );
}
