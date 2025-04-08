import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ImageView from "./CustomImageView.tsx";

export const CustomImage = Image.extend({
  group: "inline",
  inline: true,
  defining: true,
  draggable: true,
  selectable: true,
  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },
  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
        parseHTML: (element) => {
          const src = element.getAttribute("src");
          return src;
        },
        renderHTML: (attributes) => {
          if (!attributes.src) {
            return {};
          }

          return {
            src: attributes.src,
            // 添加错误处理
            onerror:
              "this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMjJDMTcuNTIyOCAyMiAyMiAxNy41MjI4IDIyIDEyQzIyIDYuNDc3MTUgMTcuNTIyOCAyIDEyIDJDNi40NzcxNSAyIDIgNi40NzcxNSAyIDEyQzIgMTcuNTIyOCA2LjQ3NzE1IDIyIDEyIDIyWiIgc3Ryb2tlPSIjOTk5OTk5IiBzdHJva2Utd2lkdGg9IjEuNSIvPjxwYXRoIGQ9Ik0xMiA4VjEyIiBzdHJva2U9IiM5OTk5OTkiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNMTIgMTZWMTYuMDEiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg=='; this.style.padding='10px'; this.style.background='#f5f5f5';",
          };
        },
      },
      // 保存原始URL
      "data-original-src": {
        default: null,
        parseHTML: (element) => element.getAttribute("data-original-src"),
        renderHTML: (attributes) => {
          if (!attributes["data-original-src"]) {
            return {};
          }

          return {
            "data-original-src": attributes["data-original-src"],
          };
        },
      },
      // 添加宽度属性
      width: {
        default: null,
        parseHTML: (element) => {
          const width =
            element.style.width || element.getAttribute("width") || null;
          return !width ? null : Number.parseInt(width, 10);
        },
        renderHTML: (attributes) => {
          return {
            width: attributes.width,
          };
        },
      },
      // 添加对齐属性
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("align"),
        renderHTML: (attributes) => {
          return {
            align: attributes.align,
          };
        },
      },
      // 添加内联属性
      inline: {
        default: false,
        parseHTML: (element) => Boolean(element.getAttribute("inline")),
        renderHTML: (attributes) => {
          return {
            inline: attributes.inline,
          };
        },
      },
    };
  },
  // 添加命令
  addCommands() {
    return {
      ...this.parent?.(),
      setImageInline:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              ...options,
              inline: options.inline ?? false,
            },
          });
        },
      updateImage:
        (options) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, options);
        },
      setAlignImage:
        (align) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { align });
        },
    };
  },
});

export default CustomImage;
