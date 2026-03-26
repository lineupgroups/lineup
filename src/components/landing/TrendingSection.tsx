import { Link } from 'react-router-dom';
import { TrendingUp, ArrowRight, Heart, Users } from 'lucide-react';
import { useTrendingProjects } from '../../hooks/useTrendingProjects';
import LoadingSpinner from '../common/LoadingSpinner';

export default function TrendingSection() {
  const { projects: trendingProjects, loading, error } = useTrendingProjects();

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Trending This Week</h2>
            <p className="text-xl text-gray-600">Discover the hottest projects gaining momentum</p>
          </div>
          <div className="flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </section>
    );
  }

  if (error || !trendingProjects.length) {
    return null; // Hide section if no trending projects
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getProgressPercentage = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100);
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium mb-4">
            <TrendingUp className="w-4 h-4" />
            <span>Hot Right Now</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Trending This Week</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover the hottest projects gaining momentum and community support
          </p>
        </div>

        {/* Trending Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12">
          {trendingProjects.slice(0, 6).map((project, index) => (
            <div key={project.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden group">
              {/* Trending Badge */}
              {index < 3 && (
                <div className="absolute top-4 left-4 z-10">
                  <div className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-sm font-medium">
                    <TrendingUp className="w-3 h-3" />
                    <span>#{index + 1} Trending</span>
                  </div>
                </div>
              )}

              {/* Project Image */}
              <div className="relative h-48 overflow-hidden">
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
                    target.src = `https://ui-avatars.com/api/?name=${encodedTitle}&background=${color}&color=fff&size=800&format=png`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                
                {/* Category Badge */}
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full text-sm font-medium">
                    {project.category}
                  </span>
                </div>
              </div>

              {/* Project Content */}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                  {project.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {project.tagline}
                </p>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{formatCurrency(project.raised)}</span>
                    <span>{getProgressPercentage(project.raised, project.goal).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage(project.raised, project.goal)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{project.supporters} supporters</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4" />
                    <span>{project.likeCount || 0} likes</span>
                  </div>
                </div>

                {/* View Project Button */}
                <Link
                  to={`/project/${project.id}`}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-orange-100 hover:text-orange-600 transition-colors"
                >
                  <span>View Project</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link
            to="/browse?sort=trending"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200"
          >
            <span>View All Trending Projects</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
