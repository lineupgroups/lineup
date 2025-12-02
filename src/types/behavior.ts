import { Timestamp } from 'firebase/firestore';

// ==================== USER BEHAVIOR TRACKING ====================

export interface ProjectView {
  id: string;
  userId: string;
  projectId: string;
  projectTitle: string;
  category: string;
  keywords: string[];
  viewedAt: Timestamp;
  viewDuration: number; // seconds
  location: {
    city: string;
    state: string;
  };
  deviceType: 'mobile' | 'desktop' | 'tablet';
  scrollDepth: number; // percentage 0-100
  clickedCTA: boolean;
  clickedSupport: boolean;
  clickedShare: boolean;
}

export interface ProjectInteraction {
  id: string;
  userId: string;
  projectId: string;
  projectTitle?: string;
  type: 'like' | 'follow' | 'share' | 'comment' | 'support' | 'view';
  interactedAt: Timestamp;
  category: string;
  keywords: string[];
  metadata?: {
    supportAmount?: number;
    commentText?: string;
    shareTarget?: string;
  };
}

export interface UserPreferences {
  userId: string;
  favoriteCategories: string[]; // Auto-calculated top 5
  preferredLocation: {
    city: string;
    state: string;
  };
  keywords: string[]; // Top 20 extracted keywords
  avgSupportAmount: number;
  lastActive: Timestamp;
  engagementScore: number; // 0-100
  personalityType: 'explorer' | 'supporter' | 'browser' | 'casual';
  totalProjectsViewed: number;
  totalProjectsSupported: number;
  totalInteractions: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CategoryEngagement {
  category: string;
  viewCount: number;
  supportCount: number;
  timeSpent: number; // seconds
  lastEngaged: Timestamp;
  score: number; // 0-100
}

// ==================== RECOMMENDATION SYSTEM ====================

export interface RecommendationScore {
  projectId: string;
  userId: string;
  totalScore: number;
  categoryScore: number;
  locationScore: number;
  historyScore: number;
  keywordScore: number;
  engagementScore: number;
  recencyFactor: number;
  diversityFactor: number;
  popularityBoost: number;
  calculatedAt: Timestamp;
  reasons: string[]; // Why this was recommended
}

export interface RecommendationCache {
  userId: string;
  forYou: string[]; // Project IDs
  nearYou: string[]; // Project IDs
  categoryBased: { [category: string]: string[] };
  similarProjects: { [projectId: string]: string[] };
  discovery: string[]; // Project IDs
  trendingLocal: string[]; // Project IDs
  almostFunded: string[]; // Project IDs
  freshLaunches: string[]; // Project IDs
  cachedAt: Timestamp;
  expiresAt: Timestamp;
}

// ==================== USER JOURNEY ====================

export interface UserSession {
  id: string;
  userId: string;
  startedAt: Timestamp;
  endedAt?: Timestamp;
  duration: number; // seconds
  pagesVisited: string[];
  projectsViewed: string[];
  interactions: ProjectInteraction[];
  deviceType: 'mobile' | 'desktop' | 'tablet';
  referrer?: string;
}

// ==================== TRACKING EVENTS ====================

export interface TrackingEvent {
  type: 'page_view' | 'project_view' | 'interaction' | 'search' | 'filter';
  userId: string;
  timestamp: Timestamp;
  data: any;
}

// ==================== HELPER TYPES ====================

export interface LocationScore {
  distance: 'same_city' | 'same_state' | 'neighboring_state' | 'same_region' | 'other';
  score: number;
}

export interface KeywordMatch {
  keyword: string;
  frequency: number;
  source: 'title' | 'description' | 'category' | 'tags';
  weight: number;
}

export interface EngagementMetrics {
  viewDuration: number;
  scrollDepth: number;
  interactionCount: number;
  returnVisits: number;
  engagementLevel: 'low' | 'medium' | 'high' | 'very_high';
}


