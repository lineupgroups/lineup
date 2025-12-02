import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Rocket, TrendingUp, Users } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-orange-50 via-white to-red-50 pt-16 pb-20 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Floating Elements - Responsive positioning */}
      <div className="absolute top-20 left-4 sm:left-10 w-16 sm:w-20 h-16 sm:h-20 bg-orange-200 rounded-full opacity-20 animate-float"></div>
      <div className="absolute top-40 right-4 sm:right-20 w-12 sm:w-16 h-12 sm:h-16 bg-red-200 rounded-full opacity-20 animate-float-delayed"></div>
      <div className="absolute bottom-20 left-4 sm:left-20 w-10 sm:w-12 h-10 sm:h-12 bg-orange-300 rounded-full opacity-30 animate-float"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium mb-6">
              <TrendingUp className="w-4 h-4" />
              <span>For the Idea Nation™</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Turn Your{' '}
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Ideas
              </span>{' '}
              Into Reality
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-gray-600 mb-8 max-w-2xl">
              Join the community that believes in innovation. Get funded, build amazing projects, 
              and connect with supporters who share your vision.
            </p>

            {/* Value Proposition */}
            <div className="flex flex-col sm:flex-row gap-6 mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">Community Driven</div>
                  <div className="text-sm text-gray-600">Connect with supporters</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">Proven Success</div>
                  <div className="text-sm text-gray-600">Ideas become reality</div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <Rocket className="w-5 h-5" />
                <span>Start Your Project</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/discover"
                className="inline-flex items-center justify-center space-x-2 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-orange-500 hover:text-orange-600 transition-colors"
              >
                <Play className="w-5 h-5" />
                <span>Explore Projects</span>
              </Link>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative">
            {/* Main Illustration */}
            <div className="relative bg-gradient-to-br from-orange-100 to-red-100 rounded-3xl p-8 shadow-2xl">
              {/* Rocket Illustration */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-orange-400 to-red-400 rounded-full mb-6 shadow-lg">
                  <Rocket className="w-16 h-16 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Launch Your Vision</h3>
                <p className="text-gray-600">
                  From concept to creation, we're here to help you succeed
                </p>
              </div>

              {/* Floating Cards - Responsive positioning */}
              <div className="absolute -top-2 -left-2 sm:-top-4 sm:-left-4 bg-white rounded-lg shadow-lg p-3 sm:p-4 animate-float">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Project Funded!</span>
                </div>
              </div>
              
              <div className="absolute -bottom-2 -right-2 sm:-bottom-4 sm:-right-4 bg-white rounded-lg shadow-lg p-3 sm:p-4 animate-float-delayed">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span className="text-xs sm:text-sm font-medium whitespace-nowrap">New Supporter</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
