import { useEffect, useState, useRef } from "react";
import "./style.scss";
import { IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import * as React from "react";
import MaterialIcon from "@/components/materialIcon";
import AddIcon from "@mui/icons-material/Add";
import SellIcon from "@mui/icons-material/Sell";
import { worksListDB } from "@/database/worksLists";
import Button from "@mui/material/Button";

interface WorksListItem {
  id: number;
  title: string;
  sort_order: number;
  tags_id: number;
}

function WorksBarItem({
  item,
  onAdd,
  onDelete,
  worksItem,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  item: WorksListItem;
  onAdd: (item: WorksListItem) => void;
  onDelete: (id: number) => void;
  worksItem: WorksListItem | null;
  onDragStart: (e: React.DragEvent<HTMLLIElement>, item: WorksListItem) => void;
  onDragOver: (e: React.DragEvent<HTMLLIElement>, item: WorksListItem) => void;
  onDrop: (e: React.DragEvent<HTMLLIElement>, item: WorksListItem) => void;
}) {
  const handleAddWorskNote = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onAdd(item);
  };

  const handleDelWorskNote = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (window.confirm("确定要删除此项吗？")) {
      onDelete(item.id);
    }
  };

  return (
    <li
      draggable
      data-id={item.id}
      onDragStart={(e) => onDragStart(e, item)}
      onDragOver={(e) => onDragOver(e, item)}
      onDrop={(e) => onDrop(e, item)}
      className={`worksBarItem ${
        !!worksItem && worksItem?.id === item.id ? "worksBarItem_active" : ""
      }`}
    >
      <span className="truncate">{item.title || "未命名"}</span>
      <div className="optionBtn">
        <IconButton aria-label="add" size="small" onClick={handleAddWorskNote}>
          <AddIcon fontSize="inherit" />
        </IconButton>
        <IconButton
          aria-label="delete"
          size="small"
          onClick={handleDelWorskNote}
        >
          <DeleteIcon fontSize="inherit" />
        </IconButton>
      </div>
    </li>
  );
}

