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
    <div className={`bg-neutral-900/30 rounded-3xl border border-neutral-800 p-6 sm:p-10 ${className}`}>
      {/* Header with Level Info */}
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-brand-white flex items-center gap-3">
              <Trophy className="w-4 h-4 text-brand-orange" />
              Achievements & Rank
            </h3>
            <p className="text-4xl sm:text-5xl font-black text-brand-white tracking-tighter italic uppercase">
              Level {level}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-1">Total Experience</div>
            <div className="text-2xl font-black text-brand-acid italic tracking-tight">{experiencePoints.toLocaleString()} XP</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-4 bg-neutral-900/50 p-6 rounded-[2rem] border border-neutral-800/50">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
            <span className="text-neutral-400">Progress to Level {level + 1}</span>
            <span className="text-brand-acid italic">{progressXP} / {requiredXP} XP</span>
          </div>
          <div className="relative w-full h-4 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-orange to-brand-acid h-full rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(204,255,0,0.2)]"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="mb-10 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2 pb-2">
          {filterButtons.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedFilter(filter.key as any)}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap
                ${selectedFilter === filter.key
                  ? 'bg-brand-acid text-brand-black shadow-[0_0_20px_rgba(204,255,0,0.15)]'
                  : 'bg-neutral-900 text-neutral-500 border border-neutral-800 hover:text-brand-white hover:border-neutral-700'
                }
              `}
            >
              {filter.icon}
              {filter.label}
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${
                selectedFilter === filter.key ? 'bg-brand-black/10' : 'bg-neutral-800'
              }`}>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <div className="text-center py-20 bg-neutral-900/20 rounded-[2.5rem] border border-neutral-800 border-dashed">
          <Trophy className="w-16 h-16 text-neutral-800 mx-auto mb-6" />
          <h4 className="text-xl font-bold text-brand-white mb-2">No Achievements Found</h4>
          <p className="text-neutral-500 max-w-xs mx-auto mb-8 font-medium">
            {selectedFilter === 'all' 
              ? 'Start your journey to unlock exclusive platform honors.'
              : `No ${selectedFilter} badges have been earned yet.`
            }
          </p>
          <button
            onClick={() => setSelectedFilter('all')}
            className="text-[11px] font-black uppercase tracking-widest text-brand-acid hover:text-brand-acid/80 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Achievement Summary */}
      {achievements.length > 0 && (
        <div className="mt-10 pt-10 border-t border-neutral-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {rarityOrder.map((rarity) => {
              const count = achievements.filter(a => a.rarity === rarity).length;
              const rarityStyles = {
                legendary: 'text-brand-acid border-brand-acid/30 bg-brand-acid/5',
                epic: 'text-brand-orange border-brand-orange/30 bg-brand-orange/5',
                rare: 'text-brand-white border-neutral-700 bg-neutral-900/50',
                common: 'text-neutral-500 border-neutral-800 bg-neutral-900/30'
              };
              
              return (
                <div key={rarity} className={`p-5 rounded-2xl border ${rarityStyles[rarity as keyof typeof rarityStyles]} transition-all duration-300 hover:scale-105`}>
                  <div className="text-3xl font-black italic mb-1">{count}</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em]">{rarity}</div>
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
