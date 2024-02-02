// AuthPage.jsx
import React, { useState, useEffect } from 'react';
import ChatClient from './chatClient';

const AuthPage = ({ instance }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );
  const [userName, setUserName] = useState("");

  useEffect(() => {
    setIsAuthenticated(localStorage.getItem('isAuthenticated') === 'true');
    setUserName(localStorage.getItem('userName'))
  }, []); 

  const handleLogin = async () => {
    try {
      const loginResponse = await instance.loginPopup();
      console.log('Login response:', loginResponse);

      if (loginResponse && loginResponse.account && loginResponse.account.name) {
        console.log('User details:', loginResponse.account);
        setIsAuthenticated(true);
        setUserName(loginResponse.account.name);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userName', loginResponse.account.name);

      } else {
        console.error('Invalid login response:', loginResponse);
      }
    } catch (error) {
      // Handle login failure
      console.error('Login error:', error);
    }
  };

  const handleLogout = () => {
    instance.logout();
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  return (
    <div className='flex flex-col items-center justify-center gap-8 w-screen h-screen'>
      {isAuthenticated ? (
        <div className='flex flex-row w-full h-full'>
          <div className='w-1/6 bg-black justify-center flex'>
            <div className='flex flex-col items-center w-full p-3 gap-3'>
              <h1 className='flex text-center text-white'>{isAuthenticated ? 'Welcome ' + userName : 'Please log in to access the chat assistant!'}</h1>
              <button className=' bg-red-300 rounded-[2rem] p-4 w-32 mx-auto h-10 items-center justify-center flex' onClick={handleLogout}>Logout</button>
              <div className='text-center bg-gray-200 rounded-xl w-full h-full'><p className='p-2'>Chat History</p></div>
            </div>
          </div>
          <div className='flex w-5/6'>
            <ChatClient></ChatClient>
          </div>
        </div>
      ) : (
        <button className=' bg-green-300 rounded-[2rem] p-4 w-32 mx-auto h-10 items-center justify-center flex' onClick={handleLogin}>Login</button>
      )}
    </div>
  );
};

export default AuthPage;
