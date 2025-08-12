// src/pages/Home.jsx
import React, { useEffect, useState, useContext } from 'react';
import api from '../api';
import QuestionCard from '../components/QuestionCard';
import { AuthContext } from '../context/AuthContext';

export default function Home() {
  const [questions, setQuestions] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    let isMounted = true;
    const fetchQuestions = async () => {
      try {
        const res = await api.get('/questions'); // proxy will rewrite to backend
        if (isMounted) setQuestions(res.data);
      } catch (err) {
        console.error('Failed to load questions', err);
      }
    };
    fetchQuestions();
    return () => { isMounted = false; };
  }, []);

  // For newcomers show short hero (we'll rely on routing to Landing for not logged-in users)
  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl text-center font-extrabold mb-8">Latest Questions</h1>
      <div>
        {questions.map(q => <QuestionCard key={q.id} q={q} />)}
      </div>
    </div>
  );
}
