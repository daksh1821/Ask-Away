import React, {
  useEffect,
  useState,
  useContext,
  useRef,
  useCallback,
} from 'react';
import api from '../api';
import QuestionCard from '../components/QuestionCard';
import { AuthContext } from '../context/AuthContext';

export default function Home() {
  const [questions, setQuestions] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loader = useRef(null);
  const { user } = useContext(AuthContext);

  const loadQuestions = useCallback(async () => {
    try {
      const res = await api.get('/questions', {
        params: { skip: page * 10, limit: 10 },
      });
      if (res.data.length === 0) {
        setHasMore(false);
      } else {
        setQuestions((prev) => [...prev, ...res.data]);
      }
    } catch (err) {
      console.error(err);
    }
  }, [page]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    if (!loader.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1 }
    );
    observer.observe(loader.current);
    return () => observer.disconnect();
  }, [hasMore]);

  return (
    <div className="container mx-auto px-6 py-12 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <h1 className="text-4xl text-center font-extrabold mb-8">
        Latest Questions
      </h1>
      <div>
        {questions.map((q) => (
          <QuestionCard key={q.id} q={q} />
        ))}
        {hasMore && (
          <div
            ref={loader}
            className="text-center py-4 text-gray-500 dark:text-gray-400 transition-colors duration-300"
          >
            Loading more...
          </div>
        )}
      </div>
    </div>
  );
}
