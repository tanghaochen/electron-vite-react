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
import {ChromePicker, CompactPicker} from "react-color";
import {styled} from "@mui/material/styles";
import TColorPicker from "@/components/richNote/tColorPicker";
import MaterialIcon from "@/components/materialIcon";

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
export default function Highlight({editor}) {
    const [open, setOpen] = React.useState(false);
    const anchorRef = React.useRef<HTMLDivElement>(null);
    // @Link ./style.scss
    const [textColorPicker, setTextColorPicker] = React.useState("");
    const [hightLightColorPicker, setHightLightColorPicker] = React.useState("");

    // 实时获取颜色状态
    const currentTextColor = editor?.getAttributes("textStyle").color || "";
    const currentHighlightColor = editor?.getAttributes("highlight").color || "";

    React.useEffect(() => {
        setTextColorPicker(currentTextColor);
        setHightLightColorPicker(currentHighlightColor);
    }, [editor?.state]); // 监听编辑器状态变化

    // 点击btn group 取消高亮和字体颜色
    const handleClick = () => {
        editor.chain().focus().unsetColor().run();
        editor.chain().focus().unsetHighlight().run();
    };

    // 打开颜色选择器
    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen);
    };
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

    // 点击字体颜色
    const handleChangeComplete = (color) => {
        setTextColorPicker(color);
        editor.chain().focus().setColor(color).run();
        setOpen(false);
    };

    // 点击btn group 取消高亮和字体颜色
    const handleTextColorBtn = () => {
        editor.chain().focus().unsetColor().run();
    };

    // 点击高亮颜色
    const handleHightLightColor = (color) => {
        setHightLightColorPicker(color);
        editor.chain().focus().setHighlight({color}).run();
        setOpen(false);
    };

    // 取消高亮
    const handleUnhightLightColor = () => {
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
                      className="w-4"
                      style={{
                          fontSize: "1rem",
                          width: "1.5rem",
                          height: "1.5rem",
                          color: `${currentTextColor} !important`,
                          backgroundColor: currentHighlightColor,
                          borderBottom: `.2rem solid ${textColorPicker}`,
                      }}
                  >
                    A
                  </span>
                    {/*{options[selectedIndex]}*/}
                </Button>
                <Button
                    size="small"
                    aria-controls={open ? "split-button-menu" : undefined}
                    aria-expanded={open ? "true" : undefined}
                    aria-label="select merge strategy"
                    aria-haspopup="menu"
                    onClick={handleToggle}
                >
                    <ArrowDropDownIcon/>
                </Button>
            </ButtonGroup>
            <Popper
                sx={{zIndex: 1}}
                open={open}
                anchorEl={anchorRef.current}
                role={undefined}
                transition
                disablePortal
            >
                {({TransitionProps, placement}) => (
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
                                        <div>字体颜色</div>
                                        <Button
                                            className={"w-full font-black"}
                                            color={"black"}
                                            variant={"text"}
                                            onClick={handleUnhightLightColor}
                                        >
                                            <MaterialIcon
                                                name={"disabled_by_default"}
                                                size={"1.5rem"}
                                            />
                                            无填充色
                                        </Button>
                                        <TColorPicker
                                            colors={textColor}
                                            value={hightLightColorPicker}
                                            onChange={handleHightLightColor}
                                        />
                                        <div className={"mt-4"}>背景颜色</div>
                                        <Button
                                            className={"w-full font-black"}
                                            color={"black"}
                                            variant={"text"}
                                            onClick={handleTextColorBtn}
                                        >
                                            <MaterialIcon
                                                name={"disabled_by_default"}
                                                size={"1.5rem"}
                                            />
                                            无填充色
                                        </Button>
                                        <TColorPicker
                                            colors={colors}
                                            value={textColorPicker}
                                            onChange={handleChangeComplete}
                                        />
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
