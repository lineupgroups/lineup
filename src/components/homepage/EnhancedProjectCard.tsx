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
      className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-orange-200 hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-200">
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />

        {/* Category Badge */}
        <div className="absolute top-3 left-3 px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-sm font-semibold rounded-full">
          {project.category}
        </div>

        {/* "Why this?" tooltip */}
        {showReasons && project.reasons && project.reasons.length > 0 && (
          <div className="absolute top-3 right-3 group/tooltip">
            <div className="p-2 bg-black/70 backdrop-blur-sm rounded-full cursor-help">
              <Info className="w-4 h-4 text-white" />
            </div>
            <div className="absolute right-0 top-full mt-2 w-48 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10">
              <p className="font-semibold mb-1">Why we're showing this:</p>
              <ul className="space-y-1">
                {project.reasons.map((reason, i) => (
                  <li key={i}>• {reason}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleLike}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
            title="Like"
          >
            <Heart className="w-4 h-4 text-red-500" />
          </button>
          <button
            onClick={handleShare}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
            title="Share"
          >
            <Share2 className="w-4 h-4 text-blue-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-2 group-hover:text-orange-600 transition-colors">
          {project.title}
        </h3>

        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {project.description}
        </p>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-semibold text-gray-900">
              ₹{project.raised.toLocaleString('en-IN')}
            </span>
            <span className="text-gray-600">
              {progress.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${progress >= 100
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                  : 'bg-gradient-to-r from-orange-500 to-red-500'
                }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Raised</span>
            <span>Goal: ₹{goalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{daysLeft} days left</span>
          </div>

          {project.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{project.location.city || project.location.state}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Heart className="w-4 h-4" />
            <span>{project.likeCount || 0}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <TrendingUp className="w-4 h-4" />
            <span>{project.followCount || 0}</span>
          </div>
          {project.score && (
            <div className="ml-auto px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
              {project.score}% match
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}


