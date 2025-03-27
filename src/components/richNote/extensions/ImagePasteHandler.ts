import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

// 处理微信公众号文章的特殊函数
async function processWechatArticle(html, editor) {
  console.log("检测到可能是微信公众号文章，使用特殊处理");

  // 创建DOM解析器
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // 提取所有段落和图片
  const elements = [];

  // 递归遍历DOM树
  function traverse(node) {
    // 跳过空文本节点
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.trim()) {
        elements.push({
          type: "text",
          content: node.textContent,
        });
      }
      return;
    }

    // 处理元素节点
    if (node.nodeType === Node.ELEMENT_NODE) {
      // 如果是图片节点
      if (node.nodeName === "IMG") {
        const src = node.getAttribute("src");
        if (src && src.startsWith("http")) {
          elements.push({
            type: "image",
            src: src,
            alt: node.getAttribute("alt") || "图片",
          });
        }
        return;
      }

      // 如果是段落或其他文本容器
      if (
        ["P", "DIV", "SPAN", "H1", "H2", "H3", "H4", "H5", "H6"].includes(
          node.nodeName,
        )
      ) {
        // 检查是否只包含一个图片
        if (
          node.childNodes.length === 1 &&
          node.firstChild.nodeName === "IMG"
        ) {
          traverse(node.firstChild);
          return;
        }

        // 检查是否包含文本
        const textContent = node.textContent.trim();
        if (textContent) {
          elements.push({
            type: "text",
            content: textContent,
          });
        }

        // 单独处理其中的图片
        const images = node.querySelectorAll('img[src^="http"]');
        if (images.length > 0) {
          Array.from(images).forEach((img) => {
            elements.push({
              type: "image",
              src: img.getAttribute("src"),
              alt: img.getAttribute("alt") || "图片",
            });
          });
        }

        return;
      }

      // 递归处理子节点
      Array.from(node.childNodes).forEach((child) => traverse(child));
    }
  }

  // 开始遍历
  Array.from(doc.body.childNodes).forEach((node) => traverse(node));

  console.log(`提取了${elements.length}个内容元素`);

  // 清空编辑器当前选区
  editor.commands.deleteSelection();

  // 逐个处理元素
  for (const element of elements) {
    if (element.type === "text") {
      // 插入文本
      editor.commands.insertContent(`<p>${element.content}</p>`);
      console.log(`插入文本: ${element.content.substring(0, 30)}...`);
    } else if (element.type === "image") {
      try {
        const src = element.src;
        console.log("处理图片:", src);

        // 设置referer
        let referer = null;
        if (src.includes("mmbiz.qpic.cn") || src.includes("mmbiz.qlogo.cn")) {
          referer = "https://mp.weixin.qq.com";
          console.log("检测到微信公众号图片，设置referer:", referer);
        } else if (src.includes("csdnimg.cn") || src.includes("csdn.net")) {
          referer = "https://blog.csdn.net";
        } else if (src.includes("zhimg.com")) {
          referer = "https://www.zhihu.com";
        }

        // 下载图片
        const localPath = await window.ipcRenderer.invoke(
          "download-image",
          src,
          referer,
        );

        if (localPath) {
          console.log("图片下载成功，新路径:", localPath);

          // 格式化路径
          let formattedPath = localPath.replace(/\\/g, "/");
          if (!formattedPath.startsWith("/")) {
            formattedPath = "/" + formattedPath;
          }

          // 直接使用编辑器的setImage命令插入图片
          editor.commands.setImage({
            src: `file:///${formattedPath}`,
            alt: element.alt,
            title: element.alt,
          });

          console.log("图片已插入编辑器:", `file:///${formattedPath}`);

          // 确保图片后有一个空行
          editor.commands.createParagraphNear();
        } else {
          console.warn("图片下载失败，跳过:", src);
        }
      } catch (error) {
        console.error("处理图片失败:", error);
      }
    }
  }

  return true;
}

