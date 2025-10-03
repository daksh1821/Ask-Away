import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext'; // ⬅️ ADD THIS
import './index.css';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <ThemeProvider> {/* ⬅️ WRAP APP HERE */}
        <App />
      </ThemeProvider>
    </AuthProvider>
  </BrowserRouter>
);
