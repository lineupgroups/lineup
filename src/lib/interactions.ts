import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  increment,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { FirestoreProject } from '../types/firestore';

// Types for interactions
export interface ProjectLike {
  id: string;
  userId: string;
  projectId: string;
  createdAt: Timestamp;
}

export interface ProjectFollow {
  id: string;
  userId: string;
  projectId: string;
  createdAt: Timestamp;
}

export interface InteractionCounts {
  likes: number;
  follows: number;
}

// Like functionality
export const likeProject = async (userId: string, projectId: string): Promise<void> => {
  const batch = writeBatch(db);
  
  // Create like document
  const likeId = `${userId}_${projectId}`;
  const likeRef = doc(db, 'likes', likeId);
  batch.set(likeRef, {
    userId,
    projectId,
    createdAt: Timestamp.now()
  });
  
  // Increment like count on project
  const projectRef = doc(db, 'projects', projectId);
  batch.update(projectRef, {
    likeCount: increment(1),
    updatedAt: Timestamp.now()
  });
  
  await batch.commit();
  
  // Update user stats after liking
  try {
    const { updateUserStats } = await import('./userProfile');
    await updateUserStats(userId);
  } catch (error) {
    console.error('Error updating user stats after like:', error);
  }
};

export const unlikeProject = async (userId: string, projectId: string): Promise<void> => {
  const batch = writeBatch(db);
  
  // Delete like document
  const likeId = `${userId}_${projectId}`;
  const likeRef = doc(db, 'likes', likeId);
  batch.delete(likeRef);
  
  // Decrement like count on project
  const projectRef = doc(db, 'projects', projectId);
  batch.update(projectRef, {
    likeCount: increment(-1),
    updatedAt: Timestamp.now()
  });
  
  await batch.commit();
  
  // Update user stats after unliking
  try {
    const { updateUserStats } = await import('./userProfile');
    await updateUserStats(userId);
  } catch (error) {
    console.error('Error updating user stats after unlike:', error);
  }
};

export const checkUserLikedProject = async (userId: string, projectId: string): Promise<boolean> => {
  const likeId = `${userId}_${projectId}`;
  const likeRef = doc(db, 'likes', likeId);
  const likeDoc = await getDoc(likeRef);
  return likeDoc.exists();
};

// Follow functionality
export const followProject = async (userId: string, projectId: string): Promise<void> => {
  const batch = writeBatch(db);
  
  // Create follow document
  const followId = `${userId}_${projectId}`;
  const followRef = doc(db, 'follows', followId);
  batch.set(followRef, {
    userId,
    projectId,
    createdAt: Timestamp.now()
  });
  
  // Increment follow count on project
  const projectRef = doc(db, 'projects', projectId);
  batch.update(projectRef, {
    followCount: increment(1),
    updatedAt: Timestamp.now()
  });
  
  await batch.commit();
  
  // Update user stats after following
  try {
    const { updateUserStats } = await import('./userProfile');
    await updateUserStats(userId);
  } catch (error) {
    console.error('Error updating user stats after follow:', error);
  }
};

export const unfollowProject = async (userId: string, projectId: string): Promise<void> => {
  const batch = writeBatch(db);
  
  // Delete follow document
  const followId = `${userId}_${projectId}`;
  const followRef = doc(db, 'follows', followId);
  batch.delete(followRef);
  
  // Decrement follow count on project
  const projectRef = doc(db, 'projects', projectId);
  batch.update(projectRef, {
    followCount: increment(-1),
    updatedAt: Timestamp.now()
  });
  
  await batch.commit();
  
  // Update user stats after unfollowing
  try {
    const { updateUserStats } = await import('./userProfile');
    await updateUserStats(userId);
  } catch (error) {
    console.error('Error updating user stats after unfollow:', error);
  }
};

export const checkUserFollowedProject = async (userId: string, projectId: string): Promise<boolean> => {
  const followId = `${userId}_${projectId}`;
  const followRef = doc(db, 'follows', followId);
  const followDoc = await getDoc(followRef);
  return followDoc.exists();
};

// Get user's liked projects
export const getUserLikedProjects = async (userId: string): Promise<FirestoreProject[]> => {
  const likesQuery = query(
    collection(db, 'likes'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const likesSnapshot = await getDocs(likesQuery);
  const projectIds = likesSnapshot.docs.map(doc => doc.data().projectId);
  
  if (projectIds.length === 0) return [];
  
  // Get project details for liked projects
  const projects: FirestoreProject[] = [];
  for (const projectId of projectIds) {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);
    if (projectDoc.exists()) {
      projects.push({
        id: projectDoc.id,
        ...projectDoc.data()
      } as FirestoreProject);
    }
  }
  
  return projects;
};

// Get user's followed projects
export const getUserFollowedProjects = async (userId: string): Promise<FirestoreProject[]> => {
  const followsQuery = query(
    collection(db, 'follows'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const followsSnapshot = await getDocs(followsQuery);
  const projectIds = followsSnapshot.docs.map(doc => doc.data().projectId);
  
  if (projectIds.length === 0) return [];
  
  // Get project details for followed projects
  const projects: FirestoreProject[] = [];
  for (const projectId of projectIds) {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);
    if (projectDoc.exists()) {
      projects.push({
        id: projectDoc.id,
        ...projectDoc.data()
      } as FirestoreProject);
    }
  }
  
  return projects;
};

// Get interaction counts for a project
export const getProjectInteractionCounts = async (projectId: string): Promise<InteractionCounts> => {
  const projectRef = doc(db, 'projects', projectId);
  const projectDoc = await getDoc(projectRef);
  
  if (!projectDoc.exists()) {
    return { likes: 0, follows: 0 };
  }
  
  const data = projectDoc.data();
  return {
    likes: data.likeCount || 0,
    follows: data.followCount || 0
  };
};

// Initialize project interaction counts (for existing projects)
export const initializeProjectInteractionCounts = async (projectId: string): Promise<void> => {
  const projectRef = doc(db, 'projects', projectId);
  const projectDoc = await getDoc(projectRef);
  
  if (projectDoc.exists()) {
    const data = projectDoc.data();
    if (data.likeCount === undefined || data.followCount === undefined) {
      const batch = writeBatch(db);
      batch.update(projectRef, {
        likeCount: data.likeCount || 0,
        followCount: data.followCount || 0
      });
      await batch.commit();
    }
  }
};
