import { Timestamp } from 'firebase/firestore';

export interface FirestoreProject {
  id: string;
  title: string;
  tagline: string;
  description: string;
  fullDescription: string;
  image: string;
  video?: string;
  creatorId: string;
  category: 'Tech' | 'Education' | 'Art' | 'Social Impact';
  goal: number;
  raised: number;
  daysLeft: number;
  supporters: number;
  featured: boolean;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled' | 'pending_verification' | 'rejected' | 'approved_scheduled' | 'suspended' | 'funded';
  // Location can be either string (legacy) or object (new format)
  location?: string | { city?: string; state?: string; country?: string };
  // Story details from project creation
  story?: {
    why: string;
    fundBreakdown: Array<{
      item: string;
      amount: number;
    }>;
    timeline?: Array<{
      month: number;
      milestone: string;
    }>;
    risks?: string;
  };
  gallery?: string[]; // Project gallery images
  // FAQs for project
  faqs?: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
  // Creator ID alias (for compatibility)
  createdBy?: string;
  // Admin approval status
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedAt?: Timestamp;
  approvedBy?: string; // Admin user ID who approved
  rejectedAt?: Timestamp;
  rejectedBy?: string; // Admin user ID who rejected
  rejectionReason?: string;
  // Admin actions
  suspendedAt?: Timestamp;
  suspendedBy?: string; // Admin user ID who suspended
  suspensionReason?: string;
  adminChangeRequests?: AdminChangeRequest[]; // Admin requests for changes
  reportCount?: number; // Number of reports against this project
  createdAt: Timestamp;
  updatedAt: Timestamp;
  endDate: Timestamp;
  // Launch settings
  launchType?: 'immediate' | 'scheduled';
  scheduledDate?: Timestamp;
  launchedAt?: Timestamp;
  rewards: FirestoreRewardTier[]; // Kept for backward compatibility but not used
  updates: FirestoreProjectUpdate[]; // Array kept for backward compatibility
  comments: FirestoreComment[]; // Array kept for backward compatibility
  // Interaction counts
  likeCount?: number;
  followCount?: number;
  // Analytics
  viewCount?: number;
  views?: number; // Alias for viewCount
  uniqueViewers?: string[]; // Array of user IDs who viewed
  // Funding
  fundingGoal?: number; // Alias for goal
  // Archive
  isArchived?: boolean;
  archivedAt?: Timestamp | null;
}

// Deprecated - Keeping for backward compatibility but system is donation-based now
export interface FirestoreRewardTier {
  id: string;
  amount: number;
  title: string;
  description: string;
  estimatedDelivery: string;
  available: number;
  claimed: number;
}

// Project Update (now stored in separate collection)
export interface FirestoreProjectUpdate {
  id: string;
  projectId: string;
  title: string;
  content: string;
  image?: string;
  videoUrl?: string; // YouTube video URL
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  scheduledFor?: Timestamp | null; // For scheduled updates
  likes: number;
  likedBy?: string[]; // Array of user IDs who liked
  commentCount: number;
  viewCount?: number; // Number of views
  visibility: 'supporters-only'; // All updates are supporters-only
  isPinned: boolean;
}

// Update Comment (comments on project updates)
export interface FirestoreUpdateComment {
  id: string;
  updateId: string;
  projectId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  likes: number;
  likedBy?: string[];
  isCreatorComment: boolean;
  isDeleted: boolean;
  creatorHeart?: boolean;
  creatorHeartAt?: Timestamp;
  parentCommentId?: string; // For nested replies
  isEdited?: boolean; // Track if comment was edited
}

// Project Comment (now stored in separate collection)
export interface FirestoreComment {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  likes: number;
  likedBy?: string[]; // Array of user IDs who liked
  parentCommentId?: string; // For nested replies
  isCreatorComment: boolean;
  isPinned: boolean;
  isDeleted: boolean;
  isSupporter: boolean; // Only supporters can comment
  // Creator Heart feature (like YouTube)
  creatorHeart?: boolean; // True if creator gave a heart
  creatorHeartAt?: Timestamp; // When the heart was given
}

