import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import { FirestoreProjectAnalytics, FirestoreSupporter } from '../types/firestore';
import { getProjectSupporters } from './firestore';

const ANALYTICS_COLLECTION = 'project-analytics';

// Get today's date in YYYY-MM-DD format
const getTodayDateString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Initialize analytics for a project and date
const initializeAnalytics = async (projectId: string, date: string): Promise<void> => {
  const docId = `${projectId}_${date}`;
  const docRef = doc(db, ANALYTICS_COLLECTION, docId);
  
  await setDoc(docRef, {
    projectId,
    date,
    views: 0,
    uniqueVisitors: 0,
    supporters: 0,
    amountRaised: 0,
    shares: 0,
    likes: 0,
    follows: 0,
    comments: 0,
    cityBreakdown: {},
    stateBreakdown: {},
    deviceBreakdown: {
      mobile: 0,
      desktop: 0,
      tablet: 0
    }
  }, { merge: true });
};

// Track a project view
export const trackProjectView = async (
  projectId: string,
  userId: string | null,
  city?: string,
  state?: string
): Promise<void> => {
  try {
    const date = getTodayDateString();
    const docId = `${projectId}_${date}`;
    const docRef = doc(db, ANALYTICS_COLLECTION, docId);
    
    // Check if document exists, if not initialize it
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await initializeAnalytics(projectId, date);
    }
    
    // Detect device type
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
    const deviceType = isTablet ? 'tablet' : (isMobile ? 'mobile' : 'desktop');
    
    // Update analytics
    const updateData: any = {
      views: increment(1),
      [`deviceBreakdown.${deviceType}`]: increment(1)
    };
    
    // Add geographic data if available
    if (city) {
      updateData[`cityBreakdown.${city}`] = increment(1);
    }
    if (state) {
      updateData[`stateBreakdown.${state}`] = increment(1);
    }
    
    // If user is logged in, track unique visitor
    if (userId) {
      updateData.uniqueVisitors = increment(1);
    }
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error tracking project view:', error);
    // Don't throw error as this shouldn't break the user experience
  }
};

// Track a donation
export const trackProjectDonation = async (
  projectId: string,
  amount: number,
  city?: string,
  state?: string
): Promise<void> => {
  try {
    const date = getTodayDateString();
    const docId = `${projectId}_${date}`;
    const docRef = doc(db, ANALYTICS_COLLECTION, docId);
    
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await initializeAnalytics(projectId, date);
    }
    
    const updateData: any = {
      supporters: increment(1),
      amountRaised: increment(amount)
    };
    
    if (city) {
      updateData[`cityBreakdown.${city}`] = increment(1);
    }
    if (state) {
      updateData[`stateBreakdown.${state}`] = increment(1);
    }
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error tracking project donation:', error);
  }
};

// Track project interaction (like, follow, comment, share)
export const trackProjectInteraction = async (
  projectId: string,
  interactionType: 'likes' | 'follows' | 'comments' | 'shares'
): Promise<void> => {
  try {
    const date = getTodayDateString();
    const docId = `${projectId}_${date}`;
    const docRef = doc(db, ANALYTICS_COLLECTION, docId);
    
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await initializeAnalytics(projectId, date);
    }
    
    await updateDoc(docRef, {
      [interactionType]: increment(1)
    });
  } catch (error) {
    console.error(`Error tracking ${interactionType}:`, error);
  }
};

