import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { apiHelpers } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import TagCloud from '../components/TagCloud';
import AIFeatures from '../components/AIFeatures';
import {
  FaEye,
  FaComments,
  FaClock,
  FaStar,
  FaRegStar,
  FaUser,
  FaCalendar,
  FaThumbsUp,
  FaShare,
  FaFlag,
  FaEdit,
  FaTrash,
  FaReply,
  FaHeart,
  FaRegHeart,
  FaTags,
  FaRobot
} from 'react-icons/fa';
import md5 from 'md5';

export default function Question() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  
  // State management
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answerLoading, setAnswerLoading] = useState(false);
  const [newAnswer, setNewAnswer] = useState('');
  const [starredAnswers, setStarredAnswers] = useState(new Set());
  const [viewTracked, setViewTracked] = useState(false);
  const [error, setError] = useState(null);
  const [showAIFeatures, setShowAIFeatures] = useState(false);

  // Fetch question data
  useEffect(() => {
    fetchQuestion();
  }, [id]);

  // Track view only once per page visit
  useEffect(() => {
    if (question && !viewTracked && id) {
      trackView();
      setViewTracked(true);
    }
  }, [question, viewTracked, id]);

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, get question without answers to avoid eager loading issues
      const questionRes = await apiHelpers.questions.getById(id, false);
      
      if (questionRes.data) {
        setQuestion(questionRes.data);
        
        // Then fetch answers separately
        try {
          const answersRes = await apiHelpers.answers.getByQuestionId(id);
          const answersData = answersRes.data || [];
          setAnswers(Array.isArray(answersData) ? answersData : []);
          
          // Set starred answers if user is logged in
          if (user && answersData.length > 0) {
            const starred = new Set();
            answersData.forEach(answer => {
              if (answer.is_starred) {
                starred.add(answer.id);
              }
            });
            setStarredAnswers(starred);
          }
        } catch (answersError) {
          console.error('Failed to fetch answers:', answersError);
          setAnswers([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch question:', error);
      setError('Failed to load question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const trackView = async () => {
    try {
      await apiHelpers.questions.incrementView(id);
      // Update local view count
      setQuestion(prev => prev ? { 
        ...prev, 
        views_count: (prev.views_count || prev.views || 0) + 1 
      } : null);
    } catch (error) {
      console.error('Failed to track view:', error);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!newAnswer.trim() || !user) return;

    // Minimum length validation
    if (newAnswer.trim().length < 10) {
      alert('Answer must be at least 10 characters long.');
      return;
    }

    try {
      setAnswerLoading(true);
      const response = await apiHelpers.answers.create(id, { 
        content: newAnswer.trim() 
      });
      
      setAnswers(prev => [...prev, response.data]);
      setNewAnswer('');
      
      // Update answer count in question
      setQuestion(prev => prev ? { 
        ...prev, 
        answers_count: (prev.answers_count || answers.length) + 1 
      } : null);
    } catch (error) {
      console.error('Failed to submit answer:', error);
      alert('Failed to post answer. Please try again.');
    } finally {
      setAnswerLoading(false);
    }
  };

  const handleStarAnswer = async (answerId) => {
    if (!user) return;

    try {
      const isCurrentlyStarred = starredAnswers.has(answerId);
      
      if (isCurrentlyStarred) {
        await apiHelpers.answers.unstar(answerId);
        setStarredAnswers(prev => {
          const newSet = new Set(prev);
          newSet.delete(answerId);
          return newSet;
        });
        
        // Update local answer stars count
        setAnswers(prev => prev.map(answer => 
          answer.id === answerId 
            ? { 
                ...answer, 
                stars_count: Math.max((answer.stars_count || 0) - 1, 0), 
                is_starred: false 
              }
            : answer
        ));
      } else {
        await apiHelpers.answers.star(answerId);
        setStarredAnswers(prev => new Set([...prev, answerId]));
        
        // Update local answer stars count
        setAnswers(prev => prev.map(answer => 
          answer.id === answerId 
            ? { 
                ...answer, 
                stars_count: (answer.stars_count || 0) + 1, 
                is_starred: true 
              }
            : answer
        ));
      }
    } catch (error) {
      console.error('Failed to star/unstar answer:', error);
      alert('Failed to update star. Please try again.');
    }
  };

  const handleSummaryGenerated = (summary) => {
    setQuestion(prev => prev ? { ...prev, ai_summary: summary } : null);
  };

  const handleTagsSuggested = (tags) => {
    setQuestion(prev => prev ? { ...prev, suggested_tags: tags.join(', ') } : null);
  };

  const timeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const formatContent = (content) => {
    return content.split('\n').map((line, index) => (
      <p key={index} className="mb-2 last:mb-0 leading-relaxed">
        {line || '\u00A0'}
      </p>
    ));
  };

  const getGravatarUrl = (email, size = 48) => {
    return email
      ? `https://www.gravatar.com/avatar/${md5(email.trim().toLowerCase())}?d=identicon&s=${size}`
      : `https://www.gravatar.com/avatar/?d=identicon&s=${size}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="xl" text="Loading question..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            {error}
          </h1>
          <button
            onClick={fetchQuestion}
            className="text-indigo-600 dark:text-indigo-400 hover:underline mr-4"
          >
            Try again
          </button>
          <Link
            to="/"
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Go back to home
          </Link>
        </div>
      </div>
    );
  }

  // Question not found
  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            Question not found
          </h1>
          <Link
            to="/"
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Go back to home
          </Link>
        </div>
      </div>
    );
  }

  const tags = (question.tags || '').split(',').map(t => t.trim()).filter(Boolean);
  const questionAuthorGravatar = getGravatarUrl(question.user?.email, 48);
  const viewCount = question.views_count || question.views || 0;
  const answerCount = question.answers_count || answers.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Question Section */}
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 border border-gray-200 dark:border-gray-700"
            >
              {/* Question Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 leading-tight">
                    {question.title}
                  </h1>
                  
                  {/* Question Meta */}
                  <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <FaEye className="w-4 h-4" />
                      <span>{viewCount} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaComments className="w-4 h-4" />
                      <span>{answerCount} answers</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaClock className="w-4 h-4" />
                      <span>Asked {timeAgo(question.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Question Actions */}
                <div className="flex items-center gap-2 ml-6">
                  <button 
                    onClick={() => setShowAIFeatures(!showAIFeatures)}
                    className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                    title="AI Features"
                  >
                    <FaRobot className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    <FaShare className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors">
                    <FaFlag className="w-4 h-4" />
                  </button>
                  {user && user.id === question.user_id && (
                    <>
                      <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors">
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors">
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* AI Summary */}
              {question.ai_summary && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <FaRobot className="text-purple-600 dark:text-purple-400" />
                    <span className="font-medium text-purple-800 dark:text-purple-200">AI Summary</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {question.ai_summary}
                  </p>
                </div>
              )}

              {/* Question Content */}
              <div className="prose prose-lg max-w-none text-gray-700 dark:text-gray-300 mb-6">
                {formatContent(question.content)}
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <FaTags className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tags:</span>
                  </div>
                  <TagCloud tags={tags} />
                </div>
              )}

              {/* Suggested Tags */}
              {question.suggested_tags && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <FaRobot className="text-purple-500" />
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400">AI Suggested Tags:</span>
                  </div>
                  <TagCloud tags={question.suggested_tags.split(',').map(t => t.trim()).filter(Boolean)} />
                </div>
              )}

              {/* Question Author */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <img
                    src={questionAuthorGravatar}
                    alt="Author"
                    className="w-12 h-12 rounded-full border-2 border-gray-300 dark:border-gray-600"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {question.user?.first_name} {question.user?.last_name}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        @{question.user?.username}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <FaStar className="text-yellow-500" />
                        <span>{question.user?.reputation || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaCalendar />
                        <span>Joined {new Date(question.user?.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.article>

            {/* AI Features Panel */}
            {showAIFeatures && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <AIFeatures 
                  question={question}
                  onSummaryGenerated={handleSummaryGenerated}
                  onTagsSuggested={handleTagsSuggested}
                />
              </motion.div>
            )}
            {/* Answers Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700"
            >
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                {answers.length === 0 ? 'No answers yet' : `${answers.length} Answer${answers.length !== 1 ? 's' : ''}`}
              </h2>

              {/* Existing Answers */}
              <div className="space-y-8">
                <AnimatePresence>
                  {answers.map((answer, index) => {
                    const authorGravatar = getGravatarUrl(answer.user?.email, 40);

                    return (
                      <motion.div
                        key={answer.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border-b border-gray-200 dark:border-gray-700 pb-8 last:border-b-0 last:pb-0"
                      >
                        <div className="flex gap-4">
                          {/* Star Button */}
                          <div className="flex flex-col items-center gap-2">
                            {user && user.id !== answer.user_id ? (
                              <button
                                onClick={() => handleStarAnswer(answer.id)}
                                className={`p-2 rounded-full transition-all duration-200 ${
                                  starredAnswers.has(answer.id)
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400'
                                }`}
                              >
                                {starredAnswers.has(answer.id) ? (
                                  <FaHeart className="w-5 h-5" />
                                ) : (
                                  <FaRegHeart className="w-5 h-5" />
                                )}
                              </button>
                            ) : (
                              <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-800">
                                <FaHeart className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {answer.stars_count || 0}
                            </span>
                            {/* Quality Score */}
                            {answer.quality_score && answer.quality_score !== 50 && (
                              <div className="text-xs text-center">
                                <div className="text-gray-500 dark:text-gray-400">Quality</div>
                                <div className={`font-semibold ${
                                  answer.quality_score >= 80 ? 'text-green-600' :
                                  answer.quality_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {answer.quality_score}%
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Answer Content */}
                          <div className="flex-1">
                            <div className="prose prose-lg max-w-none text-gray-700 dark:text-gray-300 mb-4">
                              {formatContent(answer.content)}
                            </div>

                            {/* Answer Footer */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <img
                                  src={authorGravatar}
                                  alt="Answer author"
                                  className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600"
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                                      {answer.user?.first_name} {answer.user?.last_name}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      @{answer.user?.username}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <span>Answered {timeAgo(answer.created_at)}</span>
                                    <span>•</span>
                                    <div className="flex items-center gap-1">
                                      <FaStar className="text-yellow-500" />
                                      <span>{answer.user?.reputation || 0}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Answer Actions */}
                              <div className="flex items-center gap-2">
                                <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                  <FaReply className="w-4 h-4" />
                                </button>
                                <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                  <FaShare className="w-4 h-4" />
                                </button>
                                <button className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                  <FaFlag className="w-4 h-4" />
                                </button>
                                {user && user.id === answer.user_id && (
                                  <>
                                    <button className="p-1 text-gray-400 hover:text-blue-500 transition-colors">
                                      <FaEdit className="w-4 h-4" />
                                    </button>
                                    <button className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                      <FaTrash className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Add Answer Form */}
              {user ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700"
                >
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                    Your Answer
                  </h3>
                  <form onSubmit={handleSubmitAnswer} className="space-y-4">
                    <textarea
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      placeholder="Write your answer here... (minimum 10 characters)"
                      rows={8}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100 resize-vertical"
                      required
                    />
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        <p className="mb-1">
                          {newAnswer.length}/10 characters minimum
                        </p>
                        <p>Please be respectful and provide helpful answers.</p>
                      </div>
                      <button
                        type="submit"
                        disabled={!newAnswer.trim() || newAnswer.length < 10 || answerLoading}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        {answerLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Posting...
                          </>
                        ) : (
                          'Post Answer'
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center"
                >
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8">
                    <FaUser className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Sign in to answer
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Join our community to share your knowledge and help others.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      <Link
                        to="/login"
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/register"
                        className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg font-medium transition-colors"
                      >
                        Create Account
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Question Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Question Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Asked</span>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    {new Date(question.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Views</span>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    {viewCount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Answers</span>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    {answers.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Last Activity</span>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    {answers.length > 0 
                      ? timeAgo(Math.max(...answers.map(a => new Date(a.created_at))))
                      : timeAgo(question.created_at)
                    }
                  </span>
                </div>
                {question.quality_score && question.quality_score !== 50 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">AI Quality</span>
                    <span className={`font-medium ${
                      question.quality_score >= 80 ? 'text-green-600' :
                      question.quality_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {question.quality_score}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Related Questions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Related Questions
              </h3>
              <div className="space-y-3">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Related questions will appear here based on tags and content similarity.
                </p>
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
              <h3 className="text-lg font-semibold text-indigo-800 dark:text-indigo-200 mb-3">
                How to Answer
              </h3>
              <ul className="text-sm text-indigo-700 dark:text-indigo-300 space-y-2">
                <li>• Be clear and specific</li>
                <li>• Provide examples if possible</li>
                <li>• Include relevant resources</li>
                <li>• Be respectful and constructive</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}