export interface FirestoreUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  username?: string; // Optional username for @username routing
  bio?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  twitter?: string;
  instagram?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
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
  // Admin moderation
  isSuspended?: boolean;
  suspendedAt?: Timestamp;
  suspendedBy?: string; // Admin UID
  suspensionReason?: string;
  isBanned?: boolean;
  bannedAt?: Timestamp;
  bannedBy?: string; // Admin UID
  banReason?: string;
  reportCount?: number; // Number of reports against this user
  // Verification
  isVerifiedCreator?: boolean;
  verifiedAt?: Timestamp;
  verifiedBy?: string; // Admin UID
  // Activity tracking
  lastActiveAt?: Timestamp;
  lastLoginAt?: Timestamp;
}

// Donation-based supporter (no rewards)
export interface FirestoreSupporter {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userAvatar: string;
  amount: number;
  message?: string; // Optional message from supporter
  createdAt: Timestamp;
  status: 'pending' | 'completed' | 'refunded';
  paymentMethod?: string; // For display only (mocked)
  transactionId?: string; // Mocked transaction ID
  anonymous: boolean; // Hide name from public supporter list
  // Geographic data
  city?: string;
  state?: string;
}

// In-app notification
export interface FirestoreNotification {
  id: string;
  userId: string; // Who receives this notification
  type: 'new_supporter' | 'milestone' | 'comment' | 'project_ending' | 'project_update' | 'project_funded' | 'update_comment' | 'update_comment_reply' | 'update_comment_heart';
  title: string;
  message: string;
  projectId?: string;
  projectTitle?: string;
  updateId?: string; // For update-related notifications
  updateTitle?: string; // For update-related notifications
  relatedUserId?: string; // ID of user who triggered the notification
  relatedUserName?: string;
  createdAt: Timestamp;
  read: boolean;
  readAt?: Timestamp;
  actionUrl?: string; // Where to navigate when clicked
}

// Project Analytics (stored per project)
export interface FirestoreProjectAnalytics {
  projectId: string;
  date: string; // Format: YYYY-MM-DD for daily aggregation
  views: number;
  uniqueVisitors: number;
  supporters: number;
  amountRaised: number;
  shares: number;
  likes: number;
  follows: number;
  comments: number;
  // Geographic breakdown (India only)
  cityBreakdown: { [city: string]: number }; // e.g., { "Chennai": 45, "Mumbai": 32 }
  stateBreakdown: { [state: string]: number };
  // Device breakdown
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
}

// Creator earnings (mocked payouts)
export interface FirestoreCreatorEarnings {
  userId: string;
  totalRaised: number;
  availableBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  platformFees: number; // Mocked (e.g., 5%)
  currency: string;
  lastUpdated: Timestamp;
  // Bank details (for display only, not real)
  bankDetails?: {
    accountHolderName: string;
    accountNumber: string; // Masked except last 4 digits
    ifscCode: string;
    bankName: string;
    verified: boolean;
  };
}

// Payout request (mocked)
export interface FirestorePayout {
  id: string;
  creatorId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: Timestamp;
  processedAt?: Timestamp;
  completedAt?: Timestamp;
  method: 'bank_transfer' | 'upi';
  upiId?: string;
  reference: string; // Mocked reference number
  failureReason?: string;
}

// Admin change request
export interface AdminChangeRequest {
  id: string;
  requestedBy: string; // Admin UID
  requestedAt: Timestamp;
  message: string;
  field?: string; // Optional: specific field to change
  status: 'pending' | 'addressed' | 'dismissed';
  addressedAt?: Timestamp;
}

