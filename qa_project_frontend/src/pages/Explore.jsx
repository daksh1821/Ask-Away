// src/pages/Explore.jsx
import React, { useEffect, useState } from 'react';
import api from '../api';
import TagCloud from '../components/TagCloud';
import QuestionCard from '../components/QuestionCard';

export default function Explore() {
  const [tags, setTags] = useState([]);
  const [selected, setSelected] = useState(null);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    // You can implement endpoint to return tag list, for now derive from questions
    const fetchAll = async () => {
      try {
        const res = await api.get('/questions');
        const qs = res.data || [];
        setQuestions(qs);
        // build tag set
        const tagSet = new Set();
        qs.forEach(q => (q.tags || '').split(',').map(t => t.trim()).filter(Boolean).forEach(t => tagSet.add(t)));
        setTags(Array.from(tagSet).slice(0, 50));
      } catch (err) {
        console.error(err);
      }
    };
    fetchAll();
  }, []);

  const onSelectTag = async (tag) => {
    setSelected(tag);
    try {
      // call your search endpoint or filter locally
      const res = await api.get('/questions/search', { params: { q: tag } });
      setQuestions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Explore by tag</h1>
      <TagCloud tags={tags} onSelect={onSelectTag} />
      <div className="mt-8">
        <h2 className="text-xl mb-4">Results {selected && <>for <strong>{selected}</strong></>}</h2>
        {questions.length === 0 ? (
          <p className="text-gray-500">No questions yet.</p>
        ) : (
          questions.map(q => <QuestionCard q={q} key={q.id} />)
        )}
      </div>
    </div>
  );
}
