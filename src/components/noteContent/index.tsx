import React, {useEffect, useState} from "react";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Autocomplete from "@mui/material/Autocomplete";
import SvgIcon, {SvgIconProps} from "@mui/material/SvgIcon";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import './styles.scss'

function HomeIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props}>
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </SvgIcon>
    );
}

export default function FreeSolo({title, onFileSearch}) {
    const [tagInputVal, setTagInputVal] = useState("");

    useEffect(() => {
        const handleInputEvent = (event) => {
            const {keyCode} = event;
            console.log(event);
            // 13是回测
            if (keyCode === 13) {
                onFileSearch(tagInputVal);
            }
        };
    });
    const startSearch = (e) => {
        console.log(e);
        if (e.key === "Enter") {
            console.log("search");
        }
    };

    return (
            <Autocomplete
                freeSolo
                id="free-solo-2-demo"
                className="p-2"
                disableClearable
                options={top100Films.map((option) => option.title)}
                renderInput={(params) => (
                    <div className="flex justify-between">
                        <TextField
                            {...params}
                            label="搜索标签"
                            value={tagInputVal}
                            onKeyDown={startSearch}
                            slotProps={{
                                input: {
                                    ...params.InputProps,
                                    type: "search",
                                    endAdornment: <SearchIcon/>,
                                },
                            }}
                        />
                    </div>
                )}
            />
    );
}

// Top 100 films as rated by IMDb users. http://www.imdb.com/chart/top
const top100Films = [
    {title: "The Shawshank Redemption", year: 1994},
    {title: "The Godfather", year: 1972},
    {title: "The Godfather: Part II", year: 1974},
    {title: "The Dark Knight", year: 2008},
];
