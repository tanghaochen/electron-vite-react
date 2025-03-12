import "./styles.scss";
import {Color} from "@tiptap/extension-color";
import ListItem from "@tiptap/extension-list-item";
import TextStyle from "@tiptap/extension-text-style";
import {EditorProvider, useCurrentEditor} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React from "react";
import Button from "@mui/material/Button";
import "material-symbols";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import ListItemText from "@mui/material/ListItemText";
import Select, {SelectChangeEvent} from "@mui/material/Select";
import HightlightComp from "./subComponents/highlight";
import Image from "@tiptap/extension-image";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Highlight from "@tiptap/extension-highlight";
import {
    paragraphTList,
    extTypeList,
    colors,
    listTypeList,
    textAlignTypeList,
} from "./constants";
import {Divide} from "lucide-react";
import Divider from "@mui/material/Divider";
import Blockquote from "@tiptap/extension-blockquote";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import css from "highlight.js/lib/languages/css";
import js from "highlight.js/lib/languages/javascript";
import ts from "highlight.js/lib/languages/typescript";
import html from "highlight.js/lib/languages/xml";
import {all, createLowlight} from "lowlight";
import Text from "@tiptap/extension-text";
import Typography from "@tiptap/extension-typography";
import TextAlign from "@tiptap/extension-text-align";
import Italic from "@tiptap/extension-italic";

const lowlight = createLowlight(all);
lowlight.register("html", html);
lowlight.register("css", css);
lowlight.register("js", js);
lowlight.register("ts", ts);

