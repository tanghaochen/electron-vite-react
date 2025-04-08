import React, { useRef } from "react";

// 简单的图片上传按钮组件
export default function ImageUploadButton({ editor }) {
  const fileInput = useRef(null);

  async function handleFile(event) {
    const files = event?.target?.files;
    if (!editor || files.length === 0) {
      return;
    }

    const file = files[0];

    // 直接使用URL.createObjectURL创建本地URL
    const src = URL.createObjectURL(file);

    // 使用editor命令插入图片
    editor
      .chain()
      .focus()
      .setImageInline({
        src,
        alt: file.name,
        width: 300, // 设置一个默认宽度
      })
      .run();

    // 清空input以允许重复上传相同文件
    event.target.value = null;
  }

  return (
    <>
      <button
        onClick={() => fileInput.current?.click()}
        className="menu-item"
        title="上传图片"
      >
        <span className="material-symbols-outlined">image</span>
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: "none" }}
      />
    </>
  );
}
