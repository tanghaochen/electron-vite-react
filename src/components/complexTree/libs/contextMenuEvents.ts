import { useEffect } from "react";
import { tagsdb } from "@/database/tagsdb";

export default function contextMenuEvents({
  contextMenu,
  setContextMenu,
  tree,
  items,
  dataProvider,
}) {
  const handleCloseMenu = () => {
    setContextMenu(null);
  };
  const handleAddItem = async () => {
    handleCloseMenu();

    if (!contextMenu?.targetItem) return;
    // 调用自定义 dataProvider 的 injectItem 方法：
    dataProvider.injectItem(contextMenu.targetItem);
    console.log("contextMenu", contextMenu);
  };

  const handleEditItem = (e) => {
    // Handle editing the selected item
    handleCloseMenu();
    const renameRes = tree.current.startRenamingItem(contextMenu.targetItem);
    console.log("renameRes", renameRes);
  };

  const handleDeleteItem = () => {
    // Handle deleting the selected item
    handleCloseMenu();

    if (items.root.children.length === 0) return;
    if (!contextMenu?.targetItem || contextMenu.targetItem === "root") return;

    dataProvider.deleteItem(contextMenu.targetItem);
  };

  const handleFindItem = () => {
    handleCloseMenu();
  };
  useEffect(
    () => dataProvider.onDidChangeTreeData((changedItemIds) => {}).dispose,
    [dataProvider, items],
  );
  const handleContextMenu = (event, item) => {
    // event.preventDefault();
    // event.stopPropagation();
    console.log("event,item", event, item);
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      targetItem: item.item.index, // store the item's ID (or the whole item if needed)
    });
  };

  return {
    handleContextMenu,
    handleCloseMenu,
    handleAddItem,
    handleEditItem,
    handleDeleteItem,
    handleFindItem,
  };
}
