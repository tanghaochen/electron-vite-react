import {useState} from "react";
import NoteContent from "./components/noteContent";
import NoteContentOutline from "./components/noteContentOutline";
import NoteOutlineTree from "./components/noteOutlineTagTree";
import WordsBar from '@/components/wordsBar'
import {IconButton, ListSubheader} from "@mui/material";
import Button from "@mui/material/Button";
import AddIcon from '@mui/icons-material/Add';
import Stack from "@mui/material/Stack";
import "@/assets/globalStyles.scss"
function App() {
    const [count, setCount] = useState(0);
    return (
        <div className="App w-full">
            <div className="flex w-full">
                <div className='flex'>
                    <NoteOutlineTree></NoteOutlineTree>
                    <WordsBar/>
                </div>
                <NoteContentOutline></NoteContentOutline>
            </div>
        </div>
    );
}

export default App;
