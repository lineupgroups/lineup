import { Timestamp } from 'firebase/firestore';

// Step 1: Basics
export interface ProjectBasics {
  title: string;
  tagline: string;
  category: string;
  location: {
    state: string;
    city: string;
  };
  coverImage: string;
  videoUrl: string; // YouTube only
  fundingGoal: number;
  duration: number; // 1-40 days, custom
}

// Step 2: Story
export interface ProjectStory {
  description: string; // What are you creating?
  why: string; // Why does this matter?
  fundBreakdown: Array<{
    item: string;
    amount: number;
  }>;
  gallery: string[]; // Max 7 images
  timeline?: Array<{
    month: number;
    milestone: string;
  }>;
  risks?: string;
}

// Step 3: Creator (uses existing profile, no additional fields needed)
export interface ProjectCreator {
  // All fields come from user profile
  creatorId: string;
  creatorName: string;
  creatorBio: string;
  creatorPhoto: string;
  socialLinks?: {
    instagram?: string;
    youtube?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
}

// Step 4: Verification & Launch
export interface KYCDocument {
  aadhaarNumber: string; // Full number for verification
  panCard: string;
  addressProof: string; // Image URL
  verified: boolean;
  verifiedAt?: Timestamp;
}

export interface ParentGuardianKYC {
  parentName: string;
  parentPhone: string;
  relationship: 'parent' | 'guardian';
  consentGiven: boolean;
  consentDate?: Timestamp;
  kyc: KYCDocument;
}

export interface PaymentMethod {
  type: 'bank' | 'upi';
  // For Bank
  bankDetails?: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  // For UPI
  upiId?: string;
  isPrimary: boolean;
}

export interface ProjectVerificationAndLaunch {
  // Age-based KYC
  creatorAge: number;
  kycType: 'self' | 'parent_guardian';

  // For minors (15-17)
  parentGuardianKYC?: ParentGuardianKYC;

  // For adults (18-30)
  selfKYC?: KYCDocument;

  // Payment methods
  paymentMethods: PaymentMethod[];

  // Launch settings
  launch: {
    type: 'immediate' | 'scheduled';
    scheduledDate?: Date;
    privacy: 'public' | 'unlisted';
  };

  // Notifications
  notifications: {
    emailOnDonation: boolean;
    smsOnMilestone: boolean;
    weeklySummary: boolean;
  };
}

// Complete Project Creation Data
export interface ProjectCreationData {
  step: 1 | 2 | 3 | 4;
  basics?: ProjectBasics;
  story?: ProjectStory;
  creator?: ProjectCreator;
  verificationAndLaunch?: ProjectVerificationAndLaunch;

  // Metadata
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  status: 'draft' | 'pending_verification' | 'published';
}

// Project Categories
export const PROJECT_CATEGORIES = [
  { value: 'art_design', label: 'Art & Design', icon: '🎨' },
  { value: 'technology', label: 'Technology & Innovation', icon: '💻' },
  { value: 'social_impact', label: 'Social Impact', icon: '🌍' },
  { value: 'education', label: 'Education', icon: '📚' },
  { value: 'film_video', label: 'Film & Video', icon: '🎬' },
  { value: 'music', label: 'Music', icon: '🎵' },
  { value: 'gaming', label: 'Gaming', icon: '🎮' },
  { value: 'fashion', label: 'Fashion', icon: '👗' },
  { value: 'food_beverage', label: 'Food & Beverage', icon: '🍔' },
  { value: 'sports_fitness', label: 'Sports & Fitness', icon: '⚽' },
  { value: 'others', label: 'Others', icon: '✨' }
];

// Duration presets
export const DURATION_PRESETS = [
  { value: 30, label: '30 days (Recommended)' },
  { value: 45, label: '45 days' },
  { value: 60, label: '60 days' }
];

// Maximum values
export const PROJECT_LIMITS = {
  MAX_TITLE_LENGTH: 60,
  MAX_TAGLINE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_WHY_LENGTH: 2000,
  MAX_RISKS_LENGTH: 1000,
  MAX_GALLERY_IMAGES: 7,
  MIN_FUNDING_GOAL: 10000, // ₹10,000
  MAX_FUNDING_GOAL: 10000000, // ₹1,00,00,000
  MIN_DURATION_DAYS: 1,
  MAX_DURATION_DAYS: 40,
  MAX_TIMELINE_ITEMS: 12,
  MAX_FUND_BREAKDOWN_ITEMS: 10
};

// Validation helpers
export const validateYouTubeUrl = (url: string): boolean => {
  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/(www\.)?youtu\.be\/[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/
  ];
  return patterns.some(pattern => pattern.test(url));
};

export const extractYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

export const calculatePlatformFee = (amount: number, feePercentage: number = 5): number => {
  return Math.round(amount * (feePercentage / 100));
};
