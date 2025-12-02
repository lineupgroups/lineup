import { LocationData } from '../data/locations';

export enum CompletionLevel {
  INCOMPLETE = 'incomplete',    // < 50%: Missing essential info
  ESSENTIAL = 'essential',      // 50-74%: Name + Username + Location
  ENHANCED = 'enhanced',        // 75-89%: + Photo + Bio  
  COMPLETE = 'complete'         // 90-100%: + Website + Social Links
}

export interface OnboardingProgress {
  level: CompletionLevel;
  percentage: number;
  missingFields: string[];
  nextRecommendations: string[];
  canSkipOnboarding: boolean;
}

export interface EnhancedOnboardingData {
  // Essential Info (Required for basic functionality)
  displayName: string;
  username: string;
  location: LocationData;
  
  // Enhanced Info (Recommended)
  profileImage?: string;
  bio?: string;
  
  // Complete Info (Optional)
  website?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    github?: string;
  };
  
  // System fields
  isProfileComplete?: boolean;
  profileCompletionScore?: number;
  onboardingStep?: number;
  completionLevel?: CompletionLevel;
  lastOnboardingPrompt?: Date;
  onboardingSkippedCount?: number;
}

export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  isRequired: boolean;
  completionWeight: number; // Points towards total completion
  fields: string[];
}

export const ONBOARDING_STEPS_CONFIG: OnboardingStep[] = [
  {
    id: 1,
    title: 'Essential Info',
    description: 'Basic information to get you started',
    isRequired: true,
    completionWeight: 50,
    fields: ['displayName', 'username', 'location']
  },
  {
    id: 2,
    title: 'Profile Enhancement',
    description: 'Make your profile stand out',
    isRequired: false,
    completionWeight: 25,
    fields: ['profileImage', 'bio']
  },
  {
    id: 3,
    title: 'Additional Details',
    description: 'Complete your professional presence',
    isRequired: false,
    completionWeight: 25,
    fields: ['website', 'socialLinks']
  }
];

// Calculate completion level and progress
export const calculateOnboardingProgress = (data: Partial<EnhancedOnboardingData>): OnboardingProgress => {
  let score = 0;
  const missingFields: string[] = [];
  const nextRecommendations: string[] = [];

  // Essential fields (50 points total)
  if (data.displayName?.trim()) {
    score += 15;
  } else {
    missingFields.push('Display Name');
  }

  if (data.username?.trim()) {
    score += 15;
  } else {
    missingFields.push('Username');
  }

  if (data.location?.city && data.location?.state) {
    score += 20;
  } else {
    missingFields.push('Location');
  }

  // Enhanced fields (25 points total)
  if (data.profileImage) {
    score += 15;
  } else {
    nextRecommendations.push('Add a profile photo');
  }

  if (data.bio?.trim()) {
    score += 10;
  } else {
    nextRecommendations.push('Write a short bio');
  }

  // Complete fields (25 points total)
  if (data.website?.trim()) {
    score += 10;
  } else {
    nextRecommendations.push('Add your website');
  }

  if (data.socialLinks && Object.keys(data.socialLinks).length > 0) {
    score += 15;
  } else {
    nextRecommendations.push('Connect social media accounts');
  }

  // Determine completion level
  let level: CompletionLevel;
  let canSkipOnboarding = false;

  if (score < 50) {
    level = CompletionLevel.INCOMPLETE;
    canSkipOnboarding = false; // Cannot skip without essential info
  } else if (score < 75) {
    level = CompletionLevel.ESSENTIAL;
    canSkipOnboarding = true; // Can skip with essential info
  } else if (score < 90) {
    level = CompletionLevel.ENHANCED;
    canSkipOnboarding = true;
  } else {
    level = CompletionLevel.COMPLETE;
    canSkipOnboarding = true;
  }

  return {
    level,
    percentage: Math.min(score, 100),
    missingFields,
    nextRecommendations: nextRecommendations.slice(0, 3), // Show top 3 recommendations
    canSkipOnboarding
  };
};

// Check if user should see onboarding
export const shouldShowOnboarding = (
  progress: OnboardingProgress, 
  lastPrompt?: Date, 
  skipCount: number = 0
): boolean => {
  // Always show for incomplete profiles
  if (progress.level === CompletionLevel.INCOMPLETE) {
    return true;
  }

  // Don't show if user has skipped too many times recently
  if (skipCount >= 3) {
    const daysSinceLastPrompt = lastPrompt 
      ? Math.floor((Date.now() - lastPrompt.getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    if (daysSinceLastPrompt < 7) { // Wait a week before prompting again
      return false;
    }
  }

  // Show for essential and enhanced levels occasionally
  if (progress.level === CompletionLevel.ESSENTIAL || progress.level === CompletionLevel.ENHANCED) {
    const daysSinceLastPrompt = lastPrompt 
      ? Math.floor((Date.now() - lastPrompt.getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    return daysSinceLastPrompt >= 3; // Show every 3 days
  }

  // Don't show for complete profiles
  return false;
};

// Get contextual onboarding message
export const getOnboardingMessage = (progress: OnboardingProgress): string => {
  switch (progress.level) {
    case CompletionLevel.INCOMPLETE:
      return `Complete your profile to get started (${progress.percentage}%)`;
    case CompletionLevel.ESSENTIAL:
      return `Enhance your profile to stand out (${progress.percentage}%)`;
    case CompletionLevel.ENHANCED:
      return `Almost done! Complete your profile (${progress.percentage}%)`;
    case CompletionLevel.COMPLETE:
      return `Your profile is complete! (${progress.percentage}%)`;
    default:
      return 'Complete your profile';
  }
};

