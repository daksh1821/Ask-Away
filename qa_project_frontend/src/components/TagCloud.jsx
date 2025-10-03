import React from 'react';
import { motion } from 'framer-motion';

export default function TagCloud({ tags = [], onSelect, selectedTags = [], className = '' }) {
  const isSelected = (tag) => selectedTags.includes(tag);

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag, index) => (
        <motion.button
          key={tag}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect && onSelect(tag)}
          className={`
            px-3 py-1 rounded-full text-sm font-medium transition-all duration-200
            ${isSelected(tag)
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 hover:text-indigo-700 dark:hover:text-indigo-300'
            }
            ${onSelect ? 'cursor-pointer' : 'cursor-default'}
          `}
        >
          {tag}
        </motion.button>
      ))}
    </div>
  );
}