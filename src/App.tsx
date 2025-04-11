import { useEffect, useState } from "react";
import NoteContent from "./components/noteContent";
import NoteContentOutline from "./components/noteContentOutline";
import NoteOutlineTree from "./components/noteOutlineTagTree";
import WordsBar from "@/components/wordsBar";
import { IconButton, ListSubheader } from "@mui/material";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import Stack from "@mui/material/Stack";
import "@/assets/globalStyles.scss";
import ComplextTree from "@/components/complexTree";
import DocumentOutline from "@/components/documentOutline";

function App() {
  // 点击标签树
  const [selectedTag, setSelectedTag] = useState(0);
  // 被点击词库列表worksBar, 打开词库笔记
  const [worksItem, setWorksItem] = useState({});
  // 词库列表数据
  const [worksList, setWorksList] = useState([]);
  const [currentEditor, setCurrentEditor] = useState(null);
  const [currentTab, setCurrentTab] = useState(null);
  const [activeRichTextEditor, setActiveRichTextEditor] = useState(null);

  useEffect(() => {
    console.log("selectedTag", selectedTag);
  }, [selectedTag]);

  return (
    <div className="App w-full flex-1 flex h-full absolute top-0 left-0 bottom-0">
      <div className="flex">
        {/*<NoteOutlineTree></NoteOutlineTree>*/}
        <div className="w-80 border-0 border-r-2 border-solid border-r-gray-300">
          <ComplextTree onSelectedTagChange={setSelectedTag} />
        </div>
        <div className="w-80 border-0 border-r-2 border-solid border-r-gray-300">
          <WordsBar
            selectedTagItem={selectedTag}
            worksItem={worksItem}
            setWorksItem={setWorksItem}
            worksList={worksList}
            setWorksList={setWorksList}
          />
        </div>
      </div>
      {/* 笔记内容 */}
      <NoteContentOutline
        worksItem={worksItem}
        setWorksItem={setWorksItem}
        setWorksList={setWorksList}
        setCurrentEditor={setCurrentEditor}
        setCurrentTab={setCurrentTab}
        setActiveRichTextEditor={setActiveRichTextEditor}
      ></NoteContentOutline>
      <div className="tableOfContents w-96 h-full bg-gray-50 border-0 border-l-2 border-solid border-l-gray-300 overflow-clip">
        {/* 文档大纲 */}
        <DocumentOutline
          editor={activeRichTextEditor}
          activeTabsItem={currentTab}
          // activeRichTextEditor={activeRichTextEditor}
        />
      </div>
    </div>
  );
}

export default App;
