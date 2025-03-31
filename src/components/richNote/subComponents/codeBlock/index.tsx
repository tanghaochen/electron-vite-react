import React, { useState, useRef, useEffect } from "react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import "./styles.scss";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

export default function CodeBlockComponent({
  node: { attrs },
  updateAttributes,
  editor,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [copied, setCopied] = useState(false);
  const codeRef = useRef(null);
  const [language, setLanguage] = useState(attrs.language || "plaintext");
  // 支持的语言列表
  const languages = [
    "plaintext",
    "javascript",
    "typescript",
    "html",
    "css",
    "python",
    "java",
    "php",
    "ruby",
    "go",
    "rust",
    "c",
    "cpp",
    "csharp",
    "swift",
    "bash",
    "json",
    "markdown",
    "yaml",
    "sql",
  ];
  // 当属性变化时更新语言状态
  useEffect(() => {
    setLanguage(attrs.language || "plaintext");
  }, [attrs.language]);
  // 复制代码功能
  const copyCode = () => {
    if (codeRef.current) {
      const code = codeRef.current.textContent;
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  // 选择语言
  const handleLanguageChange = (event, newValue) => {
    if (newValue) {
      setLanguage(newValue);
      updateAttributes({ language: newValue });
    }
  };
  return (
    <NodeViewWrapper className="code-block-component">
      <div className="code-block-header">
        <div className="language-selector">
          <Autocomplete
            id="language-autocomplete"
            options={languages}
            value={language}
            onChange={handleLanguageChange}
            size="small"
            sx={{ width: 150 }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                size="small"
                placeholder="选择语言"
              />
            )}
          />
        </div>
        <Button
          variant="contained"
          size="small"
          startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
          onClick={copyCode}
          className="copy-button"
        >
          {copied ? "已复制" : "复制"}
        </Button>
      </div>
      <pre ref={codeRef}>
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  );
}
