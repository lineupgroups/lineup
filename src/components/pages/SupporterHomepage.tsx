import React, { useState } from 'react';
import { Search, TrendingUp, Clock, Users, ChevronLeft, ChevronRight, Heart, Star, ArrowRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFeaturedProjects, useRecentActiveProjects, useProjectsByCategory } from '../../hooks/useProjects';
import { FirestoreProject } from '../../types/firestore';
import { convertTimestamp, getProjectProgress, getDaysLeft } from '../../lib/firestore';
import { LikeButton } from '../interactions/LikeButton';
import { ShareButton } from '../interactions/ShareButton';
import { InteractionStats } from '../interactions/InteractionStats';
import { CreatorInfo } from '../common/CreatorInfo';
import { useAuth } from '../../contexts/AuthContext';
import { ProjectsNearMeList } from '../home/ProjectsNearMeList';

interface SupporterHomepageProps {
  onProjectClick: (projectId: string) => void;
}

export default function SupporterHomepage({ onProjectClick }: SupporterHomepageProps) {
  const { switchMode } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currentSlide, setCurrentSlide] = useState(0);

  const categories = ['All', 'Tech', 'Education', 'Art', 'Social Impact', 'Health', 'Environment'];

  // Fetch data from Firestore
  const { projects: featuredProjects, loading: featuredLoading } = useFeaturedProjects();
  const { projects: recentActiveProjects, loading: recentLoading } = useRecentActiveProjects();
  const { projects: categoryProjects, loading: categoryLoading } = useProjectsByCategory(
    selectedCategory === 'All' ? '' : selectedCategory
  );

  const displayProjects = selectedCategory === 'All' ? recentActiveProjects : categoryProjects;
  const isLoading = featuredLoading || recentLoading || categoryLoading;

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

  const nextSlide = () => {
    if (featuredProjects.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % featuredProjects.length);
  };

  const prevSlide = () => {
    if (featuredProjects.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + featuredProjects.length) % featuredProjects.length);
  };

  const handleBecomeCreator = async () => {
    await switchMode('creator');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Supporter Focused */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
              Discover Amazing<br />
              <span className="text-yellow-300">Ideas & Projects</span><br />
              Worth Supporting
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
              Join thousands of supporters helping innovative creators bring their dreams to life
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
              <Link
                to="/discover"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-600 rounded-lg font-semibold text-base sm:text-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 text-center"
              >
                Explore Projects
              </Link>
              <button
                onClick={handleBecomeCreator}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border-2 border-white text-white rounded-lg font-semibold text-base sm:text-lg hover:bg-white hover:text-blue-600 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 text-center"
              >
                <span className="hidden sm:inline">Have an idea? Start creating →</span>
                <span className="sm:hidden">Start Creating</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-8 sm:py-16 border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1 sm:mb-2">10,000+</div>
              <div className="text-sm sm:text-base text-gray-600">Projects Funded</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1 sm:mb-2">₹50 Cr+</div>
              <div className="text-sm sm:text-base text-gray-600">Total Raised</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-indigo-600 mb-1 sm:mb-2">1M+</div>
              <div className="text-sm sm:text-base text-gray-600">Happy Supporters</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1 sm:mb-2">95%</div>
              <div className="text-sm sm:text-base text-gray-600">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Projects Carousel */}
      {featuredProjects.length > 0 && (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
          <div className="text-center mb-6 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">Featured Projects</h2>
            <p className="text-base sm:text-xl text-gray-600">Handpicked projects that are making a difference</p>
          </div>

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
                      <div className="sm:flex">
                        <div className="sm:w-1/2">
                          <img
                            src={project.image}
                            alt={project.title}
                            className="w-full h-48 sm:h-64 md:h-80 object-cover"
                          />
                        </div>
                        <div className="sm:w-1/2 p-4 sm:p-8">
                          <div className="flex items-center justify-between mb-4">
                            <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
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
                          <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">{project.title}</h3>
                          <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">{project.tagline}</p>
                          <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6 leading-relaxed line-clamp-3 sm:line-clamp-none">{project.description}</p>

                          {/* Progress */}
                          <div className="mb-4 sm:mb-6">
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                              <span>{formatCurrency(project.raised)} raised</span>
                              <span>{getProgressPercentage(project).toFixed(0)}% funded</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${getProgressPercentage(project)}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                            <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>{project.supporters} supporters</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>{getDaysLeft(project) > 0 ? `${getDaysLeft(project)} days left` : 'Ended'}</span>
                              </div>
                            </div>
                            <button className="px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 text-sm">
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
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-200"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-200"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Carousel Indicators */}
                <div className="flex justify-center mt-4 space-x-2">
                  {featuredProjects.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${currentSlide === index ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Projects Near Me Section */}
      <div className="bg-white py-8 sm:py-16 border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Projects Near You</h2>
              <p className="text-base sm:text-lg text-gray-600 flex items-center">
                <span className="mr-2">Showing projects in</span>
                <span className="font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full flex items-center">
                  Bangalore
                  <button className="ml-2 text-blue-400 hover:text-blue-600">
                    <span className="sr-only">Change location</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </span>
              </p>
            </div>
            <Link
              to="/search?nearMe=true"
              className="hidden sm:flex items-center text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              View all nearby
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>

          <ProjectsNearMeList onProjectClick={onProjectClick} />

          <div className="mt-6 sm:hidden text-center">
            <Link
              to="/search?nearMe=true"
              className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              View all nearby
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>

      {/* Categories & Projects */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        <div className="text-center mb-6 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">Browse by Category</h2>
          <p className="text-base sm:text-xl text-gray-600">Find projects that match your interests</p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${selectedCategory === category
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200'
                }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Project Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {displayProjects.slice(0, 9).map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1"
                onClick={() => onProjectClick(project.id)}
              >
                <div className="relative">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-40 sm:h-48 object-cover"
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
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-2">{project.title}</h3>
                  <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm line-clamp-3">{project.description}</p>

                  {/* Creator Info */}
                  <CreatorInfo
                    creatorId={project.creatorId}
                    size="sm"
                    className="mb-4"
                  />

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>{formatCurrency(project.raised)}</span>
                      <span>{getProgressPercentage(project).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${getProgressPercentage(project)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stats and Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                    <div className="flex items-center space-x-3 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{project.supporters}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{getDaysLeft(project) > 0 ? `${getDaysLeft(project)}d` : 'Ended'}</span>
                      </div>
                    </div>
                    <button
                      className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium text-xs sm:text-sm hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Support
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-6 sm:mt-12">
          <Link
            to="/discover"
            className="inline-flex items-center space-x-2 px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
          >
            <span>View All Projects</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white py-8 sm:py-16">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">How Supporting Works</h2>
            <p className="text-base sm:text-xl text-gray-600">Simple steps to make a difference</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Search className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">1. Discover</h3>
              <p className="text-sm sm:text-base text-gray-600">Browse amazing projects and find ones that inspire you</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">2. Support</h3>
              <p className="text-sm sm:text-base text-gray-600">Choose your support level and help bring ideas to life</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Star className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">3. Celebrate</h3>
              <p className="text-sm sm:text-base text-gray-600">Watch projects succeed and get exclusive updates</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-8 sm:py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">Ready to Make a Difference?</h2>
          <p className="text-base sm:text-xl text-blue-100 mb-6 sm:mb-8">
            Join our community of supporters and help innovative creators bring their ideas to life
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              to="/discover"
              className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 transform hover:scale-105"
            >
              Start Supporting
            </Link>
            <button
              onClick={handleBecomeCreator}
              className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200 transform hover:scale-105"
            >
              Become a Creator
            </button>
          </div>
        </div>
      </div>
    </div >
  );
}
