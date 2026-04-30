import React from 'react';
import { Achievement } from '../../types/user';

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  className?: string;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ 
  achievement, 
  size = 'medium', 
  showDetails = true,
  className = '' 
}) => {
  const getRarityColors = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return {
          bg: 'bg-neutral-900/30',
          border: 'border-neutral-800',
          text: 'text-neutral-500',
          badge: 'bg-neutral-800 text-neutral-400',
          accent: 'text-neutral-400'
        };
      case 'rare':
        return {
          bg: 'bg-neutral-900/50',
          border: 'border-neutral-700',
          text: 'text-brand-white',
          badge: 'bg-neutral-800 text-brand-white',
          accent: 'text-brand-white'
        };
      case 'epic':
        return {
          bg: 'bg-brand-orange/5',
          border: 'border-brand-orange/20',
          text: 'text-brand-white',
          badge: 'bg-brand-orange/10 text-brand-orange',
          accent: 'text-brand-orange'
        };
      case 'legendary':
        return {
          bg: 'bg-brand-acid/5',
          border: 'border-brand-acid/20',
          text: 'text-brand-white',
          badge: 'bg-brand-acid/10 text-brand-acid',
          accent: 'text-brand-acid'
        };
      default:
        return {
          bg: 'bg-neutral-900/30',
          border: 'border-neutral-800',
          text: 'text-neutral-500',
          badge: 'bg-neutral-800 text-neutral-400',
          accent: 'text-neutral-400'
        };
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'small':
        return {
          container: 'p-4',
          icon: 'text-3xl',
          title: 'text-[11px] font-black uppercase tracking-widest',
          description: 'text-[10px]',
          badge: 'text-[9px] px-2 py-0.5'
        };
      case 'large':
        return {
          container: 'p-10',
          icon: 'text-6xl',
          title: 'text-xl font-black italic uppercase tracking-tight',
          description: 'text-sm',
          badge: 'text-[10px] px-4 py-1.5'
        };
      default: // medium
        return {
          container: 'p-6',
          icon: 'text-4xl',
          title: 'text-sm font-black italic uppercase tracking-tight',
          description: 'text-xs',
          badge: 'text-[9px] px-3 py-1'
        };
    }
  };

  const colors = getRarityColors(achievement.rarity);
  const sizeClasses = getSizeClasses(size);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    
    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div 
      className={`
        ${colors.bg} ${colors.border} border-2 ${sizeClasses.container}
        rounded-[2rem] transition-all duration-500 group relative overflow-hidden
        hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:-translate-y-1
        ${achievement.rarity === 'legendary' ? 'hover:shadow-[0_0_40px_rgba(204,255,0,0.1)]' : ''}
        ${achievement.rarity === 'epic' ? 'hover:shadow-[0_0_40px_rgba(255,91,0,0.1)]' : ''}
        ${className}
      `}
    >
      {/* Decorative gradient for legendary/epic */}
      {(achievement.rarity === 'legendary' || achievement.rarity === 'epic') && (
        <div className={`absolute -top-24 -right-24 w-48 h-48 blur-[80px] opacity-20 pointer-events-none ${
          achievement.rarity === 'legendary' ? 'bg-brand-acid' : 'bg-brand-orange'
        }`} />
      )}

      {/* Achievement Icon */}
      <div className="text-center mb-6 relative">
        <div className={`${sizeClasses.icon} mb-4 transform group-hover:scale-125 group-hover:rotate-6 transition-transform duration-500`}>
          {achievement.icon}
        </div>
        
        {/* Rarity Badge */}
        <div className={`inline-flex items-center ${sizeClasses.badge} ${colors.badge} rounded-full font-black uppercase tracking-widest border border-current/10`}>
          {achievement.rarity}
        </div>
      </div>

      {/* Achievement Details */}
      {showDetails && (
        <div className="text-center space-y-3 relative">
          <h4 className={`${sizeClasses.title} ${colors.text} tracking-wider`}>
            {achievement.title}
          </h4>
          
          <p className={`${sizeClasses.description} text-neutral-500 font-medium leading-relaxed`}>
            {achievement.description}
          </p>
          
          {/* Experience Points */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <span className={`text-[10px] font-black italic ${colors.accent}`}>+{achievement.experiencePoints} XP</span>
            <span className="text-neutral-800 text-[10px]">/</span>
            <span className="text-[10px] font-bold text-neutral-600">{formatDate(achievement.unlockedAt)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementBadge;

