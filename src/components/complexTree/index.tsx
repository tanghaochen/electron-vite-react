import {
  StaticTreeDataProvider,
  Tree,
  UncontrolledTreeEnvironment,
} from "react-complex-tree";
import "react-complex-tree/lib/style-modern.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { tagsdb } from "@/database/tagsdb";
import { treeList } from "@/utool/treeListDataHandler";
import ContextMenu from "@/components/noteOutlineTagTree/contextMenu";
import * as React from "react";
import { nanoid } from "nanoid";
import contextMenuEvents from "@/components/complexTree/libs/contextMenuEvents";

export default function App() {
  // 默认数据
  const [items, setItems] = useState({
    root: {
      index: "root",
      isFolder: true,
      children: [],
      label: "未命名标签",
    },
  });
  const [focusedItem, setFocusedItem] = useState();
  const [expandedItems, setExpandedItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [contextMenu, setContextMenu] = React.useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  // 将数据库获取的数组数据转换为组件需要的结构
  function convertToTree(data) {
    const nodes = {};
    const root = {
      index: "root",
      isFolder: true,
      children: [],
      label: "Root",
    };

    // 构建节点Map
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const nodeId = item.id.toString();
      nodes[nodeId] = {
        index: nodeId,
        label: item.label || "未命名",
        children: [],
        isFolder: true,
        sort_order: item.sort_order || 0, // 保留sort_order
        parent_id: item.parent_id || 0, // 保留sort_order
      };
    }

    // 根据sort_order排序
    data.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const nodeId = item.id.toString();
      const parentId = !item.parent_id ? "root" : item.parent_id;

      if (parentId === "root") {
        root.children.push(nodeId);
      } else {
        const parent = nodes[parentId];
        if (parent) {
          parent.children.push(nodeId);
        }
      }
    }

    nodes.root = root;
    return nodes;
  }
  const environment = useRef();
  const tree = useRef();

  const dataProvider = useMemo(() => {
    class CustomDataProvider {
      data = items;

      listeners = [];
      newItemID = null;

      getTreeItem = async (itemId) => {
        const item = this.data[itemId];
        // items[itemId].isFolder=true
        console.log("getTreeItem", item);
        return {
          ...item,
          isFolder: item?.children && item.children.length > 0, // 关键修改
        };
      };
      renameItem = async (item, newName) => {
        this.data[item.index].label = newName;
        this.emitChange([item.index]);
        tagsdb.updateTag(this.newItemID ? this.newItemID : item.index, {
          label: newName,
        });
      };
      async onChangeItemChildren(itemId, newChildren) {
        this.data[itemId].children = newChildren;
        console.log("onChangeItemChildren");
        this.emitChange([itemId]);
      }

      onDidChangeTreeData = (listener) => {
        this.listeners.push(listener);
        console.log("onDidChangeTreeData");
        return {
          dispose: () =>
            (this.listeners = this.listeners.filter((l) => l !== listener)),
        };
      };

      emitChange = (changedItemIds) => {
        this.listeners.forEach((listener) => listener(changedItemIds));
      };
      // TODO 删除父元素没有删除children，要一起删除
      deleteItem = (itemId) => {
        // 找到所有数据中包含删除id的元素
        const parent = Object.values(this.data).find((item) =>
          item.children?.includes(itemId),
        );
        // 删除元素下所有子元素
        const deleteChildren = (children) => {
          children.forEach((childId) => {
            deleteChildren(this.data[childId].children);
            delete this.data[childId];
            tagsdb.deleteTag(childId);
          });
        };
        deleteChildren([itemId]);
        // 去除children包含某个元素的数组
        if (parent) {
          parent.children = parent.children.filter(
            (childId) => childId !== itemId,
          );
        }
        delete this.data[itemId];
        this.emitChange([parent.index]);
        tagsdb.deleteTag(itemId);
      };
      // 新增item
      injectItem = async (parentItemId, label = "未命名") => {
        tree.current.expandItem(parentItemId);

        let newItemID = await tagsdb.createTag(1, label, parentItemId);
        newItemID = String(newItemID)
        this.data[newItemID] = { index: newItemID, label, children: [], parent_id:parentItemId };
        if (!this.data[parentItemId].children) {
          this.data[parentItemId].children = [];
        }
        console.log('this.data[parentItemId],newItemID', this.data[parentItemId],this.data[newItemID])
        this.data[parentItemId].isFolder = true;
        this.data[parentItemId].children.push(newItemID);
        this.newItemID = newItemID;
        this.emitChange([parentItemId]);
        setTimeout(() => {
          tree.current.startRenamingItem(newItemID);
        }, 100);
      };
    }

    return new CustomDataProvider();
  }, []);

  useEffect(() => {
    // Fetch data from the database
    const fetchData = async () => {
      try {
        const getTreeData = await tagsdb.getTagsByCategory(1);
        const fetchedItems = convertToTree(getTreeData);
        console.log("转换后的树形结构:", fetchedItems, getTreeData);
        setItems(fetchedItems);

        // 👇重点：手动更新dataProvider的数据
        dataProvider.data = fetchedItems;
        dataProvider.emitChange(["root"]); // 通知UI刷新
      } catch (error) {
        console.error("数据获取失败:", error);
      }
    };
    fetchData();
  }, [dataProvider]);

  const useContextMenuEvents = contextMenuEvents({
    contextMenu,
    setContextMenu,
    tree,
    items,
    dataProvider,
  });

  const handleItemDrop = (items, target) => {
    /**
     * @item 选中的被拖拽的元素
     * @target drop拖拽结束的元素
     */
    console.log("拖拽结束:", items, "目标:", target);
    console.log("dataProvider", dataProvider);

    const dropItemID = target.targetItem === "root" ? "0" : target.targetItem;
    const dragItem = items[0];
    let dropPosition: "top" | "bottom" | undefined = target?.linePosition; // 没有这个值表示children
    if (!dropPosition) dropPosition = "children";
    // const dropItemID = target.parentItem
    // 更新拖拽后的层级
    items.forEach((item) => {
      tagsdb.updateTag(item.index, {
        parent_id: dropItemID,
      });
    });
    console.log(dragItem.index, dropItemID, dropPosition);
    // tagsdb.reorderIndex(dragItem.index, dropItemID, dropPosition);
    //获取需要保存排序的层级，这里只能获取到嵌套的 有children的， 另外一种是第一层级
    // const siderItem = dataProvider.data[dropItemID]?.children || [];
    // 需要更新被拖拽之后item排序和拖拽进入之后索引
    // console.log("current", tree.current, environment.current);
    let dropItem = null;
    let forIndex = 0;
    let targetDropIndex = 4;
    let targetParentID = 0;
    for (const objIndex in dataProvider.data) {
      const objItem = dataProvider.data[objIndex];
      console.log(
        objIndex,
        objItem,
        targetDropIndex,
        objItem.parent_id,
        targetParentID,
      );
      if (objItem.parent_id == targetParentID) {
        forIndex++;
      }
      if (forIndex == targetDropIndex) {
        console.log("=====>", forIndex, objItem);
      }
    }
    console.log(forIndex);
    // console.log("siderItem", siderItem, dragStartIndex);
    // 此处还可以更新数据到数据库
    // tagsdb.updateTag(items.index, {
    //     sort_order: target.childIndex,
    // })
  };

  const handleContextMenu = (event, item) => {
    // event.preventDefault();
    // event.stopPropagation();
    console.log("event,item", event, item);
    setContextMenu({
      visible: true,
      mouseX: event.clientX,
      mouseY: event.clientY,
      targetItem: item.item.index, // store the item's ID (or the whole item if needed)
    });
  };
  // Custom renderItem to integrate onContextMenu
  const renderItem = ({ item, title, context, arrow, children }) => {
    const InteractiveComponent = "div";
    return (
      <li {...context.itemContainerWithChildrenProps}>
        <InteractiveComponent
          {...context.itemContainerWithoutChildrenProps}
          {...context.interactiveElementProps}
          onContextMenu={(e) => handleContextMenu(e, item)}
          className="flex"
        >
          {arrow} <span className="ml-4"> {title}</span>
        </InteractiveComponent>
        {children}
      </li>
    );
  };
  return (
    <div className="w-full h-fullc">
      <UncontrolledTreeEnvironment
        ref={environment}
        canDragAndDrop={true}
        canDropOnFolder={true}
        canReorderItems
        canDropOnNonFolder // 建议false，防止非文件夹意外接收子节点
        canDropBelowOpenFolders
        getItemTitle={(item) => item.label} // 指定lable
        dataProvider={dataProvider}
        viewState={{
          ["root"]: {
            focusedItem,
            expandedItems,
            selectedItems,
          },
        }}
        // viewstate:记录控制状态
        // viewState={{
        //     ['tree-1']: {
        //         focusedItem: 'America',
        //         selectedItems: ['America', 'Europe', 'Asia'],
        //         expandedItems: ['Meals', 'Drinks'],
        //     },
        // }}
        onFocusItem={(item) => setFocusedItem(item.label)}
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
        onRenameItem={(item, name) => dataProvider.renameItem(item, name)}
        onSelectItems={(items) => setSelectedItems(items)}
        // 重命名回调
        // 展开箭头
        // renderItemArrow={({ item, context }) =>
        //     context?.children?.length
        // }
        // renderItem={renderItem} // 自定义渲染某个item
        renderItemTitle={(item) => (
          <span
            className="w-full h-full content-center"
            onContextMenu={(e) => handleContextMenu(e, item)}
          >
            {item.title}
          </span>
        )}
        onDragStart={(items, source) => {
          console.log("拖拽开始:", items, "来自:", source);
        }}
        onDrop={handleItemDrop}
      >
        <Tree
          treeId="tree-1"
          rootItem="root"
          treeLabel="Tree Example"
          ref={tree}
        />
      </UncontrolledTreeEnvironment>
      <ContextMenu
        onClose={useContextMenuEvents.handleCloseMenu}
        onEdit={useContextMenuEvents.handleEditItem}
        onDelete={useContextMenuEvents.handleDeleteItem}
        onAdd={useContextMenuEvents.handleAddItem}
        onFind={useContextMenuEvents.handleFindItem}
        contextMenu={contextMenu}
      />
    </div>
  );
}
