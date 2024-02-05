// AuthPage.jsx
import React, { useState, useEffect } from "react";
import ChatClient from "./chatClient";

const AuthPage = ({ instance }) => {
  const [sessionData, setSessionData] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuthenticated") === "true"
  );
  const [userName, setUserName] = useState("");
  const [session, setSession] = useState(0);
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
  console.log(sessionData);
  return (
    <div className="flex flex-col items-center justify-center gap-8 w-screen h-screen">
      {isAuthenticated ? (
        <div className="flex flex-row w-full h-full">
          <div className="w-1/6 bg-black justify-center flex">
            <div className="flex flex-col items-center w-full gap-3">
              <h1 className="flex text-center text-white mt-8 py-4">
                {isAuthenticated
                  ? "Welcome " + userName
                  : "Please log in to access the chat assistant!"}
              </h1>
              <button
                className=" bg-red-300 rounded-[2rem] mb-4 p-4 w-32 mx-auto h-10 items-center justify-center flex"
                onClick={handleLogout}
              >
                Logout
              </button>
              <div className="text-center p-4 gap-2 flex flex-col bg-black text-white w-full h-full">
                <p className="p-2">Chat Sessions</p>
                {sessionData &&
                  sessionData.map((session, index) => (
                    <button onClick={(e)=>{setSession(index)}} key={index} className="text-black p-4 bg-gray-200 w-full rounded-xl">
                      Session {index+1}
                    </button>
                  ))}
              </div>
            </div>
          </div>
          <div className="flex w-5/6">
            <ChatClient setSessionData={setSessionData} session={session}></ChatClient>
          </div>
        </div>
      ) : (
        <button
          className=" bg-green-300 rounded-[2rem] p-4 w-32 mx-auto h-10 items-center justify-center flex"
          onClick={handleLogin}
        >
          Login
        </button>
      )}
    </div>
  );
};

export default AuthPage;
