import React from "react";
import App from "./App";
import { PublicClientApplication } from "@azure/msal-browser";

export default {
    title: 'components/App',
    component: App
}

import { msalConfig } from "./authconfig.jsx";
const msalInstance = new PublicClientApplication(msalConfig);

export const Primary = ()=><App instance={msalInstance}></App>