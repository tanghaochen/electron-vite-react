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
import './styles/index.scss'
import AddIcon from "@mui/icons-material/Add";
import Button from "@mui/material/Button";
export default function complexTree({ onSelectedTagChange }) {
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
  // 
  const [selectedItems, setSelectedItems] = useState([]);
  // 右键菜单
  const [contextMenu, setContextMenu] = React.useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);
  // 当状态变化时触发回调
  useEffect(() => {
    onSelectedTagChange && onSelectedTagChange(items[selectedItems]);
  }, [selectedItems]);
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
      // 新增item的id
      newItemID = null;
      // 拖拽之后的id list
      dropList = []

      getTreeItem = async (itemId) => {
        const item = this.data[itemId];
        // items[itemId].isFolder=true
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

      // 主要用于拖拽后的数据变化监听
      async onChangeItemChildren(itemId, newChildren) {
        console.log('itemId, newChildren', itemId, newChildren)
        this.data[itemId].children = newChildren;
        this.dropList = newChildren
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
      // 新增item, parentItemId=0表示根节点
      injectItem = async (parentItemId=0, label = "未命名") => {
        const parentIdInTree = parentItemId === 0 ? "root" : String(parentItemId);

        // 展开父节点
        if (tree.current) {
          tree.current.expandItem(parentIdInTree);
        }

        // 同步数据库
        let newItemID = await tagsdb.createTag(1, label, parentItemId);
        newItemID = String(newItemID);

        // 确保父节点存在
        if (parentIdInTree !== "root" && !this.data[parentIdInTree]) {
          console.error("父节点不存在:", parentIdInTree);
          return;
        }

        // 创建新节点
        this.data[newItemID] = {
          index: newItemID,
          label,
          children: [],
          isFolder: false,
          parent_id: parentItemId,
        };

        // 添加到父节点
        if (parentIdInTree === "root") {
          this.data.root.children.push(newItemID);
        } else {
          this.data[parentIdInTree].children.push(newItemID);
          this.data[parentIdInTree].isFolder = true;
        }

        // 触发UI更新
        this.emitChange([parentIdInTree]);

        // 延迟启动重命名
        this.newItemID = newItemID;
        setTimeout(() => {
          if (tree.current) {
            tree.current.startRenamingItem(newItemID);
          }
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
    console.log("拖拽结束:", items, "目标:", target,'的',target.linePosition,target.parentItem);
    const dropItemID = target.parentItem === "root" ? "0" : target.parentItem||0;
    items.forEach((item) => {
      tagsdb.updateTag(item.index, {
        parent_id: dropItemID,
      });
    });

    dataProvider.dropList.forEach((item,index)=>{
      console.log('item', item,index)
        tagsdb.updateTag(item, {
            sort_order: index,
        });
    })
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
  
  const handleAddTagsItem = (e) => {
    dataProvider.injectItem();
  }
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
    <div className="w-full h-full bg-zinc-50">
      <div className='content-center flex gap-2 py-2 text-zinc-500 justify-between px-2'>
      <div className="font-bold p-2 w-full">分类标签</div>
        <Button
            color="#000000"
            size="small"
            style={{
              backgroundColor: 'white',
              border: '1px solid #E0E0E0',
            }}
            className='size-8 my-auto'
            onClick={handleAddTagsItem}
        >
          <AddIcon fontSize="small"/>
        </Button>
      </div>
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
        // onExpandItem={(item) =>
        //   setExpandedItems([...expandedItems, item.index])
        // }
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
            className="w-full h-full content-center text-base text-zinc-800"
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
