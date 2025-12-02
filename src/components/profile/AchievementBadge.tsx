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
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          badge: 'bg-gray-100 text-gray-600'
        };
      case 'rare':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          badge: 'bg-blue-100 text-blue-600'
        };
      case 'epic':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-700',
          badge: 'bg-purple-100 text-purple-600'
        };
      case 'legendary':
        return {
          bg: 'bg-gradient-to-br from-yellow-50 to-orange-50',
          border: 'border-yellow-300',
          text: 'text-orange-700',
          badge: 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-600'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          badge: 'bg-gray-100 text-gray-600'
        };
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'small':
        return {
          container: 'p-3',
          icon: 'text-2xl',
          title: 'text-sm font-medium',
          description: 'text-xs',
          badge: 'text-xs px-2 py-1'
        };
      case 'large':
        return {
          container: 'p-6',
          icon: 'text-4xl',
          title: 'text-lg font-semibold',
          description: 'text-sm',
          badge: 'text-sm px-3 py-1'
        };
      default: // medium
        return {
          container: 'p-4',
          icon: 'text-3xl',
          title: 'text-base font-semibold',
          description: 'text-sm',
          badge: 'text-xs px-2 py-1'
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
        ${colors.bg} ${colors.border} ${colors.text} ${sizeClasses.container}
        border rounded-xl transition-all duration-200 hover:shadow-md
        ${achievement.rarity === 'legendary' ? 'ring-2 ring-yellow-200 shadow-lg' : ''}
        ${className}
      `}
    >
      {/* Achievement Icon */}
      <div className="text-center mb-3">
        <div className={`${sizeClasses.icon} mb-2`}>
          {achievement.icon}
        </div>
        
        {/* Rarity Badge */}
        <div className={`inline-flex items-center ${sizeClasses.badge} ${colors.badge} rounded-full font-medium capitalize`}>
          {achievement.rarity}
        </div>
      </div>

      {/* Achievement Details */}
      {showDetails && (
        <div className="text-center space-y-2">
          <h4 className={`${sizeClasses.title} ${colors.text}`}>
            {achievement.title}
          </h4>
          
          <p className={`${sizeClasses.description} text-gray-600`}>
            {achievement.description}
          </p>
          
          {/* Experience Points */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <span>+{achievement.experiencePoints} XP</span>
            <span>•</span>
            <span>{formatDate(achievement.unlockedAt)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementBadge;

