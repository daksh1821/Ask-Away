import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaMagic, FaTags, FaChartLine, FaSpinner } from 'react-icons/fa';
import { apiHelpers } from '../api';

export default function AIFeatures({ question, onSummaryGenerated, onTagsSuggested }) {
  const [loading, setLoading] = useState({
    summary: false,
    tags: false,
    quality: false
  });
  const [results, setResults] = useState({
    summary: null,
    tags: [],
    quality: null
  });

  const generateSummary = async () => {
    if (!question?.id) return;
    
    setLoading(prev => ({ ...prev, summary: true }));
    try {
      const response = await apiHelpers.ai.generateSummary(question.id);
      setResults(prev => ({ ...prev, summary: response.data.summary }));
      if (onSummaryGenerated) {
        onSummaryGenerated(response.data.summary);
      }
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      setLoading(prev => ({ ...prev, summary: false }));
    }
  };

  const suggestTags = async () => {
    if (!question?.title || !question?.content) return;
    
    setLoading(prev => ({ ...prev, tags: true }));
    try {
      const response = await apiHelpers.ai.suggestTags(question.title, question.content);
      setResults(prev => ({ ...prev, tags: response.data.suggested_tags }));
      if (onTagsSuggested) {
        onTagsSuggested(response.data.suggested_tags);
      }
    } catch (error) {
      console.error('Failed to suggest tags:', error);
    } finally {
      setLoading(prev => ({ ...prev, tags: false }));
    }
  };

  const getQualityScore = async (answerId) => {
    setLoading(prev => ({ ...prev, quality: true }));
    try {
      const response = await apiHelpers.ai.getQualityScore(answerId);
      setResults(prev => ({ ...prev, quality: response.data }));
    } catch (error) {
      console.error('Failed to get quality score:', error);
    } finally {
      setLoading(prev => ({ ...prev, quality: false }));
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
      <div className="flex items-center gap-2 mb-4">
        <FaRobot className="text-purple-600 dark:text-purple-400 text-xl" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          AI-Powered Features
        </h3>
      </div>

      <div className="space-y-4">
        {/* AI Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FaMagic className="text-indigo-500" />
              <span className="font-medium text-gray-800 dark:text-gray-200">
                AI Summary
              </span>
            </div>
            <button
              onClick={generateSummary}
              disabled={loading.summary}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm transition-all flex items-center gap-2"
            >
              {loading.summary ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Summary'
              )}
            </button>
          </div>
          
          <AnimatePresence>
            {results.summary && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300"
              >
                {results.summary}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tag Suggestions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FaTags className="text-green-500" />
              <span className="font-medium text-gray-800 dark:text-gray-200">
                Suggested Tags
              </span>
            </div>
            <button
              onClick={suggestTags}
              disabled={loading.tags}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm transition-all flex items-center gap-2"
            >
              {loading.tags ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Suggesting...
                </>
              ) : (
                'Suggest Tags'
              )}
            </button>
          </div>
          
          <AnimatePresence>
            {results.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2"
              >
                {results.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quality Analytics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <FaChartLine className="text-orange-500" />
            <span className="font-medium text-gray-800 dark:text-gray-200">
              Quality Analytics
            </span>
          </div>
          
          {results.quality && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Quality Score</span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  {results.quality.quality_score}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${results.quality.quality_score}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}