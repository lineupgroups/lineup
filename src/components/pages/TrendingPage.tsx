import React, { useState } from 'react';
import { TrendingUp, Clock, Users, Filter } from 'lucide-react';
import { useFeaturedProjects, useRecentActiveProjects } from '../../hooks/useProjects';
import { FirestoreProject } from '../../types/firestore';
import { getProjectProgress, getDaysLeft } from '../../lib/firestore';
import { LikeButton } from '../interactions/LikeButton';
import { ShareButton } from '../interactions/ShareButton';
import { CreatorInfo } from '../common/CreatorInfo';
import { useNavigate } from 'react-router-dom';
import { PROJECT_CATEGORIES } from '../../config/categories';

export default function TrendingPage() {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month' | 'all'>('week');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const { projects: featuredProjects, loading: featuredLoading, error: featuredError } = useFeaturedProjects();
  const { projects: recentProjects, loading: recentLoading, error: recentError } = useRecentActiveProjects();

  const categories = [...PROJECT_CATEGORIES];

  // Combine and sort projects by trending score
  const allProjects = [...featuredProjects, ...recentProjects];
  const uniqueProjects = allProjects.filter((project, index, self) =>
    index === self.findIndex(p => p.id === project.id)
  );

  // Filter by time period
  const getTimeFilteredProjects = () => {
    const now = Date.now();
    const msPerDay = 1000 * 60 * 60 * 24;

    return uniqueProjects.filter(project => {
      if (timeFilter === 'all') return true;

      // Get project creation date
      let createdDate: Date;
      if (project.createdAt && typeof project.createdAt.toDate === 'function') {
        createdDate = project.createdAt.toDate();
      } else if (project.createdAt instanceof Date) {
        createdDate = project.createdAt;
      } else {
        return true; // Include if can't determine date
      }

      const daysSinceCreated = (now - createdDate.getTime()) / msPerDay;

      if (timeFilter === 'day') return daysSinceCreated <= 1;
      if (timeFilter === 'week') return daysSinceCreated <= 7;
      if (timeFilter === 'month') return daysSinceCreated <= 30;

      return true;
    });
  };

  const trendingProjects = getTimeFilteredProjects()
    .filter(project => categoryFilter === 'All' || project.category === categoryFilter)
    .sort((a, b) => {
      // Calculate trending score based on likes, supporters, and funding progress
      const aScore = (a.likeCount || 0) + (a.supporters * 2) + (getProjectProgress(a) / 100 * 10);
      const bScore = (b.likeCount || 0) + (b.supporters * 2) + (getProjectProgress(b) / 100 * 10);
      return bScore - aScore;
    });

  const isLoading = featuredLoading || recentLoading;
  const hasError = featuredError || recentError;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mr-2 sm:mr-3" />
                Trending Projects
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Discover the most popular and fastest-growing projects</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Time Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-2">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <span className="text-xs sm:text-sm font-medium text-gray-700">Trending in:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'day', label: 'Today' },
                  { id: 'week', label: 'This Week' },
                  { id: 'month', label: 'This Month' },
                  { id: 'all', label: 'All Time' }
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setTimeFilter(filter.id as any)}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${timeFilter === filter.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${categoryFilter === category
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="w-full px-3 sm:px-6 lg:px-8 pb-6 sm:pb-12">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-8 gap-2 sm:gap-0">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
            <span className="block sm:hidden">{categoryFilter === 'All' ? 'All Categories' : categoryFilter}</span>
            <span className="hidden sm:block">{categoryFilter === 'All' ? 'All Categories' : categoryFilter} • {timeFilter === 'all' ? 'All Time' : timeFilter === 'day' ? 'Today' : timeFilter === 'week' ? 'This Week' : 'This Month'}</span>
          </h2>
          <p className="text-sm sm:text-base text-gray-600">{trendingProjects.length} trending projects</p>
        </div>

        {/* Error State */}
        {hasError && !isLoading && (
          <div className="text-center py-16 bg-red-50 rounded-xl border border-red-200">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-red-900 mb-2">Failed to load trending projects</h3>
            <p className="text-red-600 mb-6">{featuredError || recentError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {isLoading && !hasError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                <div className="h-40 sm:h-48 bg-gray-200"></div>
                <div className="p-4 sm:p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-2 bg-gray-200 rounded mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !hasError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {trendingProjects.map((project, index) => (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1 relative"
                onClick={() => handleProjectClick(project.id)}
              >
                {/* Trending Badge */}
                {index < 3 && (
                  <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10">
                    <div className="flex items-center space-x-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-bold">
                      <TrendingUp className="w-2 h-2 sm:w-3 sm:h-3" />
                      <span className="hidden sm:inline">#{index + 1} Trending</span>
                      <span className="sm:hidden">#{index + 1}</span>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-40 sm:h-48 object-cover"
                  />
                  <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
                    <span className="px-2 sm:px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full text-xs sm:text-sm font-medium">
                      {project.category}
                    </span>
                  </div>
                  <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 flex space-x-1 sm:space-x-2">
                    <div
                      className="bg-white/90 backdrop-blur-sm rounded-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <LikeButton projectId={project.id} size="sm" showCount={false} />
                    </div>
                    <div
                      className="bg-white/90 backdrop-blur-sm rounded-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ShareButton
                        projectId={project.id}
                        projectTitle={project.title}
                        projectDescription={project.tagline}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm line-clamp-2">{project.description}</p>

                  {/* Creator Info */}
                  <CreatorInfo
                    creatorId={project.creatorId}
                    size="sm"
                    className="mb-3"
                  />

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-gray-900">{formatCurrency(project.raised)}</span>
                      <span className="text-gray-600">{Math.min(getProjectProgress(project), 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(getProjectProgress(project), 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Raised</span>
                      <span>Goal: {formatCurrency(project.goal || project.fundingGoal || 0)}</span>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{project.supporters || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{getDaysLeft(project.endDate)}d left</span>
                      </div>
                    </div>
                    {project.location && (
                      <div className="flex items-center space-x-1 text-xs">
                        <span>📍</span>
                        <span>{project.location.city || project.location.state}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold text-sm hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/project/${project.id}`);
                    }}
                  >
                    Support This Project
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && trendingProjects.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">📈</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No trending projects found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your filters or check back later</p>
            <button
              onClick={() => {
                setTimeFilter('week');
                setCategoryFilter('All');
              }}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}











