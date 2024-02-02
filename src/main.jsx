import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { msalConfig } from "./authconfig.jsx";
import { PublicClientApplication } from "@azure/msal-browser";

const msalInstance = new PublicClientApplication(msalConfig);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App instance={msalInstance} />
  </React.StrictMode>,
)
