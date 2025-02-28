import * as React from "react";
import clsx from "clsx";
import {animated, useSpring} from "@react-spring/web";
import {styled, alpha} from "@mui/material/styles";
import {TransitionProps} from "@mui/material/transitions";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import Typography from "@mui/material/Typography";
import ArticleIcon from "@mui/icons-material/Article";
import DeleteIcon from "@mui/icons-material/Delete";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import FolderRounded from "@mui/icons-material/FolderRounded";
import ImageIcon from "@mui/icons-material/Image";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import VideoCameraBackIcon from "@mui/icons-material/VideoCameraBack";
import {RichTreeView} from "@mui/x-tree-view/RichTreeView";
import {treeItemClasses} from "@mui/x-tree-view/TreeItem";
import {nanoid} from "nanoid";
import {
    useTreeItem2,
    UseTreeItem2Parameters,
} from "@mui/x-tree-view/useTreeItem2";
import {
    TreeItem2Checkbox,
    TreeItem2Content,
    TreeItem2IconContainer,
    TreeItem2Label,
    TreeItem2Root,
} from "@mui/x-tree-view/TreeItem2";
import {TreeItem2Icon} from "@mui/x-tree-view/TreeItem2Icon";
import {TreeItem2Provider} from "@mui/x-tree-view/TreeItem2Provider";
import {
    TreeItem2DragAndDropOverlay
} from "@mui/x-tree-view/TreeItem2DragAndDropOverlay";
import {TreeViewBaseItem} from "@mui/x-tree-view/models";
import {debounce, throttle} from "lodash";
import {
    createRef,
    useEffect,
    useId,
    useImperativeHandle,
    useRef,
    useState,
} from "react";
import "./style.scss";
import ContextMenu from "./contextMenu";
import {treeList} from "@/utool/treeListDataHandler";

type FileType =
    | "image"
    | "pdf"
    | "doc"
    | "video"
    | "folder"
    | "pinned"
    | "trash";

