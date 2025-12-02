import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { FirestoreUser, FirestoreProject, FirestoreSupporter } from '../types/firestore';

const USERS_COLLECTION = 'users';
const PROJECTS_COLLECTION = 'projects';
const SUPPORTERS_COLLECTION = 'supporters';

// ==================== USER ANALYTICS ====================

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number; // Logged in within last 30 days
  inactiveUsers: number;
  creators: number;
  supporters: number;
  verifiedCreators: number;
  suspendedUsers: number;
  bannedUsers: number;
  userGrowth: {
    date: string;
    count: number;
  }[];
  creatorVsSupporterRatio: {
    creators: number;
    supporters: number;
    both: number;
    neitherYet: number;
  };
  geographicDistribution: {
    state: string;
    count: number;
  }[];
  cityDistribution: {
    city: string;
    count: number;
  }[];
  retentionMetrics: {
    week1: number; // % still active after 1 week
    week2: number;
    month1: number;
  };
}

// Get all users for analytics
export const getUserAnalytics = async (): Promise<UserAnalytics> => {
  try {
    // Fetch all users
    const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
    const users: FirestoreUser[] = [];
    
    usersSnapshot.forEach((doc) => {
      users.push({ uid: doc.id, ...doc.data() } as FirestoreUser);
    });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate active users (logged in within last 30 days)
    const activeUsers = users.filter(user => {
      if (!user.lastLoginAt) return false;
      const lastLogin = user.lastLoginAt.toDate ? user.lastLoginAt.toDate() : new Date(user.lastLoginAt);
      return lastLogin > thirtyDaysAgo;
    });

    // Calculate creators and supporters
    const creators = users.filter(u => (u.stats?.projectsCreated || 0) > 0);
    const supporters = users.filter(u => (u.stats?.projectsSupported || 0) > 0);
    
    // Both creators AND supporters
    const both = users.filter(u => 
      (u.stats?.projectsCreated || 0) > 0 && 
      (u.stats?.projectsSupported || 0) > 0
    );
    
    // Neither created nor supported yet
    const neitherYet = users.filter(u => 
      (u.stats?.projectsCreated || 0) === 0 && 
      (u.stats?.projectsSupported || 0) === 0
    );

    // User growth over time (last 30 days)
    const userGrowth = calculateUserGrowth(users, 30);

    // Geographic distribution
    const stateDistribution = calculateStateDistribution(users);
    const cityDistribution = calculateCityDistribution(users);

    // Retention metrics (simplified)
    const retentionMetrics = calculateRetentionMetrics(users);

    return {
      totalUsers: users.length,
      activeUsers: activeUsers.length,
      inactiveUsers: users.length - activeUsers.length,
      creators: creators.length,
      supporters: supporters.length,
      verifiedCreators: users.filter(u => u.isVerifiedCreator).length,
      suspendedUsers: users.filter(u => u.isSuspended).length,
      bannedUsers: users.filter(u => u.isBanned).length,
      userGrowth,
      creatorVsSupporterRatio: {
        creators: creators.length - both.length, // Only creators
        supporters: supporters.length - both.length, // Only supporters
        both: both.length,
        neitherYet: neitherYet.length
      },
      geographicDistribution: stateDistribution,
      cityDistribution: cityDistribution,
      retentionMetrics
    };
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    throw new Error('Failed to fetch user analytics');
  }
};

// Calculate user growth over time
const calculateUserGrowth = (users: FirestoreUser[], days: number): { date: string; count: number }[] => {
  const growth: { date: string; count: number }[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    
    // Count users created up to this date
    const count = users.filter(user => {
      const createdAt = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
      return createdAt <= date;
    }).length;

    growth.push({ date: dateStr, count });
  }

  return growth;
};

// Calculate state distribution
const calculateStateDistribution = (users: FirestoreUser[]): { state: string; count: number }[] => {
  const stateMap: { [state: string]: number } = {};

  users.forEach(user => {
    if (user.state) {
      stateMap[user.state] = (stateMap[user.state] || 0) + 1;
    }
  });

  return Object.entries(stateMap)
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 states
};

