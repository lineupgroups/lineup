import React from 'react';
import { Trophy, Award, Star, Target, Zap, Heart } from 'lucide-react';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  type: 'first_support' | 'multi_support' | 'category_explorer' | 'early_bird' | 'local_hero' | 'streak';
  icon: 'trophy' | 'award' | 'star' | 'target' | 'zap' | 'heart';
  unlockedAt?: Date;
  progress?: number;
  total?: number;
}

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

const iconMap = {
  trophy: Trophy,
  award: Award,
  star: Star,
  target: Target,
  zap: Zap,
  heart: Heart
};

const colorMap = {
  first_support: 'from-yellow-400 to-orange-500',
  multi_support: 'from-green-400 to-emerald-500',
  category_explorer: 'from-blue-400 to-purple-500',
  early_bird: 'from-pink-400 to-rose-500',
  local_hero: 'from-indigo-400 to-blue-500',
  streak: 'from-red-400 to-orange-500'
};

export default function AchievementBadge({ achievement, size = 'md', showProgress = false }: AchievementBadgeProps) {
  const Icon = iconMap[achievement.icon];
  const isUnlocked = !!achievement.unlockedAt;
  
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };
  
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${
          isUnlocked
            ? `bg-gradient-to-br ${colorMap[achievement.type]} shadow-lg`
            : 'bg-gray-300'
        } transition-all ${isUnlocked ? 'animate-pulse' : 'opacity-50'}`}
      >
        <Icon className={`${iconSizes[size]} ${isUnlocked ? 'text-white' : 'text-gray-500'}`} />
      </div>
      
      {showProgress && achievement.progress !== undefined && achievement.total !== undefined && (
        <div className="mt-2 w-full">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${colorMap[achievement.type]} transition-all`}
              style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1 text-center">
            {achievement.progress}/{achievement.total}
          </p>
        </div>
      )}
      
      <p className={`text-sm font-semibold mt-2 text-center ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
        {achievement.title}
      </p>
      
      {isUnlocked && achievement.unlockedAt && (
        <p className="text-xs text-gray-500 mt-1">
          {new Date(achievement.unlockedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}