export default function WorksBar({
  selectedTagItem,
  worksItem,
  setWorksItem,
  worksList,
  setWorksList,
}: {
  selectedTagItem: any;
  worksItem: WorksListItem | null;
  setWorksItem: (item: WorksListItem) => void;
  worksList: WorksListItem[];
  setWorksList: (list: WorksListItem[]) => void;
}) {
  const [worksListTitle, setWorksListTitle] = useState("未命名");
  const [draggedItem, setDraggedItem] = useState<WorksListItem | null>(null);
  const [dropPosition, setDropPosition] = useState<{
    id: number;
    position: "before" | "after";
  } | null>(null);
  const previewLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWorksList([]);
    setWorksListTitle(selectedTagItem?.label || "未命名");
    const fetchData = async () => {
      if (!selectedTagItem) return;
      try {
        const worksListRes =
          (await worksListDB.getMetadataByTagId(selectedTagItem.index)) || [];
        const sortedList = worksListRes.sort(
          (a: WorksListItem, b: WorksListItem) =>
            (a.sort_order || 0) - (b.sort_order || 0),
        );
        setWorksList(sortedList);
      } catch (error) {
        console.error("数据获取失败:", error);
      }
    };
    fetchData();
  }, [selectedTagItem?.index]);

  const handleDragStart = (
    e: React.DragEvent<HTMLLIElement>,
    item: WorksListItem,
  ) => {
    setDraggedItem(item);
    // 设置拖拽数据
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        type: "worksItem",
        data: item,
      }),
    );
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLLIElement>,
    item: WorksListItem,
  ) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === item.id) {
      if (previewLineRef.current) {
        previewLineRef.current.style.display = "none";
      }
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const listRect = e.currentTarget.closest("ul")?.getBoundingClientRect();
    if (!listRect) return;

    const mouseY = e.clientY;
    const itemMiddle = rect.top + rect.height / 2;
    const position = mouseY < itemMiddle ? "before" : "after";

    setDropPosition({ id: item.id, position });

    // 更新预览线位置
    if (previewLineRef.current) {
      previewLineRef.current.style.display = "block";
      // 计算相对于列表容器的位置
      const relativeTop = rect.top - listRect.top;
      const relativeBottom = rect.bottom - listRect.top;

      if (worksList[0].id === item.id && position === "before") {
        previewLineRef.current.style.top = "0px";
      } else {
        previewLineRef.current.style.top =
          position === "before" ? `${relativeTop}px` : `${relativeBottom}px`;
      }
    }
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLLIElement>,
    targetItem: WorksListItem,
  ) => {
    e.preventDefault();
    if (!draggedItem || !dropPosition || draggedItem.id === targetItem.id)
      return;

    const oldIndex = worksList.findIndex((item) => item.id === draggedItem.id);
    const targetIndex = worksList.findIndex(
      (item) => item.id === targetItem.id,
    );
    let newIndex =
      dropPosition.position === "before" ? targetIndex : targetIndex + 1;

    // 处理拖拽到第一个元素的情况
    if (targetIndex === 0 && dropPosition.position === "before") {
      newIndex = 0;
    }

    if (oldIndex === newIndex) return;

    const newItems = arrayMove(worksList, oldIndex, newIndex);
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      sort_order: index,
    }));

    // 更新数据库
    for (const item of updatedItems) {
      await worksListDB.updateMetadata(item.id, {
        sort_order: item.sort_order,
      });
    }

    setWorksList(updatedItems);
    setDraggedItem(null);
    setDropPosition(null);
    if (previewLineRef.current) {
      previewLineRef.current.style.display = "none";
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDropPosition(null);
    if (previewLineRef.current) {
      previewLineRef.current.style.display = "none";
    }
  };

  const handleAddWorksBtn = async (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      if (!selectedTagItem?.index) {
        throw new Error("未选择有效标签");
      }
      const newItem = (await worksListDB.createMetadata({
        tags_id: selectedTagItem.index,
        title: "", // 添加默认标题
        sort_order: worksList.length, // 自动生成排序序号
      })) as WorksListItem;

      // 更新状态（带完整数据）
      setWorksList([
        ...worksList,
        {
          id: newItem.id,
          title: newItem.title || "",
          tags_id: newItem.tags_id,
          sort_order: worksList.length,
        },
      ]);
    } catch (error: any) {
      console.error("创建失败:", error);
      alert(`创建失败: ${error.message}`);
    }
  };

  const handleAddWorksNote = async (parentItem: WorksListItem) => {
    try {
      // 获取插入位置
      const parentIndex = worksList.findIndex(
        (item) => item.id === parentItem.id,
      );
      const insertPosition = parentIndex + 1;

      // 创建新条目
      const newItem = (await worksListDB.createMetadata({
        tags_id: selectedTagItem?.index,
        parent_id: parentItem?.id || 0,
        title: "未命名",
        sort_order: insertPosition,
      })) as WorksListItem;

      // 更新后续条目的排序值
      const updatedList = worksList.map((item) => {
        if (item.sort_order >= insertPosition) {
          return { ...item, sort_order: item.sort_order + 1 };
        }
        return item;
      });

      // 插入新条目
      updatedList.splice(insertPosition, 0, {
        id: newItem.id,
        title: newItem.title || "未命名",
        tags_id: newItem.tags_id,
        sort_order: insertPosition,
      });

      // 批量更新数据库
      updatedList.slice(insertPosition).forEach((item) => {
        worksListDB.updateMetadata(item.id, { sort_order: item.sort_order });
      });

      setWorksList(updatedList);
    } catch (error) {
      console.error("添加失败:", error);
    }
  };

  const handleDeleteWorksNote = async (itemId: number) => {
    try {
      await worksListDB.deleteMetadata(itemId);
      setWorksList(worksList.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error("删除失败:", error);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mx-4 w-[calc(100%-32px)]">
        <div className="flex gap-2 py-2 text-zinc-500 flex-1 min-w-0">
          <SellIcon className="flex-shrink-0" />
          <span className="truncate">{worksListTitle || "未命名标签"}</span>
        </div>
        <Button
          variant="contained"
          size="small"
          style={{
            backgroundColor: "#F5F5F5",
            color: "#000000",
          }}
          className="flex-shrink-0 size-8 my-auto"
          onClick={handleAddWorksBtn}
        >
          <AddIcon fontSize="small" />
        </Button>
      </div>
      <div
        className="flex flex-col gap-4 justify-center"
        style={{
          height: "50vh",
          display: (worksList?.length && "none") || "flex",
          color: "#8A8F8D",
        }}
      >
        <div className="flex justify-center">
          <svg
            className="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            width="100"
            height="100"
          >
            <path
              d="M831.7 369.4H193.6L64 602v290.3h897.2V602L831.7 369.4zM626.6 604.6c0 62.9-51 113.9-114 113.9s-114-51-114-113.9H117.5l103.8-198h582.5l103.8 198h-281zM502.2 131h39.1v140.6h-39.1zM236.855 200.802l27.647-27.647 99.419 99.418-27.648 27.648zM667.547 272.637l99.418-99.419 27.648 27.648-99.418 99.418z"
              fill="#bfbfbf"
            ></path>
          </svg>
        </div>
        <div className="text-center">词库为空, 点击右上方 ＋ 号新建</div>
      </div>
      {worksList?.length > 0 && (
        <div className="relative">
          <div
            ref={previewLineRef}
            className="absolute left-0 right-0 h-0.5 bg-blue-500 hidden"
            style={{ pointerEvents: "none" }}
          />
          <ul
            className="worksBarlist"
            onDragEnd={handleDragEnd}
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDragEnter={(e) => {
              e.preventDefault();
            }}
            onClick={(e) => {
              const targetEle = e.target as HTMLElement;
              const li = targetEle.closest("li");
              if (!li) return;
              const worksID = li.getAttribute("data-id");
              if (!worksID) return;
              const worksItem = worksList.find(
                (item) => item.id === Number(worksID),
              );
              if (worksItem) {
                setWorksItem(worksItem);
              }
            }}
          >
            {worksList.map((item) => (
              <WorksBarItem
                key={item.id}
                item={item}
                worksItem={worksItem}
                onAdd={handleAddWorksNote}
                onDelete={handleDeleteWorksNote}
                // onDrag={(e) => {
                //   e.currentTarget.style.opacity = "0";
                //   e.currentTarget.style.backgroundColor = "red";
                // }}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const newArray = array.slice();
  newArray.splice(
    to < 0 ? newArray.length + to : to,
    0,
    newArray.splice(from, 1)[0],
  );
  return newArray;
}
