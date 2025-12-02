/**
 * Recommendation Scoring Algorithms
 * Calculates personalized scores for project recommendations
 */

import { Timestamp } from 'firebase/firestore';
import { UserPreferences, CategoryEngagement } from '../types/behavior';
import { FirestoreProject } from '../types/firestore';
import { matchKeywords } from './keywords';

// India regions mapping
const INDIAN_REGIONS: { [key: string]: string[] } = {
  north: ['Delhi', 'Punjab', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Ladakh', 'Rajasthan', 'Uttarakhand', 'Uttar Pradesh', 'Chandigarh'],
  south: ['Andhra Pradesh', 'Karnataka', 'Kerala', 'Tamil Nadu', 'Telangana', 'Puducherry', 'Andaman and Nicobar Islands', 'Lakshadweep'],
  east: ['Bihar', 'Jharkhand', 'Odisha', 'West Bengal', 'Sikkim', 'Arunachal Pradesh', 'Assam', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Tripura'],
  west: ['Goa', 'Gujarat', 'Maharashtra', 'Daman and Diu', 'Dadra and Nagar Haveli'],
  central: ['Chhattisgarh', 'Madhya Pradesh']
};

// Neighboring states mapping
const NEIGHBORING_STATES: { [key: string]: string[] } = {
  'Maharashtra': ['Gujarat', 'Madhya Pradesh', 'Chhattisgarh', 'Telangana', 'Karnataka', 'Goa'],
  'Karnataka': ['Goa', 'Maharashtra', 'Telangana', 'Andhra Pradesh', 'Tamil Nadu', 'Kerala'],
  'Tamil Nadu': ['Kerala', 'Karnataka', 'Andhra Pradesh', 'Puducherry'],
  'Kerala': ['Tamil Nadu', 'Karnataka'],
  'Andhra Pradesh': ['Telangana', 'Karnataka', 'Tamil Nadu', 'Chhattisgarh', 'Odisha'],
  'Telangana': ['Maharashtra', 'Chhattisgarh', 'Karnataka', 'Andhra Pradesh'],
  'Gujarat': ['Rajasthan', 'Madhya Pradesh', 'Maharashtra', 'Daman and Diu', 'Dadra and Nagar Haveli'],
  'Rajasthan': ['Gujarat', 'Madhya Pradesh', 'Uttar Pradesh', 'Haryana', 'Punjab'],
  'Delhi': ['Haryana', 'Uttar Pradesh'],
  'Uttar Pradesh': ['Uttarakhand', 'Himachal Pradesh', 'Haryana', 'Rajasthan', 'Madhya Pradesh', 'Chhattisgarh', 'Jharkhand', 'Bihar', 'Delhi'],
  'West Bengal': ['Jharkhand', 'Bihar', 'Odisha', 'Sikkim', 'Assam', 'Bangladesh'],
  // Add more as needed
};

/**
 * Score project by category match
 * Returns 0-100
 */
export function scoreCategoryMatch(
  project: FirestoreProject,
  userPreferences: UserPreferences,
  categoryEngagement?: CategoryEngagement[]
): number {
  if (!userPreferences.favoriteCategories || userPreferences.favoriteCategories.length === 0) {
    return 50; // Neutral score if no preferences
  }

  // Check if project category is in user's favorites
  const categoryIndex = userPreferences.favoriteCategories.indexOf(project.category);
  
  if (categoryIndex === -1) {
    return 20; // Low score for non-favorite category
  }

  // Score based on position in favorites (first = highest)
  const baseScore = 100 - (categoryIndex * 15);

  // Boost if we have engagement data
  if (categoryEngagement) {
    const engagement = categoryEngagement.find(e => e.category === project.category);
    if (engagement) {
      // Add up to 20 points based on engagement score
      const engagementBoost = Math.min(20, engagement.score / 10);
      return Math.min(100, baseScore + engagementBoost);
    }
  }

  return baseScore;
}

/**
 * Score project by location match
 * Returns 0-100
 */
export function scoreLocationMatch(
  project: FirestoreProject,
  userPreferences: UserPreferences
): number {
  if (!project.location || !userPreferences.preferredLocation) {
    return 30; // Neutral score if no location data
  }

  const userCity = userPreferences.preferredLocation.city?.toLowerCase();
  const userState = userPreferences.preferredLocation.state?.toLowerCase();
  const projectCity = project.location.city?.toLowerCase();
  const projectState = project.location.state?.toLowerCase();

  // Same city - highest score
  if (userCity && projectCity && userCity === projectCity) {
    return 100;
  }

  // Same state - high score
  if (userState && projectState && userState === projectState) {
    return 70;
  }

  // Neighboring state - medium score
  if (userState && projectState) {
    const neighbors = NEIGHBORING_STATES[normalizeStateName(userState)] || [];
    if (neighbors.some(n => n.toLowerCase() === projectState)) {
      return 40;
    }
  }

  // Same region - low score
  const userRegion = getRegion(userState);
  const projectRegion = getRegion(projectState);
  if (userRegion && projectRegion && userRegion === projectRegion) {
    return 20;
  }

  return 10; // Different region
}

/**
 * Score project by support history
 * Returns 0-100
 */
export function scoreSupportHistory(
  project: FirestoreProject,
  supportedProjects: Array<{ projectId: string; category: string; creatorId: string; fundingGoal: number }>,
  viewedProjects: Array<{ projectId: string; category: string; keywords: string[] }>
): number {
  if (supportedProjects.length === 0) {
    return 50; // Neutral if no history
  }

  let score = 0;
  let matchCount = 0;

  supportedProjects.forEach((supported, index) => {
    // Same creator - very high score
    if (supported.creatorId === project.creatorId) {
      score += 90;
      matchCount++;
      return;
    }

    // Same category
    if (supported.category === project.category) {
      // Recent supports weighted more
      const recencyFactor = 1 - (index / supportedProjects.length) * 0.5;
      score += 70 * recencyFactor;
      matchCount++;
    }

    // Similar funding goal range (+/- 50%)
    const goalDiff = Math.abs(supported.fundingGoal - project.fundingGoal);
    const avgGoal = (supported.fundingGoal + project.fundingGoal) / 2;
    if (goalDiff / avgGoal < 0.5) {
      score += 50;
      matchCount++;
    }
  });

  // Check viewed projects for keyword matches
  viewedProjects.forEach((viewed, index) => {
    if (viewed.keywords.length > 0) {
      const projectKeywords = [project.title.toLowerCase(), project.category.toLowerCase()];
      const commonKeywords = viewed.keywords.filter(k => 
        projectKeywords.some(pk => pk.includes(k))
      );
      
      if (commonKeywords.length >= 2) {
        const recencyFactor = 1 - (index / viewedProjects.length) * 0.3;
        score += 40 * recencyFactor * (commonKeywords.length / 2);
        matchCount++;
      }
    }
  });

  // Average the score
  return matchCount > 0 ? Math.min(100, score / matchCount) : 30;
}

/**
 * Score project by keyword match
 * Returns 0-100
 */
export function scoreKeywordMatch(
  project: FirestoreProject,
  userKeywords: string[]
): number {
  if (!userKeywords || userKeywords.length === 0) {
    return 50; // Neutral if no keywords
  }

  // Extract project keywords from title and description
  const projectText = `${project.title} ${project.description}`.toLowerCase();
  const projectWords = projectText.split(/\s+/);

  let matchScore = 0;
  let titleMatches = 0;
  const titleWords = project.title.toLowerCase().split(/\s+/);

  userKeywords.forEach(keyword => {
    // Check if keyword appears in project
    if (projectWords.includes(keyword)) {
      matchScore += 10;
      
      // Extra points for title matches
      if (titleWords.includes(keyword)) {
        matchScore += 20;
        titleMatches++;
      }
    }
  });

  // Cap at 100
  return Math.min(100, matchScore);
}

/**
 * Score based on user engagement patterns
 * Returns 0-100
 */
export function scoreEngagement(
  project: FirestoreProject,
  userPreferences: UserPreferences,
  avgViewDuration: number
): number {
  let score = 50; // Base score

  // Check personality type
  if (userPreferences.personalityType === 'supporter') {
    // Supporters prefer projects closer to goal or with momentum
    const progress = (project.raised / project.fundingGoal) * 100;
    if (progress > 50) {
      score += 20;
    }
  } else if (userPreferences.personalityType === 'explorer') {
    // Explorers prefer new/unique projects
    const daysOld = getDaysOld(project.createdAt);
    if (daysOld < 7) {
      score += 20;
    }
  }

  // Engagement score boost
  if (userPreferences.engagementScore > 70) {
    score += 10;
  } else if (userPreferences.engagementScore < 30) {
    score -= 10;
  }

  // Average support amount match
  if (userPreferences.avgSupportAmount > 0) {
    const idealContribution = project.fundingGoal * 0.05; // 5% of goal
    const diff = Math.abs(userPreferences.avgSupportAmount - idealContribution);
    if (diff < idealContribution * 0.5) {
      score += 15;
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Apply recency factor
 * Returns 0.5-1.5 multiplier
 */
export function applyRecencyFactor(lastActive: Timestamp): number {
  const now = Date.now();
  const lastActiveMs = lastActive.toMillis ? lastActive.toMillis() : lastActive;
  const hoursSinceActive = (now - lastActiveMs) / (1000 * 60 * 60);

  if (hoursSinceActive < 24) return 1.5; // Very recent
  if (hoursSinceActive < 24 * 7) return 1.2; // Last week
  if (hoursSinceActive < 24 * 30) return 1.0; // Last month
  return 0.7; // Older
}

/**
 * Apply diversity factor to prevent echo chamber
 * Returns 0.8-1.2 multiplier
 */
export function applyDiversityFactor(
  project: FirestoreProject,
  userPreferences: UserPreferences,
  recentRecommendations: string[]
): number {
  // Boost if category is not in favorites (discovery)
  if (!userPreferences.favoriteCategories.includes(project.category)) {
    return 1.2;
  }

  // Reduce if we've recommended too many similar projects recently
  const similarCount = recentRecommendations.filter(r => r === project.category).length;
  if (similarCount > 3) {
    return 0.8;
  }

  return 1.0;
}

/**
 * Apply popularity boost based on project metrics
 * Returns 0.9-1.3 multiplier
 */
export function getPopularityBoost(project: FirestoreProject): number {
  let boost = 1.0;

  // Boost for trending (likes + followers)
  const trendingScore = (project.likeCount || 0) + ((project.followCount || 0) * 2);
  if (trendingScore > 100) boost += 0.1;
  if (trendingScore > 500) boost += 0.1;
  if (trendingScore > 1000) boost += 0.1;

  // Small boost for progress
  const progress = (project.raised / project.fundingGoal) * 100;
  if (progress > 25 && progress < 95) {
    boost += 0.05; // Projects with momentum
  }

  // Reduce for stagnant projects
  if (progress < 10) {
    const daysOld = getDaysOld(project.createdAt);
    if (daysOld > 14) {
      boost -= 0.1; // Old project with no traction
    }
  }

  return Math.max(0.9, Math.min(1.3, boost));
}

/**
 * Calculate final personalized score
 */
export function calculatePersonalizedScore(
  project: FirestoreProject,
  userPreferences: UserPreferences,
  supportHistory: any[],
  viewHistory: any[],
  categoryEngagement?: CategoryEngagement[],
  recentRecommendations: string[] = []
): number {
  // Calculate base scores
  const categoryScore = scoreCategoryMatch(project, userPreferences, categoryEngagement);
  const locationScore = scoreLocationMatch(project, userPreferences);
  const historyScore = scoreSupportHistory(project, supportHistory, viewHistory);
  const keywordScore = scoreKeywordMatch(project, userPreferences.keywords);
  const engagementScore = scoreEngagement(project, userPreferences, 0);

  // Weighted average
  const baseScore = (
    categoryScore * 0.30 +
    locationScore * 0.25 +
    historyScore * 0.20 +
    keywordScore * 0.15 +
    engagementScore * 0.10
  );

  // Apply multipliers
  const recencyFactor = applyRecencyFactor(userPreferences.lastActive);
  const diversityFactor = applyDiversityFactor(project, userPreferences, recentRecommendations);
  const popularityBoost = getPopularityBoost(project);

  // Final score
  const finalScore = baseScore * recencyFactor * diversityFactor * popularityBoost;

  return Math.round(finalScore);
}

/**
 * Generate explanation for why project was recommended
 */
export function generateRecommendationReasons(
  project: FirestoreProject,
  userPreferences: UserPreferences,
  scores: {
    category: number;
    location: number;
    history: number;
    keyword: number;
  }
): string[] {
  const reasons: string[] = [];

  if (scores.category > 70) {
    reasons.push(`Matches your interest in ${project.category}`);
  }

  if (scores.location > 70) {
    if (project.location) {
      reasons.push(`Project from ${project.location.city || project.location.state}`);
    }
  }

  if (scores.history > 70) {
    reasons.push('Similar to projects you supported');
  }

  if (scores.keyword > 50) {
    reasons.push('Matches your browsing interests');
  }

  const progress = (project.raised / project.fundingGoal) * 100;
  if (progress > 80 && progress < 100) {
    reasons.push('Almost funded!');
  }

  if ((project.likeCount || 0) > 50) {
    reasons.push('Popular with other supporters');
  }

  const daysOld = getDaysOld(project.createdAt);
  if (daysOld < 3) {
    reasons.push('Just launched');
  }

  return reasons.slice(0, 3); // Max 3 reasons
}

// ==================== HELPER FUNCTIONS ====================

function normalizeStateName(state: string): string {
  // Normalize common variations
  const normalized: { [key: string]: string } = {
    'delhi': 'Delhi',
    'maharashtra': 'Maharashtra',
    'karnataka': 'Karnataka',
    'tamil nadu': 'Tamil Nadu',
    'kerala': 'Kerala',
    // Add more normalizations
  };
  
  return normalized[state.toLowerCase()] || state;
}

function getRegion(state?: string): string | null {
  if (!state) return null;
  
  for (const [region, states] of Object.entries(INDIAN_REGIONS)) {
    if (states.some(s => s.toLowerCase() === state.toLowerCase())) {
      return region;
    }
  }
  
  return null;
}

function getDaysOld(timestamp: any): number {
  const now = Date.now();
  const createdMs = timestamp.toMillis ? timestamp.toMillis() : timestamp;
  return (now - createdMs) / (1000 * 60 * 60 * 24);
}


