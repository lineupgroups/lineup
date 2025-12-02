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
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from './firebase';
import {
  FirestoreProjectUpdate,
  CreateProjectUpdateData
} from '../types/firestore';

const UPDATES_COLLECTION = 'project-updates';

// Create a new project update (supporters-only)
export const createProjectUpdate = async (
  projectId: string,
  updateData: Omit<CreateProjectUpdateData, 'projectId'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, UPDATES_COLLECTION), {
      ...updateData,
      projectId,
      likes: 0,
      likedBy: [],
      commentCount: 0,
      visibility: 'supporters-only',
      isPinned: false,
      createdAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating project update:', error);
    throw new Error(`Failed to create project update: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get all updates for a project
export const getProjectUpdates = async (projectId: string): Promise<FirestoreProjectUpdate[]> => {
  try {
    const q = query(
      collection(db, UPDATES_COLLECTION),
      where('projectId', '==', projectId),
      orderBy('isPinned', 'desc'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FirestoreProjectUpdate[];
  } catch (error) {
    console.error('Error getting project updates:', error);
    throw new Error('Failed to get project updates');
  }
};

// Get a single update
export const getProjectUpdate = async (updateId: string): Promise<FirestoreProjectUpdate | null> => {
  try {
    const docRef = doc(db, UPDATES_COLLECTION, updateId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as FirestoreProjectUpdate;
    }
    return null;
  } catch (error) {
    console.error('Error getting project update:', error);
    throw new Error('Failed to get project update');
  }
};

// Update an existing project update
export const updateProjectUpdate = async (
  updateId: string,
  updateData: Partial<Omit<FirestoreProjectUpdate, 'id' | 'projectId' | 'createdAt'>>
): Promise<void> => {
  try {
    const docRef = doc(db, UPDATES_COLLECTION, updateId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating project update:', error);
    throw new Error('Failed to update project update');
  }
};

// Delete a project update
export const deleteProjectUpdate = async (updateId: string): Promise<void> => {
  try {
    const docRef = doc(db, UPDATES_COLLECTION, updateId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting project update:', error);
    throw new Error('Failed to delete project update');
  }
};

// Toggle like on an update
export const toggleUpdateLike = async (updateId: string, userId: string): Promise<boolean> => {
  try {
    const docRef = doc(db, UPDATES_COLLECTION, updateId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Update not found');
    }
    
    const updateData = docSnap.data() as FirestoreProjectUpdate;
    const likedBy = updateData.likedBy || [];
    const isLiked = likedBy.includes(userId);
    
    if (isLiked) {
      // Unlike
      await updateDoc(docRef, {
        likes: increment(-1),
        likedBy: arrayRemove(userId)
      });
      return false;
    } else {
      // Like
      await updateDoc(docRef, {
        likes: increment(1),
        likedBy: arrayUnion(userId)
      });
      return true;
    }
  } catch (error) {
    console.error('Error toggling update like:', error);
    throw new Error('Failed to toggle update like');
  }
};

// Pin/unpin an update
export const toggleUpdatePin = async (updateId: string, isPinned: boolean): Promise<void> => {
  try {
    const docRef = doc(db, UPDATES_COLLECTION, updateId);
    await updateDoc(docRef, {
      isPinned,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error toggling update pin:', error);
    throw new Error('Failed to toggle update pin');
  }
};

// Get update count for a project
export const getProjectUpdateCount = async (projectId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, UPDATES_COLLECTION),
      where('projectId', '==', projectId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting update count:', error);
    return 0;
  }
};
