// src/components/Navbar.jsx
import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { FaMoon, FaSun } from "react-icons/fa";
import md5 from "md5";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const gravatarUrl = user?.email
    ? `https://www.gravatar.com/avatar/${md5(
        user.email.trim().toLowerCase()
      )}?d=identicon`
    : `https://www.gravatar.com/avatar/?d=identicon`;

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm transition-colors">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400"
        >
          Q&A Platform
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-4">
          <Link
            to="/"
            className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            Home
          </Link>
          <Link
            to="/explore"
            className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            Explore
          </Link>

          {user ? (
            <>
              <Link
                to="/ask"
                className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow hover:opacity-90 transition"
              >
                Ask Question
              </Link>

              {/* Profile Button Circular */}
              <Link to="/profile" className="hover:scale-110 transition">
                <img
                  src={gravatarUrl}
                  alt="profile"
                  className="w-10 h-10 rounded-full border-2 border-indigo-500 shadow"
                />
              </Link>

              <button
                onClick={handleLogout}
                className="px-4 py-1 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white shadow hover:opacity-90 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow hover:opacity-90 transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow hover:opacity-90 transition"
              >
                Register
              </Link>
            </>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:scale-110 transition"
          >
            {theme === "dark" ? (
              <FaSun className="text-yellow-400" />
            ) : (
              <FaMoon className="text-gray-800" />
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
