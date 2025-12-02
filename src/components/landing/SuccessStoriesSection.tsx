import React, { useState } from 'react';
import { TrendingUp, Users, MapPin, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useSuccessStories } from '../../hooks/useLandingPage';
import { useNavigate } from 'react-router-dom';

export default function SuccessStoriesSection() {
  const { stories, loading } = useSuccessStories(true); // Get featured stories
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  if (!stories || stories.length === 0) {
    return null; // Don't show section if no stories
  }

  const currentStory = stories[currentIndex];
  const progress = ((currentStory.amountRaised / currentStory.goal) * 100).toFixed(0);

  const nextStory = () => {
    setCurrentIndex((prev) => (prev + 1) % stories.length);
  };

  const prevStory = () => {
    setCurrentIndex((prev) => (prev - 1 + stories.length) % stories.length);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleViewProject = () => {
    if (currentStory.projectId) {
      navigate(`/project/${currentStory.projectId}`);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <TrendingUp className="w-4 h-4" />
            SUCCESS STORIES
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Dreams That Became Reality
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Real stories from creators across India who turned their ideas into successful projects
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Image Side */}
              <div className="relative h-96 md:h-auto">
                <img
                  src={currentStory.image}
                  alt={currentStory.projectTitle}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full">
                  <span className="text-sm font-semibold text-green-600">
                    {progress}% Funded
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-lg">
                  {formatCurrency(currentStory.amountRaised)} Raised
                </div>
              </div>

              {/* Content Side */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                {/* Category & Location */}
                <div className="flex items-center gap-4 mb-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    {currentStory.category}
                  </span>
                  <div className="flex items-center text-gray-600 text-sm">
                    <MapPin className="w-4 h-4 mr-1" />
                    {currentStory.location.city}, {currentStory.location.state}
                  </div>
                </div>

                {/* Title & Subtitle */}
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  {currentStory.title}
                </h3>
                {currentStory.subtitle && (
                  <p className="text-lg text-green-600 font-semibold mb-4">
                    {currentStory.subtitle}
                  </p>
                )}

                {/* Project Title */}
                <p className="text-xl text-gray-700 font-medium mb-4">
                  "{currentStory.projectTitle}"
                </p>

                {/* Excerpt */}
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {currentStory.excerpt}
                </p>

                {/* Creator Info */}
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                  {currentStory.creatorPhoto ? (
                    <img
                      src={currentStory.creatorPhoto}
                      alt={currentStory.creatorName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 font-bold text-lg">
                        {currentStory.creatorName.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{currentStory.creatorName}</p>
                    <p className="text-sm text-gray-600">Project Creator</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(currentStory.amountRaised)}
                    </div>
                    <div className="text-sm text-gray-600">Total Raised</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-1">
                      <Users className="w-5 h-5" />
                      {currentStory.supportersCount}
                    </div>
                    <div className="text-sm text-gray-600">Supporters</div>
                  </div>
                </div>

                {/* CTA Button */}
                {currentStory.projectId && (
                  <button
                    onClick={handleViewProject}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    View Full Story
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          {stories.length > 1 && (
            <>
              <button
                onClick={prevStory}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-100 text-gray-800 p-3 rounded-full shadow-lg transition-all z-10"
                aria-label="Previous story"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextStory}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-100 text-gray-800 p-3 rounded-full shadow-lg transition-all z-10"
                aria-label="Next story"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {stories.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {stories.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'w-8 bg-green-600'
                      : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to story ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Tags/Filters (if stories have tags) */}
        {currentStory.tags && currentStory.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {currentStory.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-white text-gray-700 rounded-full text-sm border border-gray-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

