import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, TrendingUp, Heart, Share2, Eye, Info } from 'lucide-react';
import { FirestoreProject } from '../../types/firestore';
import { useBehaviorTracking } from '../../hooks/useBehaviorTracking';
import { getDaysLeft } from '../../lib/firestore';

interface EnhancedProjectCardProps {
  project: FirestoreProject & { score?: number; reasons?: string[] };
  showReasons?: boolean;
}

export default function EnhancedProjectCard({ project, showReasons = false }: EnhancedProjectCardProps) {
  const { trackInteraction } = useBehaviorTracking();

  const goalAmount = project.goal || project.fundingGoal || 0;
  const progress = goalAmount > 0
    ? (project.raised / goalAmount) * 100
    : 0;
  const daysLeft = getDaysLeft(project.endDate);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await trackInteraction(project.id, 'like', { title: project.title, category: project.category });
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await trackInteraction(project.id, 'share', { title: project.title, category: project.category });
    // Share logic here
  };

  return (
    <Link
      to={`/project/${project.id}`}
      className="group bg-neutral-900/50 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-neutral-800 hover:border-brand-orange/30 flex flex-col h-full"
    >
      {/* Image */}
      <div className="relative h-56 overflow-hidden bg-neutral-800">
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent opacity-80"></div>

        {/* Category Badge */}
        <div className="absolute top-4 left-4 px-3 py-1.5 bg-brand-black/80 backdrop-blur-md text-brand-white text-xs font-bold uppercase tracking-wider rounded-md border border-neutral-700">
          {project.category}
        </div>

        {/* "Why this?" tooltip */}
        {showReasons && project.reasons && project.reasons.length > 0 && (
          <div className="absolute top-4 right-4 group/tooltip">
            <div className="p-2 bg-brand-black/80 backdrop-blur-md rounded-lg border border-neutral-700 cursor-help">
              <Info className="w-4 h-4 text-brand-white" />
            </div>
            <div className="absolute right-0 top-full mt-2 w-48 p-3 bg-neutral-900 border border-neutral-700 text-brand-white text-xs rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
              <p className="font-bold text-brand-acid mb-1.5 uppercase tracking-wider text-[10px]">Why we're showing this:</p>
              <ul className="space-y-1.5">
                {project.reasons.map((reason, i) => (
                  <li key={i} className="text-neutral-300 font-medium leading-relaxed">• {reason}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="absolute bottom-4 right-4 flex gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={handleLike}
            className="p-2.5 bg-neutral-900/80 backdrop-blur-md rounded-xl hover:bg-neutral-800 border border-neutral-700 transition-colors"
            title="Like"
          >
            <Heart className="w-4 h-4 text-brand-orange" />
          </button>
          <button
            onClick={handleShare}
            className="p-2.5 bg-neutral-900/80 backdrop-blur-md rounded-xl hover:bg-neutral-800 border border-neutral-700 transition-colors"
            title="Share"
          >
            <Share2 className="w-4 h-4 text-brand-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-xl text-brand-white line-clamp-2 mb-2 group-hover:text-brand-orange transition-colors">
            {project.title}
          </h3>

          <p className="text-sm text-neutral-400 line-clamp-2 mb-4 leading-relaxed font-medium">
            {project.description}
          </p>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs font-bold tracking-wide mb-2">
              <span className="text-brand-white">
                ₹{project.raised.toLocaleString('en-IN')}
              </span>
              <span className="text-brand-orange">
                {progress.toFixed(0)}%
              </span>
            </div>
            <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out relative ${progress >= 100
                  ? 'bg-brand-acid'
                  : 'bg-brand-orange'
                  }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              >
                 <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
            <div className="flex justify-between text-[11px] font-medium text-neutral-500 mt-2 uppercase tracking-wider">
              <span>Raised</span>
              <span>Goal: ₹{goalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <div>
          {/* Meta Info */}
          <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-4 tracking-wide uppercase">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-neutral-500" />
              <span>{daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}</span>
            </div>

            {project.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                <span>{project.location.city || project.location.state}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 pt-4 border-t border-neutral-800/50 text-sm">
            <div className="flex items-center gap-1.5 text-neutral-400 font-bold">
              <Heart className="w-4 h-4 text-neutral-500" />
              <span>{project.likeCount || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-400 font-bold">
              <TrendingUp className="w-4 h-4 text-neutral-500" />
              <span>{project.followCount || 0}</span>
            </div>
            {project.score && (
              <div className="ml-auto px-3 py-1 bg-brand-acid/10 border border-brand-acid/20 text-brand-acid rounded-md text-[10px] font-extrabold uppercase tracking-widest">
                {project.score}% match
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}


