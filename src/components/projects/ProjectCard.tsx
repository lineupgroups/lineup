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
    return Math.min(getProjectProgress(project), 100);
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
    if (typeof location === 'string') return location;
    if (typeof location === 'object') {
      const { city, state } = location;
      const parts = [];
      if (city) parts.push(city);
      if (state) parts.push(state);
      return parts.join(', ') || '';
    }
    return '';
  };

  const handleCardClick = () => {
    if (onClick) onClick(project.id);
  };

  const progress = getProgressPercentage(project);

  return (
    <div
      className={`group relative bg-[#0D0D0D] rounded-[1.5rem] border border-neutral-800/50 hover:border-brand-orange/30 transition-all duration-700 overflow-hidden shadow-2xl ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={handleCardClick}
    >
      {/* 16:9 Cover Image */}
      <div className="relative aspect-video overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-transparent to-transparent z-10 opacity-60" />
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover transition-opacity duration-700"
        />
        
        {/* Badges Overlay */}
        <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-brand-black/40 backdrop-blur-xl text-brand-acid border border-white/5 rounded-full text-[8px] font-black uppercase tracking-[0.2em]">
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
                <span className={`px-3 py-1 backdrop-blur-xl rounded-full text-[8px] font-black uppercase tracking-[0.2em] border border-white/5 ${
                  isFunded ? 'text-brand-acid' : 'text-neutral-400'
                }`}>
                  {isFunded ? 'Success' : 'Ended'}
                </span>
              );
            }
            return null;
          })()}
        </div>

        {/* Hover Actions */}
        {showInteractions && (
          <div className="absolute top-4 right-4 z-20 flex gap-2 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
            <div className="p-1.5 bg-brand-black/40 backdrop-blur-xl border border-white/10 rounded-xl hover:bg-neutral-800 transition-colors" onClick={(e) => e.stopPropagation()}>
              <LikeButton projectId={project.id} size="sm" showCount={false} className="!p-1.5" />
            </div>
            <div className="p-1.5 bg-brand-black/40 backdrop-blur-xl border border-white/10 rounded-xl hover:bg-neutral-800 transition-colors" onClick={(e) => e.stopPropagation()}>
              <ShareButton projectId={project.id} projectTitle={project.title} projectDescription={project.tagline} size="sm" className="!p-1.5" />
            </div>
          </div>
        )}
      </div>

      <div className="p-6 sm:p-7">
        <h3 className="text-xl font-black italic uppercase tracking-tighter text-brand-white line-clamp-2 mb-2 group-hover:text-brand-orange transition-colors duration-500">
          {project.title}
        </h3>
        <p className="text-[11px] text-neutral-500 font-medium line-clamp-2 mb-6 leading-relaxed">
          {project.tagline}
        </p>

        {/* Stats Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div className="space-y-0.5">
              <span className="text-[9px] font-black italic uppercase tracking-[0.2em] text-neutral-600">Raised Intel</span>
              <p className="text-xl font-black text-brand-white italic tracking-tighter">
                {formatCurrency(project.raised)}
              </p>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-[9px] font-black italic uppercase tracking-[0.2em] text-neutral-600">Objective</span>
              <p className="text-xs font-black text-neutral-400 italic">
                {formatCurrency(project.goal || project.fundingGoal || 0)}
              </p>
            </div>
          </div>
          
          {/* Progress Bar Container */}
          <div className="relative w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-white/5">
            {/* Filled Progress */}
            <div
              className="absolute inset-y-0 left-0 bg-brand-orange h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,91,0,0.3)] relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {/* Localized Shimmer Animation (Only inside progress) */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full -translate-x-full animate-[shimmer_2s_infinite]" />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black italic text-brand-orange">{progress.toFixed(0)}% Complete</span>
              <div className="w-1 h-1 rounded-full bg-neutral-800" />
              <div className="flex items-center gap-1 text-[9px] font-black italic uppercase text-neutral-600">
                <MapPin className="w-2.5 h-2.5" />
                <span>{formatLocation(project.location) || 'Remote'}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-black italic uppercase text-neutral-500">
              <Calendar className="w-2.5 h-2.5" />
              <span>{formatDate(project.endDate)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Luxury Hover Glow */}
      <div className="absolute inset-0 pointer-events-none border border-brand-orange/0 group-hover:border-brand-orange/20 transition-all duration-700 rounded-[1.5rem]" />
    </div>
  );
};

export default ProjectCard;
