import { useContext, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Ask from './pages/Ask';
import Question from './pages/Question';
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
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/question/:id" element={<Question />} />
          <Route path="/ask" element={<PrivateRoute><Ask /></PrivateRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;