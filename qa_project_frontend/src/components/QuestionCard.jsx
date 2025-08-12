import React from 'react';
import { Link } from 'react-router-dom';
import md5 from 'md5';

export default function QuestionCard({ q }) {
  const preview = q.content?.slice(0, 120) + (q.content?.length > 120 ? '...' : '');
  const tags = (q.tags || '').split(',').map(t => t.trim()).filter(Boolean);
  const gravatarUrl = q.user_email
    ? `https://www.gravatar.com/avatar/${md5(q.user_email.trim().toLowerCase())}?d=identicon`
    : `https://www.gravatar.com/avatar/?d=identicon`;
  const rep = q.reputation || 0;

  return (
    <article className="bg-white dark:bg-gray-800 shadow rounded p-6 mb-6 transition-colors duration-300">
      <Link to={`/question/${q.id}`}>
        <h3 className="text-2xl text-indigo-600 dark:text-indigo-400 font-semibold mb-2">{q.title}</h3>
      </Link>
      <p className="text-gray-600 dark:text-gray-300 mb-4">{preview}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={gravatarUrl} alt="avatar" className="w-8 h-8 rounded-full" />
          <span className="text-sm text-gray-700 dark:text-gray-200">{q.username || 'User'}</span>
          <span className="bg-yellow-200 text-yellow-800 dark:bg-yellow-300 dark:text-yellow-900 text-xs px-2 py-1 rounded-full">
            ⭐ {rep}
          </span>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {tags.map(tag => (
            <span
              key={tag}
              className="px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-700 dark:text-indigo-100 rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
