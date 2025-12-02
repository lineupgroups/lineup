import { Timestamp } from 'firebase/firestore';

// Success Story for landing page
export interface SuccessStory {
  id: string;
  title: string;
  subtitle?: string;
  projectTitle: string;
  projectId?: string; // Link to actual project
  creatorName: string;
  creatorPhoto?: string;
  amountRaised: number;
  goal: number;
  supportersCount: number;
  location: {
    city: string;
    state: string;
  };
  category: string;
  image: string;
  excerpt: string; // Short description (100-150 chars)
  fullStory?: string; // Full story if needed
  tags?: string[]; // e.g., ["tech", "youth", "regional"]
  featured: boolean; // Show in featured carousel
  order: number; // Display order
  status: 'draft' | 'published';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // Admin user ID
}

// Testimonial from creators/supporters
export interface Testimonial {
  id: string;
  type: 'creator' | 'supporter';
  name: string;
  role?: string; // e.g., "Founder of XYZ", "Student from Chennai"
  photo?: string;
  location?: {
    city: string;
    state: string;
  };
  quote: string; // Main testimonial text (200 chars max)
  projectTitle?: string; // If referring to specific project
  amountRaised?: number; // For creator testimonials
  amountSupported?: number; // For supporter testimonials
  rating?: number; // 1-5 stars
  featured: boolean;
  order: number;
  status: 'draft' | 'published';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // Admin user ID
}

// Platform Statistics
export interface PlatformStats {
  totalProjectsCreated: number;
  totalProjectsFunded: number; // Reached 100% goal
  totalAmountRaised: number;
  totalSupporters: number; // Unique supporters
  totalCreators: number; // Unique creators
  successRate: number; // Percentage of projects that reached goal
  averageProjectSize: number; // Average funding per project
  lastUpdated: Timestamp;
  // These are manual overrides (for initial launch)
  manualStats?: {
    totalProjectsCreated?: number;
    totalProjectsFunded?: number;
    totalAmountRaised?: number;
    totalSupporters?: number;
    successRate?: number;
  };
}

// Recent Activity for live ticker
export interface RecentActivity {
  id: string;
  type: 'support' | 'milestone' | 'project_launched';
  message: string; // Pre-formatted message
  projectId?: string;
  projectTitle?: string;
  supporterName?: string; // "Anonymous" if anonymous
  amount?: number;
  timestamp: Timestamp;
}

// Platform Settings (controlled by admin)
export interface PlatformSettings {
  id: 'landing_page_settings'; // Fixed ID
  // Feature toggles
  showSuccessStories: boolean;
  showStatistics: boolean;
  showTestimonials: boolean;
  showLiveTicker: boolean;
  
  // Statistics mode
  statisticsMode: 'auto' | 'manual'; // Auto-calculate or use manual values
  
  // Live ticker settings
  liveTickerSpeed: number; // Seconds per item (default: 5)
  liveTickerLimit: number; // How many recent activities to show (default: 20)
  
  // Trust badges
  showTrustBadges: boolean;
  
  // Other settings
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  
  updatedAt: Timestamp;
  updatedBy: string; // Admin user ID
}

// FAQ Item
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'creator' | 'supporter' | 'general' | 'payment' | 'legal';
  order: number;
  featured: boolean; // Show on landing page
  status: 'draft' | 'published';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// How It Works Step
export interface HowItWorksStep {
  id: string;
  title: string;
  description: string;
  icon: string; // Icon name (lucide-react)
  order: number;
  forRole: 'creator' | 'supporter' | 'both';
  status: 'active' | 'inactive';
}

// Trust Badge
export interface TrustBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string; // Hex color or Tailwind class
  order: number;
  active: boolean;
}

// Helper types
export type CreateSuccessStoryData = Omit<SuccessStory, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateSuccessStoryData = Partial<Omit<SuccessStory, 'id' | 'createdAt' | 'createdBy'>>;
export type CreateTestimonialData = Omit<Testimonial, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTestimonialData = Partial<Omit<Testimonial, 'id' | 'createdAt' | 'createdBy'>>;
export type CreateFAQItemData = Omit<FAQItem, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateFAQItemData = Partial<Omit<FAQItem, 'id' | 'createdAt' | 'createdBy'>>;

