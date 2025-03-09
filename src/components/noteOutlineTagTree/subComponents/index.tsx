import { tagsdb } from "@/database/tagsdb";
import { treeList } from "@/utool/treeListDataHandler";
import { styled, Typography } from "@mui/material";
import React from "react";
import { TreeItem2Label } from "@mui/x-tree-view/TreeItem2";

const StyledTreeItemLabelText = styled(Typography)({
    color: "inherit",
    fontFamily: "General Sans",
    width: '100%',
    fontWeight: 500,
}) as unknown as typeof Typography;

interface CustomLabelProps {
    children: React.ReactNode;
    itemId?: string;
    selectedItem?: any;
    selectedItemId?: string | null;
    setItems: React.Dispatch<React.SetStateAction<any[]>>;
    setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
}

// 优化点 1: 使用 React.memo 包裹组件
const CustomLabel = React.memo(
    ({
         children,
         itemId,
         selectedItem,
         selectedItemId,
         setItems,
         setSelectedItemId,
     }: CustomLabelProps) => {
        const inputRef = React.useRef<HTMLInputElement>(null);
        const [inputValue, setInputValue] = React.useState("");

        // 优化点 2: 使用 useCallback 缓存回调函数
        const updateTreeItemLabel = React.useCallback(
            (items: any[], targetId: string, newLabel: string) => {
                return treeList.updateById(items, targetId, { label: newLabel });
            },
            []
        );

        // 优化点 3: 使用 useEffect 的 cleanup 函数管理状态
        React.useEffect(() => {
            if (itemId === selectedItemId && inputRef.current) {
                const inputElement = inputRef.current;
                inputElement.focus();
                setInputValue(children as string);

                // 添加清理函数
                return () => {
                    setInputValue("");
                };
            }
        }, [selectedItemId, itemId, children]);

        // 优化点 4: 使用 useCallback 缓存事件处理函数
        const handleInputBlur = React.useCallback(
            async (e: React.FocusEvent<HTMLInputElement>) => {
                if (!selectedItem || !selectedItemId) return;

                try {
                    // 优化点 5: 合并数据库操作和状态更新
                    await tagsdb.updateTag(selectedItem.id, {
                        label: inputValue
                    });

                    setItems(prev =>
                        updateTreeItemLabel(prev, selectedItemId, inputValue)
                    );
                } catch (error) {
                    console.error("Update failed:", error);
                } finally {
                    setSelectedItemId(null);
                }
            },
            [selectedItem, selectedItemId, inputValue, setItems, setSelectedItemId, updateTreeItemLabel]
        );

        // 优化点 6: 分离静态内容渲染
        const renderStaticContent = () => (
            <StyledTreeItemLabelText variant="body2">
                {children}
            </StyledTreeItemLabelText>
        );

        // 优化点 7: 单独抽离输入框组件
        const renderInputField = () => (
            <input
                ref={inputRef}
                type="text"
                className="pointer-events-none w-full"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={handleInputBlur}
                onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
                minLength={1}
                maxLength={30}
                size={10}
            />
        );

        return (
            <TreeItem2Label
                sx={{
                    display: "flex",
                    alignItems: "center",
                    // 优化点 8: 避免使用动态样式计算
                    padding: "2px 4px",
                    "&:hover": {
                        backgroundColor: "rgba(0, 0, 0, 0.04)"
                    }
                }}
            >
                {itemId === selectedItemId ? renderInputField() : renderStaticContent()}
            </TreeItem2Label>
        );
    },
    // 优化点 9: 自定义 props 比较函数
    (prevProps, nextProps) => {
        const isSameSelected = prevProps.selectedItemId === nextProps.selectedItemId;
        const isSameItem = prevProps.itemId === nextProps.itemId;
        const isSameContent = prevProps.children === nextProps.children;

        // 只在相关 props 变化时重新渲染
        return isSameSelected && isSameItem && isSameContent;
    }
);

export default CustomLabel;
