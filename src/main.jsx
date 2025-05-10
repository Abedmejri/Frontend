// main.jsx - Keep this structure
import React from 'react'
import ReactDOM from 'react-dom/client'
// import Dashboard from './Dashboard.jsx' // Likely don't need Dashboard imported here
import './index.css'
import {RouterProvider} from "react-router-dom";
import router from "./router.jsx"; // Your corrected router
import {ContextProvider} from './context/ContextProvider.jsx'
import 'antd/dist/reset.css'; // Make sure Antd CSS is imported if using Antd

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ContextProvider> {/* Provides context values */}
      <RouterProvider router={router} /> {/* Handles routing */}
    </ContextProvider>
  </React.StrictMode>
);