// src/App.jsx
import { useContext, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Ask from './pages/Ask';
import Question from './pages/Question';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import PrivateRoute from './components/PrivateRoute';
import { AuthContext } from './context/AuthContext';
import { setAuthToken } from './api';
import './App.css';

function App() {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const token = localStorage.getItem('qa_token');
    setAuthToken(token);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={user ? <Home /> : <Landing />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/question/:id" element={<Question />} />
        <Route path="/ask" element={<PrivateRoute><Ask /></PrivateRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      </Routes>
    </div>
  );
}

export default App;
