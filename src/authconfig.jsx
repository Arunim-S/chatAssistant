import dotenv from "dotenv";
import { LogLevel } from "@azure/msal-browser";

export const msalConfig = {
  auth: {
    clientId: `${import.meta.env.VITE_CLIENT_ID}`, // This is the ONLY mandatory field that you need to supply.
    authority: `https://login.microsoftonline.com/${
      import.meta.env.VITE_TENANT_ID
    }`, // Defaults to "https://login.microsoftonline.com/common"
    redirectUri: `${import.meta.env.VITE_REDIRECT_URI}`, // You must register this URI on Azure Portal/App Registration. Defaults to window.location.origin
    postLogoutRedirectUri: `${import.meta.env.VITE_REDIRECT_URI}`, // Indicates the page to navigate after logout.
    navigateToLoginRequestUrl: false, // If "true", will navigate back to the original request location before processing the auth code response.
  },
  cache: {
    cacheLocation: "localstorage", // Configures cache location. "sessionStorage" is more secure, but "localStorage" gives you SSO between tabs.
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            // console.error(message + " | Error");
            return;
          case LogLevel.Info:
            // console.info(message + " | Info");
            return;
          case LogLevel.Verbose:
            // console.debug(message + " | Verbose");
            return;
          case LogLevel.Warning:
            // console.warn(message + " | Warning");
            return;
        }
      },
    },
  },
};

/**
 * Scopes you add here will be prompted for user consent during sign-in.
 * By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
 * For more information about OIDC scopes, visit:
 * https://learn.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
 */
export const loginRequest = {
  scopes: [],
};

/**
 * Add here the endpoints and scopes when obtaining an access token for protected web APIs. For more information, see:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/resources-and-scopes.md
 */
export const protectedResources = {
  graphMe: {
    endpoint: "https://graph.microsoft.com/v1.0/me",
    scopes: ["User.Read"],
  },
  functionApi: {
    endpoint: "/api/hello",
    scopes: [`${import.meta.env.VITE_AUTH_URI}/access_as_user`], // e.g. api://xxxxxx/access_as_user
  },
};
