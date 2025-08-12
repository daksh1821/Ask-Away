import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEye, FaComments, FaClock, FaStar, FaUser } from 'react-icons/fa';
import md5 from 'md5';

export default function QuestionCard({ q, index = 0 }) {
  const preview = q.content?.slice(0, 150) + (q.content?.length > 150 ? '...' : '');
  const tags = (q.tags || '').split(',').map(t => t.trim()).filter(Boolean);
  
  const gravatarUrl = q.user?.email
    ? `https://www.gravatar.com/avatar/${md5(q.user.email.trim().toLowerCase())}?d=identicon&s=40`
    : `https://www.gravatar.com/avatar/?d=identicon&s=40`;

  const timeAgo = (dateString) => {
    const now = new Date();
    const questionDate = new Date(dateString);
    const diffInSeconds = Math.floor((now - questionDate) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return questionDate.toLocaleDateString();
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -2 }}
      className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-700 transition-all duration-300 group"
    >
      {/* Question Header */}
      <div className="flex items-start justify-between mb-4">
        <Link 
          to={`/question/${q.id}`}
          className="flex-1"
        >
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight mb-2">
            {q.title}
          </h3>
        </Link>
        
        {/* Question Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 ml-4">
          <div className="flex items-center gap-1">
            <FaEye className="text-xs" />
            <span>{q.views || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <FaComments className="text-xs" />
            <span>{q.answers_count || 0}</span>
          </div>
        </div>
      </div>

      {/* Question Preview */}
      <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
        {preview}
      </p>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.slice(0, 4).map((tag, tagIndex) => (
            <span
              key={tagIndex}
              className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors cursor-pointer"
            >
              {tag}
            </span>
          ))}
          {tags.length > 4 && (
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-sm">
              +{tags.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Question Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        {/* Author Info */}
        <div className="flex items-center gap-3">
          <img
            src={gravatarUrl}
            alt="avatar"
            className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-600 transition-transform group-hover:scale-110"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {q.user?.first_name} {q.user?.last_name}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                @{q.user?.username}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <FaClock />
                <span>{timeAgo(q.created_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <FaStar className="text-yellow-500" />
                <span>{q.user?.reputation || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Question Actions */}
        <div className="flex items-center gap-2">
          {q.answers_count > 0 && (
            <div className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
              <FaComments className="text-xs" />
              <span>{q.answers_count} answer{q.answers_count !== 1 ? 's' : ''}</span>
            </div>
          )}
          
          {q.answers_count === 0 && (
            <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium">
              <span>Unanswered</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.article>
  );
}