// AuthPage.jsx
import React, { useState } from 'react';

const AuthPage = ({ instance }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = async () => {
    try {
      const loginResponse = await instance.loginPopup();
      // Handle successful login
      console.log('Login response:', loginResponse);
      setIsAuthenticated(true);
    } catch (error) {
      // Handle login failure
      console.error('Login error:', error);
    }
  };

  const handleLogout = () => {
    instance.logout();
    setIsAuthenticated(false);
  };

  return (
    <div>
      <h1>{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</h1>
      {isAuthenticated ? (
        <button onClick={handleLogout}>Logout</button>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
};

export default AuthPage;
