import React, { useState } from 'react';
import { Trophy, Star, Target, Crown } from 'lucide-react';
import { Achievement } from '../../types/user';
import AchievementBadge from './AchievementBadge';

interface AchievementsSectionProps {
  achievements: Achievement[];
  level: number;
  experiencePoints: number;
  className?: string;
}

const AchievementsSection: React.FC<AchievementsSectionProps> = ({
  achievements,
  level,
  experiencePoints,
  className = ''
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'creator' | 'backer' | 'social' | 'milestone'>('all');

  const getNextLevelXP = (currentLevel: number): number => {
    const levels = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];
    if (currentLevel <= 10) {
      return levels[currentLevel] || (currentLevel - 5) * 1000;
    }
    return (currentLevel - 5) * 1000;
  };

  const getCurrentLevelXP = (currentLevel: number): number => {
    const levels = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];
    if (currentLevel <= 10) {
      return levels[currentLevel - 1] || (currentLevel - 6) * 1000;
    }
    return (currentLevel - 6) * 1000;
  };

  const nextLevelXP = getNextLevelXP(level);
  const currentLevelXP = getCurrentLevelXP(level);
  const progressXP = experiencePoints - currentLevelXP;
  const requiredXP = nextLevelXP - currentLevelXP;
  const progressPercentage = Math.min((progressXP / requiredXP) * 100, 100);

  const filteredAchievements = achievements.filter(achievement => 
    selectedFilter === 'all' || achievement.type === selectedFilter
  );

  const achievementsByRarity = filteredAchievements.reduce((acc, achievement) => {
    if (!acc[achievement.rarity]) {
      acc[achievement.rarity] = [];
    }
    acc[achievement.rarity].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const rarityOrder = ['legendary', 'epic', 'rare', 'common'];
  const sortedAchievements = rarityOrder.flatMap(rarity => 
    (achievementsByRarity[rarity] || []).sort((a, b) => {
      // Sort by unlock date within each rarity group (newest first)
      const aTime = a.unlockedAt?.seconds || 0;
      const bTime = b.unlockedAt?.seconds || 0;
      return bTime - aTime;
    })
  );

  const filterButtons = [
    { key: 'all', label: 'All', icon: <Trophy className="w-4 h-4" /> },
    { key: 'creator', label: 'Creator', icon: <Target className="w-4 h-4" /> },
    { key: 'backer', label: 'Backer', icon: <Star className="w-4 h-4" /> },
    { key: 'social', label: 'Social', icon: <Crown className="w-4 h-4" /> },
    { key: 'milestone', label: 'Milestone', icon: <Trophy className="w-4 h-4" /> }
  ];

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header with Level Info */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Achievements & Progress
          </h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">Level {level}</div>
            <div className="text-sm text-gray-500">{experiencePoints.toLocaleString()} XP</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress to Level {level + 1}</span>
            <span>{progressXP} / {requiredXP} XP</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {filterButtons.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedFilter(filter.key as any)}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${selectedFilter === filter.key
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                }
              `}
            >
              {filter.icon}
              {filter.label}
              <span className="ml-1 px-2 py-0.5 bg-white rounded-full text-xs">
                {filter.key === 'all' 
                  ? achievements.length 
                  : achievements.filter(a => a.type === filter.key).length
                }
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Achievements Grid */}
      {sortedAchievements.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedAchievements.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              size="medium"
              showDetails={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Achievements Yet</h4>
          <p className="text-gray-600 mb-4">
            {selectedFilter === 'all' 
              ? 'Start creating or backing projects to unlock achievements!'
              : `No ${selectedFilter} achievements unlocked yet.`
            }
          </p>
          <button
            onClick={() => setSelectedFilter('all')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View All Categories
          </button>
        </div>
      )}

      {/* Achievement Summary */}
      {achievements.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {rarityOrder.map((rarity) => {
              const count = achievements.filter(a => a.rarity === rarity).length;
              const colors = {
                legendary: 'text-yellow-600 bg-yellow-50',
                epic: 'text-purple-600 bg-purple-50',
                rare: 'text-blue-600 bg-blue-50',
                common: 'text-gray-600 bg-gray-50'
              };
              
              return (
                <div key={rarity} className={`p-3 rounded-lg ${colors[rarity as keyof typeof colors]}`}>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm capitalize">{rarity}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementsSection;
