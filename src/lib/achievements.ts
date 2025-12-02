/**
 * Achievement System
 * Tracks and awards user achievements based on behavior
 */

import { UserPreferences } from '../types/behavior';
import { Achievement } from '../components/achievements/AchievementBadge';

/**
 * Calculate user achievements based on preferences
 */
export function calculateAchievements(preferences: UserPreferences): Achievement[] {
  const achievements: Achievement[] = [];

  // First Support
  achievements.push({
    id: 'first_support',
    title: 'First Step',
    description: 'Made your first support!',
    type: 'first_support',
    icon: 'heart',
    unlockedAt: preferences.totalProjectsSupported >= 1 ? preferences.createdAt.toDate() : undefined
  });

  // Multi Support (5 projects)
  achievements.push({
    id: 'multi_support_5',
    title: 'Rising Supporter',
    description: 'Supported 5 projects',
    type: 'multi_support',
    icon: 'trophy',
    unlockedAt: preferences.totalProjectsSupported >= 5 ? new Date() : undefined,
    progress: preferences.totalProjectsSupported,
    total: 5
  });

  // Category Explorer (3 categories)
  achievements.push({
    id: 'category_explorer',
    title: 'Explorer',
    description: 'Supported projects in 3 different categories',
    type: 'category_explorer',
    icon: 'star',
    unlockedAt: preferences.favoriteCategories.length >= 3 ? new Date() : undefined,
    progress: preferences.favoriteCategories.length,
    total: 3
  });

  // Local Hero (3 local projects)
  if (preferences.preferredLocation.city) {
    achievements.push({
      id: 'local_hero',
      title: 'Local Hero',
      description: 'Supported 3 projects from your area',
      type: 'local_hero',
      icon: 'target',
      // This would need actual tracking of local supports
      progress: 0,
      total: 3
    });
  }

  // Engagement Master
  if (preferences.engagementScore > 80) {
    achievements.push({
      id: 'engagement_master',
      title: 'Engagement Master',
      description: 'Highly engaged with the platform',
      type: 'streak',
      icon: 'zap',
      unlockedAt: new Date()
    });
  }

  return achievements;
}

/**
 * Get unlocked achievements
 */
export function getUnlockedAchievements(preferences: UserPreferences): Achievement[] {
  const all = calculateAchievements(preferences);
  return all.filter(a => a.unlockedAt);
}

/**
 * Get next achievement to unlock
 */
export function getNextAchievement(preferences: UserPreferences): Achievement | null {
  const all = calculateAchievements(preferences);
  const locked = all.filter(a => !a.unlockedAt && a.progress !== undefined);
  
  // Sort by progress percentage
  locked.sort((a, b) => {
    const progressA = (a.progress! / a.total!) * 100;
    const progressB = (b.progress! / b.total!) * 100;
    return progressB - progressA;
  });

  return locked[0] || null;
}



