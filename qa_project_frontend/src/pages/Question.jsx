import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaStar, FaRegStar, FaEdit, FaTrash, FaFlag, FaShare, 
  FaEye, FaCalendar, FaUser, FaTags, FaComments 
} from "react-icons/fa";
import api from "../api";
import { AuthContext } from "../context/AuthContext";
import md5 from "md5";

export default function Question() {
  const { id } = useParams();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [newAnswer, setNewAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [starredAnswers, setStarredAnswers] = useState(new Set());
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        const [questionRes, answersRes] = await Promise.all([
          api.get(`/questions/${id}?include_answers=false`),
          api.get(`/answers/question/${id}`)
        ]);
        
        setQuestion(questionRes.data);
        setAnswers(answersRes.data);

        // Fetch starred answers if user is logged in
        if (user) {
          try {
            const starredRes = await api.get('/answers/starred');
            const starred = new Set(starredRes.data.map(s => s.answer_id));
            setStarredAnswers(starred);
          } catch (err) {
            console.error('Failed to fetch starred answers:', err);
          }
        }
      } catch (err) {
        console.error('Failed to fetch question:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [id, user]);

  const postAnswer = async (e) => {
    e.preventDefault();
    if (!newAnswer.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.post(`/answers/${id}`, { content: newAnswer });
      setAnswers(prev => [...prev, res.data]);
      setNewAnswer("");
    } catch (err) {
      console.error('Failed to post answer:', err);
      alert("Failed to post answer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStar = async (answerId) => {
    if (!user) return;

    try {
      if (starredAnswers.has(answerId)) {
        await api.delete(`/answers/${answerId}/star`);
        setStarredAnswers(prev => {
          const newSet = new Set(prev);
          newSet.delete(answerId);
          return newSet;
        });
      } else {
        await api.post(`/answers/${answerId}/star`);
        setStarredAnswers(prev => new Set([...prev, answerId]));
      }
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  };

  const getGravatarUrl = (email) => {
    return email
      ? `https://www.gravatar.com/avatar/${md5(email.trim().toLowerCase())}?d=identicon&s=80`
      : `https://www.gravatar.com/avatar/?d=identicon&s=80`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading question...</p>
        </motion.div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            Question not found
          </h1>
          <Link
            to="/explore"
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Browse other questions →
          </Link>
        </div>
      </div>
    );
  }

  const tags = (question.tags || '').split(',').map(t => t.trim()).filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Question Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 border border-gray-200 dark:border-gray-700"
            >
              {/* Question Header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 leading-tight">
                  {question.title}
                </h1>
                
                {/* Question Meta */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <FaCalendar />
                    <span>Asked {new Date(question.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaEye />
                    <span>{question.views || 0} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaComments />
                    <span>{answers.length} answers</span>
                  </div>
                </div>

                {/* Question Content */}
                <div className="prose prose-lg dark:prose-invert max-w-none mb-6">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {question.content}
                  </p>
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="flex items-center gap-2 mb-6">
                    <FaTags className="text-gray-400" />
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors cursor-pointer"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Question Author */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <img
                      src={getGravatarUrl(question.user?.email)}
                      alt="avatar"
                      className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-600"
                    />
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-gray-200">
                        {question.user?.first_name} {question.user?.last_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        @{question.user?.username}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                        <FaStar />
                        <span>{question.user?.reputation || 0} reputation</span>
                      </div>
                    </div>
                  </div>

                  {/* Question Actions */}
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                      <FaShare />
                    </button>
                    {user && user.id === question.user_id && (
                      <>
                        <button className="p-2 text-gray-400 hover:text-green-500 transition-colors">
                          <FaEdit />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                          <FaTrash />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

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

              {/* Answers List */}
              <AnimatePresence>
                {answers.map((answer, index) => (
                  <motion.div
                    key={answer.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 py-6 first:pt-0 last:pb-0"
                  >
                    <div className="flex gap-4">
                      {/* Vote/Star Column */}
                      <div className="flex flex-col items-center gap-2 pt-2">
                        {user && user.id !== answer.user_id && (
                          <button
                            onClick={() => toggleStar(answer.id)}
                            className={`p-2 rounded-full transition-all ${
                              starredAnswers.has(answer.id)
                                ? 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900'
                                : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            {starredAnswers.has(answer.id) ? <FaStar /> : <FaRegStar />}
                          </button>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {answer.stars_count || 0}
                        </span>
                      </div>

                      {/* Answer Content */}
                      <div className="flex-1">
                        <div className="prose prose-lg dark:prose-invert max-w-none mb-4">
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {answer.content}
                          </p>
                        </div>

                        {/* Answer Meta */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={getGravatarUrl(answer.user?.email)}
                              alt="avatar"
                              className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-600"
                            />
                            <div>
                              <div className="font-medium text-gray-800 dark:text-gray-200">
                                {answer.user?.first_name} {answer.user?.last_name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(answer.created_at).toLocaleDateString()} • 
                                <span className="ml-1">⭐ {answer.user?.reputation || 0}</span>
                              </div>
                            </div>
                          </div>

                          {/* Answer Actions */}
                          {user && user.id === answer.user_id && (
                            <div className="flex items-center gap-2">
                              <button className="p-1 text-gray-400 hover:text-green-500 transition-colors">
                                <FaEdit size={14} />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                <FaTrash size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Answer Form */}
              {user ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700"
                >
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                    Your Answer
                  </h3>
                  <form onSubmit={postAnswer} className="space-y-4">
                    <textarea
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      placeholder="Write your answer here..."
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-vertical"
                      required
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Minimum 10 characters required
                      </p>
                      <button
                        type="submit"
                        disabled={submitting || newAnswer.length < 10}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-all flex items-center gap-2"
                      >
                        {submitting ? (
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
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Please log in to post an answer
                  </p>
                  <Link
                    to="/login"
                    className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all"
                  >
                    Login to Answer
                  </Link>
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            {/* Question Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
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
                    {question.views || 0}
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
                      ? new Date(Math.max(...answers.map(a => new Date(a.created_at)))).toLocaleDateString()
                      : new Date(question.created_at).toLocaleDateString()
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Related Questions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Related Questions
              </h3>
              <div className="space-y-3">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No related questions found yet.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}