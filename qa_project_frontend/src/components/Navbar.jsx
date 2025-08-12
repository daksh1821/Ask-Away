// src/components/Navbar.jsx
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-extrabold text-indigo-600">Q&amp;A Platform</Link>
        <nav className="flex items-center gap-6">
          <Link to="/" className="text-gray-700 hover:text-indigo-600">Home</Link>
          <Link to="/explore" className="text-gray-700 hover:text-indigo-600">Explore</Link>
          {user ? (
            <>
              <Link to="/ask" className="text-gray-700 hover:text-indigo-600">Ask Question</Link>
              <Link to="/profile" className="text-gray-700 hover:text-indigo-600">Profile</Link>
              <button onClick={handleLogout} className="ml-4 bg-indigo-600 text-white px-4 py-2 rounded">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 hover:text-indigo-600">Login</Link>
              <Link to="/register" className="text-gray-700 hover:text-indigo-600">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
