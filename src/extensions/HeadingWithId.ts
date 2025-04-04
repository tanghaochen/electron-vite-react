import { mergeAttributes, Node, textblockTypeInputRule } from "@tiptap/core";
import { nanoid } from "nanoid"; // 用于生成唯一ID

/**
 * 标题级别选项
 */
export type Level = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingWithIdOptions {
  /**
   * 可用的标题级别
   * @default [1, 2, 3, 4, 5, 6]
   */
  levels: Level[];

  /**
   * 标题节点的HTML属性
   * @default {}
   */
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    headingWithId: {
      /**
       * 设置带ID的标题节点
       */
      setHeadingWithId: (attributes: {
        level: Level;
        id?: string;
      }) => ReturnType;

      /**
       * 切换带ID的标题节点
       */
      toggleHeadingWithId: (attributes: {
        level: Level;
        id?: string;
      }) => ReturnType;
    };
  }
}

/**
 * 带有唯一ID的标题扩展
 * 基于Tiptap的Heading扩展，但为每个标题添加唯一ID
 */
export const HeadingWithId = Node.create<HeadingWithIdOptions>({
  name: "headingWithId",

  addOptions() {
    return {
      levels: [1, 2, 3, 4, 5, 6],
      HTMLAttributes: {},
    };
  },

  content: "inline*",

  group: "block",

  defining: true,

  addAttributes() {
    return {
      level: {
        default: 1,
        rendered: false,
      },
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("id") || nanoid(8),
        renderHTML: (attributes) => {
          if (!attributes.id) {
            attributes.id = nanoid(8);
          }
          return { id: attributes.id };
        },
      },
    };
  },

  parseHTML() {
    return this.options.levels.map((level: Level) => ({
      tag: `h${level}`,
      attrs: { level },
    }));
  },

  renderHTML({ node, HTMLAttributes }) {
    const hasLevel = this.options.levels.includes(node.attrs.level);
    const level = hasLevel ? node.attrs.level : this.options.levels[0];

    return [
      `h${level}`,
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      setHeadingWithId:
        (attributes) =>
        ({ commands }) => {
          if (!this.options.levels.includes(attributes.level)) {
            return false;
          }

          // 如果没有提供ID，生成一个新的
          if (!attributes.id) {
            attributes.id = nanoid(8);
          }

          return commands.setNode(this.name, attributes);
        },
      toggleHeadingWithId:
        (attributes) =>
        ({ commands }) => {
          if (!this.options.levels.includes(attributes.level)) {
            return false;
          }

          // 如果没有提供ID，生成一个新的
          if (!attributes.id) {
            attributes.id = nanoid(8);
          }

          return commands.toggleNode(this.name, "paragraph", attributes);
        },
    };
  },

  addKeyboardShortcuts() {
    return this.options.levels.reduce(
      (items, level) => ({
        ...items,
        ...{
          [`Mod-Alt-${level}`]: () =>
            this.editor.commands.toggleHeadingWithId({ level }),
        },
      }),
      {},
    );
  },

  addInputRules() {
    return this.options.levels.map((level) => {
      return textblockTypeInputRule({
        find: new RegExp(
          `^(#{${Math.min(...this.options.levels)},${level}})\\s$`,
        ),
        type: this.type,
        getAttributes: {
          level,
          id: nanoid(8), // 为通过输入规则创建的标题生成唯一ID
        },
      });
    });
  },
});
