// src/components/TagCloud.jsx
import React from 'react';

export default function TagCloud({ tags = [], onSelect }) {
  return (
    <div className="flex flex-wrap gap-3">
      {tags.map(tag => (
        <button key={tag} onClick={() => onSelect(tag)} className="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-indigo-100">
          {tag}
        </button>
      ))}
    </div>
  );
}
