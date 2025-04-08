export const paragraphTList = [
  {
    icon: "format_paragraph",
    label: "正文",
  },
  {
    icon: "format_h1",
    label: "标题1",
  },
  {
    icon: "format_h2",
    label: "标题2",
  },
  {
    icon: "format_h3",
    label: "标题3",
  },
  {
    icon: "format_h4",
    label: "标题4",
  },
  {
    icon: "format_h5",
    label: "标题5",
  },
  {
    icon: "format_h6",
    label: "标题6",
  },
];
export const listTypeList = [
  {
    iconName: "format_list_bulleted",
    extType: "bulletList",
  },
  {
    iconName: "format_list_numbered",
    extType: "OrderedList",
  },
  {
    iconName: "checklist",
    extType: "TaskList",
  },
];

export const textAlignTypeList = [
  {
    iconName: "format_align_left",
    extType: "bulletList",
    toggleFunName: "setTextAlign",
    toggleFunParam: "left",
  },
  {
    iconName: "format_align_center",
    extType: "OrderedList",
    toggleFunName: "setTextAlign",
    toggleFunParam: "center",
  },
  {
    iconName: "format_align_right",
    extType: "TaskList",
    toggleFunName: "setTextAlign",
    toggleFunParam: "right",
  },
];
export const extTypeList = [
  {
    // 清理mark行内样式
    extType: "allMarks",
    toggleFunName: "unsetAllMarks",
    iconName: "ink_eraser",
  },
  {
    // 清理node节点样式
    extType: "clearNodes",
    toggleFunName: "clearNodes",
    iconName: "scan_delete",
  },
  {
    extType: "bold",
    iconName: "format_bold",
  },
  {
    extType: "italic",
    iconName: "format_italic",
  },
  {
    extType: "strike",
    iconName: "format_strikethrough",
  },
  {
    extType: "code",
    iconName: "data_object",
  },
  {
    extType: "codeBlock",
    iconName: "frame_source",
  },
  {
    extType: "blockquote",
    iconName: "format_quote",
  },
  {
    extType: "horizontalTule",
    toggleFunName: "setHorizontalRule",
    iconName: "horizontal_rule",
  },
];

// 第一步：定义颜色数组
export const colors = [
  "#262626",
  "#595959",
  "#8C8C8C",
  "#BFBFBF",
  "#D9D9D9",
  "#F5F5F5", // 灰色系
  "#F5222D",
  "#FA541C",
  "#FA8C16",
  "#FADB14",
  "#52C41A",
  "#13C2C2", // 彩色系
  "#1890FF",
  "#2F54EB",
  "#722ED1",
  "#EB2F96", // 深色系
  "#FFFFFF",
  "#FFE7E6",
  "#FFEFDB",
  "#FEF6E6",
  "#FCFFE6",
  "#E6FFFB", // 浅色背景系
  "#E6F7FF",
  "#F0F5FF",
  "#F9F0FF",
  "#FFF0F6",
];
