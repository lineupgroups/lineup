import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowRight, Users, Heart } from 'lucide-react';
import { usePopularProjects } from '../../hooks/usePopularProjects';
import LoadingSpinner from '../common/LoadingSpinner';

export default function PopularSection() {
  const { projects: popularProjects, loading, error } = usePopularProjects();

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Most Popular</h2>
            <p className="text-xl text-gray-600">Projects loved by our community</p>
          </div>
          <div className="flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </section>
    );
  }

  if (error || !popularProjects.length) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
            <Star className="w-4 h-4" />
            <span>Community Favorites</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Most Popular Projects</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover projects that have captured the hearts of our community
          </p>
        </div>

        {/* Popular Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {popularProjects.slice(0, 4).map((project, index) => (
            <div key={project.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group border border-gray-100">
              {/* Popular Badge */}
              {index === 0 && (
                <div className="absolute top-4 left-4 z-10">
                  <div className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm font-medium">
                    <Star className="w-3 h-3" />
                    <span>Most Popular</span>
                  </div>
                </div>
              )}

              {/* Project Image */}
              <div className="relative h-40 overflow-hidden">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    // Generate a unique pattern based on project title
                    const hash = project.title.split('').reduce((a, b) => {
                      a = ((a << 5) - a) + b.charCodeAt(0);
                      return a & a;
                    }, 0);
                    const colors = ['6366f1', 'f59e0b', 'ef4444', '10b981', '8b5cf6', 'f97316'];
                    const color = colors[Math.abs(hash) % colors.length];
                    const encodedTitle = encodeURIComponent(project.title);
                    target.src = `https://ui-avatars.com/api/?name=${encodedTitle}&background=${color}&color=fff&size=400&format=png`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              </div>

              {/* Project Content */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {project.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {project.tagline}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{project.supporters}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span>{project.likeCount || 0}</span>
                  </div>
                </div>

                {/* Raised Amount */}
                <div className="text-center mb-3">
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(project.raised)}</div>
                  <div className="text-xs text-gray-500">raised</div>
                </div>

                {/* View Button */}
                <Link
                  to={`/project/${project.id}`}
                  className="w-full flex items-center justify-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                >
                  <span>View</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link
            to="/browse?sort=popular"
            className="inline-flex items-center space-x-2 px-6 py-3 border-2 border-blue-500 text-blue-600 rounded-lg font-semibold hover:bg-blue-500 hover:text-white transition-colors"
          >
            <span>View All Popular Projects</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
