// AuthPage.jsx
import React, { useState, useEffect } from "react";
import ChatClient from "../../chatClient";

const AuthPage = ({ instance }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuthenticated") === "true"
  );
  const [userName, setUserName] = useState("");
  useEffect(() => {
    setIsAuthenticated(localStorage.getItem("isAuthenticated") === "true");
    setUserName(localStorage.getItem("userName"));
  }, []);

  const handleLogin = async () => {
    try {
      const loginResponse = await instance.loginPopup();
      // console.log('Login response:', loginResponse);
      if (
        loginResponse &&
        loginResponse.account &&
        loginResponse.account.name
      ) {
        // console.log('User details:', loginResponse.account);
        setIsAuthenticated(true);
        setUserName(loginResponse.account.name);
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userName", loginResponse.account.name);
      } else {
        console.error("Invalid login response:", loginResponse);
      }
    } catch (error) {
      // Handle login failure
      console.error("Login error:", error);
    }
  };

  const handleLogout = () => {
    instance.logout();
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated");
  };
  return (
    <div className="flex flex-col items-center justify-center gap-8 w-screen h-screen">
      {isAuthenticated ? (
        <div className="flex flex-row justify-end w-full h-full">
          {/* auth */}
          <div className="absolute flex w-full justify-end px-20 items-center z-50 text-black">
            <div className="flex flex-row h-12 items-center justify-center gap-3">
              <h1 className="flex text-center">
                {isAuthenticated
                  ? "Welcome " + userName + " !"
                  : "Please log in to access the chat assistant!"}
              </h1>
              <button
                className="bg-red-300 rounded-[2rem] p-2 mx-auto items-center justify-center flex"
                onClick={handleLogout}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  fill="#000000"
                  height="24px"
                  width="24px"
                  version="1.1"
                  id="Capa_1"
                  viewBox="0 0 490.3 490.3"
                  xml:space="preserve"
                >
                  <g>
                    <g>
                      <path d="M0,121.05v248.2c0,34.2,27.9,62.1,62.1,62.1h200.6c34.2,0,62.1-27.9,62.1-62.1v-40.2c0-6.8-5.5-12.3-12.3-12.3    s-12.3,5.5-12.3,12.3v40.2c0,20.7-16.9,37.6-37.6,37.6H62.1c-20.7,0-37.6-16.9-37.6-37.6v-248.2c0-20.7,16.9-37.6,37.6-37.6h200.6    c20.7,0,37.6,16.9,37.6,37.6v40.2c0,6.8,5.5,12.3,12.3,12.3s12.3-5.5,12.3-12.3v-40.2c0-34.2-27.9-62.1-62.1-62.1H62.1    C27.9,58.95,0,86.75,0,121.05z" />
                      <path d="M385.4,337.65c2.4,2.4,5.5,3.6,8.7,3.6s6.3-1.2,8.7-3.6l83.9-83.9c4.8-4.8,4.8-12.5,0-17.3l-83.9-83.9    c-4.8-4.8-12.5-4.8-17.3,0s-4.8,12.5,0,17.3l63,63H218.6c-6.8,0-12.3,5.5-12.3,12.3c0,6.8,5.5,12.3,12.3,12.3h229.8l-63,63    C380.6,325.15,380.6,332.95,385.4,337.65z" />
                    </g>
                  </g>
                </svg>
              </button>
            </div>
          </div>
          {/* chat client */}
          <div className="flex w-full">
            <ChatClient></ChatClient>
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-evenly h-full ">
          <p className="text-[3rem]">Welcome to the chat assistant</p>
          <button
            className=" bg-green-300 rounded-[2rem] p-4 w-32 mx-auto h-10 items-center justify-center flex"
            onClick={handleLogin}
          >
            Login
          </button>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
