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
  FirestoreComment,
  CreateCommentData
} from '../types/firestore';
import { getProjectSupporters } from './firestore';

const COMMENTS_COLLECTION = 'project-comments';

// Check if user is a supporter of the project
export const isUserSupporter = async (projectId: string, userId: string): Promise<boolean> => {
  try {
    const supporters = await getProjectSupporters(projectId);
    return supporters.some(supporter => supporter.userId === userId && supporter.status === 'completed');
  } catch (error) {
    console.error('Error checking supporter status:', error);
    return false;
  }
};

// Create a new comment (only supporters can comment)
export const createComment = async (
  commentData: CreateCommentData
): Promise<string> => {
  try {
    // Verify user is a supporter
    const isSupporter = await isUserSupporter(commentData.projectId, commentData.userId);
    
    if (!isSupporter && !commentData.isCreatorComment) {
      throw new Error('Only supporters and creators can comment on projects');
    }
    
    const docRef = await addDoc(collection(db, COMMENTS_COLLECTION), {
      ...commentData,
      likes: 0,
      likedBy: [],
      isPinned: false,
      isDeleted: false,
      isSupporter,
      createdAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw new Error(`Failed to create comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get all comments for a project
export const getProjectComments = async (projectId: string): Promise<FirestoreComment[]> => {
  try {
    const q = query(
      collection(db, COMMENTS_COLLECTION),
      where('projectId', '==', projectId),
      where('isDeleted', '==', false),
      orderBy('isPinned', 'desc'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FirestoreComment[];
  } catch (error) {
    console.error('Error getting project comments:', error);
    throw new Error('Failed to get project comments');
  }
};

// Get a single comment
export const getComment = async (commentId: string): Promise<FirestoreComment | null> => {
  try {
    const docRef = doc(db, COMMENTS_COLLECTION, commentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as FirestoreComment;
    }
    return null;
  } catch (error) {
    console.error('Error getting comment:', error);
    throw new Error('Failed to get comment');
  }
};

// Update a comment (only by the author)
export const updateComment = async (
  commentId: string,
  content: string
): Promise<void> => {
  try {
    const docRef = doc(db, COMMENTS_COLLECTION, commentId);
    await updateDoc(docRef, {
      content,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    throw new Error('Failed to update comment');
  }
};

// Delete a comment (soft delete)
export const deleteComment = async (commentId: string): Promise<void> => {
  try {
    const docRef = doc(db, COMMENTS_COLLECTION, commentId);
    await updateDoc(docRef, {
      isDeleted: true,
      content: '[This comment has been deleted]',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw new Error('Failed to delete comment');
  }
};

// Toggle like on a comment
export const toggleCommentLike = async (commentId: string, userId: string): Promise<boolean> => {
  try {
    const docRef = doc(db, COMMENTS_COLLECTION, commentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Comment not found');
    }
    
    const commentData = docSnap.data() as FirestoreComment;
    const likedBy = commentData.likedBy || [];
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
    console.error('Error toggling comment like:', error);
    throw new Error('Failed to toggle comment like');
  }
};

// Pin/unpin a comment (creator only)
export const toggleCommentPin = async (commentId: string, isPinned: boolean): Promise<void> => {
  try {
    const docRef = doc(db, COMMENTS_COLLECTION, commentId);
    await updateDoc(docRef, {
      isPinned,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error toggling comment pin:', error);
    throw new Error('Failed to toggle comment pin');
  }
};

// Get comment count for a project
export const getProjectCommentCount = async (projectId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, COMMENTS_COLLECTION),
      where('projectId', '==', projectId),
      where('isDeleted', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting comment count:', error);
    return 0;
  }
};

// Get replies to a comment
export const getCommentReplies = async (parentCommentId: string): Promise<FirestoreComment[]> => {
  try {
    const q = query(
      collection(db, COMMENTS_COLLECTION),
      where('parentCommentId', '==', parentCommentId),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FirestoreComment[];
  } catch (error) {
    console.error('Error getting comment replies:', error);
    return [];
  }
};
