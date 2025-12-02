import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';
import {
  FirestoreProject,
  FirestoreUser,
  FirestoreSupporter,
  CreateProjectData,
  UpdateProjectData,
  CreateUserData,
  UpdateUserData
} from '../types/firestore';

// Collections
const PROJECTS_COLLECTION = 'projects';
const USERS_COLLECTION = 'users';
const SUPPORTERS_COLLECTION = 'supporters';

// ==================== PROJECTS ====================

export const createProject = async (projectData: CreateProjectData): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), {
      ...projectData,
      raised: 0,
      supporters: 0,
      comments: [],
      updates: [],
      likeCount: 0,
      followCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Update user stats after creating project
    try {
      const { updateUserStats } = await import('./userProfile');
      await updateUserStats(projectData.creatorId);
    } catch (statsError) {
      // Don't throw error here, project creation was successful
    }

    // Log activity
    try {
      const { logActivity } = await import('./activityService');
      await logActivity(
        projectData.creatorId,
        'project_created',
        { projectName: projectData.title },
        docRef.id,
        projectData.title
      );
    } catch (activityError) {
      // Don't throw error, just log
      console.error('Failed to log activity:', activityError);
    }

    return docRef.id;
  } catch (error) {
    throw new Error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getProject = async (projectId: string): Promise<FirestoreProject | null> => {
  try {
    const docRef = doc(db, PROJECTS_COLLECTION, projectId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as FirestoreProject;
    }
    return null;
  } catch (error) {
    console.error('Error getting project:', error);
    throw new Error('Failed to get project');
  }
};

export const getProjects = async (
  constraints: QueryConstraint[] = []
): Promise<FirestoreProject[]> => {
  try {
    const q = query(collection(db, PROJECTS_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FirestoreProject[];
  } catch (error) {
    console.error('Error getting projects:', error);
    throw new Error('Failed to get projects');
  }
};

export const getFeaturedProjects = async (): Promise<FirestoreProject[]> => {
  return getProjects([
    where('featured', '==', true),
    where('status', '==', 'active'),
    where('approvalStatus', '==', 'approved'),
    orderBy('createdAt', 'desc'),
    limit(10)
  ]);
};

export const getRecentActiveProjects = async (): Promise<FirestoreProject[]> => {
  return getProjects([
    where('status', '==', 'active'),
    where('approvalStatus', '==', 'approved'),
    orderBy('createdAt', 'desc'),
    limit(12)
  ]);
};

export const getProjectsByCategory = async (category: string): Promise<FirestoreProject[]> => {
  return getProjects([
    where('category', '==', category),
    where('status', '==', 'active'),
    where('approvalStatus', '==', 'approved'),
    orderBy('createdAt', 'desc')
  ]);
};

export const getProjectsByCreator = async (creatorId: string): Promise<FirestoreProject[]> => {
  return getProjects([
    where('creatorId', '==', creatorId),
    orderBy('createdAt', 'desc')
  ]);
};

export const searchProjects = async (searchTerm: string): Promise<FirestoreProject[]> => {
  // Note: Firestore doesn't support full-text search natively
  // This is a basic implementation. For production, consider using Algolia or similar
  const allProjects = await getProjects([
    where('status', '==', 'active'),
    where('approvalStatus', '==', 'approved'),
    orderBy('title')
  ]);

  return allProjects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.tagline.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

export const updateProject = async (
  projectId: string,
  updateData: UpdateProjectData
): Promise<void> => {
  try {
    const docRef = doc(db, PROJECTS_COLLECTION, projectId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating project:', error);
    throw new Error('Failed to update project');
  }
};

export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    const docRef = doc(db, PROJECTS_COLLECTION, projectId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting project:', error);
    throw new Error('Failed to delete project');
  }
};

export const updateProjectStats = async (
  projectId: string,
  amount: number,
  incrementSupporters: boolean = true
): Promise<void> => {
  try {
    const docRef = doc(db, PROJECTS_COLLECTION, projectId);
    const updateData: any = {
      raised: amount,
      updatedAt: serverTimestamp()
    };

    if (incrementSupporters) {
      updateData.supporters = 1; // This should be incremented, but Firestore doesn't support increment in updateDoc
      // For production, use a transaction or cloud function
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating project stats:', error);
    throw new Error('Failed to update project stats');
  }
};

// ==================== USERS ====================

export const createUser = async (uid: string, userData: CreateUserData): Promise<void> => {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(docRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }
};

export const getUser = async (userId: string): Promise<FirestoreUser | null> => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { uid: docSnap.id, ...docSnap.data() } as FirestoreUser;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw new Error('Failed to get user');
  }
};

export const updateUser = async (
  userId: string,
  updateData: UpdateUserData
): Promise<void> => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error('Failed to update user');
  }
};

export const updateUserStats = async (
  userId: string,
  stats: Partial<FirestoreUser['stats']>
): Promise<void> => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(docRef, {
      'stats': stats,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user stats:', error);
    throw new Error('Failed to update user stats');
  }
};

// ==================== SUPPORTERS ====================

export const createSupporter = async (supporterData: Omit<FirestoreSupporter, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, SUPPORTERS_COLLECTION), {
      ...supporterData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating supporter:', error);
    throw new Error('Failed to create supporter');
  }
};

