import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import debounce from "lodash/debounce";

// 用于存储已处理过的图片URL
const processedImages = new Set<string>();
// 用于存储正在处理中的图片URL
const processingImages = new Set<string>();

// 处理编辑器中的网络图片
async function processEditorImages(editor) {
  if (!editor) return;

  // 获取编辑器内容
  const content = editor.getHTML();

  // 创建DOM解析器
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "text/html");

  // 查找所有网络图片
  const networkImages = doc.querySelectorAll('img[src^="http"]');

  if (networkImages.length === 0) {
    console.log("编辑器中没有网络图片需要处理");
    return;
  }

  console.log(`发现${networkImages.length}张网络图片，开始处理`);

  // 创建处理队列
  const processingQueue = [];

  // 将图片添加到处理队列
  for (const img of networkImages) {
    const src = img.getAttribute("src");

    // 跳过已处理或正在处理的图片
    if (processedImages.has(src) || processingImages.has(src)) {
      continue;
    }

    // 标记为正在处理
    processingImages.add(src);

    // 添加到处理队列
    processingQueue.push({
      src,
      alt: img.getAttribute("alt") || "图片",
      title: img.getAttribute("title") || "",
    });
  }

  if (processingQueue.length === 0) {
    console.log("没有新的网络图片需要处理");
    return;
  }

  console.log(`添加了${processingQueue.length}张新图片到处理队列`);

  // 处理队列中的图片
  for (const item of processingQueue) {
    try {
      await processNetworkImage(item, editor);
    } catch (error) {
      console.error(`处理图片失败: ${item.src}`, error);
      // 从处理中列表移除
      processingImages.delete(item.src);
    }
  }
}

// 处理单个网络图片
async function processNetworkImage(imageItem, editor) {
  const { src, alt, title } = imageItem;
  console.log("处理网络图片:", src);

  try {
    // 设置referer
    let referer = null;
    let originalUrl = null;

    // 根据图片URL设置合适的referer
    const url = new URL(src);
    const hostname = url.hostname;

    // 常见网站的referer设置
    if (hostname.includes("csdnimg.cn") || hostname.includes("csdn.net")) {
      referer = "https://blog.csdn.net";
      originalUrl = document.referrer || "https://blog.csdn.net";
    } else if (
      hostname.includes("mmbiz.qpic.cn") ||
      hostname.includes("mmbiz.qlogo.cn")
    ) {
      referer = "https://mp.weixin.qq.com";
      originalUrl = document.referrer || "https://mp.weixin.qq.com";
    } else if (hostname.includes("zhimg.com")) {
      referer = "https://www.zhihu.com";
      originalUrl = document.referrer || "https://www.zhihu.com";
    } else if (
      hostname.includes("jianshu.io") ||
      hostname.includes("jianshu.com")
    ) {
      referer = "https://www.jianshu.com";
      originalUrl = document.referrer || "https://www.jianshu.com";
    } else if (hostname.includes("juejin.cn")) {
      referer = "https://juejin.cn";
      originalUrl = document.referrer || "https://juejin.cn";
    } else if (
      hostname.includes("byteimg.com") ||
      hostname.includes("toutiao.com") ||
      hostname.includes("douyin.com") ||
      hostname.includes("bytedance.com") ||
      hostname.includes("feishu.cn")
    ) {
      // 字节跳动相关网站
      referer = "https://juejin.cn";
      originalUrl = document.referrer || "https://juejin.cn";

      // 对于字节跳动的图片，我们需要保留查询参数
      const cleanSrc = src; // 不清理URL，保留所有参数
      console.log("字节跳动图片，保留完整URL:", cleanSrc);

      // 下载图片
      const localPath = await window.ipcRenderer.invoke(
        "download-image",
        cleanSrc,
        referer,
        originalUrl,
        true, // 标记为字节跳动图片
      );

      if (localPath) {
        // 格式化路径
        let formattedPath = localPath.replace(/\\/g, "/");
        if (!formattedPath.startsWith("/")) {
          formattedPath = "/" + formattedPath;
        }

        // 替换编辑器中的图片
        replaceImageInEditor(
          editor,
          src,
          `file:///${formattedPath}`,
          alt,
          title,
        );

        // 标记为已处理
        processedImages.add(src);
        console.log("字节跳动图片处理成功:", src, "->", formattedPath);
      }

      // 从处理中列表移除
      processingImages.delete(src);
      return;
    } else {
      // 对于其他网站，使用图片所在域名作为referer
      referer = `${url.protocol}//${url.hostname}`;
      originalUrl = document.referrer || `${url.protocol}//${url.hostname}`;
    }

    console.log("设置referer:", referer);
    console.log("原始页面URL:", originalUrl);

    // 清理URL，移除查询参数
    const cleanSrc = src.split("?")[0];
    console.log("清理后的URL:", cleanSrc);

    // 下载图片
    const localPath = await window.ipcRenderer.invoke(
      "download-image",
      cleanSrc,
      referer,
      originalUrl,
    );

    if (localPath) {
      // 格式化路径
      let formattedPath = localPath.replace(/\\/g, "/");
      if (!formattedPath.startsWith("/")) {
        formattedPath = "/" + formattedPath;
      }

      // 替换编辑器中的图片
      replaceImageInEditor(editor, src, `file:///${formattedPath}`, alt, title);

      // 标记为已处理
      processedImages.add(src);
      console.log("图片处理成功:", src, "->", formattedPath);
    } else {
      console.warn("图片下载失败:", src);
    }
  } catch (error) {
    console.error("处理图片失败:", error);
  } finally {
    // 从处理中列表移除
    processingImages.delete(src);
  }
}

// 替换编辑器中的图片
function replaceImageInEditor(editor, oldSrc, newSrc, alt, title) {
  if (!editor) return;

  // 获取编辑器内容
  const content = editor.getHTML();

  // 创建DOM解析器
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "text/html");

  // 查找所有匹配的图片
  const images = doc.querySelectorAll(`img[src="${oldSrc}"]`);

  if (images.length === 0) {
    console.warn("未找到要替换的图片:", oldSrc);
    return;
  }

  // 替换图片src
  let hasChanges = false;
  images.forEach((img) => {
    img.setAttribute("src", newSrc);
    if (alt) img.setAttribute("alt", alt);
    if (title) img.setAttribute("title", title);
    hasChanges = true;
  });

  if (hasChanges) {
    // 获取更新后的HTML
    const updatedContent = doc.body.innerHTML;

    // 使用事务更新编辑器内容，避免重复插入
    editor.commands.setContent(updatedContent, {
      emitUpdate: true,
      preserveWhitespace: "full",
    });

    console.log("图片替换成功:", oldSrc, "->", newSrc);
  }
}

// 创建防抖处理函数
const debouncedProcessImages = debounce(processEditorImages, 1000);

// 创建扩展
export const ImageUpdateHandler = Extension.create({
  name: "imageUpdateHandler",

  addOptions() {
    return {
      // 防抖延迟时间（毫秒）
      debounceDelay: 1000,
    };
  },

  onUpdate({ editor }) {
    // 使用防抖函数处理图片，避免频繁更新
    debouncedProcessImages(editor);
  },

  // 清除已处理图片记录的方法（可选，用于测试或重置）
  clearProcessedImages() {
    processedImages.clear();
    processingImages.clear();
    console.log("已清除处理记录");
  },
});
