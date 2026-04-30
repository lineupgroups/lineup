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
      className={`bg-neutral-900/30 rounded-[2.5rem] border border-neutral-800 hover:border-neutral-700 transition-all duration-500 overflow-hidden group ${onClick ? 'cursor-pointer' : ''
        } ${className}`}
      onClick={handleCardClick}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black/90 via-transparent to-transparent z-10" />
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        
        {/* Badges */}
        <div className="absolute top-5 left-5 z-20 flex gap-2">
          <span className="px-4 py-1.5 bg-brand-black/60 backdrop-blur-md text-brand-acid border border-brand-acid/20 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">
            {project.category}
          </span>
          {(() => {
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
              return (
                <span className={`px-4 py-1.5 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${
                  isFunded 
                    ? 'bg-brand-acid/20 text-brand-acid border-brand-acid/30 shadow-[0_0_15px_rgba(204,255,0,0.2)]' 
                    : 'bg-neutral-900/60 text-neutral-400 border-neutral-700'
                }`}>
                  {isFunded ? 'Successful' : 'Ended'}
                </span>
              );
            }
            return null;
          })()}
        </div>

        {showInteractions && (
          <div className="absolute top-5 right-5 z-20 flex gap-2">
            <div
              className="bg-brand-black/60 backdrop-blur-md border border-neutral-800 rounded-2xl hover:bg-neutral-800 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <LikeButton projectId={project.id} size="sm" showCount={false} className="!p-2.5" />
            </div>
            <div
              className="bg-brand-black/60 backdrop-blur-md border border-neutral-800 rounded-2xl hover:bg-neutral-800 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ShareButton
                projectId={project.id}
                projectTitle={project.title}
                projectDescription={project.tagline}
                size="sm"
                className="!p-2.5"
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-8">
        <h3 className="text-xl sm:text-2xl font-black text-brand-white mb-3 line-clamp-2 italic uppercase tracking-tighter group-hover:text-brand-acid transition-colors">
          {project.title}
        </h3>
        <p className="text-neutral-500 mb-8 line-clamp-2 font-medium text-sm leading-relaxed">
          {project.tagline}
        </p>

        {/* Creator Info */}
        <div className="mb-8 p-4 bg-neutral-900/50 rounded-2xl border border-neutral-800/50">
          <CreatorInfo
            creatorId={project.creatorId}
            size="sm"
          />
        </div>

        {/* Project Stats */}
        <div className="space-y-5">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">Raised</p>
              <p className="text-xl font-black text-brand-acid italic">{formatCurrency(project.raised)}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">Goal</p>
              <p className="text-sm font-bold text-brand-white">{formatCurrency(project.goal || project.fundingGoal || 0)}</p>
            </div>
          </div>
          
          <div className="relative w-full bg-neutral-800 rounded-full h-3.5 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-orange to-brand-acid h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(204,255,0,0.2)]"
              style={{ width: `${Math.min(getProgressPercentage(project), 100)}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
            <span className="text-brand-acid">{getProgressPercentage(project).toFixed(0)}% FUNDED</span>
            <span className="text-neutral-500 flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              {formatDate(project.endDate)}
            </span>
          </div>
        </div>

        {/* Interaction Stats */}
        {showInteractions && (
          <div className="mt-8 pt-6 border-t border-neutral-800">
            <InteractionStats projectId={project.id} size="sm" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
