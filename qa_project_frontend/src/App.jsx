import { useContext, useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
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
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { AuthContext } from './context/AuthContext';
import { ThemeContext } from './context/ThemeContext';
import { setAuthToken } from './api';
import './App.css';

function App() {
  const { user, loading } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const token = localStorage.getItem('qa_token');
        if (token) {
          setAuthToken(token);
        }
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setAppLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Show loading spinner while auth is initializing
  if (loading || appLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <LoadingSpinner size="xl" text="Initializing Q&A Platform..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-500 ${theme}`}>
        <Navbar />
        
        <main className="min-h-screen">
          <AnimatePresence mode="wait">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={user ? <Home /> : <Landing />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/question/:id" element={<Question />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route path="/ask" element={
                <PrivateRoute>
                  <Ask />
                </PrivateRoute>
              } />
              <Route path="/profile" element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } />
              
              {/* Catch all route */}
              <Route path="*" element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                      404 - Page Not Found
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      The page you're looking for doesn't exist.
                    </p>
                    <a
                      href="/"
                      className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
                    >
                      Go Home
                    </a>
                  </div>
                </div>
              } />
            </Routes>
          </AnimatePresence>
        </main>

        {/* Toast notifications container */}
        <div id="toast-container" className="fixed top-4 right-4 z-50 space-y-2"></div>
      </div>
    </ErrorBoundary>
  );
}

export default App;