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
import "./style.scss";
import { ChromePicker, CompactPicker } from "react-color";
import { styled } from "@mui/material/styles";
import TColorPicker from "@/components/richNote/tColorPicker";
import MaterialIcon from "@/components/materialIcon";
import { SelectChangeEvent } from "@mui/material/Select";
import { worksListDB } from "@/database/worksLists";
import { paragraphTList } from "@/components/richNote/constants";
import ListItemText from "@mui/material/ListItemText";

const colors = [
  "transparent",
  "#F2F3F5",
  "#FBBFBC",
  "#FEDDB6",
  "#FFF895",
  "#C5F1C1",
  "#CFDDFE",
  "#DCC9FB",
  "#E5E6E9",
  "#BBBFC4",
  "#F76964",
  "#FFA53D",
  "#FFE928",
  "#92DF8A",
  "#9EBBFE",
  "#C4A4FA",
];

const textColor = [
  "#DE7802",
  "#646A73",
  "#D83931",
  "#DE7802",
  "#DC9B04",
  "#2EA121",
  "#245BDB",
  "#6425D0",
];

// 注释跳转
// @Link ./style.scss
export default function HeadingSelector({ editor }) {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  //   关闭颜色选择器
  const handleClose = (event: Event) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpen(false);
  };

  //+========================
  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 7 + ITEM_PADDING_TOP, // 7个选项的高度
        width: 200,
      },
    },
  };
  const [selectedPara, setSelectedPara] = React.useState("正文"); // 修改1: 使用字符串状态
  // 实时获取当前段落/标题状态
  const currentValue = React.useMemo(() => {
    if (!editor) return "正文";

    // 检查是否是标题（优先级从h1到h6）
    for (let level = 1; level <= 6; level++) {
      if (editor.isActive("heading", { level })) {
        return `标题${level}`;
      }
    }
    return "正文";
  }, [editor?.state]); // 当编辑器状态变化时自动更新
  const handleChange = (event: SelectChangeEvent<string>) => {
    // 修改2: 处理字符串值
    const value = event.target.value;
    setSelectedPara(value);

    // 根据选择执行编辑器命令
    if (value === "正文") {
      editor?.chain().focus().setParagraph().run();
    } else if (value.startsWith("标题")) {
      const level = parseInt(value.replace("标题", ""));
      editor?.chain().focus().toggleHeading({ level }).run();
    }
  };
  // 打开颜色选择器
  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };
  // 点击btn group 取消高亮和字体颜色
  const handleClick = () => {
    editor.chain().focus().unsetColor().run();
    editor.chain().focus().unsetHighlight().run();
  };

  return (
    <React.Fragment>
      {/*颜色按钮*/}
      <ButtonGroup
        className="ml-2"
        variant="none"
        ref={anchorRef}
        aria-label="Button group with a nested menu"
      >
        <Button onClick={handleClick}>
          <span
            className="w-12"
            style={{
              fontSize: "1rem",
              height: "1.5rem",
            }}
          >
            {currentValue}
          </span>
        </Button>
        <Button
          size="small"
          aria-controls={open ? "split-button-menu" : undefined}
          aria-expanded={open ? "true" : undefined}
          aria-label="select merge strategy"
          aria-haspopup="menu"
          onClick={handleToggle}
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
        sx={{ zIndex: 1 }}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === "bottom" ? "center top" : "center bottom",
            }}
          >
            <Paper>
              <div className="">
                <ClickAwayListener onClickAway={handleClose}>
                  <div>
                    {paragraphTList.map((paraItem, paraIndex) => (
                      <MenuItem
                        key={paraItem.label}
                        value={paraItem.label}
                        sx={{
                          py: 1, // 减少纵向padding
                          "& h1, & h2, & h3, & h4, & h5, & h6": {
                            margin: 0,
                            lineHeight: "1.3",
                            letterSpacing: "0.5px",
                          },
                        }}
                      >
                        <ListItemText>
                          {React.createElement(
                            paraIndex === 0 ? "p" : `h${paraIndex}`,
                            {
                              style: {
                                fontSize:
                                  paraIndex === 0
                                    ? "1rem"
                                    : `${2 - paraIndex * 0.2}rem`,
                                fontWeight: paraIndex === 0 ? 400 : 600,
                                color: "#333",
                                marginTop: paraIndex === 0 && "0.5rem",
                                marginBottom: paraIndex === 0 && ".5rem",
                              },
                            },
                            paraItem.label,
                          )}
                        </ListItemText>
                      </MenuItem>
                    ))}
                  </div>
                </ClickAwayListener>
              </div>
            </Paper>
          </Grow>
        )}
      </Popper>
    </React.Fragment>
  );
}