const MenuBar = () => {
    const {editor} = useCurrentEditor();
    const ITEM_HEIGHT = 48;
    const ITEM_PADDING_TOP = 8;
    const MenuProps = {
        PaperProps: {
            style: {
                maxHeight: ITEM_HEIGHT * 7 + ITEM_PADDING_TOP, // 7个选项的高度
                width: 200,
            },
        },
    };

    if (!editor) {
        return null;
    }

    const CommonBtn = (props) => {
        const {
            extType = "bold",
            toggleFunName,
            iconName,
            disabled: externalDisabled = false,
        } = props;
        const toggleFun =
            toggleFunName || `toggle${extType[0].toUpperCase()}${extType.slice(1)}`;

        return (
            <Button
                color="#000000"
                size="small"
                style={{
                    backgroundColor: editor?.isActive(extType) ? "#E7E9E8" : "",
                    height: "100%",
                }}
                onClick={() => editor?.chain().focus()[toggleFun]?.().run()}
            >
        <span className="material-symbols-outlined">
          {iconName || `format_${extType}`}
        </span>
            </Button>
        );
    };

    const [selectedPara, setSelectedPara] = React.useState("正文"); // 修改1: 使用字符串状态
    // 实时获取当前段落/标题状态
    const currentValue = React.useMemo(() => {
        if (!editor) return "正文";

        // 检查是否是标题（优先级从h1到h6）
        for (let level = 1; level <= 6; level++) {
            if (editor.isActive("heading", {level})) {
                return `标题${level}`;
            }
        }
        return "正文";
    }, [editor?.state]); // 当编辑器状态变化时自动更新

    const handleChange = (event: SelectChangeEvent<string>) => {
        // 修改2: 处理字符串值
        const value = event.target.value;
        setSelectedPara(value);

        // 根据选择执行编辑器命令
        if (value === "正文") {
            editor?.chain().focus().setParagraph().run();
        } else if (value.startsWith("标题")) {
            const level = parseInt(value.replace("标题", ""));
            editor?.chain().focus().toggleHeading({level}).run();
        }
    };

    return (
        <div className="control-group">
            <div
                className="button-group inline-flex justify-start align-middle overflow-auto">
                {/*ChromePicker,CompactPicker,GithubPicker, HuePicker, HuePicker,PhotoshopPicker,SketchPicker*/}

                <FormControl sx={{m: 1, width: 100}} size="small">
                    <Select
                        value={currentValue}
                        onChange={handleChange}
                        renderValue={(value) => value}
                        MenuProps={MenuProps}
                    >
                        {paragraphTList.map((paraItem, paraIndex) => (
                            <MenuItem
                                key={paraItem.label}
                                value={paraItem.label}
                                sx={{
                                    py: 1, // 减少纵向padding
                                    "& h1, & h2, & h3, & h4, & h5, & h6": {
                                        margin: 0,
                                        lineHeight: "1.3",
                                        letterSpacing: "0.5px",
                                    },
                                }}
                            >
                                <ListItemText>
                                    {React.createElement(
                                        paraIndex === 0 ? "p" : `h${paraIndex}`,
                                        {
                                            style: {
                                                fontSize:
                                                    paraIndex === 0
                                                        ? "1rem"
                                                        : `${2 - paraIndex * 0.2}rem`,
                                                fontWeight: paraIndex === 0 ? 400 : 600,
                                                color: "#333",
                                                marginTop: paraIndex === 0 && "0.5rem",
                                                marginBottom: paraIndex === 0 && ".5rem",
                                            },
                                        },
                                        paraItem.label,
                                    )}
                                </ListItemText>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {extTypeList.map((item, index) => {
                    return <CommonBtn key={index} {...item} />;
                })}

                <Divider orientation="vertical" variant="middle" flexItem/>

                <HightlightComp editor={editor}/>

                <Divider orientation="vertical" variant="middle" flexItem/>

                {listTypeList.map((item, index) => {
                    return <CommonBtn key={index} {...item} />;
                })}
                <Divider orientation="vertical" variant="middle" flexItem/>
                {textAlignTypeList.map((item, index) => {
                    return <CommonBtn key={index} {...item} />;
                })}
                {/* <button onClick={() => editor.chain().focus().setHardBreak().run()}>
          Hard break
        </button> */}
                {/*<button*/}
                {/*    onClick={() => editor.chain().focus().undo().run()}*/}
                {/*    disabled={!editor.can().chain().focus().undo().run()}*/}
                {/*>*/}
                {/*    Undo*/}
                {/*</button>*/}
                {/*<button*/}
                {/*    onClick={() => editor.chain().focus().redo().run()}*/}
                {/*    disabled={!editor.can().chain().focus().redo().run()}*/}
                {/*>*/}
                {/*    Redo*/}
                {/*</button>*/}
            </div>
            {/*<input*/}
            {/*    ref={inputRef}*/}
            {/*    type="text"*/}
            {/*    className="pointer-events-none w-full"*/}
            {/*    value={inputValue}*/}
            {/*    onChange={(e) => setInputValue(e.target.value)}*/}
            {/*    onBlur={handleInputBlur}*/}
            {/*    onKeyDown={(e) => {*/}
            {/*        e.stopPropagation();*/}
            {/*        if (e.key === "Enter") (e.target as HTMLInputElement).blur();*/}
            {/*    }}*/}

            {/*/>*/}
            <div
                className='w-full my-4'
            >
                <input
                    className='border-none w-full font-bold text-4xl content-title focus:ring-0'
                    minLength={1}
                    maxLength={30}
                    size={10}
                        // value={'inputValue'}
                    placeholder={'请输入标题'}
                />
            </div>
        </div>
    );
};
//
const extensions = [
    StarterKit.configure({}),
    Color.configure({types: [TextStyle.name, ListItem.name]}),
    TextStyle.configure({types: [ListItem.name]}),
    Highlight.configure({multicolor: true}),
    Image,
    Italic,
    Blockquote.configure({
        HTMLAttributes: {
            class: "my-custom-class",
        },
    }),
    Typography,
    ListItem.configure({
        HTMLAttributes: {
            class: "my-custom-class",
        },
    }),
    CodeBlockLowlight.configure({
        lowlight,
    }),
    TextAlign.configure({
        types: ["heading", "paragraph"],
    }),
    TaskList,
    Text,
    TaskItem.configure({}),
];

const content = `
<h2>
  Hi there,
</h2>
<p>
  this is a <em>basic</em> example of <strong>Tiptap</strong>. Sure, there are all kind of basic text styles you’d probably expect from a text editor. But wait until you see the lists:
</p>
<ul>
  <li>
    That’s a bullet list with one …
  </li>
  <li>
    … or two list items.
  </li>
</ul>
<img src="https://placehold.co/800x400" />
<p>
  Isn’t that great? And all of that is editable. But wait, there’s more. Let’s try a code block:
</p>
<pre><code class="language-css">body {
  display: none;
}</code></pre>
<p>
  I know, I know, this is impressive. It’s only the tip of the iceberg though. Give it a try and click a little bit around. Don’t forget to check the other examples too.
</p>
<blockquote>
  Wow, that’s amazing. Good work, boy! 👏
  <br />
  — Mom
</blockquote>
`;

export default () => {
    return (
        <EditorProvider
            slotBefore={<MenuBar/>}
            // slotAfter={<MenuBar/>}
            extensions={extensions}
            content={content}
        ></EditorProvider>
    );
};
