import React from "react";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./authconfig";

/**
 * Component for Auth
 * @type {Function}
 */
const MsalProviderWrapper = ({ children }) => {
  return <MsalProvider instance={msalConfig}>{children}</MsalProvider>;
};

export default MsalProviderWrapper;
