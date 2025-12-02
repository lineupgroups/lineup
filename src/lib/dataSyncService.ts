import { db } from './firebase';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    Timestamp
} from 'firebase/firestore';

export interface SyncReport {
    projectId: string;
    oldRaised: number;
    newRaised: number;
    oldSupporters: number;
    newSupporters: number;
    synced: boolean;
}

/**
 * Recalculates and updates statistics for a specific project
 * based on actual donation records in 'backed-projects'
 */
export async function recalculateProjectStats(projectId: string): Promise<SyncReport> {
    try {
        // 1. Get all donations for this project
        const donationsRef = collection(db, 'backed-projects');
        const q = query(donationsRef, where('projectId', '==', projectId));
        const snapshot = await getDocs(q);

        let totalRaised = 0;
        const uniqueSupporters = new Set<string>();

        snapshot.docs.forEach(docSnapshot => {
            const data = docSnapshot.data();
            totalRaised += data.amount || 0;
            if (data.userId) {
                uniqueSupporters.add(data.userId);
            }
        });

        const newRaised = totalRaised;
        const newSupporters = uniqueSupporters.size;

        // 2. Update project stats
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, {
            raised: newRaised,
            supporters: newSupporters,
            lastStatsSync: Timestamp.now()
        });

        return {
            projectId,
            oldRaised: -1,
            newRaised,
            oldSupporters: -1,
            newSupporters,
            synced: true
        };

    } catch (error) {
        console.error(`Error syncing project ${projectId}:`, error);
        throw error;
    }
}

/**
 * Recalculates and updates statistics for a specific user
 * based on actual donation records
 */
export async function recalculateUserStats(userId: string): Promise<void> {
    try {
        // 1. Get all donations by this user
        const donationsRef = collection(db, 'backed-projects');
        const q = query(donationsRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);

        let totalBacked = 0;
        const projectsBacked = new Set<string>();

        snapshot.docs.forEach(docSnapshot => {
            const data = docSnapshot.data();
            totalBacked += data.amount || 0;
            if (data.projectId) {
                projectsBacked.add(data.projectId);
            }
        });

        // 2. Update user stats
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            'stats.totalBacked': totalBacked,
            'stats.projectsBacked': projectsBacked.size,
            lastStatsSync: Timestamp.now()
        });

    } catch (error) {
        console.error(`Error syncing user ${userId}:`, error);
        throw error;
    }
}
