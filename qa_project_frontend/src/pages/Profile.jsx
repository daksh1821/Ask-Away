import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaEdit, FaSave, FaTimes, FaQuestionCircle, 
  FaComments, FaStar, FaEye, FaCalendar, FaMapMarkerAlt,
  FaGlobe, FaEnvelope, FaBriefcase, FaHeart, FaRobot,
  FaSlack, FaAws, FaGoogle, FaChartLine
} from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { apiHelpers } from '../api';
import IntegrationStatus from '../components/IntegrationStatus';
import md5 from 'md5';

export default function Profile() {
  const { user, updateProfile } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [aiAnalytics, setAiAnalytics] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    interests: '',
    work_area: '',
    location: '',
    website: '',
    bio: ''
  });

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
      fetchUserStats();
      fetchAIAnalytics();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const response = await apiHelpers.auth.getUserStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  };

  const fetchAIAnalytics = async () => {
    try {
      const response = await apiHelpers.ai.getAnalytics();
      setAiAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch AI analytics:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
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
    setIsEditing(false);
  };

  const gravatarUrl = user?.email
    ? `https://www.gravatar.com/avatar/${md5(user.email.trim().toLowerCase())}?d=identicon&s=120`
    : `https://www.gravatar.com/avatar/?d=identicon&s=120`;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            Please log in to view your profile
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Profile Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-6">
                  <img
                    src={gravatarUrl}
                    alt="Profile"
                    className="w-24 h-24 rounded-full border-4 border-gray-300 dark:border-gray-600"
                  />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                      {user.first_name} {user.last_name}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      @{user.username}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <FaCalendar />
                        <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaStar className="text-yellow-500" />
                        <span>{user.reputation || 0} reputation</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  <FaEdit />
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              {/* Profile Form */}
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div
                    key="editing"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Work Area
                      </label>
                      <input
                        type="text"
                        name="work_area"
                        value={formData.work_area}
                        onChange={handleInputChange}
                        placeholder="e.g., Software Engineer, Data Scientist"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="e.g., San Francisco, CA"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="https://yourwebsite.com"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Interests
                      </label>
                      <textarea
                        name="interests"
                        value={formData.interests}
                        onChange={handleInputChange}
                        placeholder="e.g., JavaScript, Machine Learning, Web Development"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 resize-vertical"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Tell us about yourself..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 resize-vertical"
                      />
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                      >
                        <FaSave />
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        <FaTimes />
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="viewing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {user.work_area && (
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <FaBriefcase className="text-gray-500" />
                        <span>{user.work_area}</span>
                      </div>
                    )}
                    
                    {user.location && (
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <FaMapMarkerAlt className="text-gray-500" />
                        <span>{user.location}</span>
                      </div>
                    )}
                    
                    {user.website && (
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <FaGlobe className="text-gray-500" />
                        <a 
                          href={user.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {user.website}
                        </a>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <FaEnvelope className="text-gray-500" />
                      <span>{user.email}</span>
                    </div>

                    {user.interests && (
                      <div>
                        <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Interests</h3>
                        <div className="flex flex-wrap gap-2">
                          {user.interests.split(',').map((interest, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-sm"
                            >
                              {interest.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {user.bio && (
                      <div>
                        <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">About</h3>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {user.bio}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Activity Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700"
            >
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                Activity Overview
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FaQuestionCircle className="text-blue-600 dark:text-blue-400 text-2xl" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {user.questions_count || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Questions</div>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FaComments className="text-green-600 dark:text-green-400 text-2xl" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {user.answers_count || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Answers</div>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FaStar className="text-yellow-600 dark:text-yellow-400 text-2xl" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {user.reputation || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Reputation</div>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FaHeart className="text-red-600 dark:text-red-400 text-2xl" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {stats?.stars_received || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Stars Received</div>
                </div>
              </div>
            </motion.div>

            {/* AI Analytics */}
            {aiAnalytics && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl shadow-lg p-8 border border-purple-200 dark:border-purple-800"
              >
                <div className="flex items-center gap-2 mb-6">
                  <FaRobot className="text-purple-600 dark:text-purple-400 text-2xl" />
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    AI Analytics
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                      {aiAnalytics.ai_summary_coverage?.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Questions with AI Summaries
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                      {aiAnalytics.average_question_quality}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Avg Question Quality
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {aiAnalytics.average_answer_quality}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Avg Answer Quality
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Integration Status */}
            <IntegrationStatus />

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Quick Actions
              </h3>
              
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors">
                  <FaQuestionCircle />
                  <span>Ask a Question</span>
                </button>
                
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors">
                  <FaChartLine />
                  <span>View Analytics</span>
                </button>
                
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors">
                  <FaRobot />
                  <span>AI Features</span>
                </button>
              </div>
            </motion.div>

            {/* Account Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Account Information
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Account Type</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {user.is_oauth_user ? 'Google OAuth' : 'Standard'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Member Since</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Last Updated</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {new Date(user.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}