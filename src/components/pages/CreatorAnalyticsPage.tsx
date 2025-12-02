import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectsByCreator } from '../../hooks/useProjects';
import AnalyticsDashboard from '../creator/AnalyticsDashboard';
import LoadingSpinner from '../common/LoadingSpinner';

export default function CreatorAnalyticsPage() {
  const { user } = useAuth();
  const { projects: userProjects, loading } = useProjectsByCreator(user?.uid || '');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">
            Track your project performance and audience insights
          </p>
        </div>

        {/* Project Selector */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Project
          </label>
          <select
            value={selectedProjectId || ''}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full md:w-96 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="">Choose a project to view analytics</option>
            {userProjects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>

        {/* Analytics Content */}
        {selectedProjectId ? (
          <AnalyticsDashboard projectId={selectedProjectId} />
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Select a project to view analytics
            </h3>
            <p className="text-gray-600">
              Choose a project from the dropdown above to see detailed performance metrics,
              geographic data, and engagement statistics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
