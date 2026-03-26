import React from 'react';
import { Link } from 'react-router-dom';
import { Target, ArrowRight, Users, TrendingUp } from 'lucide-react';
import { useHighlyFundedProjects } from '../../hooks/useHighlyFundedProjects';
import LoadingSpinner from '../common/LoadingSpinner';

export default function HighlyFundedSection() {
  const { projects: fundedProjects, loading, error } = useHighlyFundedProjects();

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Highly Funded</h2>
            <p className="text-xl text-gray-600">Projects making incredible progress</p>
          </div>
          <div className="flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </section>
    );
  }

  if (error || !fundedProjects.length) {
    return null;
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
    <section className="py-16 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-4">
            <Target className="w-4 h-4" />
            <span>Success Stories</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Highly Funded Projects</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Witness the power of community support with projects that are smashing their goals
          </p>
        </div>

        {/* Funded Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {fundedProjects.slice(0, 3).map((project, index) => {
            const progressPercentage = getProgressPercentage(project.raised, project.goal);
            const isOverfunded = progressPercentage >= 100;
            
            return (
              <div key={project.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                {/* Success Badge */}
                {isOverfunded && (
                  <div className="absolute top-4 left-4 z-10">
                    <div className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-sm font-medium">
                      <Target className="w-3 h-3" />
                      <span>Funded!</span>
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
                </div>

                {/* Project Content */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                    {project.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {project.tagline}
                  </p>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>{formatCurrency(project.raised)}</span>
                      <span className={`font-bold ${
                        progressPercentage >= 100 ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {progressPercentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${
                          progressPercentage >= 100 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                            : 'bg-gradient-to-r from-orange-500 to-red-500'
                        }`}
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Goal: {formatCurrency(project.goal || project.fundingGoal || 0)}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{project.supporters} supporters</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>{progressPercentage >= 100 ? 'Completed' : 'Active'}</span>
                    </div>
                  </div>

                  {/* View Project Button */}
                  <Link
                    to={`/project/${project.id}`}
                    className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                      progressPercentage >= 100
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    }`}
                  >
                    <span>View Project</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link
            to="/browse?sort=funded"
            className="inline-flex items-center space-x-2 px-6 py-3 border-2 border-green-500 text-green-600 rounded-lg font-semibold hover:bg-green-500 hover:text-white transition-colors"
          >
            <span>View All Funded Projects</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
