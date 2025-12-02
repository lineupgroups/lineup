import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './common/LoadingSpinner';

export default function MyProfilePage() {
  const { user, loading } = useAuth();

  // Show loading while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If not logged in, redirect to home
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Redirect to user's profile with their userId
  return <Navigate to={`/profile/${user.uid}`} replace />;
}
