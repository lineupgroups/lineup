import React, { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SectionContainerProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  viewAllLink?: string;
  children: ReactNode;
  className?: string;
}

export default function SectionContainer({
  title,
  subtitle,
  icon: Icon,
  viewAllLink,
  children,
  className = ''
}: SectionContainerProps) {
  return (
    <section className={`py-12 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                <Icon className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                {title}
              </h2>
              {subtitle && (
                <p className="text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="flex items-center gap-1 text-orange-600 hover:text-orange-700 font-semibold transition-colors"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Section Content */}
        {children}
      </div>
    </section>
  );
}


