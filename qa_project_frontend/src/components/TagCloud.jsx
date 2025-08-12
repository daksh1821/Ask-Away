import React from 'react';

export default function TagCloud({ tags = [], onSelect }) {
  return (
    <div className="flex flex-wrap gap-3">
      {tags.map(tag => (
        <button
          key={tag}
          onClick={() => onSelect(tag)}
          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-sm hover:bg-indigo-100 dark:hover:bg-indigo-600 transition-colors duration-200"
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
