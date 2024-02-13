import { useEffect, useState, useRef } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import dotenv from "dotenv";
import { MsalProvider } from "@azure/msal-react";
import AuthPage from "./components/Auth/authpage";

/**
 * APP Function
 * @type {Function}
 */
function App({ instance }) {
  return (
    <MsalProvider instance={instance}>
      <AuthPage instance={instance} />
    </MsalProvider>
  );
}

export default App;
