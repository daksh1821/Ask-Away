// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import {jwtDecode} from 'jwt-decode';
import api, { setAuthToken } from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('qa_token');
    if (token) {
      setAuthToken(token);
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          fetchUserProfile();
        } else {
          logout();
        }
      } catch {
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    // Send JSON, not form-data
    const response = await api.post('/auth/login', {
      username,
      password
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const token = response.data.access_token;
    setAuthToken(token);
    await fetchUserProfile();
  };

  const register = async (data) => {
    await api.post('/auth/register', data, {
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
