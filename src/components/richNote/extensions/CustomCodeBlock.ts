import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { createLowlight, all } from "lowlight";
import CodeBlockComponent from "../subComponents/codeBlock";

// 创建 lowlight 实例并注册所有语言
const lowlight = createLowlight(all);

export const CustomCodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: "plaintext",
        parseHTML: (element) =>
          element.getAttribute("class")?.replace(/^language-/, "") ||
          "plaintext",
        renderHTML: (attributes) => {
          return {
            class: `language-${attributes.language}`,
          };
        },
      },
    };
  },
}).configure({ lowlight });