type ExtendedTreeItemProps = {
    fileType?: FileType;
    id: string;
    label: string;
};
declare module "react" {
    interface CSSProperties {
        "--tree-view-color"?: string;
        "--tree-view-bg-color"?: string;
    }
}
const tagTreeList = () => {
    const ITEMS: TreeViewBaseItem<ExtendedTreeItemProps>[] = [
        {
            id: "1",
            label: "Documents",
            children: [
                {
                    id: "11",
                    label: "Company",
                    children: [
                        {id: "111", label: "Invoice", fileType: "pdf"},
                        {id: "112", label: "Meeting notes", fileType: "doc"},
                        {id: "113", label: "Tasks list", fileType: "doc"},
                        {id: "114", label: "Equipment", fileType: "pdf"},
                        {
                            id: "115",
                            label: "Video conference",
                            fileType: "video",
                        },
                    ],
                },
                {id: "12", label: "Personal", fileType: "folder"},
                {id: "13", label: "Group photo", fileType: "image"},
            ],
        },
        {
            id: "2",
            label: "Bookmarked",
            fileType: "pinned",
            children: [
                {id: "21", label: "Learning materials", fileType: "folder"},
                {id: "22", label: "News", fileType: "folder"},
                {id: "23", label: "Forums", fileType: "folder"},
                {id: "24", label: "Travel documents", fileType: "pdf"},
            ],
        },
        {id: "3", label: "History", fileType: "folder"},
        {id: "4", label: "Trash", fileType: "trash"},
    ];
    const [items, setItems] =
        useState<TreeViewBaseItem<ExtendedTreeItemProps>[]>(ITEMS);
    const [contextID, setContextID] = useState("-1");
    const [selectedItemId, setSelectedItemId] = useState(null); // For storing the selected item ID

    const [dragStartIDRecording, setDragStartIDRecording] = useState("-1");
    const [dragEndIDRecording, setDragEndIDRecording] = useState("-1");

    const StyledTreeItemRoot = styled(TreeItem2Root)(({theme}) => ({
        color: theme.palette.grey[400],
        position: "relative",
        [`& .${treeItemClasses.groupTransition}`]: {
            marginLeft: theme.spacing(3.5),
        },
        ...theme.applyStyles("light", {
            color: theme.palette.grey[800],
        }),
    })) as unknown as typeof TreeItem2Root;

    const CustomTreeItemContent = styled(TreeItem2Content)(({theme}) => ({
        flexDirection: "row-reverse",
        borderRadius: theme.spacing(0.7),
        padding: `.3rem ${theme.spacing(0.5)}`,
        paddingRight: theme.spacing(1),
        fontWeight: 500,
        [`&.Mui-expanded `]: {
            "&:not(.Mui-focused, .Mui-selected, .Mui-selected.Mui-focused) .labelIcon":
                {
                    color: theme.palette.primary.dark,
                    ...theme.applyStyles("light", {
                        color: theme.palette.primary.main,
                    }),
                },
            "&::before": {
                content: '""',
                display: "block",
                position: "absolute",
                left: "16px",
                top: "44px",
                height: "calc(100% - 48px)",
                width: "1.5px",
                backgroundColor: theme.palette.grey[700],
                ...theme.applyStyles("light", {
                    backgroundColor: theme.palette.grey[300],
                }),
            },
        },
        "&:hover": {
            backgroundColor: "#EFF0F0",
            color: "black",
        },
        [`&.Mui-focused, &.Mui-selected, &.Mui-selected.Mui-focused`]: {
            color: "black",
            fontWeight: "bold"
        },
    }));

    const AnimatedCollapse = animated(Collapse);

    function TransitionComponent(props: TransitionProps) {
        const style = useSpring({
            to: {
                opacity: props.in ? 1 : 0,
                transform: `translate3d(0,${props.in ? 0 : 20}px,0)`,
            },
        });

        return <AnimatedCollapse style={style} {...props} />;
    }

    const StyledTreeItemLabelText = styled(Typography)({
        color: "inherit",
        fontFamily: "General Sans",
        fontWeight: 500,
    }) as unknown as typeof Typography;

    interface CustomLabelProps {
        children: React.ReactNode;
        icon?: React.ElementType;
        expandable?: boolean;
        itemId?: number;
    }

    function CustomLabel({
                             icon: Icon,
                             expandable,
                             children,
                             itemId,
                             ...other
                         }: CustomLabelProps) {
        const inputRef = React.useRef(null);
        const [inputValue, setInputValue] = useState("");
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
                        {children}-{itemId}
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

    const isExpandable = (reactChildren: React.ReactNode) => {
        if (Array.isArray(reactChildren)) {
            return reactChildren.length > 0 && reactChildren.some(isExpandable);
        }
        return Boolean(reactChildren);
    };

    const getIconFromFileType = (fileType: FileType) => {
        switch (fileType) {
            case "image":
                return ImageIcon;
            case "pdf":
                return PictureAsPdfIcon;
            case "doc":
                return ArticleIcon;
            case "video":
                return VideoCameraBackIcon;
            case "folder":
                return FolderRounded;
            case "pinned":
                return FolderOpenIcon;
            case "trash":
                return DeleteIcon;
            default:
                return ArticleIcon;
        }
    };

    interface CustomTreeItemProps
        extends Omit<UseTreeItem2Parameters, "rootRef">,
            Omit<React.HTMLAttributes<HTMLLIElement>, "onFocus"> {
        dragEnterItemID: string | undefined;
        dragStyle: string;
        setDragEnterItemID: React.Dispatch<
            React.SetStateAction<string | undefined>
        >;
        setDragStyle: React.Dispatch<React.SetStateAction<string>>;
        setContextMenu: React.Dispatch<
            React.SetStateAction<{
                mouseX: number;
                mouseY: number;
            } | null>
        >;
    }

    const CustomTreeItem = React.forwardRef(function CustomTreeItem(
        props: CustomTreeItemProps,
        ref: React.Ref<HTMLLIElement>,
    ) {
        const {
            id,
            itemId,
            label,
            disabled,
            children,
            dragEnterItemID,
            dragStyle,
            setDragEnterItemID,
            setDragStyle,
            setContextMenu,
            ...other
        } = props;

        const {
            getRootProps,
            getContentProps,
            getIconContainerProps,
            getCheckboxProps,
            getLabelProps,
            getGroupTransitionProps,
            getDragAndDropOverlayProps,
            status,
            publicAPI,
        } = useTreeItem2({id, itemId, children, label, disabled, rootRef: ref});

        const item = publicAPI.getItem(itemId);
        const expandable = isExpandable(children);
        let icon;
        if (expandable) {
            icon = FolderRounded;
        } else if (item.fileType) {
            icon = getIconFromFileType(item.fileType);
        }

        const dropItemRef = useRef(null);

        const handleItemDragStart = (e, itemID) => {
            e.dataTransfer.effectAllowed = "move";
            setTimeout(() => {
                setDragStartIDRecording(itemID);
            });
        };

        const throttleOverItem = throttle(
            (e) => {
                if (dropItemRef.current.parentElement.role !== "treeitem") {
                    return;
                }
                // 获取 drop 元素的位置
                const dropRect = dropItemRef.current.getBoundingClientRect();
                const {pageY: mouseY} = e;
                const DISTANCE = 8;
                // 判断鼠标在目标元素的哪个位置：上、中、下
                if (
                    mouseY > dropRect.top - DISTANCE &&
                    mouseY < dropRect.top + DISTANCE
                ) {
                    console.log("top");
                    if (dragStyle !== "top") setDragStyle("top");
                } else if (
                    mouseY > dropRect.top + DISTANCE &&
                    mouseY < dropRect.top + dropRect.height - DISTANCE
                ) {
                    console.log("middle");
                    if (dragStyle !== "middle") setDragStyle("middle");
                } else if (
                    mouseY > dropRect.top + dropRect.height - DISTANCE &&
                    mouseY < dropRect.top + dropRect.height + DISTANCE
                ) {
                    console.log("bottom");
                    if (dragStyle !== "bottom") setDragStyle("bottom");
                }
            },
            166,
            {trailing: false},
        );

        const handleItemDragOver = (e, itemID) => {
            e.stopPropagation();
            e.preventDefault();
            if (itemID != dragEnterItemID) setDragEnterItemID(itemID);
            throttleOverItem(e);
        };

        const handleItemDragEnter = (e, itemID) => {
            setDragEndIDRecording(itemID);
        };

        const handleItemDragLeave = (e) => {
        };

        const handleItemDrop = (e) => {
            e.preventDefault();
            setDragEnterItemID("-1");
            setDragStyle("none");
            // 获取拖拽开始和放下的id
            const startDataList = window.structuredClone(
                treeList.findById(items, dragStartIDRecording),
            );
            setItems(treeList.removeById(items, dragStartIDRecording));

            // Check if startDataList is valid
            if (!startDataList) {
                console.error(
                    "Item not found for dragStartIDRecording:",
                    dragStartIDRecording,
                );
                return;
            }

            // Generate a new unique ID for the item being inserted to prevent duplicate ID
            const newItemID = nanoid(); // Use nanoid to generate a unique ID

            // Update the cloned item with the new unique ID
            startDataList.id = newItemID;

            // Prepare the position object based on the drag style
            const positionObj = {
                top: "before",
                middle: "child",
                bottom: "after",
            };

            // Insert the node with the new ID
            setItems((prevItems) => {
                const updatedItems = treeList.insertNode(prevItems, startDataList, {
                    id: dragEndIDRecording,
                    location: positionObj[dragStyle],
                });
                return updatedItems;
            });
        };

        const onContextMenu = (e, itemId) => {
            e.stopPropagation();
            setContextID(itemId);
            setContextMenu({
                mouseX: e.clientX + 2,
                mouseY: e.clientY - 6,
            });
        };

        return (
            <TreeItem2Provider itemId={itemId}>
                <StyledTreeItemRoot
                    onContextMenu={(e) => {
                        onContextMenu(e, itemId);
                    }}
                    className={`${
                        itemId == dragEnterItemID ? `drop-border-${dragStyle}` : ""
                    }`}
                    {...getRootProps(other)}
                >
                    <CustomTreeItemContent
                        {...getContentProps({
                            className: clsx("content", {
                                "Mui-expanded": status.expanded,
                                "Mui-selected": status.selected,
                                "Mui-focused": status.focused,
                                "Mui-disabled": status.disabled,
                            }),
                        })}
                        onDragStart={(e) => {
                            handleItemDragStart(e, itemId);
                        }}
                        onDragOver={(e) => {
                            handleItemDragOver(e, itemId);
                        }}
                        onDragLeave={handleItemDragLeave}
                        onDragEnter={(e) => {
                            handleItemDragEnter(e, itemId);
                        }}
                        onDrop={handleItemDrop}
                        draggable
                        ref={dropItemRef}
                    >
                        {/*折叠箭头*/}
                        <TreeItem2IconContainer {...getIconContainerProps()}>
                            <TreeItem2Icon status={status}/>
                        </TreeItem2IconContainer>
                        {/*图标和文字*/}
                        <CustomLabel
                            {...getLabelProps({
                                icon,
                                expandable: expandable && status.expanded,
                            })}
                            itemId={itemId}
                        />
                        {/*<TreeItem2DragAndDropOverlay {...getDragAndDropOverlayProps()} />*/}
                    </CustomTreeItemContent>
                    {children &&
                        <TransitionComponent {...getGroupTransitionProps()} />}
                </StyledTreeItemRoot>
            </TreeItem2Provider>
        );
    });

    const FileExplorer = () => {
        const [dragEnterItemID, setDragEnterItemID] = useState<string | undefined>(
            undefined,
        );
        const [dragStyle, setDragStyle] = useState<string>("none");
        const [contextMenu, setContextMenu] = React.useState<{
            mouseX: number;
            mouseY: number;
        } | null>(null);
        const richTreeRef = createRef();

        const handleCloseMenu = () => {
            setContextMenu(null);
        };

        const handleAddItem = () => {
            handleCloseMenu();
            const newItemID = nanoid();
            setItems(
                treeList.insertNode(
                    items,
                    {
                        id: newItemID,
                        label: "未命名",
                    },
                    {id: contextID, location: "after"},
                ),
            );
            setSelectedItemId(newItemID);
        };

        const handleEditItem = (e) => {
            // Handle editing the selected item
            handleCloseMenu();
            setSelectedItemId(contextID);
        };

        const handleDeleteItem = () => {
            // Handle deleting the selected item
            handleCloseMenu();
            setItems(treeList.removeById(items, contextID));
        };

        const handleFindItem = () => {
            // Handle finding the selected item
            console.log(`Find item with ID: ${selectedItemId}`);
            handleCloseMenu();
        };

        return (
            <div>
                <RichTreeView
                    items={items}
                    defaultExpandedItems={["1"]}
                    defaultSelectedItems="11"
                    sx={{
                        height: "fit-content",
                        flexGrow: 1,
                        maxWidth: 400,
                        overflowY: "auto",
                    }}
                    slots={{
                        item: (props) => (
                            <CustomTreeItem
                                {...props}
                                ref={richTreeRef}
                                dragEnterItemID={dragEnterItemID}
                                dragStyle={dragStyle}
                                setContextMenu={setContextMenu}
                                setDragEnterItemID={setDragEnterItemID}
                                setDragStyle={setDragStyle}
                            />
                        ),
                    }}
                ></RichTreeView>
                <ContextMenu
                    onClose={handleCloseMenu}
                    onEdit={handleEditItem}
                    onDelete={handleDeleteItem}
                    onAdd={handleAddItem}
                    onFind={handleFindItem}
                    contextMenu={contextMenu}
                />
            </div>
        );
    };

    return FileExplorer();
};

export default tagTreeList;
