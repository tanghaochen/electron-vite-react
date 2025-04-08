import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import FlexSearch from "flexsearch";
import { clipboard } from "electron";
import "./styles/index.scss";
import { worksListDB } from "@/database/worksLists";
import { noteContentDB } from "@/database/noteContentDB";
import PushPinIcon from "@mui/icons-material/PushPin";
import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from "@mui/icons-material/Settings";
import RemoveIcon from "@mui/icons-material/Remove";
import CropSquareIcon from "@mui/icons-material/CropSquare";
import FilterNoneIcon from "@mui/icons-material/FilterNone";
import Button from "@mui/material/Button";
import { styled } from "@mui/system";
import DOMPurify from "dompurify";
import {
  ImperativePanelGroupHandle,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { Breadcrumbs, Typography, Chip, IconButton, Box } from "@mui/material";
import Link from "@mui/material/Link";

interface HighlightProps {
  textContent: string;
  items?: Array<{ id: number; title: string }>;
}

// 自定义样式组件
const ControlBar = styled("div")(
  ({ theme, isPinned }: { theme?: any; isPinned: boolean }) => ({
    backgroundColor: "#1f2937", // 深灰色背景
    padding: "0.25rem 1rem",
    borderRadius: "0.375rem 0.375rem 0 0", // 只有顶部圆角
    marginBottom: "0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    transition: "all 0.3s ease",
    position: "sticky",
    top: "0",
    zIndex: 100,
    height: "1.5rem",
    color: "#fff",
    WebkitAppRegion: "drag", // 添加可拖拽属性
  }),
);

const KeywordsContainer = styled("div")({
  padding: "0.5rem",
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
  backgroundColor: "#f9fafb",
  borderBottom: "1px solid #e5e7eb",
  maxHeight: "5rem",
  overflowY: "auto",
});

const TextHighlighter = ({ textContent, items = [] }: HighlightProps) => {
  const [highlightedText, setHighlightedText] = useState(textContent);
  const contentPreviewRef = useRef<HTMLDivElement>(null);
  const [noteContent, setNoteContent] = useState("");
  const [foundKeywords, setFoundKeywords] = useState<string[]>([]);
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => b.title.length - a.title.length);
  }, [items]);

  const titleToIdMap = useMemo(() => {
    const map = new Map<string, number>();
    sortedItems.forEach((item) => map.set(item.title, item.id));
    return map;
  }, [sortedItems]);

  const escapeRegExp = useCallback((str: string) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }, []);

  // 在工具函数部分添加HTML转义方法
  const escapeHtml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const highlightAll = useCallback(() => {
    try {
      // 转义原始文本中的HTML标签
      const escapedText = escapeHtml(textContent);
      const foundWords: string[] = [];

      // 创建正则表达式模式，避免空数组导致的无效正则
      if (sortedItems.length === 0) {
        setHighlightedText(escapedText);
        setFoundKeywords([]);
        return;
      }

      const pattern = new RegExp(
        sortedItems
          .map((item) => {
            // 确保item.title存在且为字符串
            if (!item.title || typeof item.title !== "string") return "";
            const escaped = escapeRegExp(escapeHtml(item.title));
            return `(\\{${escaped}\\})|(\\[${escaped}\\])|${escaped}`;
          })
          .filter((pattern) => pattern !== "") // 过滤掉空字符串
          .join("|"),
        "gi",
      );

      // 执行替换并收集找到的关键词
      const newText = escapedText.replace(pattern, (match) => {
        const title = match.replace(/[{}[\]]/g, "");
        const id = titleToIdMap.get(title);

        // 添加到找到的关键词列表
        if (!foundWords.includes(title)) {
          foundWords.push(title);
        }

        return id !== undefined
          ? `<mark class="highlight" data-id="${id}">${match}</mark>`
          : match;
      });

      // 更新找到的关键词
      setFoundKeywords(foundWords);

      // 使用DOMPurify清理最终HTML，防止XSS攻击
      setHighlightedText(DOMPurify.sanitize(newText));
    } catch (error) {
      console.error("高亮出错:", error);
      // 出错时至少显示原始文本（经过HTML转义）
      setHighlightedText(escapeHtml(textContent));
      setFoundKeywords([]);
    }
  }, [sortedItems, textContent, titleToIdMap, escapeRegExp]);

  useEffect(() => {
    highlightAll();
  }, [textContent, items, highlightAll]);

  // 处理点击关键词的函数
  const handleChipClick = async (keyword: string) => {
    // 设置当前活跃的关键词
    setActiveKeyword(keyword);

    // 查找对应的ID
    const id = titleToIdMap.get(keyword);
    if (!id) return;

    try {
      const noteItem = await noteContentDB.getContentByNoteId(id.toString());
      // 使用DOMPurify清理笔记内容
      setNoteContent(DOMPurify.sanitize(noteItem));
    } catch (error) {
      console.error("获取笔记内容失败:", error);
      setNoteContent("<p>获取笔记内容失败</p>");
    }
  };

  useEffect(() => {
    const handler = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("highlight")) {
        const id = target.dataset.id;
        if (!id) return;

        // 获取高亮文本内容并设置为活跃关键词
        const highlightText = target.textContent?.replace(/[{}[\]]/g, "") || "";
        setActiveKeyword(highlightText);

        try {
          const noteItem = await noteContentDB.getContentByNoteId(id);
          // 使用DOMPurify清理笔记内容
          setNoteContent(DOMPurify.sanitize(noteItem));
        } catch (error) {
          console.error("获取笔记内容失败:", error);
          setNoteContent("<p>获取笔记内容失败</p>");
        }
      }
    };

    const container = contentPreviewRef.current;
    container?.addEventListener("click", handler);

    return () => container?.removeEventListener("click", handler);
  }, []);

  const ref = useRef<ImperativePanelGroupHandle>(null);

  return (
    <div className="highlighter-container h-full">
      {foundKeywords.length > 0 && (
        <KeywordsContainer>
          {foundKeywords.map((keyword, index) => (
            <Chip
              key={index}
              label={keyword}
              size="small"
              color={activeKeyword === keyword ? "primary" : "default"}
              variant={activeKeyword === keyword ? "filled" : "outlined"}
              clickable
              onClick={() => handleChipClick(keyword)}
              sx={{
                fontWeight: activeKeyword === keyword ? "bold" : "normal",
                transition: "all 0.2s ease",
              }}
            />
          ))}
        </KeywordsContainer>
      )}
      <PanelGroup direction="horizontal" ref={ref}>
        <Panel>
          <div className="content-preview content-preview-target">
            <div className="font-bold">获取内容</div>
            <div
              ref={contentPreviewRef}
              dangerouslySetInnerHTML={{ __html: highlightedText }}
              style={{ whiteSpace: "pre-wrap" }}
            ></div>
          </div>
        </Panel>
        <PanelResizeHandle className="w-1 bg-stone-200" />
        <Panel>
          <div className="content-preview content-preview-note">
            <div className="font-bold ">
              <div>笔记内容</div>
            </div>
            <div dangerouslySetInnerHTML={{ __html: noteContent }}></div>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
};

