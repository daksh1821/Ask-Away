import React, { useContext, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from 'react-router-dom';
import { 
  FaPencilAlt, FaSave, FaTimes, FaUser, FaEnvelope, FaMapMarkerAlt, 
  FaGlobe, FaBriefcase, FaHeart, FaQuestionCircle, FaComments, 
  FaStar, FaTrash, FaEye, FaEyeSlash, FaCamera, FaCalendar, FaAward,
  FaCog, FaEdit
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import md5 from "md5";
import api from "../api";

export default function Profile() {
  const { user, updateProfile, deleteAccount, logout } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State management
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [userQuestions, setUserQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [starredAnswers, setStarredAnswers] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Handle tab changes from URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['overview', 'questions', 'answers', 'starred', 'settings'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // Initialize form data
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

  // Fetch user data based on active tab
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const promises = [];

        // Always fetch stats
        promises.push(api.get('/auth/me/stats'));

        // Fetch tab-specific data
        if (activeTab === 'questions' || activeTab === 'overview') {
          promises.push(api.get('/questions/my'));
        }
        if (activeTab === 'answers' || activeTab === 'overview') {
          promises.push(api.get('/answers/my'));
        }
        if (activeTab === 'starred') {
          promises.push(api.get('/answers/starred'));
        }

        const results = await Promise.all(promises);
        
        // Set stats (always first result)
        setUserStats(results[0].data);
        
        // Set other data based on what was fetched
        let resultIndex = 1;
        if (activeTab === 'questions' || activeTab === 'overview') {
          setUserQuestions(results[resultIndex].data);
          resultIndex++;
        }
        if (activeTab === 'answers' || activeTab === 'overview') {
          setUserAnswers(results[resultIndex].data);
          resultIndex++;
        }
        if (activeTab === 'starred') {
          setStarredAnswers(results[resultIndex].data);
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, activeTab]);

  // Loading state
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

  // Gravatar URL generation
  const gravatarUrl = user.email
    ? `https://www.gravatar.com/avatar/${md5(user.email.trim().toLowerCase())}?d=identicon&s=150`
    : `https://www.gravatar.com/avatar/?d=identicon&s=150`;

  // Profile save handler
  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateProfile(formData);
      setSuccess('Profile updated successfully!');
      setEditing(false);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Cancel edit handler
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

  // Input change handler
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      await deleteAccount();
      logout();
    } catch (err) {
      setError(err.message || 'Failed to delete account');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  // Profile picture upload handler
  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // For now, show message about Gravatar
      setSuccess('To change your profile picture, please update it on Gravatar.com using your registered email address.');
      setTimeout(() => setSuccess(null), 5000);
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaUser },
    { id: 'questions', label: 'My Questions', icon: FaQuestionCircle, count: userQuestions.length },
    { id: 'answers', label: 'My Answers', icon: FaComments, count: userAnswers.length },
    { id: 'starred', label: 'Starred', icon: FaStar, count: starredAnswers.length },
    { id: 'settings', label: 'Settings', icon: FaCog }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 transition-all duration-500">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Enhanced Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 border border-gray-200 dark:border-gray-700 overflow-hidden relative"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
          </div>
          
          <div className="relative flex flex-col lg:flex-row items-center gap-8">
            {/* Enhanced Avatar Section */}
            <div className="relative group">
              <div className="relative">
                <img
                  src={gravatarUrl}
                  alt="Profile Avatar"
                  className="w-32 h-32 lg:w-40 lg:h-40 rounded-full border-4 border-indigo-500 shadow-xl object-cover"
                />
                <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center shadow-lg">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
                
                {/* Camera overlay */}
                <label className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <FaCamera className="text-white text-xl" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Enhanced User Info Section */}
            <div className="flex-1 text-center lg:text-left">
              <div className="mb-4">
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 dark:text-gray-100 mb-2 leading-tight">
                  {user.first_name} {user.last_name}
                </h1>
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                  <span className="text-lg text-gray-600 dark:text-gray-400">@{user.username}</span>
                  <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
                    Member
                  </span>
                </div>
                
                {/* Contact Info */}
                <div className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 dark:text-gray-400 mb-4 flex-wrap">
                  <div className="flex items-center gap-1">
                    <FaEnvelope className="w-4 h-4" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaCalendar className="w-4 h-4" />
                    <span className="text-sm">Joined {new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900 dark:to-indigo-800 px-4 py-3 rounded-xl text-center">
                  <div className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">
                    {user.reputation || 0}
                  </div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-300 font-medium">Reputation</div>
                </div>
                <div className="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 px-4 py-3 rounded-xl text-center">
                  <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {userQuestions.length || user.questions_count || 0}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-300 font-medium">Questions</div>
                </div>
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 px-4 py-3 rounded-xl text-center">
                  <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                    {userAnswers.length || user.answers_count || 0}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-300 font-medium">Answers</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900 dark:to-yellow-800 px-4 py-3 rounded-xl text-center">
                  <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                    {userStats?.stars_received || 0}
                  </div>
                  <div className="text-xs text-yellow-600 dark:text-yellow-300 font-medium">Stars</div>
                </div>
              </div>

              {/* Quick Info */}
              {(user.work_area || user.location) && (
                <div className="flex items-center justify-center lg:justify-start gap-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                  {user.work_area && (
                    <div className="flex items-center gap-1">
                      <FaBriefcase className="w-4 h-4" />
                      <span>{user.work_area}</span>
                    </div>
                  )}
                  {user.location && (
                    <div className="flex items-center gap-1">
                      <FaMapMarkerAlt className="w-4 h-4" />
                      <span>{user.location}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl shadow-lg transition-all transform hover:scale-105"
                >
                  <FaPencilAlt size={14} />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <FaSave size={14} />
                    )}
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all"
                  >
                    <FaTimes size={14} />
                    Cancel
                  </button>
                </div>
              )}
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
              className="bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-200 px-6 py-4 rounded-xl mb-6 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {success}
              </div>
            </motion.div>
          )}
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-6 py-4 rounded-xl mb-6 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Tab Navigation */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-2">
            <div className="flex flex-wrap gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all relative ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg transform scale-105'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`ml-1 px-2 py-1 text-xs rounded-full font-bold ${
                        activeTab === tab.id 
                          ? 'bg-white/20 text-white' 
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
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
              className="grid lg:grid-cols-2 gap-8"
            >
              {/* Enhanced Profile Info Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <FaUser className="text-indigo-600" />
                    Profile Information
                  </h2>
                  {!editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      <FaEdit size={16} />
                    </button>
                  )}
                </div>
                
                <div className="space-y-6">
                  {/* Profile Fields */}
                  {[
                    { label: 'Interests', name: 'interests', icon: FaHeart, type: 'input' },
                    { label: 'Work Area', name: 'work_area', icon: FaBriefcase, type: 'input' },
                    { label: 'Location', name: 'location', icon: FaMapMarkerAlt, type: 'input' },
                    { label: 'Website', name: 'website', icon: FaGlobe, type: 'input' }
                  ].map((field) => {
                    const Icon = field.icon;
                    return (
                      <div key={field.name} className="group">
                        <div className="flex items-start gap-4">
                          <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <Icon className="text-gray-500 dark:text-gray-400 text-sm" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              {field.label}
                            </label>
                            {editing ? (
                              <input
                                name={field.name}
                                value={formData[field.name] || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder={`Enter your ${field.label.toLowerCase()}`}
                              />
                            ) : (
                              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600">
                                {field.name === 'website' && user[field.name] ? (
                                  <a 
                                    href={user[field.name]} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 dark:text-indigo-400 hover:underline break-all"
                                  >
                                    {user[field.name]}
                                  </a>
                                ) : (
                                  <p className="text-gray-800 dark:text-gray-200">
                                    {user[field.name] || 'Not specified'}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Bio Section */}
                  <div className="group">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <FaUser className="text-gray-500 dark:text-gray-400 text-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Bio
                        </label>
                        {editing ? (
                          <textarea
                            name="bio"
                            value={formData.bio || ''}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-vertical"
                            placeholder="Tell us about yourself..."
                          />
                        ) : (
                          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 min-h-[100px]">
                            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                              {user.bio || 'No bio provided yet. Add a bio to tell others about yourself!'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Stats Card */}
              <div className="space-y-8">
                {/* Activity Statistics */}
                {userStats && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
                      <FaAward className="text-indigo-600" />
                      Activity Statistics
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/50 dark:to-indigo-800/30 rounded-xl border border-indigo-200 dark:border-indigo-700">
                        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                          {userStats.questions_count || 0}
                        </div>
                        <div className="text-sm text-indigo-500 dark:text-indigo-300 font-medium">Questions Asked</div>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/50 dark:to-green-800/30 rounded-xl border border-green-200 dark:border-green-700">
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                          {userStats.answers_count || 0}
                        </div>
                        <div className="text-sm text-green-500 dark:text-green-300 font-medium">Answers Given</div>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/50 dark:to-yellow-800/30 rounded-xl border border-yellow-200 dark:border-yellow-700">
                        <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                          {userStats.reputation || 0}
                        </div>
                        <div className="text-sm text-yellow-500 dark:text-yellow-300 font-medium">Reputation</div>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/50 dark:to-purple-800/30 rounded-xl border border-purple-200 dark:border-purple-700">
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                          {userStats.stars_received || 0}
                        </div>
                        <div className="text-sm text-purple-500 dark:text-purple-300 font-medium">Stars Received</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Activity Preview */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                    Recent Activity
                  </h2>
                  
                  <div className="space-y-4">
                    {userQuestions.slice(0, 3).map((question) => (
                      <div key={question.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <FaQuestionCircle className="text-indigo-500 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 dark:text-gray-200 truncate">
                            {question.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(question.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {userQuestions.length === 0 && (
                      <div className="text-center py-6">
                        <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Questions Tab */}
          {activeTab === 'questions' && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <FaQuestionCircle className="text-indigo-600" />
                  My Questions ({userQuestions.length})
                </h2>
                <a
                  href="/ask"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all flex items-center gap-2"
                >
                  <FaPencilAlt size={14} />
                  Ask Question
                </a>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
              ) : userQuestions.length > 0 ? (
                <div className="space-y-6">
                  {userQuestions.map((question) => (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            <a
                              href={`/question/${question.id}`}
                              className="hover:underline"
                            >
                              {question.title}
                            </a>
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                            {question.content?.length > 200 
                              ? `${question.content.slice(0, 200)}...`
                              : question.content
                            }
                          </p>
                          
                          {/* Question Tags */}
                          {question.tags && question.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {question.tags.slice(0, 3).map((tag, index) => (
                                <span 
                                  key={index}
                                  className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                              {question.tags.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                                  +{question.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <FaEye className="w-3 h-3" />
                                {question.views_count || 0} views
                              </span>
                              <span className="flex items-center gap-1">
                                <FaComments className="w-3 h-3" />
                                {question.answers_count || 0} answers
                              </span>
                              <span>{new Date(question.created_at).toLocaleDateString()}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {question.is_resolved && (
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded-full flex items-center gap-1">
                                  <FaStar className="w-3 h-3" />
                                  Resolved
                                </span>
                              )}
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                question.status === 'open' 
                                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                              }`}>
                                {question.status || 'Open'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="max-w-md mx-auto">
                    <FaQuestionCircle className="mx-auto text-gray-300 dark:text-gray-600 text-6xl mb-6" />
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-3">
                      No questions yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      Start your journey by asking your first question to the community!
                    </p>
                    <a
                      href="/ask"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
                    >
                      <FaPencilAlt size={14} />
                      Ask Your First Question
                    </a>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Answers Tab */}
          {activeTab === 'answers' && (
            <motion.div
              key="answers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700"
            >
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-8 flex items-center gap-2">
                <FaComments className="text-indigo-600" />
                My Answers ({userAnswers.length})
              </h2>
              
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
              ) : userAnswers.length > 0 ? (
                <div className="space-y-6">
                  {userAnswers.map((answer) => (
                    <motion.div
                      key={answer.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all group"
                    >
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                          <a
                            href={`/question/${answer.question_id}`}
                            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            Answer to: {answer.question?.title || 'Question'}
                          </a>
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                          <p className="text-gray-800 dark:text-gray-200">
                            {answer.content?.length > 300 
                              ? `${answer.content.slice(0, 300)}...`
                              : answer.content
                            }
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                          <span>{new Date(answer.created_at).toLocaleDateString()}</span>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <FaStar className="text-yellow-500" />
                              <span>{answer.stars_count || 0} stars</span>
                            </div>
                            {answer.is_accepted && (
                              <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs flex items-center gap-1">
                                <FaStar className="w-3 h-3" />
                                Accepted
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="max-w-md mx-auto">
                    <FaComments className="mx-auto text-gray-300 dark:text-gray-600 text-6xl mb-6" />
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-3">
                      No answers yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      Help others by answering their questions and sharing your knowledge!
                    </p>
                    <a
                      href="/"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
                    >
                      <FaComments size={14} />
                      Browse Questions
                    </a>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Starred Answers Tab */}
          {activeTab === 'starred' && (
            <motion.div
              key="starred"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700"
            >
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-8 flex items-center gap-2">
                <FaStar className="text-yellow-500" />
                Starred Answers ({starredAnswers.length})
              </h2>
              
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
              ) : starredAnswers.length > 0 ? (
                <div className="space-y-6">
                  {starredAnswers.map((star) => (
                    <motion.div
                      key={star.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                          <FaHeart className="text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            <a
                              href={`/question/${star.answer?.question_id}`}
                              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                              {star.answer?.question?.title || 'Question'}
                            </a>
                          </h3>
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                            <p className="text-gray-600 dark:text-gray-300">
                              {star.answer?.content?.length > 250 
                                ? `${star.answer.content.slice(0, 250)}...`
                                : star.answer?.content
                              }
                            </p>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <span>by</span>
                              <span className="font-medium">
                                {star.answer?.user?.first_name} {star.answer?.user?.last_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span>Starred on {new Date(star.created_at).toLocaleDateString()}</span>
                              <div className="flex items-center gap-1">
                                <FaStar className="text-yellow-500" />
                                <span>{star.answer?.stars_count || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="max-w-md mx-auto">
                    <FaStar className="mx-auto text-gray-300 dark:text-gray-600 text-6xl mb-6" />
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-3">
                      No starred answers yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      Star answers that you find helpful to save them for later reference!
                    </p>
                    <a
                      href="/"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
                    >
                      <FaStar size={14} />
                      Explore Answers
                    </a>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700"
            >
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-8 flex items-center gap-2">
                <FaCog className="text-indigo-600" />
                Account Settings
              </h2>
              
              <div className="space-y-8">
                {/* Account Information */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-8">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
                    <FaUser className="text-gray-500" />
                    Account Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        First Name
                      </label>
                      <input
                        name="first_name"
                        value={formData.first_name || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Last Name
                      </label>
                      <input
                        name="last_name"
                        value={formData.last_name || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-50 shadow-lg"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <FaSave size={14} />
                      )}
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>

                {/* Profile Picture Settings */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-8">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
                    <FaCamera className="text-gray-500" />
                    Profile Picture
                  </h3>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <img
                        src={gravatarUrl}
                        alt="Profile"
                        className="w-16 h-16 rounded-full border-2 border-yellow-300 dark:border-yellow-600"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                          Currently using Gravatar
                        </h4>
                        <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-4">
                          Your profile picture is synced with Gravatar using your email: <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">{user.email}</code>
                        </p>
                        <div className="flex gap-3">
                          <a
                            href="https://gravatar.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors"
                          >
                            <FaGlobe size={12} />
                            Update on Gravatar
                          </a>
                          <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-sm transition-colors cursor-pointer">
                            <FaCamera size={12} />
                            Upload New Picture
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleProfilePictureUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Privacy Settings */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-8">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
                    <FaEye className="text-gray-500" />
                    Privacy Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-gray-200">Profile Visibility</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Make your profile visible to other users</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-gray-200">Email Notifications</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Receive email notifications for new answers</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-4 flex items-center gap-2">
                    <FaTrash className="text-red-600" />
                    Danger Zone
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                        Delete Account
                      </h4>
                      <p className="text-red-700 dark:text-red-300 text-sm mb-4">
                        Once you delete your account, there is no going back. This will permanently remove:
                      </p>
                      <ul className="text-red-700 dark:text-red-300 text-sm mb-6 space-y-1 ml-4">
                        <li>• All your questions and answers</li>
                        <li>• Your profile information and statistics</li>
                        <li>• Your reputation and achievements</li>
                        <li>• All starred content and preferences</li>
                      </ul>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
                      >
                        <FaTrash size={14} />
                        Delete My Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaTrash className="text-red-600 dark:text-red-400 text-xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                    Delete Account
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    This action cannot be undone
                  </p>
                </div>
                
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                  <p className="text-red-800 dark:text-red-200 text-sm">
                    Are you sure you want to permanently delete your account? This will remove all your data including {userQuestions.length} questions, {userAnswers.length} answers, and {user.reputation || 0} reputation points.
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <FaTrash size={14} />
                    )}
                    {loading ? 'Deleting...' : 'Delete Account'}
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