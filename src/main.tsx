import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

import 'material-icons/iconfont/material-icons.css';
import 'material-icons/iconfont/outlined.scss';
import './index.css'
import './demos/ipc'
import {DevSupport} from "@react-buddy/ide-toolbox";
import {ComponentPreviews, useInitial} from "@/dev";
import {BrowserRouter, Route, Routes} from 'react-router';
import SelectedContent from '@/pages/selectedContent'
// If you want use Node.js, the`nodeIntegration` needs to be enabled in the Main process.
// import './demos/node'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <DevSupport ComponentPreviews={ComponentPreviews}
                    useInitialHook={useInitial}
        >
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<App/>} />
                    <Route path="/dashboard" element={<SelectedContent/>}>
                        {/*<Route index element={<RecentActivity />} />*/}
                        {/*<Route path="project/:id" element={<Project />} />*/}
                    </Route>
                </Routes>
            </BrowserRouter>

        </DevSupport>
    </React.StrictMode>,
)

postMessage({payload: 'removeLoading'}, '*')
