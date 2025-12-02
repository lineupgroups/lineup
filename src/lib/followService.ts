import { collection, query, where, orderBy, limit, getDocs, startAfter, DocumentSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { getEnhancedUserProfile } from './userProfile';
import { EnhancedUser } from '../types/user';

export interface FollowListResult {
    users: EnhancedUser[];
    lastDoc: DocumentSnapshot | null;
    hasMore: boolean;
}

/**
 * Get followers for a user with pagination
 */
export const getFollowers = async (
    userId: string,
    limitCount: number = 100,
    lastDocument?: DocumentSnapshot | null
): Promise<FollowListResult> => {
    try {
        const followsRef = collection(db, 'user-follows');

        // Query for all follows where this user is being followed
        let q = query(
            followsRef,
            where('followedUserId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        // Add pagination cursor if provided
        if (lastDocument) {
            q = query(q, startAfter(lastDocument));
        }

        const snapshot = await getDocs(q);

        // Get follower user IDs
        const followerIds = snapshot.docs.map(doc => doc.data().followerUserId);

        // Fetch user profiles for all followers
        const users: EnhancedUser[] = [];
        for (const followerId of followerIds) {
            const userProfile = await getEnhancedUserProfile(followerId);
            if (userProfile && userProfile.isPublic !== false) {
                users.push(userProfile);
            }
        }

        return {
            users,
            lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
            hasMore: snapshot.docs.length === limitCount
        };
    } catch (error) {
        console.error('Error fetching followers:', error);
        return {
            users: [],
            lastDoc: null,
            hasMore: false
        };
    }
};

/**
 * Get users that this user is following with pagination
 */
export const getFollowing = async (
    userId: string,
    limitCount: number = 100,
    lastDocument?: DocumentSnapshot | null
): Promise<FollowListResult> => {
    try {
        const followsRef = collection(db, 'user-follows');

        // Query for all users this user is following
        let q = query(
            followsRef,
            where('followerUserId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        // Add pagination cursor if provided
        if (lastDocument) {
            q = query(q, startAfter(lastDocument));
        }

        const snapshot = await getDocs(q);

        // Get followed user IDs
        const followedIds = snapshot.docs.map(doc => doc.data().followedUserId);

        // Fetch user profiles for all followed users
        const users: EnhancedUser[] = [];
        for (const followedId of followedIds) {
            const userProfile = await getEnhancedUserProfile(followedId);
            if (userProfile && userProfile.isPublic !== false) {
                users.push(userProfile);
            }
        }

        return {
            users,
            lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
            hasMore: snapshot.docs.length === limitCount
        };
    } catch (error) {
        console.error('Error fetching following:', error);
        return {
            users: [],
            lastDoc: null,
            hasMore: false
        };
    }
};

/**
 * Check if current user follows a specific user
 */
export const checkFollowStatus = async (
    currentUserId: string,
    targetUserId: string
): Promise<boolean> => {
    try {
        const followsRef = collection(db, 'user-follows');
        const q = query(
            followsRef,
            where('followerUserId', '==', currentUserId),
            where('followedUserId', '==', targetUserId)
        );

        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error('Error checking follow status:', error);
        return false;
    }
};
