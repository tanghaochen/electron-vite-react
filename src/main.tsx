import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "material-icons/iconfont/material-icons.css";
import "material-icons/iconfont/outlined.scss";
import "./index.css";
import "./demos/ipc";

// 导入 IPC 兼容层确保旧代码可以正常工作
import "./utils/ipc-compat";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

postMessage({ payload: "removeLoading" }, "*");
