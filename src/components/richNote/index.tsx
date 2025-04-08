import "./styles.scss";
import { Color } from "@tiptap/extension-color";
import ListItem from "@tiptap/extension-list-item";
import TextStyle from "@tiptap/extension-text-style";
import { EditorProvider, useCurrentEditor, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { useEffect, useState, useRef } from "react";
import Button from "@mui/material/Button";
import "material-symbols";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import ListItemText from "@mui/material/ListItemText";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import HightlightComp from "./subComponents/highlight";
import Image from "@tiptap/extension-image";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Highlight from "@tiptap/extension-highlight";
import {
  paragraphTList,
  extTypeList,
  colors,
  listTypeList,
  textAlignTypeList,
} from "./constants";
import { Divide } from "lucide-react";
import Divider from "@mui/material/Divider";
import Blockquote from "@tiptap/extension-blockquote";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import css from "highlight.js/lib/languages/css";
import js from "highlight.js/lib/languages/javascript";
import ts from "highlight.js/lib/languages/typescript";
import html from "highlight.js/lib/languages/xml";
import { all, createLowlight } from "lowlight";
import Text from "@tiptap/extension-text";
import Typography from "@tiptap/extension-typography";
import TextAlign from "@tiptap/extension-text-align";
import Italic from "@tiptap/extension-italic";
import ContentMenu from "./subComponents/contentMenu";
import Placeholder from "@tiptap/extension-placeholder";
import { noteContentDB } from "@/database/noteContentDB";
import "./styles.scss";
import { ImagePasteHandler } from "./extensions/ImagePasteHandler";
import { CustomImage } from "./extensions/CustomImage";
import { ImageUpdateHandler } from "./extensions/ImageUpdateHandler";
import { CustomCodeBlock } from "./extensions/CustomCodeBlock";
import { HeadingWithId } from "./extensions/HeadingWithId";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";

const extensions = [
  StarterKit.configure({
    italic: false,
    blockquote: false,
    listItem: false,
    codeBlock: false,
    text: false,
    image: true,
    heading: false,
  }),
  HeadingWithId,
  Color.configure({ types: [TextStyle.name, ListItem.name] }),
  TextStyle.configure({ types: [ListItem.name] }),
  Highlight.configure({ multicolor: true }),
  // CustomImage,
  Image.configure({
    HTMLAttributes: {
      class: "my-custom-class",
    },
    inline: true,
    allowBase64: true,
  }),
  Italic,
  Blockquote.configure({
    HTMLAttributes: {
      class: "my-custom-class",
    },
  }),
  Typography,
  ListItem.configure({
    HTMLAttributes: {
      class: "my-custom-class",
    },
  }),
  Placeholder.configure({
    placeholder: "开始编辑词条内容 …",
  }),
  // CodeBlockLowlight.configure({
  //   lowlight,
  // }),
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  TaskList,
  Text,
  TaskItem.configure({}),
  // ImagePasteHandler,
  ImageUpdateHandler,
  CustomCodeBlock,
  Table.configure({
    resizable: true,
  }),
  TableRow,
  TableHeader,
  TableCell,
];

export default ({
  activeTabsItem,
  tabItem,
  setActiveTabsItem,
  setTabs,
  setWorksList,
  setCurrentEditor,
  setActiveRichTextEditor,
  registerEditor,
}) => {
  const [richTextTitleInputValue, setRichTextTitleInputValue] = useState("");
  const lastActiveTabsItemRef = useRef(null);
  // const [forceUpdateKey, setForceUpdateKey] = useState(Date.now());

  const editor = useEditor({
    extensions,
    content: tabItem.content,
    onUpdate: ({ editor }) => {
      // 更新内容时处理图片
      const content = editor.getHTML();
      // 避免在每次更新时都处理图片，可以设置节流或防抖
      // 这里为了简单起见，暂不实现，但建议在实际应用中添加
    },
    onFocus: ({ editor }) => {
      console.log("onFocus");
      setActiveRichTextEditor(editor);
    },
    editorProps: {
      attributes: {
        spellcheck: "false", // 关闭拼写检查
        autocorrect: "off", // 关闭自动更正
        autocapitalize: "off", // 关闭自动大写
      },
    },
  });

  // 将编辑器实例传递给父组件
  useEffect(() => {
    if (editor) {
      setCurrentEditor(editor);

      // 注册编辑器实例
      if (registerEditor && tabItem.value) {
        console.log("注册编辑器实例:", tabItem.value);
        registerEditor(tabItem.value, editor);
      }
    }

    return () => {
      if (editor) {
        setCurrentEditor(null);
      }
    };
  }, [editor, setCurrentEditor, registerEditor, tabItem]);

  // 监听标签页变化
  useEffect(() => {
    const tabIdChanged =
      activeTabsItem?.value !== lastActiveTabsItemRef.current?.value;

    if (tabIdChanged) {
      console.log("activeTabsItem ID 变化:", activeTabsItem?.value);
      console.log(
        "上一个 activeTabsItem ID:",
        lastActiveTabsItemRef.current?.value,
      );

      // 更新引用
      lastActiveTabsItemRef.current = activeTabsItem;

      // 设置当前编辑器为活动编辑器
      if (editor && activeTabsItem?.value === tabItem.value) {
        console.log("设置当前编辑器为活动编辑器:", tabItem.value);
        setActiveRichTextEditor(editor);

        // 强制更新
        // setForceUpdateKey(Date.now());

        // 自动聚焦编辑器
        setTimeout(() => {
          editor.commands.focus();
        }, 100);
      }
    }
  }, [activeTabsItem, tabItem, editor, setActiveRichTextEditor]);

  // 监听标签页变化，自动聚焦当前编辑器
  useEffect(() => {
    // 检查当前标签页是否是活动标签页
    if (editor && activeTabsItem && tabItem.value === activeTabsItem.value) {
      console.log("自动聚焦编辑器:", tabItem.value);
      // 使用setTimeout确保DOM已经完全渲染
      setTimeout(() => {
        editor.commands.focus();
      }, 100);
    }
  }, [editor, activeTabsItem, tabItem]);

  const handleTPBlur = (e) => {
    // 获取改变的内容
    const TPContent = e.editor.getHTML();
    // 因为页面会缓存更改后的内容, 所以这里直接更新数据库, 也只有这一个地方更新笔记内容的数据库
    noteContentDB.updateContent(tabItem.value, TPContent);
  };

  const handleTPFocus = (e) => {
    console.log("handleTPFocus");
    setActiveRichTextEditor(e.editor);
  };

  return (
    <EditorProvider
      // key={`editor-${tabItem.value}-${forceUpdateKey}`}
      slotBefore={
        <ContentMenu
          activeTabsItem={activeTabsItem}
          setTabs={setTabs}
          tabItem={tabItem}
          setRichTextTitleInputValue={setRichTextTitleInputValue}
          setWorksList={setWorksList}
        />
      }
      // slotAfter={<MenuBar/>}
      extensions={extensions}
      content={tabItem.content}
      onBlur={handleTPBlur}
      onFocus={handleTPFocus}
      editorProps={{
        attributes: {
          spellcheck: "false", // 关闭拼写检查
          autocorrect: "off", // 关闭自动更正
          autocapitalize: "off", // 关闭自动大写
          class:
            "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none",
        },
      }}
    ></EditorProvider>
  );
};
