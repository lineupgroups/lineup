import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Heart, Share2, Eye, Info } from 'lucide-react';
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
  const progress = Math.min(goalAmount > 0 ? (project.raised / goalAmount) * 100 : 0, 100);
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
  };

  return (
    <Link
      to={`/project/${project.id}`}
      className="group bg-[#0D0D0D] rounded-[1.5rem] border border-neutral-800/50 hover:border-brand-orange/30 transition-all duration-700 overflow-hidden shadow-2xl flex flex-col h-full relative"
    >
      {/* 16:9 Cover Image */}
      <div className="relative aspect-video overflow-hidden bg-neutral-900">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-transparent to-transparent z-10 opacity-60" />
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover transition-opacity duration-700"
        />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            <div className="px-3 py-1 bg-brand-black/40 backdrop-blur-xl text-brand-acid text-[8px] font-black uppercase tracking-[0.2em] rounded-full border border-white/5">
            {project.category}
            </div>
            {daysLeft <= 7 && daysLeft > 0 && (
                <div className="px-3 py-1 bg-brand-orange text-brand-black text-[8px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg self-start">
                    ENDING SOON
                </div>
            )}
        </div>

        {/* Reasons Tooltip */}
        {showReasons && project.reasons && project.reasons.length > 0 && (
          <div className="absolute top-4 right-4 group/tooltip z-20">
            <div className="p-2 bg-brand-black/40 backdrop-blur-xl rounded-xl border border-white/5 cursor-help hover:bg-brand-acid hover:border-brand-acid transition-all duration-300">
              <Info className="w-3.5 h-3.5 text-brand-white group-hover/tooltip:text-brand-black" />
            </div>
            <div className="absolute right-0 top-full mt-2 w-56 p-4 bg-[#111] border border-neutral-800 text-brand-white rounded-2xl opacity-0 group-hover/tooltip:opacity-100 transition-all duration-500 pointer-events-none z-30 shadow-2xl translate-y-2 group-hover/tooltip:translate-y-0">
              <p className="font-black text-brand-acid mb-2 uppercase tracking-[0.2em] text-[8px] italic">Why we're showing this:</p>
              <ul className="space-y-1.5">
                {project.reasons.map((reason, i) => (
                  <li key={i} className="text-neutral-400 font-bold text-[10px] leading-relaxed flex gap-2">
                    <span className="text-brand-acid">•</span> {reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Floating Actions */}
        <div className="absolute bottom-4 right-4 flex gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-20">
          <button
            onClick={handleLike}
            className="p-2.5 bg-brand-black/40 backdrop-blur-xl rounded-xl hover:bg-brand-orange/20 border border-white/5 transition-all duration-300 group/btn shadow-xl"
            title="Like"
          >
            <Heart className="w-3.5 h-3.5 text-brand-orange" />
          </button>
          <button
            onClick={handleShare}
            className="p-2.5 bg-brand-black/40 backdrop-blur-xl rounded-xl hover:bg-brand-acid/20 border border-white/5 transition-all duration-300 group/btn shadow-xl"
            title="Share"
          >
            <Share2 className="w-3.5 h-3.5 text-brand-white" />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
        <div className="mb-6">
          <h3 className="text-xl font-black text-brand-white italic tracking-tighter uppercase leading-tight mb-2 group-hover:text-brand-orange transition-colors duration-500 line-clamp-2">
            {project.title}
          </h3>

          <p className="text-[11px] text-neutral-500 font-medium line-clamp-2 mb-6 leading-relaxed">
            {project.description}
          </p>

          {/* Progress Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="flex flex-col space-y-0.5">
                <span className="text-[9px] font-black italic text-neutral-600 uppercase tracking-[0.2em]">Raised Intel</span>
                <span className="text-xl font-black text-brand-white italic tracking-tighter">
                    ₹{project.raised.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex flex-col items-end space-y-0.5">
                <span className="text-[9px] font-black italic text-neutral-600 uppercase tracking-[0.2em]">Objective</span>
                <span className="text-xs font-black text-neutral-400 italic">
                    ₹{goalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            
            {/* Progress Bar Container */}
            <div className="relative w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-white/5">
              {/* Filled Progress */}
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_15px_rgba(255,91,0,0.3)] bg-brand-orange"
                style={{ width: `${progress}%` }}
              >
                 {/* Localized Shimmer Animation */}
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-1">
                <span className="text-[10px] font-black italic uppercase tracking-widest text-brand-orange">
                    {progress.toFixed(0)}% Complete
                </span>
                <div className="flex items-center gap-1.5 text-neutral-500">
                    <Clock className="w-3 h-3" />
                    <span className="text-[9px] font-black italic uppercase tracking-widest">
                        {daysLeft > 0 ? `${daysLeft} days left` : 'Campaign Ended'}
                    </span>
                </div>
            </div>
          </div>
        </div>

      </div>

      {/* Luxury Hover Glow */}
      <div className="absolute inset-0 pointer-events-none border border-brand-orange/0 group-hover:border-brand-orange/20 transition-all duration-700 rounded-[1.5rem]" />
    </Link>
  );
}


