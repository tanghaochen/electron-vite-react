import {useCurrentEditor} from "@tiptap/react";
import React, {useEffect, useState} from "react";
import Button from "@mui/material/Button";
import Select, {SelectChangeEvent} from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import {
    extTypeList,
    listTypeList,
    paragraphTList, textAlignTypeList
} from "@/components/richNote/constants";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import HightlightComp from "@/components/richNote/subComponents/highlight";
import {worksListDB} from "@/database/worksLists";

const MenuBar = ({activeTabsItem,setTabs,tabItem,setRichTextTitleInputValue,setWorksList}) => {
    const {editor} = useCurrentEditor();
    const [inputTitleValue, setInputTitleValue] = useState(tabItem.label);
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

    if (!editor) {
        return null;
    }

    const CommonBtn = (props) => {
        const {
            extType = "bold",
            toggleFunName,
            iconName,
            disabled: externalDisabled = false,
        } = props;
        const toggleFun =
            toggleFunName || `toggle${extType[0].toUpperCase()}${extType.slice(1)}`;

        return (
            <Button
                color="#000000"
                size="small"
                style={{
                    backgroundColor: editor?.isActive(extType) ? "#E7E9E8" : "",
                    height: "100%",
                }}
                onClick={() => editor?.chain().focus()[toggleFun]?.().run()}
            >
        <span className="material-symbols-outlined">
          {iconName || `format_${extType}`}
        </span>
            </Button>
        );
    };

    const [selectedPara, setSelectedPara] = React.useState("正文"); // 修改1: 使用字符串状态
    // 实时获取当前段落/标题状态
    const currentValue = React.useMemo(() => {
        if (!editor) return "正文";

        // 检查是否是标题（优先级从h1到h6）
        for (let level = 1; level <= 6; level++) {
            if (editor.isActive("heading", {level})) {
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
            editor?.chain().focus().toggleHeading({level}).run();
        }
    };

    const handleInputTitleBlur = () => {
        // setRichTextTitleInputValue(inputTitleValue)
        // 更新tab标题数据
        setTabs((tabs) => {
            return tabs.map((tab) => {
                if (tab.value === tabItem.value) {
                    tab.label = inputTitleValue;
                    return tab;
                }
                return tab;
            });
        });
        // 更新worksBar组件标题数据
        setWorksList((worksList) => {
            return worksList.map((item) => {
                if (item.id == tabItem.value) {
                    item.title = inputTitleValue;
                    return item;
                }
                return item;
            });
        });
        console.log('tabItem', tabItem)
        // return
        // // 同步数据库
        // worksListDB.updateMetadata(tabItem.value, {
        //     title: inputTitleValue,
        // });
    }

    // useEffect(() => {
    //     setInputTitleValue(activeTabsItem.label)
    // }, [activeTabsItem])

    return (
        <div className="control-group">
            <div
                className="button-group inline-flex justify-start align-middle overflow-auto">
                {/*ChromePicker,CompactPicker,GithubPicker, HuePicker, HuePicker,PhotoshopPicker,SketchPicker*/}

                <FormControl sx={{m: 1, width: 100}} size="small">
                    <Select
                        value={currentValue}
                        onChange={handleChange}
                        renderValue={(value) => value}
                        MenuProps={MenuProps}
                    >
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
                    </Select>
                </FormControl>

                {extTypeList.map((item, index) => {
                    return <CommonBtn key={index} {...item} />;
                })}

                <Divider orientation="vertical" variant="middle" flexItem/>

                <HightlightComp editor={editor}/>

                <Divider orientation="vertical" variant="middle" flexItem/>

                {listTypeList.map((item, index) => {
                    return <CommonBtn key={index} {...item} />;
                })}
                <Divider orientation="vertical" variant="middle" flexItem/>
                {textAlignTypeList.map((item, index) => {
                    return <CommonBtn key={index} {...item} />;
                })}
                {/* <button onClick={() => editor.chain().focus().setHardBreak().run()}>
          Hard break
        </button> */}
                {/*<button*/}
                {/*    onClick={() => editor.chain().focus().undo().run()}*/}
                {/*    disabled={!editor.can().chain().focus().undo().run()}*/}
                {/*>*/}
                {/*    Undo*/}
                {/*</button>*/}
                {/*<button*/}
                {/*    onClick={() => editor.chain().focus().redo().run()}*/}
                {/*    disabled={!editor.can().chain().focus().redo().run()}*/}
                {/*>*/}
                {/*    Redo*/}
                {/*</button>*/}
            </div>
            {/*<input*/}
            {/*    onKeyDown={(e) => {*/}
            {/*        e.stopPropagation();*/}
            {/*        if (e.key === "Enter") (e.target as HTMLInputElement).blur();*/}
            {/*    }}*/}
            <div
                className='w-full my-4'
            >
                <input
                    className='border-none w-full font-bold text-4xl content-title focus:ring-0'
                    minLength={1}
                    maxLength={30}
                    size={10}
                    onChange={(e) => setInputTitleValue(e.target.value)}
                    value={inputTitleValue}
                    onBlur={handleInputTitleBlur}
                    placeholder={'请输入标题'}
                />
            </div>
        </div>
    );
};

export default MenuBar;