// Calculate city distribution
const calculateCityDistribution = (users: FirestoreUser[]): { city: string; count: number }[] => {
  const cityMap: { [city: string]: number } = {};

  users.forEach(user => {
    if (user.city) {
      cityMap[user.city] = (cityMap[user.city] || 0) + 1;
    }
  });

  return Object.entries(cityMap)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15); // Top 15 cities
};

// Calculate retention metrics (simplified)
const calculateRetentionMetrics = (users: FirestoreUser[]): {
  week1: number;
  week2: number;
  month1: number;
} => {
  const now = new Date();
  const week1Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const week2Ago = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const month1Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Users who joined at least 1 week ago
  const usersFromWeek1 = users.filter(user => {
    const createdAt = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
    return createdAt <= week1Ago;
  });

  // Of those, how many are still active?
  const activeFromWeek1 = usersFromWeek1.filter(user => {
    if (!user.lastLoginAt) return false;
    const lastLogin = user.lastLoginAt.toDate ? user.lastLoginAt.toDate() : new Date(user.lastLoginAt);
    return lastLogin > week1Ago;
  });

  // Users who joined at least 2 weeks ago
  const usersFromWeek2 = users.filter(user => {
    const createdAt = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
    return createdAt <= week2Ago;
  });

  const activeFromWeek2 = usersFromWeek2.filter(user => {
    if (!user.lastLoginAt) return false;
    const lastLogin = user.lastLoginAt.toDate ? user.lastLoginAt.toDate() : new Date(user.lastLoginAt);
    return lastLogin > week2Ago;
  });

  // Users who joined at least 1 month ago
  const usersFromMonth1 = users.filter(user => {
    const createdAt = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
    return createdAt <= month1Ago;
  });

  const activeFromMonth1 = usersFromMonth1.filter(user => {
    if (!user.lastLoginAt) return false;
    const lastLogin = user.lastLoginAt.toDate ? user.lastLoginAt.toDate() : new Date(user.lastLoginAt);
    return lastLogin > month1Ago;
  });

  return {
    week1: usersFromWeek1.length > 0 
      ? Math.round((activeFromWeek1.length / usersFromWeek1.length) * 100) 
      : 0,
    week2: usersFromWeek2.length > 0 
      ? Math.round((activeFromWeek2.length / usersFromWeek2.length) * 100) 
      : 0,
    month1: usersFromMonth1.length > 0 
      ? Math.round((activeFromMonth1.length / usersFromMonth1.length) * 100) 
      : 0
  };
};

// ==================== USER SEARCH & FILTERS ====================

export interface UserSearchFilters {
  searchTerm?: string; // Search by name, email, username
  role?: 'creator' | 'supporter' | 'both' | 'none';
  registrationDateFrom?: Date;
  registrationDateTo?: Date;
  activityLevel?: 'active' | 'inactive';
  isVerified?: boolean;
  isSuspended?: boolean;
  isBanned?: boolean;
  state?: string;
  city?: string;
}

