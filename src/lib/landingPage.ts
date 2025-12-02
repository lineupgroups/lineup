import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  setDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import {
  SuccessStory,
  Testimonial,
  PlatformStats,
  PlatformSettings,
  RecentActivity,
  FAQItem,
  CreateSuccessStoryData,
  UpdateSuccessStoryData,
  CreateTestimonialData,
  UpdateTestimonialData,
  CreateFAQItemData,
  UpdateFAQItemData
} from '../types/landingPage';
import { FirestoreProject } from '../types/firestore';

// Collection names
const SUCCESS_STORIES_COLLECTION = 'success-stories';
const TESTIMONIALS_COLLECTION = 'testimonials';
const PLATFORM_STATS_COLLECTION = 'platform-stats';
const PLATFORM_SETTINGS_COLLECTION = 'platform-settings';
const RECENT_ACTIVITY_COLLECTION = 'recent-activity';
const FAQ_COLLECTION = 'faq';
const PROJECTS_COLLECTION = 'projects';
const SUPPORTERS_COLLECTION = 'supporters';

// ==================== SUCCESS STORIES ====================

export const createSuccessStory = async (data: CreateSuccessStoryData): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, SUCCESS_STORIES_COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating success story:', error);
    throw new Error('Failed to create success story');
  }
};

export const updateSuccessStory = async (id: string, data: UpdateSuccessStoryData): Promise<void> => {
  try {
    const docRef = doc(db, SUCCESS_STORIES_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating success story:', error);
    throw new Error('Failed to update success story');
  }
};

export const deleteSuccessStory = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, SUCCESS_STORIES_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting success story:', error);
    throw new Error('Failed to delete success story');
  }
};

export const getSuccessStories = async (published = true): Promise<SuccessStory[]> => {
  try {
    const constraints = [
      orderBy('order', 'asc'),
      orderBy('createdAt', 'desc')
    ];

    if (published) {
      constraints.unshift(where('status', '==', 'published'));
    }

    const q = query(collection(db, SUCCESS_STORIES_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SuccessStory[];
  } catch (error) {
    console.error('Error fetching success stories:', error);
    return [];
  }
};

export const getFeaturedSuccessStories = async (): Promise<SuccessStory[]> => {
  try {
    const q = query(
      collection(db, SUCCESS_STORIES_COLLECTION),
      where('status', '==', 'published'),
      where('featured', '==', true),
      orderBy('order', 'asc'),
      limit(6)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SuccessStory[];
  } catch (error) {
    console.error('Error fetching featured success stories:', error);
    return [];
  }
};

// ==================== TESTIMONIALS ====================

export const createTestimonial = async (data: CreateTestimonialData): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, TESTIMONIALS_COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating testimonial:', error);
    throw new Error('Failed to create testimonial');
  }
};

export const updateTestimonial = async (id: string, data: UpdateTestimonialData): Promise<void> => {
  try {
    const docRef = doc(db, TESTIMONIALS_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    throw new Error('Failed to update testimonial');
  }
};

export const deleteTestimonial = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, TESTIMONIALS_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    throw new Error('Failed to delete testimonial');
  }
};

