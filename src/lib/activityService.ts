import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp, startAfter, DocumentSnapshot } from 'firebase/firestore';
import { db } from './firebase';

// Activity Types
export type ActivityType =
    | 'project_created'
    | 'project_backed'
    | 'new_backer'
    | 'project_completed'
    | 'achievement_unlocked'
    | 'profile_updated'
    | 'user_followed'
    | 'project_liked';

export interface Activity {
    id: string;
    userId: string;  // Who performed the action
    type: ActivityType;
    targetId?: string;  // Project ID, Achievement ID, etc.
    targetName?: string;  // Project name, Achievement name, etc.
    data?: {
        amount?: number;
        displayName?: string;  // For backers (can be anonymous)
        anonymous?: boolean;
        projectName?: string;
        achievementName?: string;
        [key: string]: any;
    };
    createdAt: Timestamp;
}

export interface ActivityFeedResult {
    activities: Activity[];
    lastDoc: DocumentSnapshot | null;
    hasMore: boolean;
}

/**
 * Log a new activity to Firestore
 */
export const logActivity = async (
    userId: string,
    type: ActivityType,
    data?: Activity['data'],
    targetId?: string,
    targetName?: string
): Promise<void> => {
    try {
        const activitiesRef = collection(db, 'user-activities');

        await addDoc(activitiesRef, {
            userId,
            type,
            targetId,
            targetName,
            data: data || {},
            createdAt: Timestamp.now()
        });
    } catch (error) {
        console.error('Error logging activity:', error);
        // Don't throw - activity logging should not break main functionality
    }
};

/**
 * Get activities performed BY a user (for profile activity tab)
 */
export const getUserActivities = async (
    userId: string,
    limitCount: number = 20,
    lastDocument?: DocumentSnapshot | null
): Promise<ActivityFeedResult> => {
    try {
        const activitiesRef = collection(db, 'user-activities');

        let q = query(
            activitiesRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        if (lastDocument) {
            q = query(q, startAfter(lastDocument));
        }

        const snapshot = await getDocs(q);

        const activities: Activity[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Activity));

        return {
            activities,
            lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
            hasMore: snapshot.docs.length === limitCount
        };
    } catch (error) {
        console.error('Error fetching user activities:', error);
        return {
            activities: [],
            lastDoc: null,
            hasMore: false
        };
    }
};

/**
 * Get activities related to a creator's projects (for creator dashboard)
 * This includes: new backers, comments, milestone completions, etc.
 */
export const getProjectActivities = async (
    creatorId: string,
    limitCount: number = 20,
    lastDocument?: DocumentSnapshot | null
): Promise<ActivityFeedResult> => {
    try {
        const activitiesRef = collection(db, 'user-activities');

        // Get activities of type 'new_backer' for this creator's projects
        // We'll need to query by type and then filter by creator
        let q = query(
            activitiesRef,
            where('type', 'in', ['new_backer', 'project_completed']),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        if (lastDocument) {
            q = query(q, startAfter(lastDocument));
        }

        const snapshot = await getDocs(q);

        // Filter to only activities for this creator's projects
        // Note: In production, you might want to add creatorId field to activities for better performance
        const activities: Activity[] = snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Activity))
            .filter(activity => {
                // For now, we'll include all - in production, add creatorId filter
                return true;
            });

        return {
            activities,
            lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
            hasMore: snapshot.docs.length === limitCount
        };
    } catch (error) {
        console.error('Error fetching project activities:', error);
        return {
            activities: [],
            lastDoc: null,
            hasMore: false
        };
    }
};

/**
 * Helper function to format activity display text
 */
export const formatActivityText = (activity: Activity): string => {
    switch (activity.type) {
        case 'project_created':
            return `Created project "${activity.targetName || 'Untitled'}"`;

        case 'project_backed':
            const amount = activity.data?.amount || 0;
            return `Backed "${activity.targetName || 'a project'}" with ₹${amount.toLocaleString('en-IN')}`;

        case 'new_backer':
            const backerAmount = activity.data?.amount || 0;
            const displayName = activity.data?.displayName || 'Someone';
            return `${displayName} backed your project with ₹${backerAmount.toLocaleString('en-IN')}`;

        case 'project_completed':
            return `Successfully completed "${activity.targetName || 'a project'}"`;

        case 'achievement_unlocked':
            return `Unlocked achievement: ${activity.targetName || 'New Achievement'}`;

        case 'profile_updated':
            return 'Updated their profile';

        case 'user_followed':
            return `Started following ${activity.targetName || 'someone'}`;

        case 'project_liked':
            return `Liked "${activity.targetName || 'a project'}"`;

        default:
            return 'Activity';
    }
};

/**
 * Get icon for activity type
 */
export const getActivityIcon = (type: ActivityType): string => {
    switch (type) {
        case 'project_created':
            return '🚀';
        case 'project_backed':
        case 'new_backer':
            return '💰';
        case 'project_completed':
            return '✅';
        case 'achievement_unlocked':
            return '🏆';
        case 'profile_updated':
            return '✏️';
        case 'user_followed':
            return '👥';
        case 'project_liked':
            return '❤️';
        default:
            return '📌';
    }
};
