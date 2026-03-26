import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export default function LoadingSpinner({ size = 'md', color = 'text-orange-500' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizeClasses[size]} ${color} animate-spin`}>
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    </div>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-gray-300"></div>
      <div className="p-6">
        <div className="h-4 bg-gray-300 rounded mb-2"></div>
        <div className="h-6 bg-gray-300 rounded mb-4"></div>
        <div className="h-3 bg-gray-300 rounded mb-4 w-3/4"></div>
        <div className="h-2 bg-gray-300 rounded mb-4"></div>
        <div className="flex justify-between">
          <div className="h-4 bg-gray-300 rounded w-20"></div>
          <div className="h-4 bg-gray-300 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
}

export function FeaturedProjectSkeleton() {
  return (
    <div className="w-full flex-shrink-0 animate-pulse">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="relative">
          <div className="w-full h-96 bg-gray-300"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="h-6 bg-gray-400 rounded mb-2 w-3/4"></div>
            <div className="h-4 bg-gray-400 rounded mb-4 w-1/2"></div>
            <div className="h-2 bg-gray-400 rounded mb-4"></div>
            <div className="flex justify-between">
              <div className="h-4 bg-gray-400 rounded w-24"></div>
              <div className="h-10 bg-gray-400 rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// D-OPT-02: Dashboard stat card skeleton for better loading UX
export function DashboardStatSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        <div className="w-16 h-4 bg-gray-200 rounded"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-20"></div>
    </div>
  );
}

// D-OPT-02: Full dashboard skeleton for initial load
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-9 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-5 w-80 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-12 w-36 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <DashboardStatSkeleton />
            <DashboardStatSkeleton />
            <DashboardStatSkeleton />
            <DashboardStatSkeleton />
            <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl shadow-sm p-6 animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-white/30 rounded-lg"></div>
              </div>
              <div className="h-8 bg-white/30 rounded w-24 mb-2"></div>
              <div className="h-4 bg-white/30 rounded w-32"></div>
            </div>
          </div>

          {/* Charts section skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
              <div className="h-64 bg-gray-100 rounded flex items-end justify-between px-4 pb-4">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="w-8 bg-gray-200 rounded-t" style={{ height: `${30 + Math.random() * 50}%` }}></div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-gray-100 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick actions skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

