import { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, TrendingUp, Clock, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFeaturedProjects, useRecentActiveProjects, useProjectsByCategory, useProjectSearch } from '../hooks/useProjects';
import { useCreatorsData } from '../hooks/useCreatorsData';
import { FirestoreProject } from '../types/firestore';
import { convertTimestamp, getProjectProgress, getDaysLeft } from '../lib/firestore';
import { LikeButton } from './interactions/LikeButton';
import { ShareButton } from './interactions/ShareButton';
import { InteractionStats } from './interactions/InteractionStats';
import { CreatorInfo } from './common/CreatorInfo';
import { ProjectImage } from './common/ProjectImage';
import { sanitizeText } from '../utils/sanitize';
import { PROJECT_CATEGORIES } from '../config/categories';

interface HomepageProps {
  onProjectClick: (projectId: string) => void;
  onStartJourney?: () => void;
}

export default function Homepage({ onProjectClick, onStartJourney }: HomepageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sortBy, setSortBy] = useState<'trending' | 'newest'>('trending');

  const categories = PROJECT_CATEGORIES.slice(0, 5); // Show first 5 categories on homepage

  // Fetch data from Firestore
  const { projects: featuredProjects, loading: featuredLoading, error: featuredError } = useFeaturedProjects();
  const { projects: recentActiveProjects, loading: recentLoading, error: recentError } = useRecentActiveProjects();
  const { projects: categoryProjects, loading: categoryLoading, error: categoryError } = useProjectsByCategory(
    selectedCategory === 'All' ? '' : selectedCategory
  );
  const { projects: searchResults, loading: searchLoading, error: searchError } = useProjectSearch(searchQuery);

  // Memoize expensive project sorting and filtering
  const displayProjects = useMemo((): FirestoreProject[] => {
    let projects: FirestoreProject[] = [];

    if (searchQuery.trim()) {
      projects = searchResults;
    } else if (selectedCategory === 'All') {
      // Show featured projects first, fallback to recent active projects
      projects = featuredProjects.length > 0 ? featuredProjects : recentActiveProjects;
    } else {
      projects = categoryProjects;
    }

    // Apply sorting
    return [...projects].sort((a, b) => {
      if (sortBy === 'trending') {
        // Sort by combination of likes, supporters, and funding percentage
        const aScore = (a.likeCount || 0) + (a.supporters * 2) + (getProjectProgress(a) / 100 * 10);
        const bScore = (b.likeCount || 0) + (b.supporters * 2) + (getProjectProgress(b) / 100 * 10);
        return bScore - aScore;
      } else {
        // Sort by creation date (newest first)
        return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
      }
    });
  }, [searchQuery, searchResults, selectedCategory, featuredProjects, recentActiveProjects, categoryProjects, sortBy]);

  // Issue #14: Batch fetch all creator data to avoid N+1 queries
  const creatorIds = useMemo(() => {
    return displayProjects.map(p => p.creatorId).filter(id => id);
  }, [displayProjects]);
  const { creatorsMap, getCreator } = useCreatorsData(creatorIds);

  const isLoading = featuredLoading || recentLoading || categoryLoading || searchLoading;
  const hasError = featuredError || recentError || categoryError || searchError;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getProgressPercentage = (project: FirestoreProject) => {
    return getProjectProgress(project);
  };

  const nextSlide = useCallback(() => {
    if (featuredProjects.length === 0) return;
    setCurrentSlide((prev) => {
      const newIndex = (prev + 1) % featuredProjects.length;
      return newIndex;
    });
  }, [featuredProjects.length]);

  const prevSlide = useCallback(() => {
    if (featuredProjects.length === 0) return;
    setCurrentSlide((prev) => {
      const newIndex = (prev - 1 + featuredProjects.length) % featuredProjects.length;
      return newIndex;
    });
  }, [featuredProjects.length]);

  // Reset slide index when featured projects change
  useEffect(() => {
    if (featuredProjects.length > 0 && currentSlide >= featuredProjects.length) {
      setCurrentSlide(0);
    }
  }, [featuredProjects.length, currentSlide]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              India's Youth.<br />
              India's Ideas.<br />
              <span className="text-yellow-300">India's Future.</span>
            </h1>
            <p className="text-xl md:text-2xl text-orange-100 mb-8 max-w-3xl mx-auto">
              Empowering the next generation of innovators to bring their dreams to life
            </p>
            <button
              onClick={onStartJourney}
              aria-label="Start your crowdfunding journey"
              className="px-8 py-4 bg-white text-orange-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-orange-500"
            >
              Start Your Journey
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 -mt-12 relative z-10">
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for projects, creators, or ideas..."
                value={searchQuery}
                onChange={(e) => {
                  const sanitizedValue = sanitizeText(e.target.value).slice(0, 100); // Limit length
                  setSearchQuery(sanitizedValue);
                }}
                aria-label="Search for projects, creators, or ideas"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Category Filters */}
            <div className="w-full lg:w-auto overflow-x-auto">
              <div className="flex gap-2 pb-2 lg:pb-0 min-w-max lg:min-w-0 lg:flex-wrap" role="group" aria-label="Project categories">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    aria-pressed={selectedCategory === category}
                    aria-label={`Filter by ${category} category`}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 whitespace-nowrap ${selectedCategory === category
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-600'
                      }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex gap-2" role="group" aria-label="Sort options">
              <button
                onClick={() => setSortBy('trending')}
                aria-pressed={sortBy === 'trending'}
                aria-label="Sort by trending projects"
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${sortBy === 'trending'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Trending</span>
              </button>
              <button
                onClick={() => setSortBy('newest')}
                aria-pressed={sortBy === 'newest'}
                aria-label="Sort by newest projects"
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${sortBy === 'newest'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
              >
                <Clock className="w-4 h-4" />
                <span>Newest</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Projects Carousel */}
      {featuredProjects.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured Projects</h2>
          <div className="relative">
            <div className="overflow-hidden rounded-xl">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {featuredProjects.map((project) => (
                  <div key={project.id} className="w-full flex-shrink-0">
                    <div
                      className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform hover:scale-[1.02] transition-all duration-300"
                      onClick={() => onProjectClick(project.id)}
                    >
                      <div className="md:flex">
                        <div className="md:w-1/2">
                          <ProjectImage
                            src={project.image}
                            alt={project.title}
                            fallbackTitle={project.title}
                            className="w-full h-64 md:h-80 object-cover"
                          />
                        </div>
                        <div className="md:w-1/2 p-8">
                          <div className="flex items-center justify-between mb-4">
                            <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-medium">
                              {project.category}
                            </span>
                            <div className="flex items-center space-x-2">
                              <LikeButton projectId={project.id} size="sm" showCount={false} />
                              <ShareButton
                                projectId={project.id}
                                projectTitle={project.title}
                                projectDescription={project.tagline}
                                size="sm"
                              />
                            </div>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h3>
                          <p className="text-gray-600 mb-4">{project.tagline}</p>
                          <p className="text-gray-700 mb-6 leading-relaxed">{project.description}</p>

                          {/* Progress */}
                          <div className="mb-6">
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                              <span>{formatCurrency(project.raised)} raised</span>
                              <span>{getProgressPercentage(project).toFixed(0)}% funded</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${getProgressPercentage(project)}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Users className="w-4 h-4" />
                                <span>{project.supporters} supporters</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{getDaysLeft(project) > 0 ? `${getDaysLeft(project)} days left` : 'Ended'}</span>
                              </div>
                            </div>
                            <button className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105">
                              Support Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Carousel Controls */}
            {featuredProjects.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  disabled={featuredProjects.length <= 1}
                  aria-label={`Previous featured project (${currentSlide + 1} of ${featuredProjects.length})`}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextSlide}
                  disabled={featuredProjects.length <= 1}
                  aria-label={`Next featured project (${currentSlide + 1} of ${featuredProjects.length})`}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Carousel Indicators */}
                <div className="flex justify-center mt-4 space-x-2" role="tablist" aria-label="Featured projects">
                  {featuredProjects.map((project, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      role="tab"
                      aria-selected={currentSlide === index}
                      aria-label={`Go to featured project ${index + 1}: ${project.title}`}
                      className={`w-2 h-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${currentSlide === index ? 'bg-orange-500' : 'bg-gray-300'
                        }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Project Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {selectedCategory === 'All'
              ? (featuredProjects.length > 0 ? 'Featured Projects' : 'Recent Projects')
              : `${selectedCategory} Projects`
            }
          </h2>
          <p className="text-gray-600">{displayProjects.length} projects found</p>
        </div>

        {hasError ? (
          <div className="text-center py-16">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-gray-600 mb-6">We're having trouble loading projects. Please try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-6">
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayProjects.map((project) => (
              <article
                key={project.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1"
                onClick={() => onProjectClick(project.id)}
                role="button"
                tabIndex={0}
                aria-label={`View project: ${project.title}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onProjectClick(project.id);
                  }
                }}
              >
                <div className="relative">
                  <ProjectImage
                    src={project.image}
                    alt={project.title}
                    fallbackTitle={project.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full text-sm font-medium">
                      {project.category}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 flex space-x-2">
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

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{project.title}</h3>
                  <p className="text-gray-600 mb-4 text-sm line-clamp-3">{project.description}</p>

                  {/* Creator Info - Using prefetched data */}
                  <CreatorInfo
                    creatorId={project.creatorId}
                    size="sm"
                    className="mb-4"
                    prefetchedCreator={getCreator(project.creatorId)}
                  />

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>{formatCurrency(project.raised)}</span>
                      <span>{getProgressPercentage(project).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${getProgressPercentage(project)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stats and Action */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{project.supporters}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{getDaysLeft(project) > 0 ? `${getDaysLeft(project)}d` : 'Ended'}</span>
                      </div>
                      <InteractionStats projectId={project.id} size="sm" />
                    </div>
                    <button
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium text-sm hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Support
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && displayProjects.length === 0 && (
          <div className="text-center py-16" role="status" aria-live="polite">
            <div className="text-gray-400 text-6xl mb-4" aria-hidden="true">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              aria-label="Clear all search filters and categories"
              className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}