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
