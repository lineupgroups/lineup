import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    increment,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { db } from './firebase';
import { FirestoreUpdateComment } from '../types/firestore';

const UPDATE_COMMENTS_COLLECTION = 'update-comments';
const UPDATES_COLLECTION = 'project-updates';

// Get all comments for an update (including replies)
export const getUpdateComments = async (updateId: string): Promise<FirestoreUpdateComment[]> => {
    try {
        const q = query(
            collection(db, UPDATE_COMMENTS_COLLECTION),
            where('updateId', '==', updateId),
            where('isDeleted', '==', false),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as FirestoreUpdateComment[];
    } catch (error) {
        console.error('Error getting update comments:', error);
        return [];
    }
};

// Get a single comment by ID
export const getUpdateCommentById = async (commentId: string): Promise<FirestoreUpdateComment | null> => {
    try {
        const docRef = doc(db, UPDATE_COMMENTS_COLLECTION, commentId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as FirestoreUpdateComment;
        }
        return null;
    } catch (error) {
        console.error('Error getting comment:', error);
        return null;
    }
};

// Create a new comment on an update
export const createUpdateComment = async (data: {
    updateId: string;
    projectId: string;
    userId: string;
    userName: string;
    userAvatar: string;
    content: string;
    isCreatorComment: boolean;
    parentCommentId?: string; // For replies
}): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, UPDATE_COMMENTS_COLLECTION), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            likes: 0,
            likedBy: [],
            isDeleted: false,
            isEdited: false
        });

        // Atomically increment the commentCount on the parent update
        const updateDocRef = doc(db, UPDATES_COLLECTION, data.updateId);
        await updateDoc(updateDocRef, {
            commentCount: increment(1)
        });

        return docRef.id;
    } catch (error) {
        console.error('Error creating update comment:', error);
        throw new Error('Failed to create comment');
    }
};

// Edit an existing comment
export const editUpdateComment = async (commentId: string, newContent: string): Promise<void> => {
    try {
        const docRef = doc(db, UPDATE_COMMENTS_COLLECTION, commentId);
        await updateDoc(docRef, {
            content: newContent,
            isEdited: true,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error editing update comment:', error);
        throw new Error('Failed to edit comment');
    }
};

// Toggle like on an update comment
export const toggleUpdateCommentLike = async (commentId: string, userId: string): Promise<boolean> => {
    try {
        const docRef = doc(db, UPDATE_COMMENTS_COLLECTION, commentId);
        const q = query(
            collection(db, UPDATE_COMMENTS_COLLECTION),
            where('__name__', '==', commentId)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            throw new Error('Comment not found');
        }

        const commentData = snapshot.docs[0].data();
        const isLiked = commentData.likedBy?.includes(userId);

        if (isLiked) {
            await updateDoc(docRef, {
                likes: increment(-1),
                likedBy: arrayRemove(userId)
            });
            return false;
        } else {
            await updateDoc(docRef, {
                likes: increment(1),
                likedBy: arrayUnion(userId)
            });
            return true;
        }
    } catch (error) {
        console.error('Error toggling update comment like:', error);
        throw new Error('Failed to like comment');
    }
};

// Delete (soft) an update comment and decrement the count
export const deleteUpdateComment = async (commentId: string): Promise<void> => {
    try {
        const docRef = doc(db, UPDATE_COMMENTS_COLLECTION, commentId);

        // First get the comment to find the updateId
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            throw new Error('Comment not found');
        }

        const commentData = docSnap.data();

        // Soft delete the comment
        await updateDoc(docRef, {
            isDeleted: true,
            updatedAt: serverTimestamp()
        });

        // Decrement the commentCount on the parent update
        if (commentData.updateId) {
            const updateDocRef = doc(db, UPDATES_COLLECTION, commentData.updateId);
            await updateDoc(updateDocRef, {
                commentCount: increment(-1)
            });
        }
    } catch (error) {
        console.error('Error deleting update comment:', error);
        throw new Error('Failed to delete comment');
    }
};

// Toggle creator heart on an update comment
export const toggleCreatorHeart = async (commentId: string, giveHeart: boolean): Promise<void> => {
    try {
        const docRef = doc(db, UPDATE_COMMENTS_COLLECTION, commentId);
        await updateDoc(docRef, {
            creatorHeart: giveHeart,
            creatorHeartAt: giveHeart ? serverTimestamp() : null,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error toggling creator heart:', error);
        throw new Error('Failed to update heart');
    }
};
