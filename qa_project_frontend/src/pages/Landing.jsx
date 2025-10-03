import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Landing() {
  const features = [
    { title: 'Look up', desc: 'Search solved questions and quick answers.' },
    { title: 'Ask up', desc: 'Post questions and get help from the community.' },
    { title: 'Answer it', desc: 'Share your knowledge and earn reputation.' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-6 py-20 text-center text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <h1 className="text-4xl font-extrabold mb-6">
          EVERYTHING YOU WANT TO KNOW IS HERE
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-12">
          Look up • Ask up • Answer it
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              whileHover={{ scale: 1.05 }}
              className="bg-white dark:bg-gray-800 p-8 rounded shadow text-left transition-colors duration-300"
            >
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-500 dark:text-gray-300">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="flex border border-gray-300 dark:border-gray-600 rounded overflow-hidden shadow-sm transition-colors duration-300">
            <input
              placeholder="Search what you are looking for..."
              className="flex-1 px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
            />
            <Link
              to="/explore"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 flex items-center transition-colors duration-300"
            >
              Explore
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col md:flex-row justify-center gap-4">
          <Link
            to="/register"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded transition-colors duration-300"
          >
            Get started — Register
          </Link>
          <Link
            to="/login"
            className="text-indigo-600 dark:text-indigo-400 border border-indigo-600 dark:border-indigo-400 px-6 py-3 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-colors duration-300"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
