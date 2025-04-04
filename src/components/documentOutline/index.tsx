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

  // 检测标签页和编辑器变化
  useEffect(() => {
    if (
      activeTabsItem?.value !== lastActiveTabsItemRef.current?.value ||
      editor !== lastEditorRef.current
    ) {
      console.log("编辑器或标签页变化，强制更新");
      lastActiveTabsItemRef.current = activeTabsItem;
      lastEditorRef.current = editor;

      // 强制更新
      setForceUpdate((prev) => prev + 1);
      // 重置选中项
      setSelectedItems([]);
      setActiveHeading(null);
      // 重置展开项，只保留根节点
      setExpandedItems(["root"]);

      console.log("切换到新的编辑器实例或标签页:", activeTabsItem?.value);

      // 立即提取当前编辑器的标题
      if (editor) {
        const extractHeadings = () => {
          try {
            const headingsList = [];
            const content = editor.getJSON();

            // 遍历文档内容查找标题元素
            if (content && content.content) {
              content.content.forEach((node, index) => {
                // 同时支持 heading 和 headingWithId 类型
                if (node.type === "heading" || node.type === "headingWithId") {
                  // 对于普通 heading，使用索引作为 ID
                  const id =
                    (node.attrs && node.attrs.id) || `heading-${index}`;
                  // 获取级别
                  const level = node.attrs ? node.attrs.level : 1;
                  let text = "";

                  // 提取标题文本
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
                    index,
                    position: index,
                  });
                }
              });
            }

            return headingsList;
          } catch (error) {
            console.error("提取标题时出错:", error);
            return [];
          }
        };

        const newHeadings = extractHeadings();
        setHeadings(newHeadings);
        console.log("已更新标题列表:", newHeadings);

        // 强制组件重新渲染
        setTimeout(() => {
          setForceUpdate((prev) => prev + 1);
        }, 0);
      }
    }
  }, [activeTabsItem, editor]);

  // 从编辑器内容中提取标题
  useEffect(() => {
    if (!editor) return;

    const extractHeadings = () => {
      try {
        const headingsList = [];
        const content = editor.getJSON();

        // 遍历文档内容查找标题元素
        if (content && content.content) {
          content.content.forEach((node, index) => {
            // 同时支持 heading 和 headingWithId 类型
            if (node.type === "heading" || node.type === "headingWithId") {
              // 对于普通 heading，使用索引作为 ID
              const id = (node.attrs && node.attrs.id) || `heading-${index}`;
              // 获取级别
              const level = node.attrs ? node.attrs.level : 1;
              let text = "";

              // 提取标题文本
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
                index,
                position: index,
              });
            }
          });
        }

        return headingsList;
      } catch (error) {
        console.error("提取标题时出错:", error);
        return [];
      }
    };

    const updateHeadings = () => {
      if (editor.isDestroyed) return;

      // 检查当前编辑器是否与活动标签页匹配
      if (activeTabsItem && editor) {
        const newHeadings = extractHeadings();
        setHeadings(newHeadings);
      }
    };

    // 初始提取标题
    updateHeadings();

    // 监听编辑器内容变化
    const updateHandler = editor.on("update", updateHeadings);

    // 监听编辑器事务
    const transactionHandler = editor.on("transaction", updateHeadings);

    // 监听编辑器焦点变化
    const focusHandler = editor.on("focus", () => {
      console.log("编辑器获得焦点");
      // 如果当前编辑器与活动标签页匹配，则更新标题
      if (activeTabsItem && editor) {
        updateHeadings();
      }
    });

    return () => {
      if (typeof updateHandler === "function") {
        updateHandler();
      }
      if (typeof transactionHandler === "function") {
        transactionHandler();
      }
      if (typeof focusHandler === "function") {
        focusHandler();
      }
    };
  }, [editor, forceUpdate, activeTabsItem]);

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

  // 监听编辑器滚动位置，高亮当前可见的标题
  useEffect(() => {
    if (!editor) return;

    const handleScroll = () => {
      try {
        // 获取当前活动标签页的ID
        const activeTabId = activeTabsItem?.value;

        // 找到所有标题元素
        const headingElements = document.querySelectorAll(
          ".ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror h6",
        );

        if (headingElements.length === 0) return;

        // 找到当前可见的标题
        let currentHeading = null;
        const editorElement =
          editor.view.dom.closest(".ProseMirror-wrapper") ||
          editor.view.dom.parentElement ||
          document.querySelector(".tiptap-container");

        if (!editorElement) return;

        const scrollTop = editorElement.scrollTop;
        const viewportHeight = editorElement.clientHeight;
        const editorRect = editorElement.getBoundingClientRect();

        for (let i = 0; i < headingElements.length; i++) {
          const element = headingElements[i];
          const rect = element.getBoundingClientRect();
          const elementTop = rect.top - editorRect.top;

          if (elementTop <= 100) {
            // 标题在视口顶部或接近顶部
            currentHeading = element.id;
          } else {
            break; // 找到第一个不在视口内的标题就停止
          }
        }

        if (currentHeading !== activeHeading) {
          setActiveHeading(currentHeading);
          if (currentHeading) {
            setSelectedItems([currentHeading]);
          }
        }
      } catch (error) {
        console.error("处理滚动时出错:", error);
      }
    };

    // 找到正确的滚动容器
    const editorElement =
      editor.view.dom.closest(".ProseMirror-wrapper") ||
      editor.view.dom.parentElement ||
      document.querySelector(".tiptap-container");

    if (editorElement) {
      editorElement.addEventListener("scroll", handleScroll);

      // 初始触发一次滚动处理，确保初始状态正确
      setTimeout(handleScroll, 300);

      return () => {
        editorElement.removeEventListener("scroll", handleScroll);
      };
    }
  }, [editor, activeHeading, forceUpdate, activeTabsItem]);

  // 点击目录项滚动到对应位置
  const handleSelectItems = (items) => {
    setSelectedItems(items);

    if (items.length > 0 && editor) {
      const headingId = items[0];
      if (headingId === "root") return;

      try {
        // 获取当前活动标签页的ID
        const activeTabId = activeTabsItem?.value;

        // 构建完整的标题ID，包含标签页ID前缀
        const fullHeadingId = headingId;

        // 直接使用标题ID查找元素
        const targetHeading = document.getElementById(fullHeadingId);

        if (targetHeading) {
          // 找到编辑器的滚动容器
          const scrollContainer =
            editor.view.dom.closest(".ProseMirror-wrapper") ||
            editor.view.dom.parentElement ||
            document.querySelector(".tiptap-container") ||
            document.querySelector(".EditorContent");

          if (scrollContainer) {
            // 计算元素相对于滚动容器的位置
            const elementRect = targetHeading.getBoundingClientRect();
            const containerRect = scrollContainer.getBoundingClientRect();
            const relativeTop =
              elementRect.top - containerRect.top + scrollContainer.scrollTop;

            // 滚动到元素位置
            scrollContainer.scrollTo({
              top: relativeTop - 20, // 添加一些顶部边距
              behavior: "smooth",
            });
          } else {
            // 回退方案：直接使用元素的scrollIntoView
            targetHeading.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        } else {
          console.log("未找到标题元素，尝试使用编辑器命令滚动", fullHeadingId);

          // 查找文档中的所有标题节点
          const headingNodes = [];
          editor.state.doc.descendants((node, pos) => {
            // 同时支持 heading 和 headingWithId 类型
            if (
              (node.type.name === "heading" ||
                node.type.name === "headingWithId") &&
              node.attrs.id === headingId
            ) {
              headingNodes.push({ node, pos });
            }
          });

          if (headingNodes.length > 0) {
            // 使用编辑器的命令滚动到该位置
            editor.commands.scrollIntoView(headingNodes[0].pos, 0);
          } else {
            console.warn("未找到匹配的标题节点:", headingId);
          }
        }
      } catch (error) {
        console.error("滚动到标题时出错:", error);
      }
    }
  };

  return (
    <div className="document-outline">
      <div className="outline-header">
        <h3 className="text-zinc-800 font-bold p-4">文档目录</h3>
      </div>
      {Object.keys(items).length > 1 ? (
        <UncontrolledTreeEnvironment
          key={`tree-${forceUpdate}`}
          dataProvider={new StaticTreeDataProvider(items)}
          canDragAndDrop={false}
          canDropOnFolder={false}
          canReorderItems={false}
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
                }
              }}
              style={{
                textDecoration: "none", // 移除下划线
                color: "inherit", // 使用继承的颜色
                display: "block", // 块级显示
                padding: "4px 8px", // 添加内边距
                cursor: "pointer", // 鼠标指针
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
  );
}
