// src/components/QuestionCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function QuestionCard({ q }) {
  const preview = q.content?.slice(0, 120) + (q.content?.length > 120 ? '...' : '');
  const tags = (q.tags || '').split(',').map(t => t.trim()).filter(Boolean);

  return (
    <article className="bg-white shadow rounded p-6 mb-6">
      <Link to={`/question/${q.id}`} className="text-center block">
        <h3 className="text-2xl text-indigo-600 font-semibold mb-2">{q.title}</h3>
      </Link>
      <p className="text-gray-600 mb-4 text-center">{preview}</p>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {tags.map(tag => (
            <span key={tag} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">{tag}</span>
          ))}
        </div>
        <div className="text-sm text-gray-500">Asked on {new Date(q.created_at).toLocaleDateString()}</div>
      </div>
    </article>
  );
}
