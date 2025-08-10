import React, { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

const Home = () => {
  console.log('Home component is rendering');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Starting API call to /questions...');
    api.get('/questions')
      .then((res) => {
        console.log('API Response:', res.data);
        setQuestions(res.data);
      })
      .catch((err) => {
        console.error('API Error:', err.response ? err.response.data : err.message);
        setError('Failed to load questions');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;
  if (questions.length === 0 && !loading && !error) return <div className="text-center py-8">No questions available.</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Latest Questions</h1>
      <div className="space-y-6">
        {questions.map((q) => (
          <div key={q.id} className="bg-white shadow-md rounded-lg p-6">
            <Link to={`/question/${q.id}`} className="text-xl font-semibold text-blue-600 hover:underline">{q.title}</Link>
            <p className="text-gray-600 mt-2">{q.content.substring(0, 150)}...</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {q.tags.split(',').map((tag) => (
                <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{tag.trim()}</span>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">Asked on {new Date(q.created_at).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;