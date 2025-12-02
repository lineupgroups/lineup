import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Helmet>
        <title>Page Not Found - Lineup</title>
        <meta name="description" content="The page you're looking for doesn't exist." />
      </Helmet>

      <div className="text-center max-w-md mx-auto">
        <div className="mb-8">
          <div className="text-6xl font-bold text-orange-500 mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200"
          >
            <Home className="w-5 h-5" />
            <span>Go Home</span>
          </Link>

          <div className="flex justify-center space-x-4">
            <Link
              to="/discover"
              className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Browse Projects</span>
            </Link>

            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Looking for something specific? Try searching or browse our projects.</p>
        </div>
      </div>
    </div>
  );
}