const App = () => {
  const [customClipBoardContent, setCustomClipBoardContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const items = [
    { id: 1, title: "Java" },
    { id: 2, title: "Python" },
    { id: 6, title: "编程" },
    { id: 7, title: "言" },
    { id: 8, title: "语言" },
    { id: 6, title: "编程语言" },
    { id: 3, title: "JavaScript" },
    { id: 4, title: "Spring" },
    { id: 5, title: "log" },
  ];
  const [highlightedKeywords, setHighlightedKeywords] = useState(items);

  const handlePin = () => {
    setIsPinned(!isPinned);
    window.ipcRenderer?.send("pin-window", !isPinned);
  };

  const handleClose = () => {
    window.ipcRenderer?.send("close-window");
    setIsClosed(true);
  };

  const handleMinimize = () => {
    window.ipcRenderer?.send("minimize-window");
  };

  const handleMaximize = () => {
    window.ipcRenderer?.send("maximize-window");
    setIsMaximized(!isMaximized);
  };

  // 监听窗口最大化/还原状态变化
  useEffect(() => {
    const handleMaximizeChange = (_: any, maximized: boolean) => {
      setIsMaximized(maximized);
    };

    window.ipcRenderer?.on("maximize-change", handleMaximizeChange);

    return () => {
      window.ipcRenderer?.off?.("maximize-change", handleMaximizeChange);
    };
  }, []);

  const handleClipboardUpdate = useCallback((event: any, text: string) => {
    const cleanText = text.text
      .replace(/\n{3,}/g, "\n")
      .replace(/^\n+|\n+$/g, "")
      .replace(/[\u200B-\u200D\uFEFF]/g, "");

    setCustomClipBoardContent(cleanText);
  }, []);

  const getWorksList = async () => {
    const res = await worksListDB.getMetadataByTagId(1);
    setHighlightedKeywords(res);
    return res;
  };

  useEffect(() => {
    getWorksList();
    window.ipcRenderer?.on("clipboard-update", (event: any, text: string) => {
      getWorksList();
      handleClipboardUpdate(event, text);
    });
    return () => {
      window.ipcRenderer?.off?.("clipboard-update", handleClipboardUpdate);
    };
  }, [handleClipboardUpdate]);

  if (isClosed) return null;

  return (
    <div className="noteHightLightRoot">
      <ControlBar isPinned={isPinned}>
        <Box sx={{ display: "flex", gap: "0.5rem" }}>
          <IconButton
            size="small"
            onClick={handlePin}
            sx={{
              color: isPinned ? "#3b82f6" : "#fff",
              padding: "2px",
              WebkitAppRegion: "no-drag", // 按钮不可拖拽
            }}
          >
            <PushPinIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            sx={{
              color: "#fff",
              padding: "2px",
              WebkitAppRegion: "no-drag", // 按钮不可拖拽
            }}
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Box>
        <Typography variant="caption" sx={{ color: "#fff" }}>
          内容高亮工具
        </Typography>
        <Box sx={{ display: "flex", gap: "0.5rem" }}>
          <IconButton
            size="small"
            onClick={handleMinimize}
            sx={{
              color: "#fff",
              padding: "2px",
              WebkitAppRegion: "no-drag", // 按钮不可拖拽
            }}
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleMaximize}
            sx={{
              color: "#fff",
              padding: "2px",
              WebkitAppRegion: "no-drag", // 按钮不可拖拽
            }}
          >
            {isMaximized ? (
              <FilterNoneIcon fontSize="small" />
            ) : (
              <CropSquareIcon fontSize="small" />
            )}
          </IconButton>
          <IconButton
            size="small"
            onClick={handleClose}
            sx={{
              color: "#ef4444",
              padding: "2px",
              WebkitAppRegion: "no-drag", // 按钮不可拖拽
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </ControlBar>

      <TextHighlighter
        textContent={customClipBoardContent}
        items={highlightedKeywords}
      />
    </div>
  );
};

export default App;
