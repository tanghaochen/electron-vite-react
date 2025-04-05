import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Tree,
  UncontrolledTreeEnvironment,
  StaticTreeDataProvider,
} from "react-complex-tree";
import "react-complex-tree/lib/style-modern.css";
import "./styles.scss";

export default function DocumentOutline({ editor, activeTabsItem }) {
  const [headings, setHeadings] = useState([]);
  const [expandedItems, setExpandedItems] = useState(["root"]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [activeHeading, setActiveHeading] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const lastActiveTabsItemRef = useRef(null);
  const lastEditorRef = useRef(null);
  const treeKey = useRef(`tree-${Date.now()}`);
  const observerRef = useRef(null);

  // 检测标签页和编辑器变化
  useEffect(() => {
    const tabIdChanged =
      activeTabsItem?.value !== lastActiveTabsItemRef.current?.value;
    const editorChanged = editor !== lastEditorRef.current;

    console.log("检测变化:", {
      activeTabsItem: activeTabsItem?.value,
      lastActiveTabsItem: lastActiveTabsItemRef.current?.value,
      editorChanged,
      tabIdChanged,
    });

    if (tabIdChanged || editorChanged) {
      console.log("标签页或编辑器变化，强制更新目录");

      // 更新引用
      lastActiveTabsItemRef.current = activeTabsItem;
      lastEditorRef.current = editor;

      // 重置状态
      setSelectedItems([]);
      setActiveHeading(null);
      setExpandedItems(["root"]);

      // 强制更新
      setForceUpdate((prev) => prev + 1);
      treeKey.current = `tree-${Date.now()}`;

      // 如果编辑器存在，立即提取标题
      if (editor) {
        console.log("提取当前编辑器标题");
        setTimeout(() => {
          try {
            const headingsList = [];
            const content = editor.getJSON();

            if (content && content.content) {
              content.content.forEach((node, index) => {
                if (node.type === "heading" || node.type === "headingWithId") {
                  const id =
                    (node.attrs && node.attrs.id) || `heading-${index}`;
                  const level = node.attrs ? node.attrs.level : 1;
                  let text = "";

                  if (node.content) {
                    node.content.forEach((textNode) => {
                      if (textNode.text) {
                        text += textNode.text;
                      }
                    });
                  }

                  headingsList.push({
                    id,
                    level,
                    text,
                    index: id,
                    position: index,
                  });
                }
              });
            }

            console.log("提取到标题:", headingsList.length);
            setHeadings(headingsList);

            // 再次强制更新
            setTimeout(() => {
              setForceUpdate((prev) => prev + 1);
              treeKey.current = `tree-${Date.now()}`;

              // 设置 IntersectionObserver
              setupIntersectionObserver();
            }, 50);
          } catch (error) {
            console.error("提取标题时出错:", error);
          }
        }, 50);
      } else {
        setHeadings([]);
      }
    }
  }, [activeTabsItem, editor]);

  // 监听编辑器内容变化
  useEffect(() => {
    if (!editor) return;

    const updateHeadings = () => {
      if (editor.isDestroyed) return;

      try {
        const headingsList = [];
        const content = editor.getJSON();

        if (content && content.content) {
          content.content.forEach((node, index) => {
            if (node.type === "heading" || node.type === "headingWithId") {
              const id = (node.attrs && node.attrs.id) || `heading-${index}`;
              const level = node.attrs ? node.attrs.level : 1;
              let text = "";

              if (node.content) {
                node.content.forEach((textNode) => {
                  if (textNode.text) {
                    text += textNode.text;
                  }
                });
              }

              headingsList.push({
                id,
                level,
                text,
                index: id,
                position: index,
              });
            }
          });
        }

        setHeadings(headingsList);

        // 更新后重新设置 IntersectionObserver
        setTimeout(() => {
          setupIntersectionObserver();
        }, 50);
      } catch (error) {
        console.error("更新标题时出错:", error);
      }
    };

    // 初始提取标题
    updateHeadings();

    // 监听编辑器内容变化
    const updateHandler = editor.on("update", updateHeadings);

    // 监听编辑器焦点变化
    const focusHandler = editor.on("focus", () => {
      console.log("编辑器获得焦点，更新目录");
      updateHeadings();
    });

    return () => {
      if (typeof updateHandler === "function") updateHandler();
      if (typeof focusHandler === "function") focusHandler();

      // 清理 IntersectionObserver
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
              // 延迟设置选中项，确保树组件已经重新创建
              // setTimeout(() => {
              console.log("id>>", id);
              // setSelectedItems([id]);
              setTimeout(() => {
                setSelectedItems([id]);
              }, 0);
              // // 确保高亮的项目在展开状态
              // ensureItemExpanded(id);
              // // }, 10);
              // setActiveHeading(id);
              // // 确保高亮的项目在展开状态
              // ensureItemExpanded(id);
              break;
            }
          }
        }
      },
      {
        root:
          document.querySelector(".ProseMirror-wrapper") ||
          document.querySelector(".tiptap-container"),
        threshold: [0, 0.25, 0.5, 0.75, 1], // 提高灵敏度
        rootMargin: "-10% 0px -10% 0px", // 根据需要调整，负值缩小视口
      },
    );

    // 存储观察者引用
    observerRef.current = observer;

    // 获取所有标题元素
    setTimeout(() => {
      const headingElements = document.querySelectorAll(
        ".ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror h6, .ProseMirror [role='heading']",
      );

      console.log("找到标题元素:", headingElements.length);

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
    for (const nodeId in items) {
      if (
        items[nodeId].children &&
        items[nodeId].children.includes(currentNode)
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

  // 构建树形数据
  const items = useMemo(() => {
    console.log("重新构建树形数据，当前标题数量:", headings.length);

    const nodes = {
      root: {
        index: "root",
        isFolder: true,
        children: [],
        label: "目录",
      },
    };

    // 创建节点
    headings.forEach((heading) => {
      nodes[heading.id] = {
        index: heading.id,
        label: heading.text,
        level: heading.level,
        position: heading.position,
        children: [],
        isFolder: false,
      };
    });

    // 构建树结构
    let lastNodeByLevel = {};
    lastNodeByLevel[0] = "root";

    headings.forEach((heading) => {
      const level = heading.level;
      const parentLevel = level - 1;

      // 找到合适的父节点
      let parentId = "root";
      for (let l = parentLevel; l > 0; l--) {
        if (lastNodeByLevel[l]) {
          parentId = lastNodeByLevel[l];
          break;
        }
      }

      // 添加到父节点的子节点列表
      nodes[parentId].children.push(heading.id);
      nodes[parentId].isFolder = true;

      // 更新当前级别的最后节点
      lastNodeByLevel[level] = heading.id;

      // 清除所有更高级别的最后节点
      for (let l = level + 1; l <= 6; l++) {
        delete lastNodeByLevel[l];
      }
    });

    return nodes;
  }, [headings, forceUpdate]);

  // 点击目录项滚动到对应位置
  const handleSelectItems = (items) => {
    setSelectedItems(items);
  };

  return (
    <>
      <div className="document-outline">
        <div className="outline-header">
          <h3 className="text-zinc-800 font-bold p-4">文档目录</h3>
        </div>
        {Object.keys(items).length > 1 ? (
          <UncontrolledTreeEnvironment
            key={treeKey.current}
            dataProvider={new StaticTreeDataProvider(items)}
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
                  textDecoration: "none", // 移除下划线
                  fontWeight: selectedItems.includes(item.index)
                    ? "bold"
                    : "normal", // 高亮加粗
                  display: "block", // 块级显示
                  padding: "4px 8px", // 添加内边距
                  cursor: "pointer", // 鼠标指针
                  borderRadius: "4px", // 圆角
                }}
              >
                {item.label}
              </a>
            )}
          >
            <Tree treeId="outline" rootItem="root" treeLabel="文档目录" />
          </UncontrolledTreeEnvironment>
        ) : (
          <div className="empty-outline">
            <p className="text-zinc-500 text-center p-4">没有可用的目录</p>
          </div>
        )}
      </div>
    </>
  );
}
