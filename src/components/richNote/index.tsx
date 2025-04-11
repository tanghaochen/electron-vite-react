import { Color } from "@tiptap/extension-color";
import ListItem from "@tiptap/extension-list-item";
import TextStyle from "@tiptap/extension-text-style";
import {
  EditorContent,
  EditorProvider,
  useCurrentEditor,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { useEffect, useState, useRef, useCallback } from "react";
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
import ContentMenu from "./subComponents/contentMenu/index";
import Placeholder from "@tiptap/extension-placeholder";
import { noteContentDB } from "@/database/noteContentDB";
import { ImagePasteHandler } from "./extensions/ImagePasteHandler";
import { CustomImage } from "./extensions/CustomImage.ts";
import { ImageUpdateHandler } from "./extensions/ImageUpdateHandler";
import { CustomCodeBlock } from "./extensions/CustomCodeBlock";
import { HeadingWithId } from "./extensions/HeadingWithId";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Link from "@tiptap/extension-link";
import "./styles/index.scss";
import { debounce, throttle } from "lodash";

const extensions = [
  StarterKit.configure({
    italic: false,
    blockquote: false,
    listItem: false,
    codeBlock: false,
    text: false,
    image: false,
    heading: false,
  }),
  HeadingWithId,
  Link.configure({
    // protocols: ["ftp", "mailto"],
    // autolink: true,
    // linkOnPaste: true,
  }),
  Color.configure({ types: [TextStyle.name, ListItem.name] }),
  TextStyle.configure({ types: [ListItem.name] }),
  Highlight.configure({ multicolor: true }),
  CustomImage.configure({
    inline: true,
    HTMLAttributes: {
      class: "custom-image",
    },
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
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  TaskList,
  Text,
  TaskItem.configure({}),
  ImageUpdateHandler,
  CustomCodeBlock,
  Table.configure({
    resizable: true,
  }),
  TableRow,
  TableHeader,
  TableCell,
];

type RichNoteProps = {
  activeTabsItem: any; // 当前标签页
  tabItem: any; // 标签页
  setTabs: (tabs: any) => void; // 设置标签页
  setWorksList: (list: any) => void; // 设置工作列表
  setCurrentEditor: (editor: any) => void; // 设置当前编辑器
  setActiveRichTextEditor: (editor: any) => void; // 设置活动编辑器
  registerEditor: (id: string, editor: any) => void; // 注册编辑器实例
  isNoTab: boolean; // 是否没有标签页, 不用处理多tiptap实例, 不用管上面那么多参数
  isShowHeading: boolean; // 是否显示标题
};

// 在组件外部定义防抖函数
const debouncedUpdateContent = debounce((value, content) => {
  noteContentDB.updateContent(value, content);
}, 500);

export default React.memo(
  ({
    activeTabsItem,
    tabItem = { content: "", value: "" },
    setTabs,
    setWorksList,
    setCurrentEditor,
    setActiveRichTextEditor,
    registerEditor,
    isNoTab = false,
    isShowHeading = true,
  }: Partial<RichNoteProps>) => {
    const [richTextTitleInputValue, setRichTextTitleInputValue] = useState("");
    const lastActiveTabsItemRef = useRef(null);
    const [forceUpdateKey, setForceUpdateKey] = useState(Date.now());

    const editor = useEditor({
      extensions,
      content:
        typeof tabItem.content === "string" && tabItem.content.startsWith("{")
          ? JSON.parse(tabItem.content)
          : tabItem.content,
      onUpdate: throttle(({ editor }) => {
        // 图片处理逻辑
      }, 1000),
      onFocus: ({ editor }) => {
        console.log("onFocus");
        setActiveRichTextEditor && setActiveRichTextEditor(editor);
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
      if (!setCurrentEditor || !setActiveRichTextEditor || !editor) return;

      setCurrentEditor(editor);

      // 注册编辑器实例
      if (registerEditor && tabItem.value) {
        registerEditor(tabItem.value, editor);
      }

      return () => {
        setCurrentEditor(null);
      };
    }, [editor, setCurrentEditor, registerEditor, tabItem.value]);

    // 监听标签页变化
    useEffect(() => {
      if (!activeTabsItem) return;
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
          setActiveRichTextEditor && setActiveRichTextEditor(editor);

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

    const handleTPBlur = useCallback(
      (e) => {
        const TPContent = e.editor.getJSON();
        debouncedUpdateContent(tabItem.value, TPContent);
      },
      [tabItem.value],
    );

    const handleTPFocus = useCallback(
      (e) => {
        setActiveRichTextEditor && setActiveRichTextEditor(e.editor);
      },
      [setActiveRichTextEditor],
    );

    useEffect(() => {
      console.log(tabItem);
      //   editor.at.div.hosts
    }, [tabItem]);

    return (
      <EditorProvider
        key={`editor-${tabItem.value}-${forceUpdateKey}`}
        slotBefore={
          <ContentMenu
            setTabs={setTabs}
            tabItem={tabItem}
            setRichTextTitleInputValue={setRichTextTitleInputValue}
            setWorksList={setWorksList}
            isShowHeading={isShowHeading}
          />
        }
        extensions={extensions}
        content={
          typeof tabItem.content === "string" && tabItem.content.startsWith("{")
            ? JSON.parse(tabItem.content)
            : tabItem.content
        }
        onBlur={handleTPBlur}
        immediatelyRender={true}
        shouldRerenderOnTransaction={(oldState, newState) => {
          // 只在特定情况下重新渲染
          return oldState.doc.content !== newState.doc.content;
        }}
        onFocus={handleTPFocus}
        editorProps={{
          attributes: {
            spellcheck: "false",
            autocorrect: "off",
            autocapitalize: "off",
            class:
              "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none",
          },
        }}
      ></EditorProvider>
      // <EditorContent editor={editor} />
    );
  },
  (prevProps, nextProps) => {
    // 自定义比较逻辑
    return (
      prevProps.tabItem.value === nextProps.tabItem.value &&
      prevProps.activeTabsItem?.value === nextProps.activeTabsItem?.value
    );
  },
);
