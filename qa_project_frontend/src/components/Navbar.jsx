// src/components/Navbar.jsx
import React, { useContext, useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { 
  FaMoon, 
  FaSun, 
  FaUser, 
  FaSignOutAlt, 
  FaCog, 
  FaQuestionCircle,
  FaStar,
  FaBars,
  FaTimes,
  FaSearch,
  FaBell
} from "react-icons/fa";
import md5 from "md5";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsDropdownOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const gravatarUrl = user?.email
    ? `https://www.gravatar.com/avatar/${md5(
        user.email.trim().toLowerCase()
      )}?d=identicon&s=40`
    : `https://www.gravatar.com/avatar/?d=identicon&s=40`;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActivePage = (path) => location.pathname === path;

  const navLinks = [
    { to: "/", label: "Home", icon: null },
    { to: "/explore", label: "Explore", icon: null },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-lg border-b border-gray-200/20 dark:border-gray-700/20 transition-all duration-300">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 group"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <FaQuestionCircle className="text-white text-sm" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Q&A Hub
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="w-full relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                placeholder="Search questions..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActivePage(to)
                    ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {label}
              </Link>
            ))}

            {user ? (
              <>
                <Link
                  to="/ask"
                  className="ml-4 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  Ask Question
                </Link>

                {/* Notifications */}
                <button className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  <FaBell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                </button>

                {/* Profile Dropdown */}
                <div className="relative ml-4" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                  >
                    <img
                      src={gravatarUrl}
                      alt="Profile"
                      className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-indigo-500 transition-colors"
                    />
                    <div className="hidden xl:block text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        @{user.username}
                      </p>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <img src={gravatarUrl} alt="Profile" className="w-10 h-10 rounded-full" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <FaUser className="w-4 h-4" />
                        <span>View Profile</span>
                      </Link>

                      <Link
                        to="/my-questions"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <FaQuestionCircle className="w-4 h-4" />
                        <span>My Questions</span>
                      </Link>

                      <Link
                        to="/starred"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <FaStar className="w-4 h-4" />
                        <span>Starred Answers</span>
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <FaCog className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>

                      <hr className="my-2 border-gray-200 dark:border-gray-700" />

                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-2 w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <FaSignOutAlt className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3 ml-4">
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="ml-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-110 transition-all duration-200"
            >
              {theme === "dark" ? (
                <FaSun className="w-5 h-5" />
              ) : (
                <FaMoon className="w-5 h-5" />
              )}
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isMobileMenuOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            {/* Mobile Search */}
            <div className="mb-4 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                placeholder="Search questions..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            {/* Mobile Navigation Links */}
            <div className="space-y-2">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActivePage(to)
                      ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {label}
                </Link>
              ))}

              {user ? (
                <>
                  <Link
                    to="/ask"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium text-center"
                  >
                    Ask Question
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium text-center"
                  >
                    Get Started
                  </Link>
                </>
              )}

              <button
                onClick={toggleTheme}
                className="flex items-center space-x-3 px-4 py-2 w-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                {theme === "dark" ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
                <span>Toggle Theme</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}