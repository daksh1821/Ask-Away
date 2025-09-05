import React, { useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { setAuthToken } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchUserProfile } = useContext(AuthContext);

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/login', { 
          state: { message: 'Authentication failed. Please try again.' }
        });
        return;
      }

      if (token) {
        try {
          setAuthToken(token);
          await fetchUserProfile();
          navigate('/', { replace: true });
        } catch (err) {
          console.error('Token processing failed:', err);
          navigate('/login', { 
            state: { message: 'Authentication failed. Please try again.' }
          });
        }
      } else {
        navigate('/login', { 
          state: { message: 'No authentication token received.' }
        });
      }
    };

    handleCallback();
  }, [searchParams, navigate, fetchUserProfile]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <LoadingSpinner size="xl" text="Completing authentication..." />
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Please wait while we sign you in...
        </p>
      </div>
    </div>
  );
}