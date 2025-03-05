import {tagsdb} from "@/database/tagsdb";
import {treeList} from "@/utool/treeListDataHandler";
import {styled, Typography} from "@mui/material";
import * as React from "react";
import {useEffect} from "react";
import {
    TreeItem2Checkbox,
    TreeItem2Content,
    TreeItem2IconContainer,
    TreeItem2Label,
    TreeItem2Root,
} from "@mui/x-tree-view/TreeItem2";

const StyledTreeItemLabelText = styled(Typography)({
    color: "inherit",
    fontFamily: "General Sans",
    width: '100%',
    fontWeight: 500,
}) as unknown as typeof Typography;

interface CustomLabelProps {
    children: React.ReactNode;
    icon?: React.ElementType;
    expandable?: boolean;
    itemId?: number;
}


export default function CustomLabel({
                                        icon: Icon,
                                        expandable,
                                        children,
                                        itemId,
                                        selectedItem,
                                        selectedItemId,
                                        setItems,
                                        setSelectedItemId,
                                        ...other
                                    }) {
    const inputRef = React.useRef(null);
    const [inputValue, setInputValue] = React.useState("");
    useEffect(() => {
        if (itemId === selectedItemId) {
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    setInputValue(children);
                }
            }, 0);
        }
    }, [selectedItemId]);

    const handleClick = () => {
        // 聚焦输入框
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const updateTreeItemLabel = (items, itemId, newLabel) => {
        return treeList.updateById(items, itemId, {label: newLabel});

        return items.map((item) => {
            if (item.id === itemId) {
                return {...item, label: newLabel};
            } else if (item.children) {
                return {
                    ...item,
                    children: updateTreeItemLabel(item.children, itemId, newLabel),
                };
            }
            return item;
        });
    };

    const handleInputBlur = (e) => {
        console.log('handleInputBlur', selectedItem)
        selectedItem.dbID = selectedItem.id
        tagsdb.updateTag(selectedItem.dbID || selectedItem.id, {
            label: inputValue // 根据需求添加其他字段
            // icon: 'new_icon',
            // color: '#ff0000'
        });
        setItems((prevItems) =>
            updateTreeItemLabel(prevItems, selectedItemId, inputValue),
        );
        setSelectedItemId("-1");
    };

    return (
        <TreeItem2Label
            {...other}
            sx={{
                display: "flex",
                alignItems: "center",
            }}
            onClick={handleClick}
            role='debug-ccustomlabel'
        >
            {/*{Icon && (*/}
            {/*    <Box*/}
            {/*        component={Icon}*/}
            {/*        className="labelIcon"*/}
            {/*        color="inherit"*/}
            {/*        sx={{mr: 1, fontSize: '1.2rem'}}*/}
            {/*    />*/}
            {/*)}*/}

            {itemId != selectedItemId && (
                <StyledTreeItemLabelText variant="body2">
                    {children}
                </StyledTreeItemLabelText>
            )}

            {/* 条件渲染 input 元素 */}
            {itemId === selectedItemId && (
                <input
                    ref={inputRef}
                    type="text"
                    className="pointer-events-none w-full"
                    id="name"
                    name="name"
                    onBlur={handleInputBlur}
                    required
                    value={inputValue} // 绑定值
                    onKeyDown={(e) => {
                        e.stopPropagation(); // 阻止事件冒泡
                        if (e.key === "Enter") {
                            e.target.blur(); // Remove focus from the input when Enter is pressed
                        }
                    }}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                    }} // 更新值
                    minLength="1"
                    maxLength="30"
                    size="10"
                />
            )}
        </TreeItem2Label>
    );
}