// 处理纯文本中可能包含的图片URL
async function processTextImageUrls(text, editor) {
  // 匹配URL的正则表达式
  const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)(\?[^\s]*)?)/gi;

  // 查找所有可能的图片URL
  const urls = [];
  let match;

  // 查找纯URL
  while ((match = urlRegex.exec(text)) !== null) {
    urls.push(match[1]);
  }

  if (urls.length === 0) {
    return false;
  }

  console.log(`从文本中提取到${urls.length}个可能的图片URL`);

  // 先插入文本内容，替换掉图片URL
  let textWithoutUrls = text;
  for (const url of urls) {
    textWithoutUrls = textWithoutUrls.replace(url, "");
  }

  if (textWithoutUrls.trim()) {
    editor.commands.insertContent(textWithoutUrls);
  }

  // 然后处理每个URL
  for (const url of urls) {
    try {
      console.log("处理可能的图片URL:", url);

      // 检查是否已经是本地路径
      if (url.startsWith("file://")) {
        continue;
      }

      // 设置referer
      let referer = null;
      if (url.includes("mmbiz.qpic.cn") || url.includes("mmbiz.qlogo.cn")) {
        referer = "https://mp.weixin.qq.com";
      } else if (url.includes("csdnimg.cn") || url.includes("csdn.net")) {
        referer = "https://blog.csdn.net";
      } else if (url.includes("zhimg.com")) {
        referer = "https://www.zhihu.com";
      }

      // 下载图片
      const localPath = await window.ipcRenderer.invoke(
        "download-image",
        url,
        referer,
      );

      if (localPath) {
        console.log("图片URL下载成功，新路径:", localPath);

        // 格式化路径
        let formattedPath = localPath.replace(/\\/g, "/");
        if (!formattedPath.startsWith("/")) {
          formattedPath = "/" + formattedPath;
        }

        // 直接使用编辑器的addImage命令插入图片
        editor.commands.createParagraphNear();
        editor.commands.setImage({
          src: `file:///${formattedPath}`,
          alt: "粘贴的图片",
        });
        editor.commands.createParagraphNear();

        console.log("图片已插入编辑器:", `file:///${formattedPath}`);
      } else {
        console.warn("图片下载失败，跳过:", url);
      }
    } catch (error) {
      console.error("处理图片失败:", error);
    }
  }

  return true;
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

                        // 格式化路径
                        let formattedPath = localPath.replace(/\\/g, "/");
                        if (!formattedPath.startsWith("/")) {
                          formattedPath = "/" + formattedPath;
                        }

                        // 直接使用编辑器的addImage命令插入图片
                        editor.commands.setImage({
                          src: `file:///${formattedPath}`,
                          alt: "粘贴的图片",
                        });

                        console.log(
                          "图片已插入编辑器:",
                          `file:///${formattedPath}`,
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

            // 检查是否有HTML内容
            const html = clipboardData.getData("text/html");
            const plainText = clipboardData.getData("text/plain");

            // 检测是否是微信公众号文章
            if (
              html &&
              (html.includes("mmbiz.qpic.cn") ||
                html.includes("mmbiz.qlogo.cn") ||
                html.includes("mp.weixin.qq.com"))
            ) {
              event.preventDefault();
              console.log("检测到可能是微信公众号内容");

              try {
                const processed = await processWechatArticle(html, editor);
                if (processed) {
                  return true;
                }
              } catch (error) {
                console.error("处理微信公众号内容失败:", error);
              }
            }

            // 处理纯文本中可能包含的图片URL
            if (plainText) {
              console.log("检查纯文本中是否包含图片URL");

              try {
                const processed = await processTextImageUrls(plainText, editor);

                if (processed) {
                  event.preventDefault();
                  console.log("从文本中提取并处理了图片URL");
                  return true;
                }
                // 如果没有图片，让编辑器处理默认粘贴
              } catch (error) {
                console.error("处理文本中的图片URL失败:", error);
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
export { processWechatArticle, processTextImageUrls };
