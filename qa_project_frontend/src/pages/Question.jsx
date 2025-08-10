import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const Question = () => {
  const { id } = useParams();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [newAnswer, setNewAnswer] = useState('');
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    api.get(`/questions/${id}`).then((res) => setQuestion(res.data)).catch(() => setError('Question not found'));
    api.get(`/answers/${id}`).then((res) => setAnswers(res.data));
  }, [id]);

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/answers', { content: newAnswer }, { params: { question_id: id } });
      setAnswers([...answers, response.data]);
      setNewAnswer('');
    } catch (err) {
      setError('Failed to post answer');
    }
  };

  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;
  if (!question) return <div className="text-center py-8">Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">{question.title}</h1>
      <p className="text-gray-600 mb-6">{question.content}</p>
      <div className="flex flex-wrap gap-2 mb-6">
        {question.tags.split(',').map((tag) => (
          <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{tag.trim()}</span>
        ))}
      </div>
      <h2 className="text-2xl font-semibold mb-4">Answers</h2>
      <div className="space-y-6 mb-8">
        {answers.map((ans) => (
          <div key={ans.id} className="bg-white shadow-md rounded-lg p-6">
            <p className="text-gray-600">{ans.content}</p>
            <p className="text-sm text-gray-500 mt-2">Answered by User {ans.user_id} on {new Date(ans.created_at).toLocaleDateString()}</p>
          </div>
        ))}
        {answers.length === 0 && <p className="text-gray-500">No answers yet.</p>}
      </div>
      {user ? (
        <form onSubmit={handleSubmitAnswer}>
          <textarea
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            className="w-full px-3 py-2 border rounded-md h-24 mb-4"
            placeholder="Write your answer..."
            required
          />
          <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">Post Answer</button>
        </form>
      ) : (
        <p className="text-gray-500">Login to post an answer.</p>
      )}
    </div>
  );
};

export default Question;