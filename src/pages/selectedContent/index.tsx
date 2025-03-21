import React, {useState, useMemo, useCallback, useEffect, useRef} from 'react';
import FlexSearch from 'flexsearch';
import {clipboard} from 'electron';
import './styles/index.scss'
import {worksListDB} from "@/database/worksLists";
import {noteContentDB} from "@/database/noteContentDB";

interface HighlightProps {
    textContent: string;
    items?: Array<{ id: number; title: string }>;
}

const TextHighlighter = ({textContent, items = []}: HighlightProps) => {
    const [highlightedText, setHighlightedText] = useState(textContent);
    const contentPreviewRef = useRef<HTMLDivElement>(null);
    const [noteContent, setNoteContent] = useState('');
    // 按标题长度降序排序
    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => b.title.length - a.title.length);
    }, [items]);

    // 创建标题到ID的映射
    const titleToIdMap = useMemo(() => {
        const map = new Map<string, number>();
        sortedItems.forEach(item => map.set(item.title, item.id));
        return map;
    }, [sortedItems]);

    const escapeRegExp = useCallback((str: string) => {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }, []);

    const highlightAll = useCallback(() => {
        try {
            // 构建正则表达式模式
            const pattern = new RegExp(
                sortedItems
                    .map(item => {
                        const escaped = escapeRegExp(item.title);
                        // 匹配三种形式：{标题}、[标题]、纯标题
                        return `(\\{${escaped}\\})|(\\[${escaped}\\])|${escaped}`;
                    })
                    .join("|"),
                "gi"
            );

            // 执行替换并添加data-id属性
            const newText = textContent.replace(pattern, (match) => {
                // 提取纯标题内容
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

    // 点击事件处理
    useEffect(() => {
        const handler =async (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('highlight')) {
                const id = target.dataset.id;
                if (!id) return false
                console.log('点击了221234:', id);
                const noteItem =await noteContentDB.getContentByNoteId(id)
                console.log('noteItem', noteItem)
                setNoteContent(noteItem)
            }
        };

        const container = contentPreviewRef.current;
        container?.addEventListener('click', handler);

        return () => container?.removeEventListener('click', handler);
    }, []);

    return (
        <div className="highlighter-container">
            <button
                onClick={highlightAll}
                disabled={items.length === 0}
                className="highlight-trigger"
            >
                🖍️ 执行未命名高亮javasdfsdlog3234222das
            </button>
            <div className="flex gap-1 h-80">
                <div className="content-preview content-preview-target">
                    <div className='font-bold'>获取内容</div>
                    <div ref={contentPreviewRef} dangerouslySetInnerHTML={{__html: highlightedText}}></div>
                </div>
                <div className="content-preview content-preview-note">
                    <div className='font-bold'>笔记内容</div>
                    <div dangerouslySetInnerHTML={{__html: noteContent}}></div>
                </div>
            </div>
        </div>
    );
};

const App = () => {
    const [customClipBoardContent, setCustomClipBoardContent] = useState('');
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

    const handleClipboardUpdate = useCallback((event: any, text: string) => {
        console.log('Received clogipboardJavadaf update:', text);
        // 仅更新原始文本内容，高亮状态由子组件管理
        setCustomClipBoardContent(text.text);
    }, []);
    const getWorksList = async () => {
        const res = await worksListDB.getMetadataByTagId(1)
        console.log('res', res)
        setHighlightedKeywords(res)
        return res
    }
    if (!window.ipcRenderer?.on) return;
    useEffect(() => {
        getWorksList()
        window.ipcRenderer.on('clipboard-update', (event: any, text: string) => {
            getWorksList()
            // 仅更新原始文本内容，高亮状态由子组件管理
            handleClipboardUpdate(event, text)
        });
        return () => {
            window.ipcRenderer?.off?.('clipboard-update', handleClipboardUpdate);
        };
    }, [handleClipboardUpdate]);


    return (
        <div style={{maxWidth: 800, margin: '20px auto'}}>
            <h1>技术术语高亮演示</h1>
            <TextHighlighter
                textContent={customClipBoardContent}
                items={highlightedKeywords}
            />
        </div>
    );
};

export default App;
