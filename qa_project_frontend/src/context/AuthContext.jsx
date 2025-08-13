// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import {jwtDecode} from 'jwt-decode';
import api, { setAuthToken } from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    try {
      setError(null);
      const response = await api.post('/auth/login-json', {
        username,
        password
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const token = response.data.access_token;
      setAuthToken(token);
      await fetchUserProfile();
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
      throw err;
    }
  };

  const register = async (data) => {
    try {
      setError(null);
      await api.post('/auth/register', data, {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
      throw err;
    }
  };

  const updateProfile = async (data) => {
    try {
      setError(null);
      const response = await api.put('/auth/me', data, {
        headers: { 'Content-Type': 'application/json' }
      });
      setUser(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Profile update failed');
      throw err;
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      register, 
      updateProfile, 
      logout,
      setError 
    }}>
      {children}
    </AuthContext.Provider>
  );
};