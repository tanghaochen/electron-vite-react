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
import HeadingSelector
    from "@/components/richNote/subComponents/headingSelector";

const MenuBar = ({activeTabsItem,setTabs,tabItem,setRichTextTitleInputValue,setWorksList}) => {
    const {editor} = useCurrentEditor();
    const [inputTitleValue, setInputTitleValue] = useState(tabItem.label);

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
        // // 同步数据库
        worksListDB.updateMetadata(tabItem.value, {
            title: inputTitleValue,
        });
    }

    // useEffect(() => {
    //     setInputTitleValue(activeTabsItem.label)
    // }, [activeTabsItem])

    return (
        <div className="control-group">
            <div
                className="button-group inline-flex justify-start align-middle overflow-auto">
                {/*ChromePicker,CompactPicker,GithubPicker, HuePicker, HuePicker,PhotoshopPicker,SketchPicker*/}
                <HeadingSelector editor={editor} inputTitleValue={inputTitleValue} setTabs={setTabs} tabItem={setTabs} setWorksList={setWorksList}/>

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