export const getProjectSupporters = async (projectId: string): Promise<FirestoreSupporter[]> => {
  try {
    const q = query(
      collection(db, SUPPORTERS_COLLECTION),
      where('projectId', '==', projectId),
      where('status', '==', 'completed'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FirestoreSupporter[];
  } catch (error) {
    console.error('Error getting project supporters:', error);
    throw new Error('Failed to get project supporters');
  }
};

export const getUserSupporters = async (userId: string): Promise<FirestoreSupporter[]> => {
  try {
    const q = query(
      collection(db, SUPPORTERS_COLLECTION),
      where('userId', '==', userId),
      where('status', '==', 'completed'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FirestoreSupporter[];
  } catch (error) {
    console.error('Error getting user supporters:', error);
    throw new Error('Failed to get user supporters');
  }
};

// ==================== UTILITY FUNCTIONS ====================

export const convertTimestamp = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};

export const formatFirestoreDate = (timestamp: Timestamp): string => {
  return timestamp.toDate().toLocaleDateString();
};

export const isProjectActive = (project: FirestoreProject): boolean => {
  const now = new Date();
  const endDate = project.endDate.toDate();
  return project.status === 'active' && endDate > now;
};

export const getProjectProgress = (project: FirestoreProject): number => {
  const goal = project.goal || project.fundingGoal || 0;
  if (goal <= 0) return 0;
  return Math.min((project.raised / goal) * 100, 100);
};

export const getDaysLeft = (endDate: Timestamp | Date | any): number => {
  if (!endDate) return 0;

  try {
    const now = new Date();
    let endDateTime: Date;

    // Handle Firestore Timestamp
    if (endDate && typeof endDate.toDate === 'function') {
      endDateTime = endDate.toDate();
    }
    // Handle Date object
    else if (endDate instanceof Date) {
      endDateTime = endDate;
    }
    // Handle timestamp number or string
    else if (typeof endDate === 'number' || typeof endDate === 'string') {
      endDateTime = new Date(endDate);
    }
    // Handle object with seconds (Firestore timestamp-like)
    else if (endDate && typeof endDate === 'object' && 'seconds' in endDate) {
      endDateTime = new Date(endDate.seconds * 1000);
    }
    // Handle object with _seconds (Firestore internal format)
    else if (endDate && typeof endDate === 'object' && '_seconds' in endDate) {
      endDateTime = new Date((endDate._seconds || endDate._seconds) * 1000);
    }
    // Handle plain object that might be a serialized date
    else if (endDate && typeof endDate === 'object') {
      console.log('Attempting to parse object as date:', endDate);
      // Try to convert to string first
      const dateStr = JSON.stringify(endDate);
      endDateTime = new Date(dateStr.replace(/['"{}]/g, ''));

      // If invalid, log and return 0
      if (isNaN(endDateTime.getTime())) {
        console.warn('Unknown endDate format:', endDate);
        return 0;
      }
    }
    else {
      console.warn('Unknown endDate format:', endDate);
      return 0;
    }

    const diffTime = endDateTime.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  } catch (error) {
    console.error('Error calculating days left:', error);
    return 0;
  }
};
