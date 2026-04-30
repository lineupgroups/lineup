import React, { useState } from 'react';
import { TrendingUp, Clock, Users, Filter, Sparkles } from 'lucide-react';
import { useFeaturedProjects, useRecentActiveProjects } from '../../hooks/useProjects';
import { FirestoreProject } from '../../types/firestore';
import { getProjectProgress, getDaysLeft } from '../../lib/firestore';
import EnhancedProjectCard from '../homepage/EnhancedProjectCard';
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

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="bg-[#111] border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-white flex items-center tracking-tight mb-2">
                <div className="p-3 bg-brand-orange/10 rounded-2xl mr-4 border border-brand-orange/20">
                    <TrendingUp className="w-8 h-8 text-brand-orange" />
                </div>
                Trending Projects
              </h1>
              <p className="text-base sm:text-lg text-neutral-400 font-medium">Discover the most popular and fastest-growing projects</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-[#111]/80 backdrop-blur-md rounded-2xl border border-neutral-800 p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col gap-6">
            {/* Time Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-neutral-500" />
                <span className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Trending in:</span>
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
                    className={`px-4 py-2 rounded-3xl text-sm font-bold transition-all duration-300 border ${timeFilter === filter.id
                        ? 'bg-brand-acid text-brand-black border-brand-acid shadow-[0_0_15px_rgba(204,255,0,0.2)]'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800 hover:text-brand-white hover:border-neutral-700'
                      }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={`px-4 py-2 rounded-3xl text-sm font-bold transition-all duration-300 border ${categoryFilter === category
                      ? 'bg-brand-orange text-brand-white border-brand-orange shadow-[0_0_15px_rgba(255,91,0,0.2)]'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800 hover:text-brand-white hover:border-neutral-700'
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-20">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-brand-white tracking-wide">
            {categoryFilter === 'All' ? 'All Categories' : categoryFilter} 
            <span className="text-neutral-500 mx-3">•</span> 
            <span className="text-brand-acid">{timeFilter === 'all' ? 'All Time' : timeFilter === 'day' ? 'Today' : timeFilter === 'week' ? 'This Week' : 'This Month'}</span>
          </h2>
          <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">{trendingProjects.length} trending projects</p>
        </div>

        {/* Error State */}
        {hasError && !isLoading && (
          <div className="text-center py-16 bg-neutral-900/50 rounded-3xl border border-red-900/50">
            <div className="text-red-500 text-6xl mb-6">⚠️</div>
            <h3 className="text-2xl font-bold text-brand-white mb-3">Failed to load trending projects</h3>
            <p className="text-neutral-400 font-medium mb-8 max-w-md mx-auto">{featuredError || recentError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-red-500/100/10 text-red-500 border border-red-500/50 rounded-3xl font-bold hover:bg-red-500/100 hover:text-white transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        )}

        {isLoading && !hasError && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-neutral-900 rounded-2xl h-[400px] animate-pulse border border-neutral-800" />
            ))}
          </div>
        )}

        {!isLoading && !hasError && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingProjects.map((project, index) => (
              <div key={project.id} className="relative group/card">
                {/* Trending Badge */}
                {index < 3 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-transform duration-300 group-hover/card:-translate-y-1">
                    <div className="flex items-center space-x-1.5 bg-brand-orange text-brand-white px-4 py-1.5 rounded-full text-xs font-bold shadow-[0_4px_20px_rgba(255,91,0,0.4)] border border-[#ff7b33]">
                      <Sparkles className="w-3.5 h-3.5 text-brand-white animate-pulse" />
                      <span>#{index + 1} Trending</span>
                    </div>
                  </div>
                )}
                
                <EnhancedProjectCard project={project} />
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && trendingProjects.length === 0 && (
          <div className="text-center py-24 bg-neutral-900/30 rounded-3xl border border-neutral-800">
            <div className="w-24 h-24 bg-neutral-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-12 h-12 text-neutral-500" />
            </div>
            <h3 className="text-2xl font-bold text-brand-white mb-3 tracking-tight">No trending projects found</h3>
            <p className="text-neutral-400 font-medium mb-8 max-w-md mx-auto">Try adjusting your filters or check back later for new trending ideas.</p>
            <button
              onClick={() => {
                setTimeFilter('week');
                setCategoryFilter('All');
              }}
              className="px-8 py-3 bg-brand-acid text-brand-black rounded-3xl font-bold hover:bg-[#b3e600] transition-all duration-300 shadow-[0_0_15px_rgba(204,255,0,0.2)]"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}