// Get analytics for a project for a date range
export const getProjectAnalytics = async (
  projectId: string,
  startDate?: string,
  endDate?: string
): Promise<FirestoreProjectAnalytics[]> => {
  try {
    let q = query(
      collection(db, ANALYTICS_COLLECTION),
      where('projectId', '==', projectId),
      orderBy('date', 'desc')
    );
    
    if (startDate && endDate) {
      q = query(
        collection(db, ANALYTICS_COLLECTION),
        where('projectId', '==', projectId),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data() as FirestoreProjectAnalytics);
  } catch (error) {
    console.error('Error getting project analytics:', error);
    return [];
  }
};

// Get aggregated analytics for a project
export const getAggregatedAnalytics = async (
  projectId: string,
  days: number = 30
): Promise<{
  totalViews: number;
  totalUniqueVisitors: number;
  totalSupporters: number;
  totalAmountRaised: number;
  totalShares: number;
  totalLikes: number;
  totalFollows: number;
  totalComments: number;
  cityBreakdown: { [city: string]: number };
  stateBreakdown: { [state: string]: number };
  deviceBreakdown: { mobile: number; desktop: number; tablet: number };
  dailyData: FirestoreProjectAnalytics[];
}> => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];
    
    const analytics = await getProjectAnalytics(projectId, startDateString, endDateString);
    
    // Aggregate data
    const aggregated = {
      totalViews: 0,
      totalUniqueVisitors: 0,
      totalSupporters: 0,
      totalAmountRaised: 0,
      totalShares: 0,
      totalLikes: 0,
      totalFollows: 0,
      totalComments: 0,
      cityBreakdown: {} as { [city: string]: number },
      stateBreakdown: {} as { [state: string]: number },
      deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0 },
      dailyData: analytics
    };
    
    analytics.forEach(day => {
      aggregated.totalViews += day.views || 0;
      aggregated.totalUniqueVisitors += day.uniqueVisitors || 0;
      aggregated.totalSupporters += day.supporters || 0;
      aggregated.totalAmountRaised += day.amountRaised || 0;
      aggregated.totalShares += day.shares || 0;
      aggregated.totalLikes += day.likes || 0;
      aggregated.totalFollows += day.follows || 0;
      aggregated.totalComments += day.comments || 0;
      
      // Aggregate city breakdown
      Object.entries(day.cityBreakdown || {}).forEach(([city, count]) => {
        aggregated.cityBreakdown[city] = (aggregated.cityBreakdown[city] || 0) + count;
      });
      
      // Aggregate state breakdown
      Object.entries(day.stateBreakdown || {}).forEach(([state, count]) => {
        aggregated.stateBreakdown[state] = (aggregated.stateBreakdown[state] || 0) + count;
      });
      
      // Aggregate device breakdown
      aggregated.deviceBreakdown.mobile += day.deviceBreakdown?.mobile || 0;
      aggregated.deviceBreakdown.desktop += day.deviceBreakdown?.desktop || 0;
      aggregated.deviceBreakdown.tablet += day.deviceBreakdown?.tablet || 0;
    });
    
    return aggregated;
  } catch (error) {
    console.error('Error getting aggregated analytics:', error);
    return {
      totalViews: 0,
      totalUniqueVisitors: 0,
      totalSupporters: 0,
      totalAmountRaised: 0,
      totalShares: 0,
      totalLikes: 0,
      totalFollows: 0,
      totalComments: 0,
      cityBreakdown: {},
      stateBreakdown: {},
      deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0 },
      dailyData: []
    };
  }
};

// Get geographic breakdown for a project (India cities)
export const getGeographicBreakdown = async (
  projectId: string
): Promise<{
  cities: { name: string; count: number; percentage: number }[];
  states: { name: string; count: number; percentage: number }[];
}> => {
  try {
    const supporters = await getProjectSupporters(projectId);
    
    const cityCount: { [key: string]: number } = {};
    const stateCount: { [key: string]: number } = {};
    
    supporters.forEach((supporter: FirestoreSupporter) => {
      if (supporter.city) {
        cityCount[supporter.city] = (cityCount[supporter.city] || 0) + 1;
      }
      if (supporter.state) {
        stateCount[supporter.state] = (stateCount[supporter.state] || 0) + 1;
      }
    });
    
    const totalSupporters = supporters.length;
    
    const cities = Object.entries(cityCount)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalSupporters > 0 ? (count / totalSupporters) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
    
    const states = Object.entries(stateCount)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalSupporters > 0 ? (count / totalSupporters) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
    
    return { cities, states };
  } catch (error) {
    console.error('Error getting geographic breakdown:', error);
    return { cities: [], states: [] };
  }
};
