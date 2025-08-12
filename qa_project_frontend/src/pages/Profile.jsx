// src/pages/Profile.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Profile() {
  const { user } = useContext(AuthContext);

  if (!user) return <div className="container mx-auto p-8">Login to see your profile.</div>;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <div className="bg-white p-6 rounded shadow">
        <p><strong>Username:</strong> {user.username}</p>
        {user.email && <p><strong>Email:</strong> {user.email}</p>}
        {user.interests && <p><strong>Interests:</strong> {user.interests}</p>}
        {user.work_area && <p><strong>Work area:</strong> {user.work_area}</p>}
      </div>
    </div>
  );
}
