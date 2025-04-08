import { useCurrentEditor } from "@tiptap/react";
import React, { useEffect, useState, useRef } from "react";
import Button from "@mui/material/Button";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import {
  extTypeList,
  listTypeList,
  paragraphTList,
  textAlignTypeList,
} from "@/components/richNote/constants";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import HightlightComp from "@/components/richNote/subComponents/highlight";
import { worksListDB } from "@/database/worksLists";
import HeadingSelector from "@/components/richNote/subComponents/headingSelector";
import TpTable from "../tpTable";

const MenuBar = ({
  setTabs,
  tabItem,
  setWorksList,
  isShowHeading = true,
} = {}) => {
  const { editor } = useCurrentEditor();
  const [inputTitleValue, setInputTitleValue] = useState(tabItem.label);
  const editorRef = useRef(null);

  // 当编辑器实例变化时更新引用
  useEffect(() => {
    if (editor) {
      editorRef.current = editor;
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  const CommonBtn = (props) => {
    const {
      extType = "bold",
      toggleFunName,
      iconName,
      toggleFunParam,
      disabled: externalDisabled = false,
    } = props;
    const toggleFun =
      toggleFunName || `toggle${extType[0].toUpperCase()}${extType.slice(1)}`;

    // 直接定义点击处理函数，不使用回调
    const handleClick = (e) => {
      e.preventDefault(); // 阻止默认行为
      e.stopPropagation(); // 阻止事件冒泡

      // 确保编辑器获得焦点
      editor.commands.focus();

      // 直接执行命令，不使用链式API
      if (typeof editor.commands[toggleFun] === "function") {
        editor.commands[toggleFun](toggleFunParam || undefined);
      }
    };

    return (
      <Button
        color="#000000"
        size="small"
        style={{
          backgroundColor: editor?.isActive(extType) ? "#E7E9E8" : "",
          height: "100%",
        }}
        onMouseDown={handleClick} // 使用onMouseDown而不是onClick
        disabled={externalDisabled}
      >
        <span className="material-symbols-outlined">
          {iconName || `format_${extType}`}
        </span>
      </Button>
    );
  };

  const handleInputTitleBlur = () => {
    // 更新tab标题数据
    setTabs &&
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
    setWorksList &&
      setWorksList((worksList) => {
        return worksList.map((item) => {
          if (item.id == tabItem.value) {
            item.title = inputTitleValue;
            return item;
          }
          return item;
        });
      });
    console.log("tabItem", tabItem);
    // 同步数据库
    worksListDB.updateMetadata(tabItem.value, {
      title: inputTitleValue,
    });
  };

  return (
    <div className="control-group sticky top-0 z-10 bg-white">
      <div className="button-group inline-flex justify-start align-middle overflow-auto">
        <HeadingSelector editor={editor} />

        {extTypeList.map((item, index) => {
          return <CommonBtn key={index} {...item} />;
        })}

        <Divider orientation="vertical" variant="middle" flexItem />

        <HightlightComp editor={editor} />

        <Divider orientation="vertical" variant="middle" flexItem />

        {listTypeList.map((item, index) => {
          return <CommonBtn key={index} {...item} />;
        })}

        <Divider orientation="vertical" variant="middle" flexItem />

        {textAlignTypeList.map((item, index) => {
          return <CommonBtn key={index} {...item} />;
        })}

        <Divider orientation="vertical" variant="middle" flexItem />

        <TpTable editor={editor} />
      </div>
      <div className="w-full my-4">
        {isShowHeading && (
          <input
            className="border-none w-full font-bold text-4xl content-title focus:ring-0"
            minLength={1}
            maxLength={30}
            size={10}
            onChange={(e) => setInputTitleValue(e.target.value)}
            value={inputTitleValue}
            onBlur={handleInputTitleBlur}
            placeholder={"请输入标题"}
          />
        )}
      </div>
    </div>
  );
};

export default MenuBar;
