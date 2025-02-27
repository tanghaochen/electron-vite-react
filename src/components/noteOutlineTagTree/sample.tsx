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
import {DragDropContext, Droppable, Draggable} from "@hello-pangea/dnd";

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
    children?: React.ReactNode;
};

const ITEMS: TreeViewBaseItem<ExtendedTreeItemProps>[] = [
    {
        id: "1",
        label: "Documents",
        children: [
            {
                id: "1.1",
                label: "Company",
                children: [
                    {id: "1.1.1", label: "Invoice", fileType: "pdf"},
                    {id: "1.1.2", label: "Meeting notes", fileType: "doc"},
                    {id: "1.1.3", label: "Tasks list", fileType: "doc"},
                    {id: "1.1.4", label: "Equipment", fileType: "pdf"},
                    {id: "1.1.5", label: "Video conference", fileType: "video"},
                ],
            },
            {id: "1.2", label: "Personal", fileType: "folder"},
            {id: "1.3", label: "Group photo", fileType: "image"},
        ],
    },
    {
        id: "2",
        label: "Bookmarked",
        fileType: "pinned",
        children: [
            {id: "2.1", label: "Learning materials", fileType: "folder"},
            {id: "2.2", label: "News", fileType: "folder"},
            {id: "2.3", label: "Forums", fileType: "folder"},
            {id: "2.4", label: "Travel documents", fileType: "pdf"},
        ],
    },
    {id: "3", label: "History", fileType: "folder"},
    {id: "4", label: "Trash", fileType: "trash"},
];

const reorderItems = (
    list,
    startIndex,
    endIndex,
    sourceParentId?,
    destinationParentId?,
) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    if (sourceParentId !== destinationParentId) {
        // Update the parent-child relationships when moving between parents
        const moveItemToNewParent = (items, itemId, newParentId) => {
            const parentItem = items.find((item) => item.id === newParentId);
            if (parentItem) {
                parentItem.children = [...(parentItem.children || []), itemId];
            }
        };
        // Call this for the new parent and old parent if necessary
        moveItemToNewParent(result, removed.id, destinationParentId);
    }

    return result;
};

const FileExplorer = () => {
    const [items, setItems] = React.useState(ITEMS);

    const onDragEnd = (result) => {
        const {source, destination} = result;
        if (!destination) return;

        const reordered = reorderItems(items, source.index, destination.index);
        setItems(reordered);
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="droppable" direction="vertical">
                {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                        <RichTreeView
                            items={items}
                            defaultExpandedItems={["1", "1.1"]}
                            defaultSelectedItems="1.1"
                            sx={{
                                height: "fit-content",
                                flexGrow: 1,
                                maxWidth: 400,
                                overflowY: "auto",
                            }}
                            slots={{item: CustomTreeItem}}
                        />
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
};

export default FileExplorer;
