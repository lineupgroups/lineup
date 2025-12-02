import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, TrendingUp, Clock, Users, ChevronLeft, ChevronRight, Rocket } from 'lucide-react';
import { useFeaturedProjects, useRecentActiveProjects, useProjectsByCategory, useProjectSearch } from '../hooks/useProjects';
import { FirestoreProject } from '../types/firestore';
import { convertTimestamp, getProjectProgress, getDaysLeft } from '../lib/firestore';
import { LikeButton } from './interactions/LikeButton';
import { ShareButton } from './interactions/ShareButton';
import { InteractionStats } from './interactions/InteractionStats';
import { CreatorInfo } from './common/CreatorInfo';
import { sanitizeText } from '../utils/sanitize';
import { PROJECT_CATEGORIES } from '../config/categories';

export default function HomepageRouter() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'All');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sortBy, setSortBy] = useState<'trending' | 'newest'>((searchParams.get('sort') as 'trending' | 'newest') || 'trending');

  // Sync URL params with state
  useEffect(() => {
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') as 'trending' | 'newest';

    // Handle category changes from URL
    if (category) {
      setSelectedCategory(category);
    } else {
      // If no category in URL, it means "All"
      setSelectedCategory('All');
    }
    
    if (search && search !== searchQuery) {
      setSearchQuery(search);
    }
    if (sort && sort !== sortBy) {
      setSortBy(sort);
    }
  }, [searchParams, searchQuery, sortBy]);

  // Update URL when state changes
  const updateUrlParams = (newCategory?: string, newSearch?: string, newSort?: 'trending' | 'newest') => {
    const params = new URLSearchParams(searchParams);
    
    if (newCategory !== undefined) {
      if (newCategory === 'All') {
        params.delete('category');
      } else {
        params.set('category', newCategory);
      }
    }
    
    if (newSearch !== undefined) {
      if (newSearch.trim() === '') {
        params.delete('search');
      } else {
        params.set('search', newSearch);
      }
    }
    
    if (newSort !== undefined) {
      params.set('sort', newSort);
    }
    
    setSearchParams(params, { replace: true });
  };

  const categories = PROJECT_CATEGORIES;
  
  // Fetch data from Firestore
  const { projects: featuredProjects, loading: featuredLoading, error: featuredError } = useFeaturedProjects();
  const { projects: recentActiveProjects, loading: recentLoading, error: recentError } = useRecentActiveProjects();
  const { projects: categoryProjects, loading: categoryLoading, error: categoryError } = useProjectsByCategory(
    selectedCategory === 'All' ? '' : selectedCategory
  );
  const { projects: searchResults, loading: searchLoading, error: searchError } = useProjectSearch(searchQuery);

  // Check for any errors
  const hasError = featuredError || recentError || categoryError || searchError;

  const handleProjectClick = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  const handleStartJourney = () => {
    navigate('/dashboard');
  };

  const handleSearch = (query: string) => {
    const sanitizedQuery = sanitizeText(query).slice(0, 100);
    setSearchQuery(sanitizedQuery);
    updateUrlParams(undefined, sanitizedQuery);
  };

  const handleCategoryChange = (category: string) => {
    // First update the state directly to ensure immediate UI feedback
    setSelectedCategory(category);
    
    // Then update URL params
    updateUrlParams(category);
  };

  const handleSortChange = (sort: 'trending' | 'newest') => {
    setSortBy(sort);
    updateUrlParams(undefined, undefined, sort);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Carousel navigation functions
  const nextSlide = () => {
    if (featuredProjects.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % featuredProjects.length);
  };

  const prevSlide = () => {
    if (featuredProjects.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + featuredProjects.length) % featuredProjects.length);
  };

  // Get projects to display based on search and category
  const getDisplayProjects = () => {
    let projects: FirestoreProject[] = [];
    
    if (searchQuery) {
      // If search query exists, use search results
      projects = searchResults;
    } else if (selectedCategory === 'All') {
      // For 'All' category, use recent active projects
      projects = recentActiveProjects;
    } else {
      // For specific categories, use category projects
      projects = categoryProjects;
    }
    
    // Sort projects
    if (sortBy === 'trending') {
      projects = [...projects].sort((a, b) => {
        const aScore = (a.likeCount || 0) + (a.supporters || 0) * 2;
        const bScore = (b.likeCount || 0) + (b.supporters || 0) * 2;
        return bScore - aScore;
      });
    } else {
      projects = [...projects].sort((a, b) => {
        const aDate = convertTimestamp(a.createdAt);
        const bDate = convertTimestamp(b.createdAt);
        return bDate.getTime() - aDate.getTime();
      });
    }
    
    return projects;
  };

  const displayProjects = getDisplayProjects();
  const isLoading = featuredLoading || recentLoading || categoryLoading || searchLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Browse Projects - Lineup</title>
        <meta name="description" content="Discover innovative projects and support creators bringing amazing ideas to life." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
            Discover Amazing Projects
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Browse innovative projects from creators around the world. Find something you love and help bring it to life.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-6 sm:mb-12">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search for projects, creators, or categories..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 sm:py-4 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base sm:text-lg shadow-sm"
            />
          </div>
        </div>

        {/* Error State */}
        {hasError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h3>
              <p className="text-red-600 mb-4">We're having trouble loading projects. Please try again.</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )}

        {/* Featured Projects Carousel */}
        {!searchQuery && featuredProjects.length > 0 && (
          <section className="mb-8 sm:mb-16" role="region" aria-label="Featured projects">
            <div className="flex items-center justify-between mb-4 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Featured Projects</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={prevSlide}
                  className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-orange-500"
                  aria-label="Previous featured project"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={nextSlide}
                  className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-orange-500"
                  aria-label="Next featured project"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden">
              {featuredProjects.map((project, index) => (
                <div
                  key={project.id}
                  className={`${index === currentSlide ? 'block' : 'hidden'}`}
                  role="tabpanel"
                  aria-hidden={index !== currentSlide}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 p-4 sm:p-8">
                    <div>
                      <img
                        src={project.image}
                        alt={project.title}
                        className="w-full h-48 sm:h-64 lg:h-80 object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60';
                        }}
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className="mb-4">
                        <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                          {project.category}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">{project.title}</h3>
                      <p className="text-gray-600 mb-4 sm:mb-6 text-base sm:text-lg">{project.tagline}</p>
                      
                      <div className="mb-6">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>{formatCurrency(project.raised)}</span>
                          <span>{getProjectProgress(project).toFixed(0)}% funded</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(getProjectProgress(project), 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <CreatorInfo creatorId={project.creatorId || project.createdBy} />
                        </div>
                        <InteractionStats projectId={project.id} />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                        <button
                          onClick={() => handleProjectClick(project.id)}
                          className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 text-sm sm:text-base"
                        >
                          View Project
                        </button>
                        <div className="flex justify-center space-x-2">
                          <LikeButton projectId={project.id} />
                          <ShareButton 
                          projectId={project.id}
                          projectTitle={project.title}
                          projectDescription={project.tagline}
                        />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Carousel Indicators */}
            <div className="flex justify-center mt-6 space-x-2" role="tablist" aria-label="Featured projects navigation">
              {featuredProjects.map((_, index) => (
                <button
                  key={index}
                  role="tab"
                  aria-selected={index === currentSlide}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    index === currentSlide ? 'bg-orange-500' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to featured project ${index + 1}`}
                />
              ))}
            </div>
          </section>
        )}

        {/* Category Filter & Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-3 sm:space-y-0">
          {/* Categories */}
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start" role="group" aria-label="Project categories">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  selectedCategory === category
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-orange-50 hover:border-orange-300'
                }`}
                aria-pressed={selectedCategory === category}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Sort Options */}
          <div className="flex items-center justify-center sm:justify-start space-x-2" role="group" aria-label="Sort options">
            <span className="text-xs sm:text-sm text-gray-600">Sort by:</span>
            <button
              onClick={() => handleSortChange('trending')}
              className={`flex items-center space-x-1 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                sortBy === 'trending'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-700 hover:bg-orange-50'
              }`}
              aria-pressed={sortBy === 'trending'}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Trending</span>
            </button>
            <button
              onClick={() => handleSortChange('newest')}
              className={`flex items-center space-x-1 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                sortBy === 'newest'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-700 hover:bg-orange-50'
              }`}
              aria-pressed={sortBy === 'newest'}
            >
              <Clock className="w-4 h-4" />
              <span>Newest</span>
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        <section aria-label="Project listings">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-4 sm:p-6 animate-pulse">
                  <div className="w-full h-40 sm:h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : displayProjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {displayProjects.map((project) => (
                <div key={project.id} className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden group">
                  <div className="relative">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=60';
                      }}
                    />
                    <div className="absolute top-4 left-4">
                      <span className="inline-block px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full text-sm font-medium">
                        {project.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 line-clamp-2">{project.tagline}</p>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>{formatCurrency(project.raised)}</span>
                        <span>{getProjectProgress(project).toFixed(0)}% funded</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(getProjectProgress(project), 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{project.supporters} supporters</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{getDaysLeft(project.endDate)} days left</span>
                      </div>
                    </div>

                    {/* Creator */}
                    <div className="flex items-center justify-between mb-4">
                      <CreatorInfo creatorId={project.creatorId || project.createdBy} />
                      <InteractionStats projectId={project.id} />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleProjectClick(project.id)}
                        className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 sm:px-4 rounded-lg font-medium hover:bg-orange-100 hover:text-orange-600 transition-colors text-xs sm:text-sm"
                      >
                        View Project
                      </button>
                      <LikeButton projectId={project.id} />
                      <ShareButton 
                        projectId={project.id}
                        projectTitle={project.title}
                        projectDescription={project.tagline}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery ? 'No projects found' : 'No projects in this category'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? `We couldn't find any projects matching "${searchQuery}". Try different keywords.`
                  : 'There are no projects in this category yet. Check back later!'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => handleSearch('')}
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="mt-12 sm:mt-20 text-center bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 sm:p-12 text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Have an Amazing Idea?</h2>
          <p className="text-base sm:text-xl text-orange-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Join thousands of creators who have brought their ideas to life with the support of our community.
          </p>
          <button
            onClick={handleStartJourney}
            className="inline-flex items-center space-x-2 bg-white text-orange-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm sm:text-base"
          >
            <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Start Your Project</span>
          </button>
        </section>
      </div>
    </div>
  );
}
