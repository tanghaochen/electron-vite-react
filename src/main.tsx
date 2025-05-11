import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "material-icons/iconfont/material-icons.css";
import "material-icons/iconfont/outlined.scss";
import "./index.css";
import "./demos/ipc";
import { DevSupport } from "@react-buddy/ide-toolbox";
import { ComponentPreviews, useInitial } from "@/dev";
import { HashRouter, Route, Routes } from "react-router-dom";
// 导入 IPC 兼容层确保旧代码可以正常工作
import "./utils/ipc-compat";
import SelectedContent from "@/pages/selectedContent";
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <DevSupport
      ComponentPreviews={ComponentPreviews}
      useInitialHook={useInitial}
    >
      <HashRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/dashboard" element={<SelectedContent />}>
            {/*<Route index element={<RecentActivity />} />*/}
            {/*<Route path="project/:id" element={<Project />} />*/}
          </Route>
        </Routes>
      </HashRouter>
    </DevSupport>
  </React.StrictMode>,
);

postMessage({ payload: "removeLoading" }, "*");
