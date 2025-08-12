import React, { useEffect, useState } from 'react';
import api from '../api';
import TagCloud from '../components/TagCloud';
import QuestionCard from '../components/QuestionCard';

export default function Explore() {
  const [tags, setTags] = useState([]);
  const [selected, setSelected] = useState(null);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await api.get('/questions');
        const qs = res.data || [];
        setQuestions(qs);

        const tagSet = new Set();
        qs.forEach(q =>
          (q.tags || '')
            .split(',')
            .map(t => t.trim())
            .filter(Boolean)
            .forEach(t => tagSet.add(t))
        );
        setTags(Array.from(tagSet).slice(0, 50));
      } catch (err) {
        console.error(err);
      }
    };
    fetchAll();
  }, []);

  const onSelectTag = async tag => {
    setSelected(tag);
    try {
      const res = await api.get('/questions/search', { params: { q: tag } });
      setQuestions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <h1 className="text-3xl font-bold mb-6">Explore by tag</h1>
      <TagCloud tags={tags} onSelect={onSelectTag} />
      <div className="mt-8">
        <h2 className="text-xl mb-4">
          Results {selected && <>for <strong>{selected}</strong></>}
        </h2>
        {questions.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 transition-colors duration-300">
            No questions yet.
          </p>
        ) : (
          questions.map(q => <QuestionCard q={q} key={q.id} />)
        )}
      </div>
    </div>
  );
}
