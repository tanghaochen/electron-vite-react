import {useEffect, useState} from "react";
import NoteContent from "./components/noteContent";
import NoteContentOutline from "./components/noteContentOutline";
import NoteOutlineTree from "./components/noteOutlineTagTree";
import WordsBar from '@/components/wordsBar'
import {IconButton, ListSubheader} from "@mui/material";
import Button from "@mui/material/Button";
import AddIcon from '@mui/icons-material/Add';
import Stack from "@mui/material/Stack";
import "@/assets/globalStyles.scss"
import ComplextTree from '@/components/complexTree'


function App() {
    // 点击标签树
    const [selectedTag, setSelectedTag] = useState(0);
    // 被点击词库列表worksBar, 打开词库笔记
    const [worksItem, setWorksItem] = useState({});
    // 词库列表数据
    const [worksList, setWorksList] = useState([]);
    useEffect(() => {
        console.log('selectedTag', selectedTag)
    }, [selectedTag]);

    return (
        <div className="App w-full overflow-clip">
            <div className="flex w-full absolute top-0 bottom-0 overflow-clip">
                <div className='flex'>
                    {/*<NoteOutlineTree></NoteOutlineTree>*/}
                    <div className='w-80 border-0 border-r-2 border-solid border-r-gray-300'>
                        <ComplextTree onSelectedTagChange={setSelectedTag} />
                    </div>
                    <div className='w-80 border-0 border-r-2 border-solid border-r-gray-300'>
                    <WordsBar selectedTagItem={selectedTag} worksItem={worksItem} setWorksItem={setWorksItem} worksList={worksList} setWorksList={setWorksList} />
                    </div>
                </div>
                <NoteContentOutline worksItem={worksItem} setWorksItem={setWorksItem} setWorksList={setWorksList} ></NoteContentOutline>
            </div>
        </div>
    );
}

export default App;
