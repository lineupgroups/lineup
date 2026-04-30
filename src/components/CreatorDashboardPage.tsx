import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import CreatorDashboard from './CreatorDashboard';

export default function CreatorDashboardPage() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-brand-black text-brand-white font-sans">
      <Helmet>
        <title>Creator Dashboard - Lineup</title>
        <meta name="description" content="Manage your projects, track supporters, and grow your creator journey." />
      </Helmet>

      <CreatorDashboard
        onBack={handleBack}
      />
    </div>
  );
}
