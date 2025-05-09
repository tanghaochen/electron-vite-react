/**
 * 用于修复 Electron 应用中的静态资源路径问题
 * 在主窗口加载时自动注入到渲染进程
 */

(function () {
  // 检测是否在 Electron 环境中运行
  if (window && window.process && window.process.type === "renderer") {
    console.log("在 Electron 环境中运行，修复资源路径");

    // 监听DOMContentLoaded事件，确保在文档加载后执行
    document.addEventListener("DOMContentLoaded", function () {
      // 修复base标签
      const baseElement = document.querySelector("base");
      if (!baseElement) {
        const newBase = document.createElement("base");
        newBase.href = "./";
        document.head.appendChild(newBase);
      } else {
        baseElement.href = "./";
      }

      // 为所有资源添加正确的路径前缀
      document
        .querySelectorAll("script[src], link[href], img[src]")
        .forEach((element) => {
          const srcAttr = element.hasAttribute("src") ? "src" : "href";
          const originalSrc = element.getAttribute(srcAttr);

          // 修复非绝对路径的资源链接
          if (
            originalSrc &&
            !originalSrc.startsWith("http") &&
            !originalSrc.startsWith("data:") &&
            !originalSrc.startsWith("./") &&
            !originalSrc.startsWith("/")
          ) {
            element.setAttribute(srcAttr, "./" + originalSrc);
          }
        });
    });

    // 拦截获取静态资源的请求
    const originalFetch = window.fetch;
    window.fetch = function (url, options) {
      if (
        typeof url === "string" &&
        !url.startsWith("http") &&
        !url.startsWith("data:") &&
        !url.startsWith("./") &&
        !url.startsWith("/")
      ) {
        url = "./" + url;
      }
      return originalFetch.call(this, url, options);
    };

    console.log("资源路径修复完成");
  }
})();
