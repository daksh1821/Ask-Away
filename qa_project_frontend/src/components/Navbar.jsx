import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600">Q&A Platform</Link>
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-gray-700 hover:text-blue-600">Home</Link>
          {user ? (
            <>
              <Link to="/ask" className="text-gray-700 hover:text-blue-600">Ask Question</Link>
              <button onClick={logout} className="flex items-center text-gray-700 hover:text-red-600">
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 hover:text-blue-600">Login</Link>
              <Link to="/register" className="text-gray-700 hover:text-blue-600">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;