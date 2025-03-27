import "./styles.scss";
import { Color } from "@tiptap/extension-color";
import ListItem from "@tiptap/extension-list-item";
import TextStyle from "@tiptap/extension-text-style";
import { EditorProvider, useCurrentEditor, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { useEffect, useState } from "react";
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
const lowlight = createLowlight(all);
lowlight.register("html", html);
lowlight.register("css", css);
lowlight.register("js", js);
lowlight.register("ts", ts);
//
const extensions = [
  StarterKit.configure({
    image: true,
  }),
  Color.configure({ types: [TextStyle.name, ListItem.name] }),
  TextStyle.configure({ types: [ListItem.name] }),
  Highlight.configure({ multicolor: true }),
  // CustomImage,
  Image.configure({
    HTMLAttributes: {
      class: "my-custom-class",
    },
    inline: false,
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
  CodeBlockLowlight.configure({
    lowlight,
  }),
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  TaskList,
  Text,
  TaskItem.configure({}),
  ImagePasteHandler,
];

export default ({
  activeTabsItem,
  tabItem,
  setActiveTabsItem,
  setTabs,
  setWorksList,
}) => {
  const [richTextTitleInputValue, setRichTextTitleInputValue] = useState("");
  const editor = useEditor({
    extensions,
    content: tabItem.content,
    onUpdate: ({ editor }) => {
      // 更新内容时处理图片
      const content = editor.getHTML();
      // 避免在每次更新时都处理图片，可以设置节流或防抖
      // 这里为了简单起见，暂不实现，但建议在实际应用中添加
    },
  });
  const handleTPBlur = (e) => {
    // 获取改变的内容
    const TPContent = e.editor.getHTML();
    // 因为页面会缓存更改后的内容, 所以这里直接更新数据库, 也只有这一个地方更新笔记内容的数据库
    noteContentDB.updateContent(tabItem.value, TPContent);
  };

  return (
    <EditorProvider
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
    ></EditorProvider>
  );
};
