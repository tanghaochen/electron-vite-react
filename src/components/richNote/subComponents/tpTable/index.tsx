import * as React from "react";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Grow from "@mui/material/Grow";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";
import { Editor } from "@tiptap/react";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import ListItemText from "@mui/material/ListItemText";
import "./tableStyle.scss";
import MaterialIcon from "@/components/materialIcon";

interface TableSelectorProps {
  editor: Editor;
}

const TableOperations = ({ editor }: TableSelectorProps) => {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement>(null);

  // 检查是否在表格中
  const isInTable = editor?.isActive("table");

  // 常用操作命令
  const tableCommands = [
    {
      label: "插入表格",
      icon: '<BorderAllIcon fontSize="small" />',
      action: () =>
        editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
      alwaysEnabled: true,
    },
    {
      label: "前方插入列",
      icon: '<AddBoxIcon fontSize="small" />',
      action: () => editor.chain().focus().addColumnBefore().run(),
      disabled: !isInTable,
    },
    {
      label: "后方插入列",
      icon: '<AddBoxIcon fontSize="small" />',
      action: () => editor.chain().focus().addColumnAfter().run(),
      disabled: !isInTable,
    },
    {
      label: "删除列",
      icon: '<DeleteIcon fontSize="small" />',
      action: () => editor.chain().focus().deleteColumn().run(),
      disabled: !isInTable,
    },
    {
      label: "上方插入行",
      icon: '<AddBoxIcon fontSize="small" />',
      action: () => editor.chain().focus().addRowBefore().run(),
      disabled: !isInTable,
    },
    {
      label: "下方插入行",
      icon: '<AddBoxIcon fontSize="small" />',
      action: () => editor.chain().focus().addRowAfter().run(),
      disabled: !isInTable,
    },
    {
      label: "删除行",
      icon: '<DeleteIcon fontSize="small" />',
      action: () => editor.chain().focus().deleteRow().run(),
      disabled: !isInTable,
    },
    {
      label: "合并单元格",
      icon: '<MergeIcon fontSize="small" />',
      action: () => editor.chain().focus().mergeCells().run(),
      disabled: !isInTable,
    },
    {
      label: "拆分单元格",
      icon: '<CallSplitIcon fontSize="small" />',
      action: () => editor.chain().focus().splitCell().run(),
      disabled: !isInTable,
    },
    {
      label: "删除表格",
      icon: '<DeleteIcon fontSize="small" />',
      action: () => editor.chain().focus().deleteTable().run(),
      disabled: !isInTable,
    },
  ];

  const handleToggle = () => setOpen((prev) => !prev);
  const handleClose = (event: Event) => {
    if (anchorRef.current?.contains(event.target as HTMLElement)) return;
    setOpen(false);
  };

  return (
    <React.Fragment>
      <ButtonGroup
        variant="none"
        ref={anchorRef}
        aria-label="table operations"
        className="ml-2"
        style={{ minWidth: 100, justifyContent: "flex-start" }}
      >
        <Button
          onClick={() => tableCommands[0].action()}
          disabled={!editor?.isEditable}
        >
          <MaterialIcon name="table_edit" size="1.5rem" />
        </Button>
        <Button size="small" onClick={handleToggle}>
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        transition
        disablePortal
        sx={{ zIndex: 1300 }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} style={{ transformOrigin: "left top" }}>
            <Paper elevation={3} sx={{ minWidth: 220 }}>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList dense>
                  <Typography variant="subtitle2" sx={{ px: 2, py: 1 }}>
                    表格操作
                  </Typography>
                  <Divider />

                  {/* 基础操作 */}
                  {tableCommands.map((cmd, index) => (
                    <MenuItem
                      key={index}
                      onClick={() => {
                        cmd.action();
                        handleClose(new Event("click"));
                      }}
                      disabled={cmd.disabled && !cmd.alwaysEnabled}
                    >
                      <ListItemText>{cmd.label}</ListItemText>
                    </MenuItem>
                  ))}

                  <Divider />

                  {/* 高级操作 */}
                  <MenuItem
                    disabled={!isInTable}
                    onClick={() =>
                      editor.chain().focus().toggleHeaderRow().run()
                    }
                  >
                    {/* <TableChartIcon fontSize="small" /> */}
                    切换表头行
                  </MenuItem>
                  <MenuItem
                    disabled={!isInTable}
                    onClick={() =>
                      editor.chain().focus().toggleHeaderColumn().run()
                    }
                  >
                    切换表头列
                  </MenuItem>
                  <MenuItem
                    disabled={!isInTable}
                    onClick={() => editor.chain().focus().goToNextCell().run()}
                  >
                    下一个单元格
                  </MenuItem>
                  <MenuItem
                    disabled={!isInTable}
                    onClick={() =>
                      editor.chain().focus().goToPreviousCell().run()
                    }
                  >
                    上一个单元格
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </React.Fragment>
  );
};

export default TableOperations;
