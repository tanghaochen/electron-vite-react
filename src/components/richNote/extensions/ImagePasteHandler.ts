import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

// 通用HTML内容处理函数
async function processHTMLContent(html, editor) {
  console.log("处理HTML内容");

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

  // 检查是否有图片
  const hasImages = elements.some((el) => el.type === "image");
  if (!hasImages) {
    console.log("HTML内容中没有图片，使用默认粘贴处理");
    return false; // 这里返回false，让默认粘贴处理程序接管
  }

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

          try {
            // 尝试下载图片
            const localPath = await window.ipcRenderer.invoke(
              "download-image",
              cleanSrc,
              referer,
              originalUrl,
              true, // 标记为字节跳动图片
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
              console.warn("字节跳动图片下载失败，尝试直接插入原始URL");

              // 对于字节跳动的图片，如果下载失败，直接使用原始URL
              editor.commands.setImage({
                src: src,
                alt: element.alt || "图片",
                title: element.alt,
              });

              // 确保图片后有一个空行
              editor.commands.createParagraphNear();
            }
          } catch (error) {
            console.error("处理字节跳动图片失败:", error);

            // 如果处理失败，直接使用原始URL
            editor.commands.setImage({
              src: src,
              alt: element.alt || "图片",
              title: element.alt,
            });

            // 确保图片后有一个空行
            editor.commands.createParagraphNear();
          }

          continue; // 跳过后续处理
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

          // 如果下载失败，可以选择跳过或者使用原始URL
          // 这里我们选择跳过，不使用原始URL
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

      // 清理URL，移除查询参数
      const cleanUrl = url.split("?")[0];
      console.log("清理后的URL:", cleanUrl);

      // 设置referer
      let referer = null;

      // 根据图片URL设置合适的referer
      try {
        const urlObj = new URL(cleanUrl);
        const hostname = urlObj.hostname;

        // 常见网站的referer设置
        if (hostname.includes("csdnimg.cn") || hostname.includes("csdn.net")) {
          referer = "https://blog.csdn.net";
        } else if (
          hostname.includes("mmbiz.qpic.cn") ||
          hostname.includes("mmbiz.qlogo.cn")
        ) {
          referer = "https://mp.weixin.qq.com";
        } else if (hostname.includes("zhimg.com")) {
          referer = "https://www.zhihu.com";
        } else if (
          hostname.includes("jianshu.io") ||
          hostname.includes("jianshu.com")
        ) {
          referer = "https://www.jianshu.com";
        } else if (hostname.includes("juejin.cn")) {
          referer = "https://juejin.cn";
        } else {
          // 对于其他网站，使用图片所在域名作为referer
          referer = `${urlObj.protocol}//${urlObj.hostname}`;
        }
      } catch (e) {
        console.error("解析URL失败:", e);
      }

      // 下载图片
      const localPath = await window.ipcRenderer.invoke(
        "download-image",
        cleanUrl,
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
          alt: "图片",
        });

        console.log("图片已插入编辑器:", `file:///${formattedPath}`);

        // 确保图片后有一个空行
        editor.commands.createParagraphNear();
      } else {
        console.warn("图片下载失败，跳过:", url);
      }
    } catch (error) {
      console.error("处理图片URL失败:", error);
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
            const { clipboardData } = event;
            console.log(clipboardData);
            // 1. 处理直接粘贴的图片文件（优先级最高）
            if (clipboardData.items) {
              for (let i = 0; i < clipboardData.items.length; i++) {
                if (clipboardData.items[i].type.indexOf("image") === 0) {
                  const blob = clipboardData.items[i].getAsFile();

                  if (blob) {
                    try {
                      // 将blob转为base64
                      const reader = new FileReader();
                      const base64Promise = new Promise((resolve) => {
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                      });

                      const base64 = await base64Promise;
                      const localPath = await window.ipcRenderer.invoke(
                        "download-image",
                        base64,
                      );

                      if (localPath) {
                        // 格式化路径
                        let formattedPath = localPath.replace(/\\/g, "/");
                        if (!formattedPath.startsWith("/")) {
                          formattedPath = "/" + formattedPath;
                        }

                        // 阻止默认行为
                        event.preventDefault();

                        // 插入图片
                        editor.commands.setImage({
                          src: `file:///${formattedPath}`,
                          alt: "粘贴的图片",
                        });

                        console.log(
                          "图片已插入编辑器:",
                          `file:///${formattedPath}`,
                        );
                        return true;
                      }
                    } catch (error) {
                      console.error("处理粘贴图片失败:", error);
                    }
                  }
                }
              }
            }

            // 2. 处理HTML内容中的图片
            const html = clipboardData.getData("text/html");
            if (html && html.includes("<img")) {
              try {
                const processed = await processHTMLContent(html, editor);
                if (processed) {
                  event.preventDefault();
                  return true;
                }
              } catch (error) {
                console.error("处理HTML内容失败:", error);
              }
            }

            // 3. 处理纯文本中的图片URL
            const plainText = clipboardData.getData("text/plain");
            console.log(">>>", plainText, html);
            if (plainText) {
              const urlRegex =
                /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)(\?[^\s]*)?)/gi;
              if (urlRegex.test(plainText)) {
                try {
                  const processed = await processTextImageUrls(
                    plainText,
                    editor,
                  );
                  if (processed) {
                    event.preventDefault();
                    return true;
                  }
                } catch (error) {
                  console.error("处理文本中的图片URL失败:", error);
                }
              }
            }

            // 4. 对于所有其他情况，使用默认粘贴行为
            // 修复重复插入问题：移除这一行，让默认处理机制接管
            // editor.commands.insertContent(html);

            // 返回false让默认粘贴处理程序接管
            return false;
          },
        },
      }),
    ];
  },
});

// 导出处理函数以便在其他地方使用
export { processHTMLContent, processTextImageUrls };
