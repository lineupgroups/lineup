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
      className="group bg-[#0A0A0A] rounded-[2.5rem] shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 overflow-hidden border border-neutral-800 hover:border-brand-acid/30 flex flex-col h-full relative"
    >
      {/* Image Section */}
      <div className="relative h-64 overflow-hidden bg-neutral-900">
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
        />
        {/* Elite Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500"></div>

        {/* Top Badges */}
        <div className="absolute top-5 left-5 flex flex-col gap-2">
            <div className="px-4 py-1.5 bg-brand-black/60 backdrop-blur-xl text-brand-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-white/10 shadow-xl">
            {project.category}
            </div>
            {daysLeft <= 7 && daysLeft > 0 && (
                <div className="px-4 py-1.5 bg-brand-orange text-brand-black text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg self-start">
                    ENDING SOON
                </div>
            )}
        </div>

        {/* "Why this?" tooltip */}
        {showReasons && project.reasons && project.reasons.length > 0 && (
          <div className="absolute top-5 right-5 group/tooltip">
            <div className="p-2.5 bg-brand-black/60 backdrop-blur-xl rounded-2xl border border-white/10 cursor-help hover:bg-brand-acid hover:border-brand-acid transition-all duration-300">
              <Info className="w-4 h-4 text-brand-white group-hover/tooltip:text-brand-black" />
            </div>
            <div className="absolute right-0 top-full mt-3 w-56 p-4 bg-brand-black border border-neutral-800 text-brand-white rounded-3xl opacity-0 group-hover/tooltip:opacity-100 transition-all duration-500 pointer-events-none z-30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] translate-y-2 group-hover/tooltip:translate-y-0">
              <p className="font-black text-brand-acid mb-3 uppercase tracking-[0.2em] text-[9px]">Why we're showing this:</p>
              <ul className="space-y-2">
                {project.reasons.map((reason, i) => (
                  <li key={i} className="text-neutral-400 font-bold text-xs leading-relaxed flex gap-2">
                    <span className="text-brand-acid">•</span> {reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Quick Actions (Floating) */}
        <div className="absolute bottom-5 right-5 flex gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
          <button
            onClick={handleLike}
            className="p-3 bg-brand-black/60 backdrop-blur-xl rounded-2xl hover:bg-brand-orange border border-white/10 transition-all duration-300 group/btn shadow-xl"
            title="Like"
          >
            <Heart className="w-4 h-4 text-brand-orange group-hover/btn:text-brand-white" />
          </button>
          <button
            onClick={handleShare}
            className="p-3 bg-brand-black/60 backdrop-blur-xl rounded-2xl hover:bg-brand-acid border border-white/10 transition-all duration-300 group/btn shadow-xl"
            title="Share"
          >
            <Share2 className="w-4 h-4 text-brand-white group-hover/btn:text-brand-black" />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between bg-neutral-900/20 backdrop-blur-sm">
        <div className="mb-6">
          <h3 className="text-2xl font-black text-brand-white italic tracking-tighter uppercase leading-tight mb-3 group-hover:text-brand-acid transition-colors duration-300 line-clamp-2">
            {project.title}
          </h3>

          <p className="text-sm text-neutral-500 line-clamp-2 font-bold leading-relaxed mb-6">
            {project.description}
          </p>

          {/* Progress Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-1">Raised</span>
                <span className="text-xl font-black text-brand-white italic tracking-tighter">
                    ₹{project.raised.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-1">Goal</span>
                <span className="text-sm font-bold text-neutral-300">
                    ₹{goalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            
            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out relative ${progress >= 100
                  ? 'bg-brand-acid shadow-[0_0_15px_rgba(204,255,0,0.4)]'
                  : 'bg-brand-orange shadow-[0_0_15px_rgba(255,91,0,0.4)]'
                  }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              >
                 <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-1">
                <span className={`text-[10px] font-black uppercase tracking-widest ${progress >= 100 ? 'text-brand-acid' : 'text-brand-orange'}`}>
                    {progress.toFixed(0)}% Funded
                </span>
                <div className="flex items-center gap-1.5 text-neutral-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        {daysLeft > 0 ? `${daysLeft} days left` : 'Campaign Ended'}
                    </span>
                </div>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="flex items-center justify-between pt-6 border-t border-neutral-800/50">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-neutral-400 group-hover:text-brand-orange transition-colors">
                    <Heart className="w-4 h-4" />
                    <span className="text-xs font-black italic tracking-tighter">{project.likeCount || 0}</span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-400 group-hover:text-brand-acid transition-colors">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-black italic tracking-tighter">{project.followCount || 0}</span>
                </div>
            </div>

            {project.location && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-800/50 rounded-full border border-neutral-800">
                    <MapPin className="w-3 h-3 text-neutral-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
                        {project.location.city || project.location.state}
                    </span>
                </div>
            )}
        </div>
      </div>
    </Link>
  );
}


