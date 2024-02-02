  /**
 *  Configuration for Auth
 * @type {Object{}}
 */
export const msalConfig = {
    auth: {
      clientId: import.meta.env.CLIENT_ID,
      authority: `https://login.microsoftonline.com/${import.meta.env.DEP_ID}`,
      redirectUri: 'http://localhost:3000', 
    },
    cache: {
      cacheLocation: "sessionStorage",
      storeAuthStateInCookie: false,
    },
  };
  