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
    const [selectedTag, setSelectedTag] = useState(0);

    useEffect(() => {
        console.log('selectedTag', selectedTag)
    }, [selectedTag]);

    return (
        <div className="App w-full">
            <div className="flex w-full">
                <div className='flex'>
                    {/*<NoteOutlineTree></NoteOutlineTree>*/}
                    <div className='w-80 border-0 border-r-2 border-solid border-r-gray-300'>
                        <ComplextTree onSelectedTagChange={setSelectedTag} />
                    </div>
                    <div className='w-80 border-0 border-r-2 border-solid border-r-gray-300'>

                    <WordsBar /></div>
                </div>
                <NoteContentOutline selectedTag={selectedTag}></NoteContentOutline>
            </div>
        </div>
    );
}

export default App;
