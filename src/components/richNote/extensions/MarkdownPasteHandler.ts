import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { marked } from "marked"; // 需要安装: npm install marked

// 将处理图片的函数移到插件外部
async function processHTMLImages(html) {
  console.log("处理HTML内容中的图片");
  const doc = new DOMParser().parseFromString(html, "text/html");
  const images = doc.querySelectorAll('img[src^="http"]');

  // 如果没有发现网络图片，直接返回原始HTML
  if (images.length === 0) {
    return html;
  }

  let processed = 0;
  const total = images.length;
  console.log(`发现${total}张网络图片，开始处理`);
  let anyImageChanged = false;

  // 使用Promise.all并发处理所有图片
  await Promise.all(
    Array.from(images).map(async (img) => {
      try {
        const originalSrc = img.src;
        console.log(`处理图片 ${++processed}/${total}:`, originalSrc);

        // 检查图片是否已经是本地路径
        if (originalSrc.startsWith("file://")) {
          console.log("图片已是本地路径，跳过:", originalSrc);
          return;
        }

        // 添加重试机制
        let retries = 3;
        let localPath = null;

        while (retries > 0 && !localPath) {
          try {
            localPath = await window.ipcRenderer.invoke(
              "download-image",
              originalSrc,
            );
            break; // 成功后跳出循环
          } catch (error) {
            console.error(`下载图片失败，剩余重试次数: ${retries - 1}`, error);
            retries--;
            // 延迟后重试
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        if (localPath) {
          console.log("图片下载成功，新路径:", localPath);
          // 保存原始URL作为自定义属性
          img.setAttribute("data-original-src", originalSrc);
          // 使用file://协议的完整路径
          const newSrc = `file://${localPath}`;
          img.src = newSrc;
          anyImageChanged = true;

          // 验证更改是否生效
          console.log("图片URL已更改为:", img.src);
        } else {
          console.warn("图片下载失败，保留原地址:", originalSrc);
        }
      } catch (error) {
        console.error("图片处理失败:", error);
      }
    }),
  );

  if (anyImageChanged) {
    console.log("至少有一张图片成功更改为本地路径");
  } else {
    console.log("没有图片更改为本地路径，内容保持不变");
  }

  return doc.body.innerHTML;
}

// 检查文本是否包含Markdown语法
function isMarkdown(text) {
  // 检查常见的Markdown语法
  const markdownPatterns = [
    /^#+\s+.+$/m, // 标题
    /\[.+\]\(.+\)/, // 链接
    /!\[.*\]\(.+\)/, // 图片
    /^>\s+.+$/m, // 引用
    /^[-*+]\s+.+$/m, // 无序列表
    /^[0-9]+\.\s+.+$/m, // 有序列表
    /^```[\s\S]*?```$/m, // 代码块
    /`[^`]+`/, // 行内代码
    /\*\*[^*]+\*\*/, // 粗体
    /\*[^*]+\*/, // 斜体
    /^---+$/m, // 分隔线
    /^===+$/m, // 分隔线
    /^___+$/m, // 分隔线
  ];

  return markdownPatterns.some((pattern) => pattern.test(text));
}

// 将Markdown转换为HTML
function markdownToHtml(markdown) {
  try {
    return marked.parse(markdown);
  } catch (error) {
    console.error("Markdown转换失败:", error);
    return markdown;
  }
}

// 创建扩展
export const MarkdownPasteHandler = Extension.create({
  name: "markdownPasteHandler",

  addStorage() {
    return {
      markdownDetected: false,
    };
  },

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        key: new PluginKey("markdownPasteHandler"),
        props: {
          handlePaste: async (view, event, slice) => {
            const { clipboardData } = event;

            if (!clipboardData) return false;

            // 获取纯文本内容
            const text = clipboardData.getData("text/plain");

            // 如果没有文本，让编辑器处理默认粘贴
            if (!text) return false;

            // 检查是否为Markdown
            if (isMarkdown(text)) {
              console.log("检测到Markdown内容，开始处理");
              event.preventDefault();

              try {
                // 转换Markdown为HTML
                const html = markdownToHtml(text);
                console.log("Markdown已转换为HTML");

                // 处理HTML中的图片
                const processedHTML = await processHTMLImages(html);

                // 插入处理后的内容
                editor.commands.insertContent(processedHTML);

                // 更新存储状态
                this.storage.markdownDetected = true;

                return true;
              } catch (error) {
                console.error("处理Markdown粘贴失败:", error);
                // 失败时尝试直接插入原始文本
                editor.commands.insertContent(text);
                return true;
              }
            }

            // 检查HTML内容中是否包含图片
            const html = clipboardData.getData("text/html");
            if (
              html &&
              (html.includes('img src="http') || html.includes("img src='http"))
            ) {
              console.log("检测到HTML中包含网络图片，开始处理");
              event.preventDefault();

              try {
                // 处理HTML中的图片
                const processedHTML = await processHTMLImages(html);
                editor.commands.insertContent(processedHTML);
                return true;
              } catch (error) {
                console.error("处理粘贴的HTML图片失败:", error);
                editor.commands.insertContent(html);
                return true;
              }
            }

            // 对于其他内容，让编辑器处理默认粘贴行为
            return false;
          },
        },
      }),
    ];
  },
});

// 导出处理函数以便在其他地方使用
export { processHTMLImages, markdownToHtml, isMarkdown };
