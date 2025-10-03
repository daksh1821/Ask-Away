import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaFire, FaClock, FaCompass } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import api from '../api';
import QuestionCard from '../components/QuestionCard';
import { AuthContext } from '../context/AuthContext';

export default function Home() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState('latest');
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);
  const observer = useRef();

  const lastQuestionElementRef = useCallback(node => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreQuestions();
      }
    });
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore]);

  const loadQuestions = useCallback(async (reset = false) => {
    if (loadingMore && !reset) return;
    
    try {
      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 0 : page;
      let endpoint = '/questions';
      const params = {
        skip: currentPage * 10,
        limit: 10
      };

      // Switch endpoint based on active tab
      switch (activeTab) {
        case 'trending':
          endpoint = '/questions/trending';
          params.days = 7;
          break;
        case 'feed':
          if (user) {
            endpoint = '/questions/feed';
          }
          break;
        default:
          endpoint = '/questions';
      }

      const response = await api.get(endpoint, { params });
      const newQuestions = response.data;

      if (reset) {
        setQuestions(newQuestions);
        setPage(1);
      } else {
        setQuestions(prev => [...prev, ...newQuestions]);
        setPage(prev => prev + 1);
      }

      setHasMore(newQuestions.length === 10);
    } catch (err) {
      console.error('Failed to load questions:', err);
      setError('Failed to load questions. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, activeTab, user, loadingMore]);

  const loadMoreQuestions = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadQuestions(false);
    }
  }, [loadQuestions, loadingMore, hasMore]);

  // Reset and load questions when tab changes
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    loadQuestions(true);
  }, [activeTab]);

  const tabs = [
    { id: 'latest', label: 'Latest', icon: FaClock, desc: 'Recently asked questions' },
    { id: 'trending', label: 'Trending', icon: FaFire, desc: 'Popular this week' },
    ...(user ? [{ id: 'feed', label: 'My Feed', icon: FaCompass, desc: 'Personalized for you' }] : [])
  ];

  if (loading && questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading questions...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {user ? `Welcome back, ${user.first_name}!` : 'Latest Questions'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Discover interesting questions and share your knowledge with the community
          </p>

          {/* Quick Actions */}
          {user && (
            <div className="flex justify-center gap-4 mb-8">
              <Link
                to="/ask"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-300 shadow-lg hover:shadow-xl"
              >
                <FaPlus />
                Ask Question
              </Link>
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300"
              >
                <FaCompass />
                Explore More
              </Link>
            </div>
          )}
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-wrap justify-center gap-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm'
                  }`}
                >
                  <Icon className="text-sm" />
                  <div className="text-left">
                    <div className="font-medium">{tab.label}</div>
                    <div className="text-xs opacity-75">{tab.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center justify-between">
              <p className="text-red-700 dark:text-red-400">{error}</p>
              <button
                onClick={() => loadQuestions(true)}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
              >
                Retry
              </button>
            </div>
          </motion.div>
        )}

        {/* Questions Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <AnimatePresence>
            {questions.length > 0 ? (
              questions.map((question, index) => (
                <div
                  key={question.id}
                  ref={index === questions.length - 1 ? lastQuestionElementRef : null}
                >
                  <QuestionCard q={question} index={index} />
                </div>
              ))
            ) : !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="text-gray-400 dark:text-gray-500">
                  <FaCompass className="mx-auto text-6xl mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No questions found</h3>
                  <p className="mb-4">
                    {activeTab === 'feed' 
                      ? "We couldn't find any questions matching your interests. Try exploring different topics!"
                      : "Be the first to ask a question in this category!"
                    }
                  </p>
                  {user && (
                    <Link
                      to="/ask"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-300"
                    >
                      <FaPlus />
                      Ask the First Question
                    </Link>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading More Indicator */}
          {loadingMore && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                Loading more questions...
              </div>
            </motion.div>
          )}

          {/* End of Results */}
          {!hasMore && questions.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="text-gray-500 dark:text-gray-400">
                <p className="mb-4">You've reached the end!</p>
                <Link
                  to="/ask"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-300"
                >
                  <FaPlus />
                  Ask a New Question
                </Link>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Stats Section */}
        {user && questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors duration-300"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Your Activity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {user.questions_count || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Questions Asked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {user.answers_count || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Answers Given</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {user.reputation || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Reputation</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}