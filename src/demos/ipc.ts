// 使用新的 electronAPI 接口
try {
  if (window.electronAPI) {
    // 监听来自主进程的消息
    // window.electronAPI.receive("main-process-message", (...args) => {
    //   console.log("[Receive Main-process message]:", ...args);
    // });
    // 也可以这样发送消息
    // window.electronAPI.send("message-to-main", "hello");
  } else {
    console.warn("electronAPI 未找到，可能不在 Electron 环境中");
  }
} catch (error) {
  console.error("设置 IPC 监听器时出错:", error);
}
