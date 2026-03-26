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
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  runTransaction
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
  updateData: Omit<CreateProjectUpdateData, 'projectId'>,
  creatorId: string // Required for Firestore security rules
): Promise<string> => {
  try {
    // Clean updateData to remove undefined values (Firebase doesn't accept undefined)
    const cleanedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        cleanedData[key] = value;
      }
    }

    const docRef = await addDoc(collection(db, UPDATES_COLLECTION), {
      ...cleanedData,
      projectId,
      creatorId, // Required for security rules
      likes: 0,
      likedBy: [],
      commentCount: 0,
      visibility: 'supporters-only',
      isPinned: cleanedData.isPinned || false,
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
    // Clean updateData to remove undefined values (Firebase doesn't accept undefined)
    const cleanedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        cleanedData[key] = value;
      }
    }

    const docRef = doc(db, UPDATES_COLLECTION, updateId);
    await updateDoc(docRef, {
      ...cleanedData,
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

// Toggle like on an update - using transaction to prevent race conditions
export const toggleUpdateLike = async (updateId: string, userId: string): Promise<boolean> => {
  try {
    const docRef = doc(db, UPDATES_COLLECTION, updateId);

    const result = await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);

      if (!docSnap.exists()) {
        throw new Error('Update not found');
      }

      const updateData = docSnap.data() as FirestoreProjectUpdate;
      const likedBy = updateData.likedBy || [];
      const isLiked = likedBy.includes(userId);

      if (isLiked) {
        // Unlike - use transaction to atomically update
        transaction.update(docRef, {
          likes: increment(-1),
          likedBy: arrayRemove(userId)
        });
        return false;
      } else {
        // Like - use transaction to atomically update
        transaction.update(docRef, {
          likes: increment(1),
          likedBy: arrayUnion(userId)
        });
        return true;
      }
    });

    return result;
  } catch (error) {
    console.error('Error toggling update like:', error);
    throw new Error('Failed to toggle update like');
  }
};

// U-LOG-01: Pin/unpin an update - only one pinned update per project
export const toggleUpdatePin = async (updateId: string, isPinned: boolean, projectId?: string): Promise<void> => {
  try {
    // If pinning, first unpin any other pinned updates for this project
    if (isPinned && projectId) {
      // Get all pinned updates for this project
      const q = query(
        collection(db, UPDATES_COLLECTION),
        where('projectId', '==', projectId),
        where('isPinned', '==', true)
      );

      const querySnapshot = await getDocs(q);

      // Unpin all previously pinned updates
      const unpinPromises = querySnapshot.docs.map(async (docSnapshot) => {
        if (docSnapshot.id !== updateId) {
          await updateDoc(doc(db, UPDATES_COLLECTION, docSnapshot.id), {
            isPinned: false,
            updatedAt: serverTimestamp()
          });
        }
      });

      await Promise.all(unpinPromises);
    }

    // Now pin/unpin the requested update
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
