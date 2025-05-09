import React, { useState } from "react";
import { Menu, MenuItem, IconButton } from "@mui/material";
import { Delete, Edit, Add, FindInPage } from "@mui/icons-material";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import MenuList from "@mui/material/MenuList";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Typography from "@mui/material/Typography";
import ContentCut from "@mui/icons-material/ContentCut";
import ContentCopy from "@mui/icons-material/ContentCopy";
import ContentPaste from "@mui/icons-material/ContentPaste";
import "./style.scss";

const ContextMenu = ({
  anchorEl,
  onClose,
  onEdit,
  onDelete,
  onAdd,
  onFind,
  contextMenu,
}) => {
  return (
    <Paper sx={{ width: 220, maxWidth: "100%" }}>
      <Menu
        PaperProps={{
          style: {
            borderRadius: ".5rem",
            boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.1)",
            border: "1px solid #e0e0e0",
            padding: "0",
          },
        }}
        open={contextMenu !== null}
        onClose={onClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={onAdd}>
          <ListItemIcon>
            <Add fontSize="small" />
          </ListItemIcon>
          <ListItemText className="pr-24">添加</ListItemText>
        </MenuItem>
        <MenuItem onClick={onEdit}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>编辑</ListItemText>
        </MenuItem>
        <MenuItem onClick={onDelete}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>删除</ListItemText>
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default ContextMenu;