export const searchUsers = async (filters: UserSearchFilters): Promise<FirestoreUser[]> => {
  try {
    // Fetch all users (in production, you'd want server-side filtering)
    const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
    let users: FirestoreUser[] = [];
    
    usersSnapshot.forEach((doc) => {
      users.push({ uid: doc.id, ...doc.data() } as FirestoreUser);
    });

    // Apply filters
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      users = users.filter(user => 
        user.displayName?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term)
      );
    }

    if (filters.role) {
      if (filters.role === 'creator') {
        users = users.filter(u => (u.stats?.projectsCreated || 0) > 0);
      } else if (filters.role === 'supporter') {
        users = users.filter(u => (u.stats?.projectsSupported || 0) > 0);
      } else if (filters.role === 'both') {
        users = users.filter(u => 
          (u.stats?.projectsCreated || 0) > 0 && 
          (u.stats?.projectsSupported || 0) > 0
        );
      } else if (filters.role === 'none') {
        users = users.filter(u => 
          (u.stats?.projectsCreated || 0) === 0 && 
          (u.stats?.projectsSupported || 0) === 0
        );
      }
    }

    if (filters.registrationDateFrom) {
      users = users.filter(user => {
        const createdAt = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
        return createdAt >= filters.registrationDateFrom!;
      });
    }

    if (filters.registrationDateTo) {
      users = users.filter(user => {
        const createdAt = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
        return createdAt <= filters.registrationDateTo!;
      });
    }

    if (filters.activityLevel) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      if (filters.activityLevel === 'active') {
        users = users.filter(user => {
          if (!user.lastLoginAt) return false;
          const lastLogin = user.lastLoginAt.toDate ? user.lastLoginAt.toDate() : new Date(user.lastLoginAt);
          return lastLogin > thirtyDaysAgo;
        });
      } else {
        users = users.filter(user => {
          if (!user.lastLoginAt) return true;
          const lastLogin = user.lastLoginAt.toDate ? user.lastLoginAt.toDate() : new Date(user.lastLoginAt);
          return lastLogin <= thirtyDaysAgo;
        });
      }
    }

    if (filters.isVerified !== undefined) {
      users = users.filter(u => u.isVerifiedCreator === filters.isVerified);
    }

    if (filters.isSuspended !== undefined) {
      users = users.filter(u => u.isSuspended === filters.isSuspended);
    }

    if (filters.isBanned !== undefined) {
      users = users.filter(u => u.isBanned === filters.isBanned);
    }

    if (filters.state) {
      users = users.filter(u => u.state === filters.state);
    }

    if (filters.city) {
      users = users.filter(u => u.city === filters.city);
    }

    return users;
  } catch (error) {
    console.error('Error searching users:', error);
    throw new Error('Failed to search users');
  }
};

// Get user details with full info
export const getUserFullDetails = async (userId: string): Promise<{
  user: FirestoreUser;
  projects: FirestoreProject[];
  supportedProjects: FirestoreSupporter[];
  activitySummary: {
    totalProjects: number;
    activeProjects: number;
    totalSupported: number;
    totalRaised: number;
    totalSpent: number;
  };
}> => {
  try {
    // Get user
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    const user = { uid: userDoc.id, ...userDoc.data() } as FirestoreUser;

    // Get user's projects
    const projectsQuery = query(
      collection(db, PROJECTS_COLLECTION),
      where('creatorId', '==', userId)
    );
    const projectsSnapshot = await getDocs(projectsQuery);
    const projects: FirestoreProject[] = [];
    projectsSnapshot.forEach(doc => {
      projects.push({ id: doc.id, ...doc.data() } as FirestoreProject);
    });

    // Get supported projects
    const supportedQuery = query(
      collection(db, SUPPORTERS_COLLECTION),
      where('userId', '==', userId)
    );
    const supportedSnapshot = await getDocs(supportedQuery);
    const supportedProjects: FirestoreSupporter[] = [];
    supportedSnapshot.forEach(doc => {
      supportedProjects.push({ id: doc.id, ...doc.data() } as FirestoreSupporter);
    });

    // Calculate activity summary
    const totalRaised = projects.reduce((sum, p) => sum + (p.raised || 0), 0);
    const totalSpent = supportedProjects.reduce((sum, s) => sum + (s.amount || 0), 0);
    const activeProjects = projects.filter(p => p.status === 'active').length;

    return {
      user,
      projects,
      supportedProjects,
      activitySummary: {
        totalProjects: projects.length,
        activeProjects,
        totalSupported: supportedProjects.length,
        totalRaised,
        totalSpent
      }
    };
  } catch (error) {
    console.error('Error fetching user full details:', error);
    throw new Error('Failed to fetch user details');
  }
};

// Import getDoc
import { getDoc } from 'firebase/firestore';


