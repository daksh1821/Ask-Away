import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Ask = () => {
  const [formData, setFormData] = useState({ title: '', content: '', tags: '' });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  // DEBUG: print localStorage token and axios defaults
  console.log('localStorage qa_token:', localStorage.getItem('qa_token'));
  console.log('axios headers before post:', api.defaults.headers?.common);

  try {
    // note trailing slash to avoid server redirect
    const response = await api.post('/questions/', formData);
    navigate(`/question/${response.data.id}`);
  } catch (err) {
    console.error('POST /questions error:', err.response || err);
    setError('Failed to post question');
  }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-8">
      <h2 className="text-2xl font-bold mb-6">Ask a Question</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Title</label>
          <input name="title" value={formData.title} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" required />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Content</label>
          <textarea name="content" value={formData.content} onChange={handleChange} className="w-full px-3 py-2 border rounded-md h-32" required />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
          <input name="tags" value={formData.tags} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
        </div>
        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600">Post Question</button>
      </form>
    </div>
  );
};

export default Ask;