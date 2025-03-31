import React, { useState, useRef } from "react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import "./styles.scss";

export default function CodeBlockComponent({
  node: { attrs },
  updateAttributes,
  editor,
}) {
  const [showLanguageList, setShowLanguageList] = useState(false);
  const [copied, setCopied] = useState(false);
  const codeRef = useRef(null);

  // 支持的语言列表 - 与您已注册的语言保持一致
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

  // 复制代码功能
  const copyCode = () => {
    if (codeRef.current) {
      const code = codeRef.current.textContent;
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 切换语言选择器显示
  const toggleLanguageList = () => {
    setShowLanguageList(!showLanguageList);
  };

  // 选择语言
  const selectLanguage = (language) => {
    updateAttributes({ language });
    setShowLanguageList(false);
  };

  return (
    <NodeViewWrapper className="code-block-component">
      <div className="code-block-header">
        <div className="language-selector">
          <button className="language-button" onClick={toggleLanguageList}>
            {attrs.language || "plaintext"}
            <span className="material-symbols-outlined">expand_more</span>
          </button>

          {showLanguageList && (
            <div className="language-list">
              {languages.map((lang) => (
                <div
                  key={lang}
                  className={`language-item ${
                    attrs.language === lang ? "selected" : ""
                  }`}
                  onClick={() => selectLanguage(lang)}
                >
                  {lang}
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="copy-button" onClick={copyCode}>
          <span className="material-symbols-outlined">
            {copied ? "check" : "content_copy"}
          </span>
          {copied ? "已复制" : "复制"}
        </button>
      </div>

      <pre ref={codeRef}>
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  );
}
