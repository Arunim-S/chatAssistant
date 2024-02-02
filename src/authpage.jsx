import React from "react";
import { useMsal } from "@azure/msal-react";

/**
 * Auth component
 * @type {Function}
 */
const AuthButton = () => {
  const { instance, accounts } = useMsal();

  /**
   *  Handle Login
   * @type {Function}
   */
  const handleLogin = () => {
    instance.loginPopup().then((response) => {
      console.log(response);
    });
    // instance.loginRedirect();
    // console.log("loggedin")
  };
  /**
   *  Handle Logout
   * @type {Function}
   */
  const handleLogout = () => {
    instance.logoutPopup({ account: accounts[0] }).then((response) => {
      console.log(response);
    });
  };

  return (
    <div>
      {accounts.length === 0 ? (
        <button onClick={handleLogin}>Login</button>
      ) : (
        <button onClick={handleLogout}>Logout</button>
      )}
    </div>
  );
};

export default AuthButton;
