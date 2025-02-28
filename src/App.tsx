import {useState} from "react";
import NoteContent from "./components/noteContent";
import NoteContentOutline from "./components/noteContentOutline";
import NoteOutlineTree from "./components/noteOutlineTagTree";
import WordsBar from '@/components/wordsBar'

function App() {
    const [count, setCount] = useState(0);
    return (
        <div className="App w-full">
            <div className="flex w-full">
                <div className='flex'>
                    <div className="h-full bg-white" style={{
                        zIndex: 9999,
                        borderRight: '1px solid rgba(0, 0, 0, 0.12)',
                        backgroundColor:'#FAFAFA'
                    }}>
                        <NoteContent></NoteContent>
                        <NoteOutlineTree></NoteOutlineTree>
                    </div>
                    <WordsBar/>
                </div>
                <NoteContentOutline></NoteContentOutline>
            </div>
        </div>
    );
}

export default App;
