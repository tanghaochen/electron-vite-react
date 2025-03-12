import {DndContext, MouseSensor, useSensor, useSensors} from '@dnd-kit/core';
import {
    rectSortingStrategy,
    SortableContext,
    useSortable
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {useEffect, useState} from 'react';
import {restrictToParentElement} from "@dnd-kit/modifiers";
import './style.scss'
import {IconButton} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import * as React from "react";
import MaterialIcon from "@/components/materialIcon";
import AddIcon from '@mui/icons-material/Add';
import SellIcon from '@mui/icons-material/Sell';
import {Divide} from "lucide-react";
import {worksListDB} from "@/database/worksLists";

function SortableItem({id, index, value}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({id, index});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    // 组件结构优化
    return (
        <li
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="worksBarItem" // 移除非必要 class
        >
            <span className="truncate">{value}</span>
            <div className='optionBtn'>
                <IconButton
                    aria-label="add"
                    size="small"
                >
                    <AddIcon fontSize="inherit"/>
                </IconButton>
                <IconButton
                    aria-label="delete"
                    size="small"
                >
                    <DeleteIcon fontSize="inherit"/>
                </IconButton>
            </div>
        </li>
    );

}

export default function App() {
    // const [items, setItems] = useState(['Item 333333333333333333333333331', 'Item 2', 'Item 3', 'Item 4']);
    const [worksList, setWorksList] = useState(['Item 333333333333333333333333331', 'Item 2', 'Item 3', 'Item 4']);

//拖拽传感器，在移动像素5px范围内，不触发拖拽事件
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    function handleDragEnd(event) {
        const {active, over} = event;

        if (over && active.id !== over.id) {
            setWorksList((items) => {
                const oldIndex = items.findIndex(item => item === active.id);
                const newIndex = items.findIndex(item => item === over.id);

                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }

    useEffect(() => {
        console.log('Items updated:', worksList);
    }, [worksList]);

    const handleAddWorksBtn = (e) => {
        setWorksList((item) => {
            // const newItem =  item.push('未命名')
            // console.log('newItem', newItem)
            return [...item, '未命名']
        })
        worksListDB.cre
    }
    return (
        <div>
            <div className='flex content-center mx-4  justify-between'>
                <div className='content-center flex gap-2'>
                    <SellIcon/>
                    tagsName
                </div>
                <IconButton
                    aria-label="add"
                    size="small"
                    onClick={handleAddWorksBtn}
                >
                    <AddIcon fontSize="small"/>
                </IconButton>
            </div>
            <div className='flex flex-col  gap-4 justify-center'
                 style={{height: '50vh',
                     display:worksList?.length && 'none',
                     color:'#8A8F8D'}}>
                <div className='flex justify-center'>
                    <svg t="1741698415168" className="icon" viewBox="0 0 1024 1024"
                         version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1596"
                         width="100" height="100">
                        <path
                            d="M831.7 369.4H193.6L64 602v290.3h897.2V602L831.7 369.4zM626.6 604.6c0 62.9-51 113.9-114 113.9s-114-51-114-113.9H117.5l103.8-198h582.5l103.8 198h-281zM502.2 131h39.1v140.6h-39.1zM236.855 200.802l27.647-27.647 99.419 99.418-27.648 27.648zM667.547 272.637l99.418-99.419 27.648 27.648-99.418 99.418z"
                            p-id="1597" fill="#bfbfbf"></path>
                    </svg>
                </div>
                <div className='text-center'>
                    词库为空, 点击右上方 ＋ 号新建
                </div>
            </div>
            {/*// restrictToParentElement: 限制在父容器内*/}
            <DndContext onDragEnd={handleDragEnd}
                        modifiers={[restrictToParentElement]}>
                <SortableContext items={worksList}
                                 strategy={rectSortingStrategy}
                                 sensors={sensors}
                >
                    <ul className="worksBarlist">
                        {worksList.map((item, index) => (
                            <SortableItem
                                key={item}
                                id={item}
                                index={index}
                                value={item}
                            />
                        ))}
                    </ul>
                </SortableContext>
            </DndContext>
        </div>
    );
}

function arrayMove(array, from, to) {
    const newArray = array.slice();
    newArray.splice(to < 0 ? newArray.length + to : to, 0,
        newArray.splice(from, 1)[0]
    );
    return newArray;
}
