import { DndContext, MouseSensor, useSensor, useSensors } from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import "./style.scss";
import { IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import * as React from "react";
import MaterialIcon from "@/components/materialIcon";
import AddIcon from "@mui/icons-material/Add";
import SellIcon from "@mui/icons-material/Sell";
import { Divide } from "lucide-react";
import { worksListDB } from "@/database/worksLists";
import Button from "@mui/material/Button";

function SortableItem({
  index,
  item,
  onAdd,
  onDelete,
  worksItem,
}: {
  index: number;
  item: any;
  onAdd: any;
  onDelete: any;
  worksItem: any;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id, index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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

  // 组件结构优化
  return (
    <li
      ref={setNodeRef}
      style={style}
      worksid={item.id}
      {...attributes}
      {...listeners}
      className={`worksBarItem ${
        !!worksItem && worksItem?.id === item.id ? "worksBarItem_active" : ""
      }`} // 移除非必要 class
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
}) {
  // const [items, setItems] = useState(['Item 333333333333333333333333331', 'Item 2', 'Item 3', 'Item 4']);
  // 词库列表的的分类标签标题
  const [worksListTitle, setWorksListTitle] = useState("未命名");

  useEffect(() => {
    setWorksList([]);
    setWorksListTitle(selectedTagItem?.label || "未命名");
    // 获取词库列表
    const fetchData = async () => {
      if (!selectedTagItem) return;
      try {
        const worksListRes =
          (await worksListDB.getMetadataByTagId(selectedTagItem.index)) || [];
        setWorksList((item) => {
          return item.concat(worksListRes);
        });
      } catch (error) {
        console.error("数据获取失败:", error);
      }
    };
    fetchData();
  }, [selectedTagItem?.index]);

  // useEffect(() => {
  //     console.log('selectedTagItem?.title111111111', worksList, worksItem)
  //     if(!worksItem?.title) return
  //     // 更改对应某个数据的title
  //     setWorksList((item) => {
  //         return item.map((item) => {
  //             if(item.id == worksItem.id){
  //                 item.title = worksItem.title
  //             }
  //             return item
  //         })
  //     })
  // }, [worksItem?.title]);

  //拖拽传感器，在移动像素5px范围内，不触发拖拽事件
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  function handleDragEnd(event) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWorksList((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        // 获取新数组
        const newItems = arrayMove(items, oldIndex, newIndex);

        // 更新数据库排序
        newItems.forEach((item, index) => {
          worksListDB.updateMetadata(item.id, { sort_order: index });
        });

        return newItems.map((item, index) => ({
          ...item,
          sort_order: index,
        }));
      });
    }
  }

  const handleAddWorksBtn = async (e) => {
    try {
      if (!selectedTagItem?.index) {
        throw new Error("未选择有效标签");
      }
      console.log("selectedTagItem", selectedTagItem);
      const newItem = await worksListDB.createMetadata({
        tags_id: selectedTagItem.index,
        title: "", // 添加默认标题
        sort_order: worksList.length, // 自动生成排序序号
      });

      console.log("新建结果:", newItem);

      // 更新状态（带完整数据）
      setWorksList((prev) => [
        ...prev,
        {
          id: newItem.id,
          title: newItem.title,
          tags_id: newItem.tags_id,
          sort_order: newItem.index,
        },
      ]);
    } catch (error) {
      console.error("创建失败:", error);
      alert(`创建失败: ${error.message}`);
    }
  };

  const handleAddWorksNote = async (parentItem) => {
    try {
      // 获取插入位置
      const parentIndex = worksList.findIndex(
        (item) => item.id === parentItem.id,
      );
      const insertPosition = parentIndex + 1;

      // 创建新条目
      const newItem = await worksListDB.createMetadata({
        tags_id: selectedTagItem?.index,
        parent_id: parentItem?.id || 0,
        title: "未命名",
        sort_order: insertPosition,
      });

      // 更新后续条目的排序值
      const updatedList = worksList.map((item) => {
        if (item.sort_order >= insertPosition) {
          return { ...item, sort_order: item.sort_order + 1 };
        }
        return item;
      });

      // 插入新条目
      updatedList.splice(insertPosition, 0, {
        ...newItem,
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

  const handleDeleteWorksNote = async (itemId) => {
    try {
      await worksListDB.deleteMetadata(itemId);
      setWorksList((prev) => prev.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error("删除失败:", error);
    }
  };
  return (
    <div>
      <div className="flex items-center mx-4 justify-between">
        <div className="content-center flex gap-2 py-2 text-zinc-500">
          <SellIcon />
          {worksListTitle || "未命名标签"}
        </div>
        <Button
          color="#000000"
          size="small"
          style={{
            backgroundColor: "#F5F5F5",
          }}
          className="size-8 my-auto"
          onClick={handleAddWorksBtn}
        >
          <AddIcon fontSize="small" />
        </Button>
      </div>
      <div
        className="flex flex-col  gap-4 justify-center"
        style={{
          height: "50vh",
          display: (worksList?.length && "none") || "flex",
          color: "#8A8F8D",
        }}
      >
        <div className="flex justify-center">
          <svg
            t="1741698415168"
            className="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="1596"
            width="100"
            height="100"
          >
            <path
              d="M831.7 369.4H193.6L64 602v290.3h897.2V602L831.7 369.4zM626.6 604.6c0 62.9-51 113.9-114 113.9s-114-51-114-113.9H117.5l103.8-198h582.5l103.8 198h-281zM502.2 131h39.1v140.6h-39.1zM236.855 200.802l27.647-27.647 99.419 99.418-27.648 27.648zM667.547 272.637l99.418-99.419 27.648 27.648-99.418 99.418z"
              p-id="1597"
              fill="#bfbfbf"
            ></path>
          </svg>
        </div>
        <div className="text-center">词库为空, 点击右上方 ＋ 号新建</div>
      </div>
      {/*// restrictToParentElement: 限制在父容器内*/}
      {worksList?.length > 0 && (
        <DndContext
          onDragEnd={handleDragEnd}
          sensors={sensors}
          modifiers={[restrictToParentElement]}
        >
          <SortableContext
            items={worksList}
            strategy={rectSortingStrategy}
            sensors={sensors}
          >
            <ul
              className="worksBarlist"
              onClick={(e) => {
                const targetEle = e.nativeEvent.target.closest("li");
                if (targetEle.tagName !== "LI") return;
                const worksID = targetEle.getAttribute("worksid");
                const worksItem = worksList.find((item) => item.id == worksID);
                setWorksItem(worksItem); // NOTE 设置当前选中的词库
                console.log("worksItem", worksItem);
                // const targetBtn = e.nativeEvent.target.closest('BUTTON')
              }}
            >
              {worksList.map((item, index) => {
                return (
                  <SortableItem
                    index={index}
                    item={item}
                    worksItem={worksItem}
                    key={item.id}
                    onAdd={handleAddWorksNote}
                    onDelete={handleDeleteWorksNote}
                  />
                );
              })}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function arrayMove(array, from, to) {
  const newArray = array.slice();
  newArray.splice(
    to < 0 ? newArray.length + to : to,
    0,
    newArray.splice(from, 1)[0],
  );
  return newArray;
}
