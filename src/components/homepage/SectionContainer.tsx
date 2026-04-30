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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            {Icon && (
              <div className="p-2.5 bg-brand-orange/10 rounded-xl border border-brand-orange/20">
                <Icon className="w-6 h-6 text-brand-orange" />
              </div>
            )}
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-brand-white tracking-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="text-neutral-400 mt-1 font-medium">{subtitle}</p>
              )}
            </div>
          </div>

          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="group flex items-center gap-1.5 text-brand-orange hover:text-[#ff7b33] font-bold text-sm tracking-wide transition-colors"
            >
              View All
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>

        {/* Section Content */}
        {children}
      </div>
    </section>
  );
}
