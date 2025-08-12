import React, { useContext, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaPencilAlt, FaSave, FaTimes, FaUser, FaEnvelope, FaMapMarkerAlt, 
  FaGlobe, FaBriefcase, FaHeart, FaQuestionCircle, FaComments, 
  FaStar, FaTrash, FaEye, FaEyeSlash 
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import md5 from "md5";
import api from "../api";

export default function Profile() {
  const { user, updateProfile, deleteAccount, logout } = useContext(AuthContext);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [userQuestions, setUserQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        interests: user.interests || '',
        work_area: user.work_area || '',
        location: user.location || '',
        website: user.website || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        const [questionsRes, answersRes, statsRes] = await Promise.all([
          api.get('/questions/my'),
          api.get('/answers/my'),
          api.get('/auth/me/stats')
        ]);

        setUserQuestions(questionsRes.data);
        setUserAnswers(answersRes.data);
        setUserStats(statsRes.data);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      }
    };

    fetchUserData();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  const gravatarUrl = user.email
    ? `https://www.gravatar.com/avatar/${md5(user.email.trim().toLowerCase())}?d=identicon&s=120`
    : `https://www.gravatar.com/avatar/?d=identicon&s=120`;

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateProfile(formData);
      setSuccess('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      interests: user.interests || '',
      work_area: user.work_area || '',
      location: user.location || '',
      website: user.website || '',
      bio: user.bio || ''
    });
    setEditing(false);
    setError(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      logout();
    } catch (err) {
      setError(err.message);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaUser },
    { id: 'questions', label: 'Questions', icon: FaQuestionCircle },
    { id: 'answers', label: 'Answers', icon: FaComments },
    { id: 'settings', label: 'Settings', icon: FaPencilAlt }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 transition-all duration-500">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <img
                src={gravatarUrl}
                alt="avatar"
                className="w-32 h-32 rounded-full border-4 border-indigo-500 shadow-lg"
              />
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                {user.first_name} {user.last_name}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                @{user.username}
              </p>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {user.email}
              </p>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="bg-indigo-100 dark:bg-indigo-900 px-4 py-2 rounded-full">
                  <span className="text-indigo-800 dark:text-indigo-200 font-semibold">
                    ⭐ {user.reputation || 0} Reputation
                  </span>
                </div>
                <div className="bg-green-100 dark:bg-green-900 px-4 py-2 rounded-full">
                  <span className="text-green-800 dark:text-green-200 font-semibold">
                    {user.questions_count || 0} Questions
                  </span>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-full">
                  <span className="text-blue-800 dark:text-blue-200 font-semibold">
                    {user.answers_count || 0} Answers
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(!editing)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
              >
                <FaPencilAlt size={14} />
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Messages */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-200 px-4 py-3 rounded-lg mb-6"
            >
              {success}
            </motion.div>
          )}
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-6"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid md:grid-cols-2 gap-8"
            >
              {/* Profile Info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
                  Profile Information
                </h2>
                
                <div className="space-y-4">
                  {[
                    { label: 'Interests', name: 'interests', icon: FaHeart },
                    { label: 'Work Area', name: 'work_area', icon: FaBriefcase },
                    { label: 'Location', name: 'location', icon: FaMapMarkerAlt },
                    { label: 'Website', name: 'website', icon: FaGlobe }
                  ].map((field) => {
                    const Icon = field.icon;
                    return (
                      <div key={field.name} className="flex items-start gap-3">
                        <Icon className="text-gray-400 mt-1" />
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {field.label}
                          </label>
                          {editing ? (
                            <input
                              name={field.name}
                              value={formData[field.name] || ''}
                              onChange={handleChange}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-all"
                              placeholder={`Enter your ${field.label.toLowerCase()}`}
                            />
                          ) : (
                            <p className="text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                              {user[field.name] || 'Not specified'}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Bio */}
                  <div className="flex items-start gap-3">
                    <FaUser className="text-gray-400 mt-1" />
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bio
                      </label>
                      {editing ? (
                        <textarea
                          name="bio"
                          value={formData.bio || ''}
                          onChange={handleChange}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-all resize-vertical"
                          placeholder="Tell us about yourself..."
                        />
                      ) : (
                        <p className="text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg whitespace-pre-wrap">
                          {user.bio || 'No bio provided'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {editing && (
                  <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleCancel}
                      className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
                    >
                      <FaTimes size={14} />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <FaSave size={14} />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Stats Card */}
              {userStats && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
                    Activity Statistics
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/50 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {userStats.questions_count}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Questions</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {userStats.answers_count}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Answers</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {userStats.reputation}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Reputation</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {userStats.stars_received}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Stars Received</div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'questions' && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
                My Questions ({userQuestions.length})
              </h2>
              
              {userQuestions.length > 0 ? (
                <div className="space-y-4">
                  {userQuestions.map((question) => (
                    <div
                      key={question.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    >
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        <a
                          href={`/question/${question.id}`}
                          className="hover:text-indigo-600 dark:hover:text-indigo-400"
                        >
                          {question.title}
                        </a>
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        {question.content?.slice(0, 150)}...
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>{new Date(question.created_at).toLocaleDateString()}</span>
                        <span>{question.answers_count || 0} answers</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaQuestionCircle className="mx-auto text-gray-400 text-4xl mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No questions asked yet</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'answers' && (
            <motion.div
              key="answers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
                My Answers ({userAnswers.length})
              </h2>
              
              {userAnswers.length > 0 ? (
                <div className="space-y-4">
                  {userAnswers.map((answer) => (
                    <div
                      key={answer.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    >
                      <p className="text-gray-800 dark:text-gray-200 mb-2">
                        {answer.content?.slice(0, 200)}...
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>{new Date(answer.created_at).toLocaleDateString()}</span>
                        <div className="flex items-center gap-2">
                          <FaStar className="text-yellow-500" />
                          <span>{answer.stars_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaComments className="mx-auto text-gray-400 text-4xl mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No answers provided yet</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
                Account Settings
              </h2>
              
              <div className="space-y-6">
                {/* Account Info */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                    Account Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        First Name
                      </label>
                      <input
                        name="first_name"
                        value={formData.first_name || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Last Name
                      </label>
                      <input
                        name="last_name"
                        value={formData.last_name || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <FaSave size={14} />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
                  <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
                    Danger Zone
                  </h3>
                  <p className="text-red-600 dark:text-red-400 text-sm mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all flex items-center gap-2"
                  >
                    <FaTrash size={14} />
                    Delete Account
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
              >
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                  Delete Account
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your questions, answers, and profile data.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
                  >
                    Delete Account
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}