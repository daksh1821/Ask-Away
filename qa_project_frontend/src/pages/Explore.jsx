import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaFilter, FaTags, FaUser, FaCalendar, FaFire } from 'react-icons/fa';
import api from '../api';
import QuestionCard from '../components/QuestionCard';
import TagCloud from '../components/TagCloud';

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: searchParams.get('q') || '',
    tags: searchParams.get('tags') || '',
    sortBy: 'latest'
  });
  const [popularTags, setPopularTags] = useState([]);
  const [trendingQuestions, setTrendingQuestions] = useState([]);
  const [stats, setStats] = useState(null);

  // Fetch popular tags
  useEffect(() => {
    const fetchPopularTags = async () => {
      try {
        const res = await api.get('/questions', { params: { limit: 100 } });
        const allTags = res.data
          .flatMap(q => (q.tags || '').split(',').map(t => t.trim()).filter(Boolean))
          .reduce((acc, tag) => {
            acc[tag] = (acc[tag] || 0) + 1;
            return acc;
          }, {});
        
        const sorted = Object.entries(allTags)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 20)
          .map(([tag]) => tag);
        
        setPopularTags(sorted);
      } catch (err) {
        console.error('Failed to fetch tags:', err);
      }
    };

    fetchPopularTags();
  }, []);

  // Fetch trending questions
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await api.get('/questions/trending', { params: { limit: 5 } });
        setTrendingQuestions(res.data);
      } catch (err) {
        console.error('Failed to fetch trending:', err);
      }
    };

    fetchTrending();
  }, []);

  // Search questions
  const searchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = '/questions';
      const params = { limit: 50 };

      if (filters.search) {
        endpoint = '/questions/search';
        params.q = filters.search;
      }

      if (filters.tags) {
        params.tags = filters.tags;
      }

      const res = await api.get(endpoint, { params });
      setQuestions(res.data);
    } catch (err) {
      console.error('Search failed:', err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    searchQuestions();
  }, [searchQuestions]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Update URL params
    const newParams = new URLSearchParams();
    if (newFilters.search) newParams.set('q', newFilters.search);
    if (newFilters.tags) newParams.set('tags', newFilters.tags);
    setSearchParams(newParams);
  };

  const handleTagSelect = (tag) => {
    const currentTags = filters.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag].join(', ');
      handleFilterChange('tags', newTags);
    }
  };

  const clearFilters = () => {
    setFilters({ search: '', tags: '', sortBy: 'latest' });
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-all duration-500">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Explore Knowledge
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Discover answers, share insights, and connect with the community
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Search & Filters Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <FaSearch className="text-indigo-500" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Search & Filter
                </h3>
              </div>

              {/* Search Input */}
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>

              {/* Tags Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Filter by Tags
                </label>
                <input
                  type="text"
                  placeholder="e.g., react, javascript, python"
                  value={filters.tags}
                  onChange={(e) => handleFilterChange('tags', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Sort Options */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  <option value="latest">Latest</option>
                  <option value="popular">Most Popular</option>
                  <option value="trending">Trending</option>
                  <option value="unanswered">Unanswered</option>
                </select>
              </div>

              {/* Clear Filters */}
              {(filters.search || filters.tags) && (
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 text-indigo-600 dark:text-indigo-400 border border-indigo-600 dark:border-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-all"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Popular Tags */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <FaTags className="text-green-500" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Popular Tags
                </h3>
              </div>
              <TagCloud tags={popularTags.slice(0, 15)} onSelect={handleTagSelect} />
            </div>

            {/* Trending Questions */}
            {trendingQuestions.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <FaFire className="text-orange-500" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Trending Now
                  </h3>
                </div>
                <div className="space-y-3">
                  {trendingQuestions.map((q) => (
                    <div key={q.id} className="border-l-4 border-orange-500 pl-3">
                      <a
                        href={`/question/${q.id}`}
                        className="text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-2"
                      >
                        {q.title}
                      </a>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {q.answers_count || 0} answers
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3"
          >
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {filters.search || filters.tags ? 'Search Results' : 'All Questions'}
                </h2>
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full text-sm font-medium">
                  {questions.length} found
                </span>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              /* Questions List */
              <AnimatePresence mode="wait">
                <motion.div
                  key={questions.length}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {questions.length > 0 ? (
                    questions.map((question, index) => (
                      <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <QuestionCard q={question} />
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <div className="text-gray-400 dark:text-gray-500 mb-4">
                        <FaSearch className="mx-auto text-6xl mb-4" />
                        <h3 className="text-xl font-medium">No questions found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">
                          Try adjusting your search terms or filters
                        </p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}