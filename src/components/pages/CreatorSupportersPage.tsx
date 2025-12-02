import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectsByCreator } from '../../hooks/useProjects';
import SupportersList from '../creator/SupportersList';
import LoadingSpinner from '../common/LoadingSpinner';

export default function CreatorSupportersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { projects, loading } = useProjectsByCreator(user?.uid || '');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Supporters</h1>
                <p className="text-sm text-gray-500">View and manage your project backers</p>
              </div>
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search supporters..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Projects</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Supporters List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {selectedProjectId === 'all' ? (
            <div className="space-y-8">
              {projects.map(project => (
                <div key={project.id} className="border-b border-gray-100 last:border-0 pb-8 last:pb-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-2 h-8 bg-orange-500 rounded-r-full mr-3"></span>
                    {project.title}
                  </h3>
                  <SupportersList projectId={project.id} limit={5} showTitle={false} />
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setSelectedProjectId(project.id)}
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      View All Supporters for this Project
                    </button>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">You haven't created any projects yet.</p>
                </div>
              )}
            </div>
          ) : (
            <SupportersList projectId={selectedProjectId} limit={50} />
          )}
        </div>
      </div>
    </div>
  );
}
