// src/pages/Landing.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl font-extrabold mb-6">EVERYTHING YOU WANT TO KNOW IS HERE</h1>
        <p className="text-gray-600 mb-12">Look up • Ask up • Answer it</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-8 rounded shadow text-left">
            <h3 className="text-xl font-semibold mb-2">Look up</h3>
            <p className="text-gray-500">Search solved questions and quick answers.</p>
          </div>
          <div className="bg-white p-8 rounded shadow text-left">
            <h3 className="text-xl font-semibold mb-2">Ask up</h3>
            <p className="text-gray-500">Post questions and get help from the community.</p>
          </div>
          <div className="bg-white p-8 rounded shadow text-left">
            <h3 className="text-xl font-semibold mb-2">Answer it</h3>
            <p className="text-gray-500">Share your knowledge and earn reputation.</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="flex border rounded overflow-hidden shadow-sm">
            <input placeholder="Search what you are looking for..." className="flex-1 px-4 py-3" />
            <Link to="/explore" className="bg-indigo-600 px-6 text-white flex items-center">Explore</Link>
          </div>
        </div>

        <div className="mt-12">
          <Link to="/register" className="inline-block bg-indigo-600 text-white px-6 py-3 rounded mr-4">Get started — Register</Link>
          <Link to="/login" className="inline-block text-indigo-600 border border-indigo-600 px-6 py-3 rounded">Login</Link>
        </div>
      </div>
    </div>
  );
}
