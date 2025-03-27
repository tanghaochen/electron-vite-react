import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

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

// 检查URL是否为图片链接
function isImageUrl(url) {
  // 检查URL是否以常见图片扩展名结尾
  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".bmp",
    ".svg",
  ];
  const lowerUrl = url.toLowerCase();
  return (
    imageExtensions.some((ext) => lowerUrl.endsWith(ext)) ||
    // 或者包含特定的图片服务域名
    lowerUrl.includes("cdn.nlark.com") ||
    lowerUrl.includes("csdnimg.cn") ||
    lowerUrl.includes("img.") ||
    lowerUrl.includes("image.") ||
    lowerUrl.includes("images.")
  );
}

// 从文本中提取可能的图片URL
function extractImageUrls(text) {
  // 匹配http/https开头的URL
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(urlRegex) || [];

  // 过滤出可能是图片的URL
  return urls.filter((url) => isImageUrl(url));
}

// 处理纯文本中的图片URL
async function processTextImageUrls(text) {
  const imageUrls = extractImageUrls(text);

  if (imageUrls.length === 0) {
    return { text, hasImages: false };
  }

  console.log(`从文本中提取到${imageUrls.length}个可能的图片URL`);
  let processedText = text;
  let hasProcessedImages = false;

  for (const url of imageUrls) {
    try {
      console.log(`处理可能的图片URL: ${url}`);

      // 尝试下载图片
      const localPath = await window.ipcRenderer.invoke("download-image", url);

      if (localPath) {
        console.log("图片URL下载成功，新路径:", localPath);

        // 在文本中将URL替换为图片标签
        const imgTag = `<img src="file://${localPath}" data-original-src="${url}" alt="从URL转换的图片">`;
        processedText = processedText.replace(url, imgTag);
        hasProcessedImages = true;
      }
    } catch (error) {
      console.error("处理文本中的图片URL失败:", error);
    }
  }

  return { text: processedText, hasImages: hasProcessedImages };
}

export const ImagePasteHandler = Extension.create({
  name: "imagePasteHandler",

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        key: new PluginKey("imagePasteHandler"),
        props: {
          handlePaste: async (view, event, slice) => {
            const { state } = view;
            const { clipboardData } = event;

            // 检查是否有HTML内容
            const html = clipboardData.getData("text/html");
            const plainText = clipboardData.getData("text/plain");

            // 处理HTML中的图片
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
            // 处理纯文本中可能包含的图片URL
            else if (plainText) {
              console.log("检查纯文本中是否包含图片URL");

              try {
                const { text, hasImages } = await processTextImageUrls(
                  plainText,
                );

                if (hasImages) {
                  event.preventDefault();
                  console.log("从文本中提取并处理了图片URL");
                  editor.commands.insertContent(text);
                  return true;
                }
                // 如果没有图片，让编辑器处理默认粘贴
              } catch (error) {
                console.error("处理文本中的图片URL失败:", error);
              }
            }

            // 处理直接粘贴的图片文件
            if (clipboardData.items) {
              for (let i = 0; i < clipboardData.items.length; i++) {
                if (clipboardData.items[i].type.indexOf("image") === 0) {
                  event.preventDefault();
                  const blob = clipboardData.items[i].getAsFile();

                  if (blob) {
                    // 读取文件内容并保存到本地
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                      try {
                        // 将DataURL转换为Blob
                        const dataUrl = e.target.result;
                        const res = await fetch(dataUrl);
                        const imageBlob = await res.blob();

                        // 创建临时文件URL
                        const tempUrl = URL.createObjectURL(imageBlob);

                        // 通过IPC调用保存到本地
                        const localPath = await window.ipcRenderer.invoke(
                          "download-image",
                          tempUrl,
                        );

                        // 插入图片
                        editor.commands.insertContent(
                          `<img src="file://${localPath}" alt="粘贴的图片">`,
                        );

                        // 释放临时URL
                        URL.revokeObjectURL(tempUrl);
                      } catch (error) {
                        console.error("处理粘贴图片失败:", error);
                      }
                    };
                    reader.readAsDataURL(blob);
                    return true;
                  }
                }
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
export { processHTMLImages };
