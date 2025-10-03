import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaQuestionCircle, FaTags, FaLightbulb, FaEye, 
  FaCheckCircle, FaExclamationTriangle 
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import api from "../api";

const Ask = () => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: "",
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [validation, setValidation] = useState({
    title: { valid: false, message: "" },
    content: { valid: false, message: "" },
    tags: { valid: true, message: "" }
  });
  
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const validateField = (name, value) => {
    let isValid = false;
    let message = "";

    switch (name) {
      case 'title':
        if (value.length < 10) {
          message = "Title must be at least 10 characters";
        } else if (value.length > 300) {
          message = "Title must be less than 300 characters";
        } else {
          isValid = true;
          message = "✓ Good title length";
        }
        break;
      
      case 'content':
        if (value.length < 20) {
          message = "Content must be at least 20 characters";
        } else if (value.length > 5000) {
          message = "Content must be less than 5000 characters";
        } else {
          isValid = true;
          message = "✓ Good content length";
        }
        break;
      
      case 'tags':
        const tagList = value.split(',').map(t => t.trim()).filter(Boolean);
        if (tagList.length > 5) {
          message = "Maximum 5 tags allowed";
        } else {
          isValid = true;
          message = tagList.length > 0 ? `✓ ${tagList.length} tag(s)` : "Optional: Add relevant tags";
        }
        break;
    }

    return { valid: isValid, message };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Real-time validation
    const fieldValidation = validateField(name, value);
    setValidation(prev => ({
      ...prev,
      [name]: fieldValidation
    }));
  };

  const canSubmit = () => {
    return validation.title.valid && validation.content.valid && validation.tags.valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.post("/questions", formData);
      navigate(`/question/${response.data.id}`);
    } catch (err) {
      console.error("POST /questions error:", err.response || err);
      setError(err.response?.data?.detail || "Failed to post question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const suggestedTags = [
    "javascript", "react", "python", "nodejs", "css", "html", 
    "database", "api", "frontend", "backend", "mobile", "web"
  ];

  const addSuggestedTag = (tag) => {
    const currentTags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (!currentTags.includes(tag) && currentTags.length < 5) {
      const newTags = [...currentTags, tag].join(', ');
      setFormData({ ...formData, tags: newTags });
      setValidation(prev => ({
        ...prev,
        tags: validateField('tags', newTags)
      }));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            Please log in to ask a question
          </h2>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 transition-all duration-500">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <FaQuestionCircle className="text-white text-xl" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Ask a Question
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
            Get help from our community by asking detailed, specific questions.
            The more context you provide, the better answers you'll receive.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-6 flex items-center gap-2"
                >
                  <FaExclamationTriangle />
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title Field */}
                <div>
                  <label className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    <FaQuestionCircle className="text-indigo-500" />
                    Question Title
                  </label>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                      formData.title ? (validation.title.valid ? 'border-green-500' : 'border-red-500') : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="What's your question? Be specific and descriptive..."
                    required
                  />
                  <div className={`mt-2 text-sm flex items-center gap-2 ${
                    validation.title.valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {validation.title.message}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {formData.title.length}/300 characters
                  </div>
                </div>

                {/* Content Field */}
                <div>
                  <label className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    <FaLightbulb className="text-yellow-500" />
                    Question Details
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-vertical ${
                      formData.content ? (validation.content.valid ? 'border-green-500' : 'border-red-500') : 'border-gray-300 dark:border-gray-600'
                    }`}
                    rows={8}
                    placeholder="Provide detailed information about your question:&#10;&#10;• What exactly are you trying to do?&#10;• What have you tried so far?&#10;• What errors or issues are you encountering?&#10;• Include relevant code, error messages, or examples"
                    required
                  />
                  <div className={`mt-2 text-sm flex items-center gap-2 ${
                    validation.content.valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {validation.content.message}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {formData.content.length}/5000 characters
                  </div>
                </div>

                {/* Tags Field */}
                <div>
                  <label className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    <FaTags className="text-green-500" />
                    Tags (Optional)
                  </label>
                  <input
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                      !validation.tags.valid ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="e.g., javascript, react, css, database"
                  />
                  <div className={`mt-2 text-sm flex items-center gap-2 ${
                    validation.tags.valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {validation.tags.message}
                  </div>
                  
                  {/* Suggested Tags */}
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Suggested tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => addSuggestedTag(tag)}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                  >
                    <FaEye />
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting || !canSubmit()}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all transform hover:scale-105"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Posting Question...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle />
                        Post Your Question
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Preview Section */}
              <AnimatePresence>
                {showPreview && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700"
                  >
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                      Preview
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                      <h4 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                        {formData.title || "Your question title will appear here"}
                      </h4>
                      <div className="prose prose-lg dark:prose-invert max-w-none mb-4">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {formData.content || "Your question details will appear here"}
                        </p>
                      </div>
                      {formData.tags && (
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.split(',').map(tag => tag.trim()).filter(Boolean).map((tag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Tips Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <FaLightbulb className="text-yellow-500" />
                Writing Tips
              </h3>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Be specific and clear in your question title</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Include what you've already tried</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Add relevant code snippets or error messages</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Use appropriate tags to help others find your question</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Check for similar questions before posting</span>
                </li>
              </ul>
            </div>

            {/* Question Guidelines */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">
                Question Guidelines
              </h3>
              <div className="space-y-3 text-sm text-blue-700 dark:text-blue-300">
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-500 flex-shrink-0" />
                  <span>Clear, specific titles</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-500 flex-shrink-0" />
                  <span>Detailed problem description</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-500 flex-shrink-0" />
                  <span>Relevant code examples</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-500 flex-shrink-0" />
                  <span>Expected vs actual results</span>
                </div>
              </div>
            </div>

            {/* User Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Your Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Questions Asked</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {user.questions_count || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Answers Given</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {user.answers_count || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Reputation</span>
                  <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                    {user.reputation || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Questions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Need Inspiration?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Browse recent questions from the community to see examples of well-structured questions.
              </p>
              <button
                onClick={() => navigate('/explore')}
                className="w-full px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all"
              >
                Browse Questions
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Ask;