// Report system
export interface FirestoreReport {
  id: string;
  reportType: 'project' | 'user' | 'comment';
  targetId: string; // ID of reported item
  targetType: 'project' | 'user' | 'comment';
  reportedBy: string; // User ID who reported
  reporterName: string;
  reporterEmail: string;
  category: 'spam' | 'fraud' | 'inappropriate_content' | 'harassment' | 'misinformation' | 'other';
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string; // Admin UID
  resolution?: string;
  actionTaken?: 'none' | 'warning' | 'content_removed' | 'user_suspended' | 'user_banned' | 'project_suspended';
  // Auto-flagging
  autoFlagged?: boolean;
  flaggedKeywords?: string[];
  // Additional context
  projectTitle?: string; // If reporting a project
  userName?: string; // If reporting a user
}

// User activity log
export interface FirestoreActivityLog {
  id: string;
  userId: string;
  userName: string;
  activityType: 'project_created' | 'project_supported' | 'comment_posted' | 'profile_updated' | 'login' | 'logout';
  description: string;
  metadata?: {
    projectId?: string;
    projectTitle?: string;
    amount?: number;
    [key: string]: any;
  };
  createdAt: Timestamp;
  ipAddress?: string;
  userAgent?: string;
}

// Admin action log (for audit trail)
export interface FirestoreAdminLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: 'approve_project' | 'reject_project' | 'suspend_project' | 'reactivate_project' | 'feature_project' | 'unfeature_project' | 'suspend_user' | 'ban_user' | 'unban_user' | 'verify_creator' | 'unverify_creator' | 'resolve_report' | 'request_changes';
  targetType: 'project' | 'user' | 'report';
  targetId: string;
  targetName: string;
  details: string;
  metadata?: {
    reason?: string;
    previousStatus?: string;
    newStatus?: string;
    [key: string]: any;
  };
  createdAt: Timestamp;
}

// Keyword flags for auto-moderation
export interface FirestoreKeywordFlag {
  id: string;
  keyword: string;
  category: 'spam' | 'fraud' | 'inappropriate' | 'harassment';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  createdAt: Timestamp;
  createdBy: string; // Admin UID
}

// Helper types for creating/updating documents
export type CreateProjectData = Omit<FirestoreProject, 'id' | 'createdAt' | 'updatedAt' | 'raised' | 'supporters' | 'comments' | 'updates' | 'viewCount' | 'uniqueViewers' | 'approvedAt' | 'approvedBy' | 'rejectedAt' | 'rejectedBy'>;
export type UpdateProjectData = Partial<Omit<FirestoreProject, 'id' | 'createdAt' | 'creatorId'>>;
export type CreateUserData = Omit<FirestoreUser, 'uid' | 'createdAt' | 'updatedAt'>;
export type UpdateUserData = Partial<Omit<FirestoreUser, 'uid' | 'createdAt'>>;
export type CreateProjectUpdateData = Omit<FirestoreProjectUpdate, 'id' | 'createdAt' | 'likes' | 'likedBy' | 'commentCount'>;
export type CreateCommentData = Omit<FirestoreComment, 'id' | 'createdAt' | 'likes' | 'likedBy' | 'isPinned' | 'isDeleted'>;
export type CreateNotificationData = Omit<FirestoreNotification, 'id' | 'createdAt' | 'read' | 'readAt'>;
export type CreateReportData = Omit<FirestoreReport, 'id' | 'createdAt' | 'reviewedAt' | 'reviewedBy' | 'resolution' | 'actionTaken'>;
export type CreateActivityLogData = Omit<FirestoreActivityLog, 'id' | 'createdAt'>;
export type CreateAdminLogData = Omit<FirestoreAdminLog, 'id' | 'createdAt'>;

export interface FirestoreDonation {
  id: string;
  userId: string;
  projectId: string;
  amount: number;
  rewardTier?: string | null;
  backedAt: Timestamp;
  status: 'active' | 'refunded' | 'cancelled';
  anonymous: boolean;
  displayName?: string;
  displayProfileImage?: string | null;
  transactionId: string;
  paymentReference: string;
  paymentDetails?: any;
  // Helper fields for display (optional)
  donorId?: string; // Alias for userId
  donorName?: string; // Alias for displayName
  projectTitle?: string;
  createdAt?: Timestamp; // Alias for backedAt
}
