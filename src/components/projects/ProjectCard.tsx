import React from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { FirestoreProject } from '../../types/firestore';
import { getProjectProgress } from '../../lib/firestore';
import { LikeButton } from '../interactions/LikeButton';
import { ShareButton } from '../interactions/ShareButton';
import { InteractionStats } from '../interactions/InteractionStats';
import { CreatorInfo } from '../common/CreatorInfo';

interface ProjectCardProps {
  project: FirestoreProject;
  onClick?: (projectId: string) => void;
  showInteractions?: boolean;
  className?: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onClick,
  showInteractions = true,
  className = ''
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getProgressPercentage = (project: FirestoreProject) => {
    return getProjectProgress(project);
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatLocation = (location: any) => {
    if (!location) return '';

    // Handle string format (legacy)
    if (typeof location === 'string') {
      return location;
    }

    // Handle object format {city, state} or {city, state, country}
    if (typeof location === 'object') {
      const { city, state, country } = location;
      const parts = [];

      if (city) parts.push(city);
      if (state) parts.push(state);
      if (country && country !== 'India') parts.push(country);

      return parts.join(', ') || '';
    }

    return '';
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(project.id);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${onClick ? 'cursor-pointer transform hover:-translate-y-1' : ''
        } ${className}`}
      onClick={handleCardClick}
    >
      <div className="relative">
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full text-sm font-medium">
            {project.category}
          </span>
          {/* Status Badge for non-active projects */}
          {(() => {
            // We can't easily import getProjectStatus here without circular deps or refactoring, 
            // so we'll do a lightweight check or just rely on passed props if we had them.
            // For now, let's just check expiration/funding simply.
            const now = new Date();
            let endDate: Date;
            if (project.endDate && typeof project.endDate.toDate === 'function') {
              endDate = project.endDate.toDate();
            } else {
              endDate = new Date(project.endDate as any);
            }
            const isExpired = endDate < now;
            const isFunded = (project.raised || 0) >= (project.goal || project.fundingGoal || 0);

            if (isExpired) {
              if (isFunded) {
                return (
                  <span className="ml-2 px-3 py-1 bg-green-100/90 backdrop-blur-sm text-green-800 rounded-full text-sm font-medium border border-green-200">
                    Successful
                  </span>
                );
              } else {
                return (
                  <span className="ml-2 px-3 py-1 bg-gray-100/90 backdrop-blur-sm text-gray-800 rounded-full text-sm font-medium border border-gray-200">
                    Ended
                  </span>
                );
              }
            }
            return null;
          })()}
        </div>
        {showInteractions && (
          <div className="absolute top-4 right-4 flex space-x-2">
            <div
              className="bg-white/90 backdrop-blur-sm rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <LikeButton projectId={project.id} size="sm" showCount={false} />
            </div>
            <div
              className="bg-white/90 backdrop-blur-sm rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <ShareButton
                projectId={project.id}
                projectTitle={project.title}
                projectDescription={project.tagline}
                size="sm"
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          {project.title}
        </h3>
        <p className="text-gray-600 mb-4 line-clamp-2">
          {project.tagline}
        </p>

        {/* Creator Info */}
        <CreatorInfo
          creatorId={project.creatorId}
          size="sm"
          className="mb-4"
        />

        {/* Project Stats */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Raised</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(project.raised)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(getProgressPercentage(project), 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>{getProgressPercentage(project).toFixed(0)}% funded</span>
            <span>Goal: {formatCurrency(project.goal || project.fundingGoal || 0)}</span>
          </div>
        </div>

        {/* Project Meta Info */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>Ends {formatDate(project.endDate)}</span>
          </div>
          {project.location && (
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{formatLocation(project.location)}</span>
            </div>
          )}
        </div>

        {/* Interaction Stats */}
        {showInteractions && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <InteractionStats projectId={project.id} size="sm" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
