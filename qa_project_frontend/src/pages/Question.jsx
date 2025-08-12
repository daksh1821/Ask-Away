import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import { AuthContext } from "../context/AuthContext";
import md5 from "md5";

export default function Question() {
  const { id } = useParams();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [newAnswer, setNewAnswer] = useState("");
  const { user } = useContext(AuthContext);

  useEffect(() => {
    api.get(`/questions/${id}`).then((res) => setQuestion(res.data));
    api.get(`/answers/${id}`).then((res) => setAnswers(res.data));
  }, [id]);

  const postAnswer = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(
        "/answers",
        { content: newAnswer },
        { params: { question_id: id } }
      );
      setAnswers((prev) => [...prev, res.data]);
      setNewAnswer("");
    } catch {
      alert("Failed to post answer");
    }
  };

  if (!question) return <div className="p-8 text-center">Loading...</div>;

  const gravatarUrl = question.user_email
    ? `https://www.gravatar.com/avatar/${md5(
        question.user_email.trim().toLowerCase()
      )}?d=identicon`
    : `https://www.gravatar.com/avatar/?d=identicon`;

  return (
    <div className="container mx-auto px-6 py-12 grid md:grid-cols-3 gap-8">
      {/* Question Section */}
      <div className="md:col-span-2 bg-white p-6 rounded-lg shadow">
        <h1 className="text-3xl font-bold mb-2 text-indigo-700">
          {question.title}
        </h1>
        <p className="text-gray-700 mb-4">{question.content}</p>

        {/* Tags */}
        <div className="flex gap-2 flex-wrap mb-4">
          {(question.tags || "")
            .split(",")
            .filter((t) => t.trim() !== "")
            .map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
              >
                {tag.trim()}
              </span>
            ))}
        </div>

        {/* Author */}
        <div className="flex items-center gap-3 mb-6">
          <img
            src={gravatarUrl}
            alt="avatar"
            className="w-10 h-10 rounded-full"
          />
          <span className="text-gray-700 font-medium">
            {question.first_name} {question.last_name}
          </span>
        </div>

        {/* Answers */}
        <h2 className="text-xl font-semibold mb-4">Answers</h2>
        {answers.length > 0 ? (
          answers.map((a) => {
            const ansAvatar = a.user_email
              ? `https://www.gravatar.com/avatar/${md5(
                  a.user_email.trim().toLowerCase()
                )}?d=identicon`
              : `https://www.gravatar.com/avatar/?d=identicon`;

            return (
              <div key={a.id} className="border-t py-4">
                <p>{a.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  <img
                    src={ansAvatar}
                    alt="avatar"
                    className="w-8 h-8 rounded-full"
                  />
                  <small className="text-gray-500">
                    {a.first_name} {a.last_name} •{" "}
                    {new Date(a.created_at).toLocaleDateString()}
                  </small>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500">No answers yet.</p>
        )}

        {/* Answer Form */}
        {user && (
          <form onSubmit={postAnswer} className="mt-6">
            <textarea
              className="w-full border rounded p-3 mb-3 focus:ring-2 focus:ring-indigo-400"
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="Write your answer..."
              required
            />
            <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition">
              Post Answer
            </button>
          </form>
        )}
      </div>

      {/* Sidebar */}
      <aside className="bg-gray-50 p-4 rounded shadow">
        <h3 className="font-semibold mb-3">About this question</h3>
        <p className="text-sm text-gray-600">
          Asked on {new Date(question.created_at).toLocaleDateString()}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Views: {question.views || 0}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Answers: {answers.length}
        </p>
      </aside>
    </div>
  );
}
