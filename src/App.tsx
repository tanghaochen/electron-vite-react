import { useEffect, useState, useRef } from "react";
import NoteContent from "./components/noteContent";
import NoteContentOutline from "./components/noteContentOutline";
import NoteOutlineTree from "./components/noteOutlineTagTree";
import WordsBar from "@/components/wordsBar";
import { IconButton, ListSubheader } from "@mui/material";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import Stack from "@mui/material/Stack";
import "@/assets/globalStyles.scss";
import ComplextTree from "@/components/complexTree/index.tsx";
import DocumentOutline from "@/components/documentOutline";

interface TreeItemData {
  index: string;
  isFolder: boolean;
  children: string[];
  label: string;
  parent_id?: number;
  sort_order?: number;
  data?: any;
}

function App() {
  // 点击标签树
  const [selectedTag, setSelectedTag] = useState<TreeItemData | null>(null);
  // 被点击词库列表worksBar, 打开词库笔记
  const [worksItem, setWorksItem] = useState({});
  // 词库列表数据
  const [worksList, setWorksList] = useState([]);
  const [currentEditor, setCurrentEditor] = useState(null);
  const [currentTab, setCurrentTab] = useState(null);
  const [activeRichTextEditor, setActiveRichTextEditor] = useState(null);
  const richTextEditorEleRef = useRef(null);

  useEffect(() => {
    console.log("selectedTag", selectedTag);
  }, [selectedTag]);

  return (
    <div className="App w-full flex-1 flex h-full absolute top-0 left-0 bottom-0">
      <div className="flex">
        {/*<NoteOutlineTree></NoteOutlineTree>*/}
        <div className="w-80 border-0 border-r-2 border-solid border-r-gray-300">
          <ComplextTree
            onSelectedTagChange={setSelectedTag}
            setWorksItem={setWorksItem}
          />
        </div>
        <div className="w-80 border-0 border-r-2 border-solid border-r-gray-300">
          <WordsBar
            selectedTagItem={selectedTag} // 当前选中的标签, 打开词库列表
            worksItem={worksItem} // 当前选中的词库, 打开词库笔记
            setWorksItem={setWorksItem} // 设置当前选中的词库
            worksList={worksList} // 词库列表
            setWorksList={setWorksList} // 设置词库列表
          />
        </div>
      </div>
      {/* 笔记内容 */}
      <NoteContentOutline
        worksItem={worksItem} // 当前选中的词库, 打开词库笔记
        setWorksItem={setWorksItem} // 设置当前选中的词库
        setWorksList={setWorksList} // 设置词库列表
        setCurrentEditor={setCurrentEditor} // 设置当前编辑器
        setCurrentTab={setCurrentTab} // 设置当前标签
        setActiveRichTextEditor={setActiveRichTextEditor} // 设置当前富文本编辑器
      ></NoteContentOutline>
      <div className="tableOfContents w-96 h-full bg-gray-50 border-0 border-l-2 border-solid border-l-gray-300 overflow-clip">
        {/* 文档大纲 */}
        <DocumentOutline
          editor={activeRichTextEditor}
          activeTabsItem={currentTab}
          richTextEditorEleRef={richTextEditorEleRef}
        />
      </div>
    </div>
  );
}

export default App;
