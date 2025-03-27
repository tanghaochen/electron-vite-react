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
const lowlight = createLowlight(all);
lowlight.register("html", html);
lowlight.register("css", css);
lowlight.register("js", js);
lowlight.register("ts", ts);
//
const extensions = [
  StarterKit.configure({}),
  Color.configure({ types: [TextStyle.name, ListItem.name] }),
  TextStyle.configure({ types: [ListItem.name] }),
  Highlight.configure({ multicolor: true }),
  Image,
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

  // 优化处理HTML内容中的图片函数
  const processHTMLImages = async (html) => {
    console.log("处理HTML内容中的图片");
    const doc = new DOMParser().parseFromString(html, "text/html");
    const images = doc.querySelectorAll('img[src^="http"]');

    // 如果没有发现网络图片，直接返回原始HTML
    if (images.length === 0) {
      return html;
    }

    let processed = 0;
    const total = images.length;
    console.log(`发现${total}张网络图片，开始处理`);
    let anyImageChanged = false;

    for (const img of images) {
      try {
        const originalSrc = img.src;
        console.log(`处理图片 ${++processed}/${total}:`, originalSrc);

        // 检查图片是否已经是本地路径
        if (originalSrc.startsWith("file://")) {
          console.log("图片已是本地路径，跳过:", originalSrc);
          continue;
        }

        // 添加重试机制
        let retries = 3;
        let localPath = null;

        while (retries > 0 && !localPath) {
          try {
            localPath = await window.ipcRenderer.invoke(
              "download-image",
              originalSrc,
            );
          } catch (error) {
            console.error(`下载图片失败，剩余重试次数: ${retries - 1}`, error);
            retries--;
            // 延迟后重试
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        if (localPath) {
          console.log("图片下载成功，新路径:", localPath);
          // 保存原始URL作为自定义属性
          img.setAttribute("data-original-src", originalSrc);
          // 使用file://协议的完整路径
          const newSrc = `file://${localPath}`;
          img.src = newSrc;
          anyImageChanged = true;

          // 验证更改是否生效
          console.log("图片URL已更改为:", img.src);
          console.log("是否包含file://:", img.src.includes("file://"));
        } else {
          console.warn("图片下载失败，保留原地址:", originalSrc);
        }
      } catch (error) {
        console.error("图片处理失败:", error);
      }
    }

    if (anyImageChanged) {
      console.log("至少有一张图片成功更改为本地路径");
    } else {
      console.log("没有图片更改为本地路径，内容保持不变");
    }

    const processedHTML = doc.body.innerHTML;
    return processedHTML;
  };
  useEffect(() => {
    if (!editor) return;

    // 处理粘贴事件
    const handlePaste = async (event) => {
      const items = (event.clipboardData || event.originalEvent.clipboardData)
        .items;
      let html = null;

      // 优化点1: 添加剪贴板类型判断日志
      console.log(
        "剪贴板项目类型:",
        Array.from(items).map((item) => item.type),
      );

      // 检查剪贴板中是否有HTML内容
      for (let i = 0; i < items.length; i++) {
        if (items[i].type === "text/html") {
          html = await new Promise((resolve) => {
            items[i].getAsString(resolve);
          });
          break;
        }
      }

      if (html) {
        // 解析HTML中的图片
        const doc = new DOMParser().parseFromString(html, "text/html");
        const images = doc.querySelectorAll('img[src^="http"]');

        if (images.length > 0) {
          event.preventDefault();
          console.log(`发现${images.length}张网络图片，开始处理`);

          try {
            // 下载所有网络图片并替换为本地路径
            const processedHTML = await processHTMLImages(html);

            // 使用 transaction API 确保内容正确插入并保存
            editor.commands.insertContent(processedHTML);

            // 手动触发内容更新事件
            setTimeout(() => {
              const updatedContent = editor.getHTML();
              noteContentDB.updateContent(tabItem.value, updatedContent);
              console.log(
                "粘贴内容已保存，内容包含:",
                updatedContent.includes("file://")
                  ? "本地文件路径"
                  : "仍然是网络路径",
              );
            }, 100);

            return;
          } catch (error) {
            console.error("处理粘贴的HTML图片失败:", error);
            // 失败时仍插入原始内容
            editor.commands.insertContent(html);
          }
          return;
        }
      }

      // 处理直接粘贴的图片
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          event.preventDefault();
          const blob = items[i].getAsFile();
          const reader = new FileReader();
          reader.onload = async (e) => {
            const dataUrl = e.target.result;
            // 这里可以添加将dataUrl保存为本地文件的逻辑
            editor.commands.setImage({ src: dataUrl });
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
    };

    // 添加粘贴事件监听
    editor.view.dom.addEventListener("paste", handlePaste);

    return () => {
      editor.view.dom.removeEventListener("paste", handlePaste);
    };
  }, [editor]);

  // 处理现有内容中的网络图片
  useEffect(() => {
    if (!editor || !tabItem.content) return;

    const processExistingContent = async () => {
      try {
        const html = editor.getHTML();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const images = doc.querySelectorAll('img[src^="http"]');

        if (images.length > 0) {
          console.log(
            `发现${images.length}张网络图片，开始处理现有内容中的图片`,
          );

          // 下载并处理图片
          const processedHTML = await processHTMLImages(html);

          // 确保修改后的HTML与原始HTML不同
          if (processedHTML !== html) {
            console.log("替换编辑器内容为处理后的内容");

            // 强制更新编辑器内容 - 使用transaction API确保更新生效
            editor.commands.setContent(processedHTML, false, {
              preserveWhitespace: "full",
            });

            // 确保内容更新后保存到数据库
            const updatedContent = editor.getHTML();
            noteContentDB.updateContent(tabItem.value, updatedContent);

            // 添加调试日志验证内容已经更新
            console.log(
              "编辑器内容已更新，新内容包含：",
              editor.getHTML().includes("file://")
                ? "本地文件路径"
                : "仍然是网络路径",
            );
          }
        }
      } catch (error) {
        console.error("处理现有内容图片失败:", error);
      }
    };

    processExistingContent();
  }, [editor, tabItem.content]);
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
