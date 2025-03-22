import React, {useState, useMemo, useCallback, useEffect, useRef} from 'react';
import FlexSearch from 'flexsearch';
import {clipboard} from 'electron';
import './styles/index.scss'
import {worksListDB} from "@/database/worksLists";
import {noteContentDB} from "@/database/noteContentDB";
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from '@mui/icons-material/Settings';
import Button from "@mui/material/Button";
import {styled} from '@mui/system';
import DOMPurify from 'dompurify';
import {
    ImperativePanelGroupHandle,
    Panel,
    PanelGroup,
    PanelResizeHandle,
} from "react-resizable-panels";
import { Breadcrumbs, Typography } from '@mui/material';
import Link from '@mui/material/Link';


interface HighlightProps {
    textContent: string;
    items?: Array<{ id: number; title: string }>;
}

// 自定义样式组件
const ControlBar = styled('div')(({theme, isPinned}: {
    theme?: any;
    isPinned: boolean
}) => ({
    backgroundColor: isPinned ? '#e5e7eb' : '#f3f4f6',
    padding: '1rem',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: isPinned ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
    transition: 'all 0.3s ease',
    position: 'sticky',
    top: '0',
    zIndex: 100
}));

const TextHighlighter = ({textContent, items = []}: HighlightProps) => {
    const [highlightedText, setHighlightedText] = useState(textContent);
    const contentPreviewRef = useRef<HTMLDivElement>(null);
    const [noteContent, setNoteContent] = useState('');

    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => b.title.length - a.title.length);
    }, [items]);

    const titleToIdMap = useMemo(() => {
        const map = new Map<string, number>();
        sortedItems.forEach(item => map.set(item.title, item.id));
        return map;
    }, [sortedItems]);

    const escapeRegExp = useCallback((str: string) => {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

            // 创建匹配模式（保持原逻辑）
            const pattern = new RegExp(
                sortedItems
                    .map(item => {
                        const escaped = escapeRegExp(escapeHtml(item.title)); // 关键点：同时转义搜索词
                        return `(\\{${escaped}\\})|(\\[${escaped}\\])|${escaped}`;
                    })
                    .join("|"),
                "gi"
            );
            // 执行替换
            const newText = escapedText.replace(pattern, (match) => {
                const title = match.replace(/[{}[\]]/g, '');
                const id = titleToIdMap.get(title);
                return id !== undefined
                    ? `<mark class="highlight" data-id="${id}">${match}</mark>`
                    : match;
            });


            setHighlightedText(newText);
        } catch (error) {
            console.error('高亮出错:', error);
        }
    }, [sortedItems, textContent, titleToIdMap, escapeRegExp]);

    useEffect(() => {
        highlightAll();
    }, [textContent, items, highlightAll]);

    useEffect(() => {
        const handler = async (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('highlight')) {
                const id = target.dataset.id;
                if (!id) return false
                const noteItem = await noteContentDB.getContentByNoteId(id)
                setNoteContent(noteItem)
            }
        };

        const container = contentPreviewRef.current;
        container?.addEventListener('click', handler);

        return () => container?.removeEventListener('click', handler);
    }, []);
    const ref = useRef<ImperativePanelGroupHandle>(null);

    return (
        <div className="highlighter-container h-full">
                <PanelGroup direction="horizontal" ref={ref}>
                    <Panel>
                        <div className="content-preview content-preview-target">
                            <div className='font-bold'>获取内容</div>
                            <div
                                ref={contentPreviewRef}
                                dangerouslySetInnerHTML={{__html: highlightedText}}
                                style={{whiteSpace: 'pre-wrap'}}
                            ></div>
                        </div>
                    </Panel>
                    <PanelResizeHandle className="w-1 bg-stone-200" />
                    <Panel>
                        <div className="content-preview content-preview-note">
                            <div className='font-bold '>
                                <div>笔记内容</div>

                            </div>
                            {/*<div role="presentation" >*/}
                            {/*    <Breadcrumbs aria-label="breadcrumb">*/}
                            {/*        <Link underline="hover" color="inherit" href="/">*/}
                            {/*            MUI*/}
                            {/*        </Link>*/}
                            {/*        <Link*/}
                            {/*            underline="hover"*/}
                            {/*            color="inherit"*/}
                            {/*            href="/material-ui/getting-started/installation/"*/}
                            {/*        >*/}
                            {/*            Core*/}
                            {/*        </Link>*/}
                            {/*        <Typography sx={{ color: 'text.primary' }}>Breadcrumbs</Typography>*/}
                            {/*    </Breadcrumbs>*/}
                            {/*</div>*/}
                            <div
                                dangerouslySetInnerHTML={{__html: noteContent}}></div>
                        </div>
                    </Panel>
                </PanelGroup>
        </div>
    );
};

const App = () => {
    const [customClipBoardContent, setCustomClipBoardContent] = useState('');
    const [isPinned, setIsPinned] = useState(false);
    const [isClosed, setIsClosed] = useState(false);
    const items = [
        {id: 1, title: "Java"},
        {id: 2, title: "Python"},
        {id: 6, title: "编程"},
        {id: 7, title: "言"},
        {id: 8, title: "语言"},
        {id: 6, title: "编程语言"},
        {id: 3, title: "JavaScript"},
        {id: 4, title: "Spring"},
        {id: 5, title: "log"}
    ];
    const [highlightedKeywords, setHighlightedKeywords] = useState(items);

    const handlePin = () => {
        setIsPinned(!isPinned);
        window.ipcRenderer?.send('pin-window', !isPinned);
    };

    const handleClose = () => {
        window.ipcRenderer?.send('close-window');
        setIsClosed(true);
    };

    const handleClipboardUpdate = useCallback((event: any, text: string) => {
        const cleanText = text.text
            .replace(/\n{3,}/g, '\n')
            .replace(/^\n+|\n+$/g, '')
            .replace(/[\u200B-\u200D\uFEFF]/g, '');

        setCustomClipBoardContent(cleanText);
    }, []);

    const getWorksList = async () => {
        const res = await worksListDB.getMetadataByTagId(1)
        setHighlightedKeywords(res)
        return res
    }

    useEffect(() => {
        getWorksList()
        window.ipcRenderer?.on('clipboard-update', (event: any, text: string) => {
            getWorksList()
            handleClipboardUpdate(event, text)
        });
        return () => {
            window.ipcRenderer?.off?.('clipboard-update', handleClipboardUpdate);
        };
    }, [handleClipboardUpdate]);

    if (isClosed) return null;

    return (
        <div className='noteHightLightRoot'>
            <ControlBar isPinned={isPinned} style={{marginBottom: 0}}>
                <div className="flex gap-2">
                    <Button
                        variant={isPinned ? "contained" : "outlined"}
                        color="primary"
                        onClick={handlePin}
                        startIcon={<PushPinOutlinedIcon
                            style={{color: isPinned ? '#fff' : '#3b82f6'}}/>}
                    >
                        {isPinned ? '取消置顶' : '置顶窗口'}
                    </Button>
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<SettingsIcon/>}
                    >
                        设置
                    </Button>
                </div>
                <Button
                    variant="outlined"
                    color="error"
                    onClick={handleClose}
                    startIcon={<CloseIcon/>}
                >
                    关闭窗口
                </Button>
            </ControlBar>

            <TextHighlighter
                textContent={customClipBoardContent}
                items={highlightedKeywords}
            />
        </div>
    );
};

export default App;
