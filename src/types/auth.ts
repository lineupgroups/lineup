import { User as FirebaseUser } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

export type UserRole = 'supporter' | 'creator' | 'hybrid';
export type UserMode = 'supporter' | 'creator';

export interface ModeSwitch {
  from: UserMode;
  to: UserMode;
  switchedAt: Date;
}

export interface UserRolePreferences {
  primaryRole: UserRole;
  defaultMode: UserMode;
  hasCreatedProjects: boolean;
  hasBackedProjects: boolean;
  roleHistory: ModeSwitch[];
  preferredStartMode?: UserMode;

  // NEW: KYC-based creator access
  canAccessCreatorMode: boolean; // Only true if KYC approved
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  username?: string; // NEW: Username for @username URLs
  photoURL?: string;
  profileImage?: string; // NEW: Profile image URL from our system
  bio?: string;
  location?: string;
  isProfileComplete?: boolean; // NEW: Onboarding completion
  profileCompletionScore?: number; // NEW: 0-100%
  onboardingStep?: number; // NEW: Current onboarding step
  createdAt: Date;
  updatedAt: Date;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  stats?: {
    projectsCreated: number;
    projectsSupported: number;
    totalRaised: number;
    totalSupported: number;
  };
  // NEW: Role management
  rolePreferences?: UserRolePreferences;
  currentMode?: UserMode;
  // NEW: Supporter preferences
  interests?: string[];
  supporterOnboardingComplete?: boolean;

  // NEW: KYC and Creator Verification
  kycStatus?: 'not_started' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  kycSubmittedAt?: Date;
  kycApprovedAt?: Date;
  kycRejectedAt?: Date;
  kycRejectionReason?: string;
  kycDocumentId?: string;
  isCreatorVerified?: boolean;
  canCreateProjects?: boolean;
  creatorActivatedAt?: Date;
}

export interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  currentMode: UserMode;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUserData: () => Promise<void>;
  switchMode: (mode: UserMode) => Promise<void>;
  getUserRole: () => UserRole;
}
