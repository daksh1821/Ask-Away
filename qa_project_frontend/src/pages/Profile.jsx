import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import md5 from "md5";
import { motion } from "framer-motion";
import { FaPencilAlt } from "react-icons/fa";
import api from "../api";

export default function Profile() {
  const { user, logout } = useContext(AuthContext);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(user || {});

  if (!user) return <div className="p-8 text-center">Loading profile...</div>;

  const gravatarUrl = user.email
    ? `https://www.gravatar.com/avatar/${md5(user.email.trim().toLowerCase())}?d=identicon`
    : `https://www.gravatar.com/avatar/?d=identicon`;

  const handleSave = async () => {
    try {
      await api.put("/users/me", formData, {
        headers: { "Content-Type": "application/json" },
      });
      window.location.reload();
    } catch (err) {
      console.error("Update failed", err);
    }
    setEditing(false);
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <motion.div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl shadow-lg p-8 relative transition-colors duration-300">
          {/* Edit Icon */}
          <button
            className="absolute top-4 right-4 text-gray-500 dark:text-gray-300 hover:text-indigo-500 transition-colors duration-300"
            onClick={() => setEditing(!editing)}
          >
            <FaPencilAlt size={18} />
          </button>

          {/* Avatar */}
          <div className="flex flex-col items-center">
            <img
              src={gravatarUrl}
              alt="avatar"
              className="w-28 h-28 rounded-full border-4 border-indigo-500 shadow-md"
            />
            <h2 className="mt-4 text-xl font-bold text-gray-800 dark:text-gray-100">
              {user.first_name} {user.last_name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
            <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>

          {/* Reputation Badge */}
          <div className="mt-4 flex justify-center">
            <span className="bg-yellow-200 dark:bg-yellow-300 text-yellow-800 text-sm px-3 py-1 rounded-full font-semibold shadow transition-colors duration-300">
              ⭐ {user.reputation || 0} Reputation
            </span>
          </div>

          {/* Stats Grid */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center transition-colors duration-300">
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {user.questions_count || 0}
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Questions Asked</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center transition-colors duration-300">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {user.answers_count || 0}
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Answers Given</p>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="mt-8 space-y-4">
            {[
              { label: "Interests", name: "interests" },
              { label: "Work Area", name: "work_area" },
              { label: "Location", name: "location" },
              { label: "Website", name: "website" },
              { label: "Bio", name: "bio" },
            ].map((field) => (
              <div key={field.name}>
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-1">
                  {field.label}
                </h3>
                {editing ? (
                  field.name === "bio" ? (
                    <textarea
                      name={field.name}
                      value={formData[field.name] || ""}
                      onChange={handleChange}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
                    />
                  ) : (
                    <input
                      name={field.name}
                      value={formData[field.name] || ""}
                      onChange={handleChange}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
                    />
                  )
                ) : (
                  <p className="bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-lg shadow-sm transition-colors duration-300">
                    {user[field.name] || "Not specified"}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Save Button */}
          {editing && (
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded transition-colors duration-300"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
