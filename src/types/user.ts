import { Timestamp } from 'firebase/firestore';

// Enhanced User Profile Types
export interface SocialLinks {
  twitter?: string;
  linkedin?: string;
  github?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  website?: string;
}

export interface UserStats {
  projectsCreated?: number;
  projectsBacked?: number;
  projectsLiked?: number;
  projectsFollowed?: number;
  totalRaised?: number;
  totalBacked?: number;
  followersCount?: number;
  followingCount?: number;
  successRate?: number;
  averageProjectDuration?: number;
}

export interface Achievement {
  id: string;
  type: 'creator' | 'backer' | 'social' | 'milestone';
  title: string;
  description: string;
  icon: string;
  unlockedAt: Timestamp;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  experiencePoints: number;
}

export interface AchievementDefinition {
  id: string;
  type: 'creator' | 'backer' | 'social' | 'milestone';
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  criteria: {
    condition: 'projects_created' | 'amount_raised' | 'projects_backed' | 'followers' | 'social_links';
    threshold: number;
  };
  rewards: {
    experiencePoints: number;
    badge: string;
  };
}

export interface EnhancedUser {
  // Basic Info (existing)
  id: string;
  email: string;
  displayName: string;
  username: string;                    // NEW: Unique username
  profileImage?: string;
  coverImage?: string;                 // NEW: Profile cover/banner image
  createdAt: Timestamp;

  // Enhanced Profile Data
  bio?: string;
  description?: string;
  location?: string;
  jobTitle?: string;

  // Onboarding & Profile Completion
  isProfileComplete: boolean;          // NEW: Onboarding completion
  profileCompletionScore: number;      // NEW: 0-100%
  onboardingStep?: number;             // NEW: Current onboarding step
  usernameChangedAt?: Timestamp;       // NEW: Last username change

  // Social Media Links
  socialLinks: SocialLinks;

  // Profile Settings
  isPublic: boolean;
  showEmail: boolean;
  showStats: boolean;
  showBackedProjects: boolean;
  profileVisibility?: 'public' | 'private'; // NEW: Enhanced privacy
  donateAnonymousByDefault?: boolean;       // NEW: Anonymous donation preference

  // Verification
  isEmailVerified?: boolean;           // NEW: Email verification
  isUsernameVerified?: boolean;        // NEW: Username verification
  verificationBadges?: string[];       // NEW: Verification badges

  // KYC and Creator Verification (NEW)
  kycStatus: 'not_started' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  kycSubmittedAt?: Timestamp;
  kycApprovedAt?: Timestamp;
  kycRejectedAt?: Timestamp;
  kycRejectionReason?: string;
  kycDocumentId?: string; // Reference to kyc_documents collection

  // Creator Eligibility
  isCreatorVerified: boolean;  // TRUE only after KYC approval
  isVerifiedCreator?: boolean; // For profile display (green ring, badge) - set by KYC approval or manual verification
  verifiedAt?: Timestamp;      // When verification was granted
  canCreateProjects: boolean;  // TRUE only after KYC approval
  creatorActivatedAt?: Timestamp; // When they first became creator

  // Statistics (computed/cached)
  stats: UserStats;

  // Achievement System
  achievements: Achievement[];
  level: number;
  experiencePoints: number;

  // Profile Customization
  theme?: 'default' | 'dark' | 'colorful'; // NEW: Profile themes

  // Timestamps
  updatedAt: Timestamp;
  lastActiveAt: Timestamp;
}

export interface UserActivity {
  id: string;
  userId: string;
  type: 'project_created' | 'project_backed' | 'project_completed' | 'achievement_unlocked' | 'profile_updated';
  data: any;
  createdAt: Timestamp;
}

export interface BackedProject {
  id: string;
  userId: string;
  projectId: string;
  amount: number;
  rewardTier?: string;
  backedAt: Timestamp;
  status: 'active' | 'completed' | 'cancelled' | 'refunded';
  anonymous: boolean;
  displayName: string;          // Either real name or anonymous_userXXXX#X
  displayProfileImage?: string; // Profile image or undefined for anonymous
}

// Username validation and onboarding types
export interface UsernameValidation {
  isValid: boolean;
  isAvailable: boolean;
  suggestions?: string[];
  error?: string;
}

export interface OnboardingData {
  displayName: string;
  username: string;
  bio?: string;
  profileImage?: string;
  location?: string;
  website?: string;
}

export interface ProfileCompletion {
  score: number;
  completedFields: string[];
  missingFields: string[];
  recommendations: string[];
}

// Achievement Definitions
export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'first_project',
    type: 'creator',
    title: 'First Steps',
    description: 'Created your first project',
    icon: '🚀',
    rarity: 'common',
    criteria: { condition: 'projects_created', threshold: 1 },
    rewards: { experiencePoints: 100, badge: 'first_project' }
  },
  {
    id: 'rising_star',
    type: 'creator',
    title: 'Rising Star',
    description: 'Raised ₹1 Lakh across all projects',
    icon: '⭐',
    rarity: 'rare',
    criteria: { condition: 'amount_raised', threshold: 100000 },
    rewards: { experiencePoints: 500, badge: 'rising_star' }
  },
  {
    id: 'super_backer',
    type: 'backer',
    title: 'Super Backer',
    description: 'Backed 25+ projects',
    icon: '💝',
    rarity: 'epic',
    criteria: { condition: 'projects_backed', threshold: 25 },
    rewards: { experiencePoints: 750, badge: 'super_backer' }
  },
  {
    id: 'community_leader',
    type: 'social',
    title: 'Community Leader',
    description: '500+ followers',
    icon: '👑',
    rarity: 'legendary',
    criteria: { condition: 'followers', threshold: 500 },
    rewards: { experiencePoints: 1000, badge: 'community_leader' }
  },
  {
    id: 'serial_entrepreneur',
    type: 'creator',
    title: 'Serial Entrepreneur',
    description: 'Created 10+ projects',
    icon: '🔥',
    rarity: 'rare',
    criteria: { condition: 'projects_created', threshold: 10 },
    rewards: { experiencePoints: 600, badge: 'serial_entrepreneur' }
  },
  {
    id: 'social_butterfly',
    type: 'social',
    title: 'Social Butterfly',
    description: 'Connected 5+ social media accounts',
    icon: '🦋',
    rarity: 'common',
    criteria: { condition: 'social_links', threshold: 5 },
    rewards: { experiencePoints: 200, badge: 'social_butterfly' }
  }
];

// User Level System
export const getUserLevel = (experiencePoints: number): number => {
  if (experiencePoints < 100) return 1;
  if (experiencePoints < 300) return 2;
  if (experiencePoints < 600) return 3;
  if (experiencePoints < 1000) return 4;
  if (experiencePoints < 1500) return 5;
  if (experiencePoints < 2100) return 6;
  if (experiencePoints < 2800) return 7;
  if (experiencePoints < 3600) return 8;
  if (experiencePoints < 4500) return 9;
  if (experiencePoints < 5500) return 10;
  return Math.floor(experiencePoints / 1000) + 5;
};

export const getNextLevelXP = (currentLevel: number): number => {
  const levels = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];
  if (currentLevel <= 10) {
    return levels[currentLevel] || (currentLevel - 5) * 1000;
  }
  return (currentLevel - 5) * 1000;
};

