// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // proxy will forward to backend
});

// Set or remove token in axios + localStorage
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('qa_token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('qa_token');
  }
};

// Load token on app start
const savedToken = localStorage.getItem('qa_token');
if (savedToken) {
  setAuthToken(savedToken);
}

export default api;