export const getTestimonials = async (published = true): Promise<Testimonial[]> => {
  try {
    const constraints = [
      orderBy('order', 'asc'),
      orderBy('createdAt', 'desc')
    ];

    if (published) {
      constraints.unshift(where('status', '==', 'published'));
    }

    const q = query(collection(db, TESTIMONIALS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Testimonial[];
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
};

export const getFeaturedTestimonials = async (): Promise<Testimonial[]> => {
  try {
    const q = query(
      collection(db, TESTIMONIALS_COLLECTION),
      where('status', '==', 'published'),
      where('featured', '==', true),
      orderBy('order', 'asc'),
      limit(6)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Testimonial[];
  } catch (error) {
    console.error('Error fetching featured testimonials:', error);
    return [];
  }
};

// ==================== PLATFORM STATISTICS ====================

export const calculatePlatformStats = async (): Promise<PlatformStats> => {
  try {
    // Get all projects
    const projectsSnapshot = await getDocs(collection(db, PROJECTS_COLLECTION));
    const projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FirestoreProject[];
    
    // Get all supporters
    const supportersSnapshot = await getDocs(collection(db, SUPPORTERS_COLLECTION));
    const supporters = supportersSnapshot.docs.map(doc => doc.data());
    
    // Calculate stats
    const totalProjectsCreated = projects.length;
    const totalProjectsFunded = projects.filter(p => p.raised >= p.goal).length;
    const totalAmountRaised = projects.reduce((sum, p) => sum + (p.raised || 0), 0);
    const uniqueSupporters = new Set(supporters.map((s: any) => s.userId)).size;
    const uniqueCreators = new Set(projects.map(p => p.creatorId)).size;
    const successRate = totalProjectsCreated > 0 
      ? (totalProjectsFunded / totalProjectsCreated) * 100 
      : 0;
    const averageProjectSize = totalProjectsCreated > 0
      ? totalAmountRaised / totalProjectsCreated
      : 0;

    const stats: PlatformStats = {
      totalProjectsCreated,
      totalProjectsFunded,
      totalAmountRaised,
      totalSupporters: uniqueSupporters,
      totalCreators: uniqueCreators,
      successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal
      averageProjectSize: Math.round(averageProjectSize),
      lastUpdated: Timestamp.now()
    };

    // Save to Firestore
    const statsRef = doc(db, PLATFORM_STATS_COLLECTION, 'current');
    await updateDoc(statsRef, stats).catch(async () => {
      // If document doesn't exist, create it
      await addDoc(collection(db, PLATFORM_STATS_COLLECTION), { ...stats, id: 'current' });
    });

    return stats;
  } catch (error) {
    console.error('Error calculating platform stats:', error);
    throw new Error('Failed to calculate platform statistics');
  }
};

export const getPlatformStats = async (): Promise<PlatformStats | null> => {
  try {
    const docRef = doc(db, PLATFORM_STATS_COLLECTION, 'current');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as PlatformStats;
    }
    
    // If no stats exist, calculate them
    return await calculatePlatformStats();
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    return null;
  }
};

export const updateManualStats = async (manualStats: Partial<PlatformStats['manualStats']>): Promise<void> => {
  try {
    const statsRef = doc(db, PLATFORM_STATS_COLLECTION, 'current');
    
    // Use setDoc with merge to create or update
    await setDoc(statsRef, {
      manualStats,
      lastUpdated: serverTimestamp()
    }, { merge: true });
    
  } catch (error) {
    console.error('Error updating manual stats:', error);
    throw new Error('Failed to update manual statistics');
  }
};

// ==================== PLATFORM SETTINGS ====================

export const getPlatformSettings = async (): Promise<PlatformSettings | null> => {
  try {
    const docRef = doc(db, PLATFORM_SETTINGS_COLLECTION, 'landing_page_settings');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as PlatformSettings;
    }
    
    // Return default settings if none exist
    const defaultSettings: PlatformSettings = {
      id: 'landing_page_settings',
      showSuccessStories: false, // Off by default until content added
      showStatistics: false,
      showTestimonials: false,
      showLiveTicker: false,
      statisticsMode: 'manual', // Manual by default for new launches
      liveTickerSpeed: 5,
      liveTickerLimit: 20,
      showTrustBadges: true,
      maintenanceMode: false,
      updatedAt: Timestamp.now(),
      updatedBy: 'system'
    };
    
    return defaultSettings;
  } catch (error) {
    console.error('Error fetching platform settings:', error);
    return null;
  }
};

export const updatePlatformSettings = async (
  settings: Partial<PlatformSettings>,
  adminId: string
): Promise<void> => {
  try {
    const docRef = doc(db, PLATFORM_SETTINGS_COLLECTION, 'landing_page_settings');
    
    // Use setDoc with merge option to create or update
    await setDoc(docRef, {
      ...settings,
      updatedAt: serverTimestamp(),
      updatedBy: adminId
    }, { merge: true });
    
  } catch (error) {
    console.error('Error updating platform settings:', error);
    throw new Error('Failed to update platform settings');
  }
};

// ==================== RECENT ACTIVITY (Live Ticker) ====================

export const addRecentActivity = async (activity: Omit<RecentActivity, 'id'>): Promise<void> => {
  try {
    await addDoc(collection(db, RECENT_ACTIVITY_COLLECTION), activity);
    
    // Keep only last 50 activities (cleanup old ones)
    const q = query(
      collection(db, RECENT_ACTIVITY_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.size > 50) {
      const batch = writeBatch(db);
      snapshot.docs.slice(50).forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
  } catch (error) {
    console.error('Error adding recent activity:', error);
  }
};

export const getRecentActivities = async (limitCount = 20): Promise<RecentActivity[]> => {
  try {
    const q = query(
      collection(db, RECENT_ACTIVITY_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as RecentActivity[];
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
};

// ==================== FAQ ====================

export const createFAQItem = async (data: CreateFAQItemData): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, FAQ_COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating FAQ item:', error);
    throw new Error('Failed to create FAQ item');
  }
};

export const updateFAQItem = async (id: string, data: UpdateFAQItemData): Promise<void> => {
  try {
    const docRef = doc(db, FAQ_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating FAQ item:', error);
    throw new Error('Failed to update FAQ item');
  }
};

export const deleteFAQItem = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, FAQ_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting FAQ item:', error);
    throw new Error('Failed to delete FAQ item');
  }
};

export const getFAQItems = async (published = true): Promise<FAQItem[]> => {
  try {
    const constraints = [
      orderBy('category', 'asc'),
      orderBy('order', 'asc')
    ];

    if (published) {
      constraints.unshift(where('status', '==', 'published'));
    }

    const q = query(collection(db, FAQ_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FAQItem[];
  } catch (error) {
    console.error('Error fetching FAQ items:', error);
    return [];
  }
};

export const getFeaturedFAQs = async (): Promise<FAQItem[]> => {
  try {
    const q = query(
      collection(db, FAQ_COLLECTION),
      where('status', '==', 'published'),
      where('featured', '==', true),
      orderBy('order', 'asc'),
      limit(8)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FAQItem[];
  } catch (error) {
    console.error('Error fetching featured FAQs:', error);
    return [];
  }
};

