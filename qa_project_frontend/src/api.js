import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Uses proxy to avoid CORS
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('qa_token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('qa_token');
  }
};

export default api;