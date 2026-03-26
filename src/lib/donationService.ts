/**
 * Donation Service
 * 
 * Core service for handling all donation operations including:
 * - Processing donations with atomic updates
 * - Updating project funding
 * - Recording transactions
 * - Managing donation statistics
 * - Handling notifications
 */

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    writeBatch,
    increment,
    Timestamp,
    startAfter,
    DocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { FirestoreProject } from '../types/firestore';
import { BackedProject } from '../types/user';
import {
    generateTransactionId,
    generatePaymentReference,
    generateDonationId,
} from '../utils/transactionUtils';
import {
    validateDonation,
    validatePaymentDetails,
    recordDonationAttempt,
} from '../utils/donationValidation';
import { getEnhancedUserProfile } from './userProfile';
import { shouldDisplayAsAnonymous, getDisplayInfo } from '../utils/anonymousUser';

// Types
export interface DonationRequest {
    userId: string;
    projectId: string;
    amount: number;
    rewardTier?: string;
    isAnonymous: boolean;
    paymentDetails: {
        name: string;
        email: string;
        phone?: string;
    };
}

export interface DonationResult {
    success: boolean;
    transactionId: string;
    paymentReference: string;
    donationId: string;
    message: string;
    errors?: string[];
}

export interface DonationData extends Omit<BackedProject, 'rewardTier' | 'displayProfileImage'> {
    rewardTier?: string | null;
    displayProfileImage?: string | null;
    transactionId: string;
    paymentReference: string;
    paymentDetails: {
        name: string;
        email: string;
        phone?: string | null;
    };
    // Thanked status (set when creator sends thank you)
    thankedAt?: Timestamp;
    thankedBy?: string;
}

export interface DonationStats {
    totalAmount: number;
    totalDonations: number;
    averageDonation: number;
    topDonation: number;
    uniqueDonors: number;
    anonymousDonations: number;
    recentDonations: DonationData[];
}

export interface PaginationOptions {
    limitCount?: number;
    lastDoc?: DocumentSnapshot;
    orderByField?: 'backedAt' | 'amount';
    orderDirection?: 'asc' | 'desc';
}

// Get all donations for a creator (across all their projects)
export async function getCreatorDonations(
    creatorId: string,
    limitCount: number = 50
): Promise<DonationData[]> {
    try {
        // 1. Get all projects by this creator
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, where('creatorId', '==', creatorId));
        const projectsSnapshot = await getDocs(q);

        if (projectsSnapshot.empty) return [];

        const projectIds = projectsSnapshot.docs.map(doc => doc.id);

        // 2. Get donations for these projects
        // Firestore 'in' query is limited to 10 items. 
        // If > 10 projects, we need multiple queries or client-side filtering.
        // For scalability, we'll fetch by batches of 10.

        const donations: DonationData[] = [];
        const chunks = [];

        for (let i = 0; i < projectIds.length; i += 10) {
            chunks.push(projectIds.slice(i, i + 10));
        }

        for (const chunk of chunks) {
            const donationsRef = collection(db, 'backed-projects');
            const donationsQuery = query(
                donationsRef,
                where('projectId', 'in', chunk),
                orderBy('backedAt', 'desc'),
                limit(limitCount)
            );

            const snapshot = await getDocs(donationsQuery);
            snapshot.docs.forEach(doc => {
                donations.push(doc.data() as DonationData);
            });
        }

        // Sort combined results and limit
        return donations
            .sort((a, b) => b.backedAt.toMillis() - a.backedAt.toMillis())
            .slice(0, limitCount);

    } catch (error) {
        console.error('Error fetching creator donations:', error);
        throw error;
    }
}

/**
 * Main function to process a donation
 * Handles validation, atomic updates, and notifications
 */
export async function processDonation(
    request: DonationRequest
): Promise<DonationResult> {
    const {
        userId,
        projectId,
        amount,
        rewardTier,
        isAnonymous,
        paymentDetails,
    } = request;

    try {
        // 1. Validate donation
        const validation = await validateDonation(userId, projectId, amount);
        if (!validation.isValid) {
            return {
                success: false,
                transactionId: '',
                paymentReference: '',
                donationId: '',
                message: 'Validation failed',
                errors: validation.errors,
            };
        }

        // 2. Validate payment details
        const paymentValidation = validatePaymentDetails(paymentDetails);
        if (!paymentValidation.isValid) {
            return {
                success: false,
                transactionId: '',
                paymentReference: '',
                donationId: '',
                message: 'Invalid payment details',
                errors: paymentValidation.errors,
            };
        }

        // 3. Get user profile for anonymous handling
        const userProfile = await getEnhancedUserProfile(userId);
        if (!userProfile) {
            return {
                success: false,
                transactionId: '',
                paymentReference: '',
                donationId: '',
                message: 'User profile not found',
                errors: ['Please ensure you are signed in'],
            };
        }

        // 4. Determine anonymous status
        const shouldBeAnonymous = shouldDisplayAsAnonymous(
            userProfile.isPublic,
            userProfile.donateAnonymousByDefault || false,
            isAnonymous
        );

        // 5. Get display information
        const displayInfo = getDisplayInfo(
            {
                id: userProfile.id,
                displayName: userProfile.displayName,
                profileImage: userProfile.profileImage,
            },
            shouldBeAnonymous
        );

        // 6. Generate IDs
        const transactionId = generateTransactionId();
        const paymentReference = generatePaymentReference();
        const donationId = generateDonationId(userId, projectId);

        // 7. Create donation data
        const donationData: DonationData = {
            id: donationId,
            userId,
            projectId,
            amount,
            rewardTier: rewardTier || null,
            backedAt: Timestamp.now(),
            status: 'active',
            anonymous: shouldBeAnonymous,
            displayName: displayInfo.displayName,
            displayProfileImage: displayInfo.displayProfileImage || null,
            transactionId,
            paymentReference,
            paymentDetails: {
                ...paymentDetails,
                phone: paymentDetails.phone || null,
            },
        };

        // 8. Execute atomic transaction
        await executeAtomicDonation(donationData, projectId, userId);

        // 9. Record rate limit attempt
        recordDonationAttempt(userId);

        // 10. Send notifications (async, don't wait)
        sendDonationNotifications(donationData, projectId).catch((error) => {
            console.error('Failed to send notifications:', error);
        });

        return {
            success: true,
            transactionId,
            paymentReference,
            donationId,
            message: 'Donation processed successfully',
        };
    } catch (error) {
        console.error('Error processing donation:', error);
        return {
            success: false,
            transactionId: '',
            paymentReference: '',
            donationId: '',
            message: 'Failed to process donation',
            errors: [
                error instanceof Error
                    ? error.message
                    : 'An unexpected error occurred',
            ],
        };
    }
}

/**
 * Executes atomic donation transaction
 * Updates donation record, project stats, user stats, and activity log
 */
async function executeAtomicDonation(
    donationData: DonationData,
    projectId: string,
    userId: string
): Promise<void> {
    const batch = writeBatch(db);

    try {
        // 1. Create donation record
        const donationRef = doc(db, 'backed-projects', donationData.id);
        batch.set(donationRef, donationData);

        // 2. Update project stats
        const projectRef = doc(db, 'projects', projectId);
        batch.update(projectRef, {
            raised: increment(donationData.amount),
            supporters: increment(1),
            lastDonationAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });

        // 3. Update user stats
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, {
            'stats.totalBacked': increment(donationData.amount),
            'stats.projectsBacked': increment(1),
            updatedAt: Timestamp.now(),
            lastActiveAt: Timestamp.now(),
        });

        // 4. Create activity log
        const activityRef = doc(collection(db, 'user-activities'));
        batch.set(activityRef, {
            id: activityRef.id,
            userId,
            type: 'project_backed',
            data: {
                projectId,
                amount: donationData.amount,
                anonymous: donationData.anonymous,
                transactionId: donationData.transactionId,
            },
            createdAt: Timestamp.now(),
        });

        // 5. Commit all changes atomically
        await batch.commit();
    } catch (error) {
        console.error('Error in atomic donation transaction:', error);
        throw new Error('Failed to complete donation transaction');
    }
}

/**
 * Updates project funding atomically
 * Used for manual updates or corrections
 */
export async function updateProjectFunding(
    projectId: string,
    amount: number
): Promise<void> {
    try {
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, {
            raised: increment(amount),
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Error updating project funding:', error);
        throw error;
    }
}

/**
 * Gets all donations for a specific project
 */
export async function getProjectDonations(
    projectId: string,
    options: PaginationOptions = {}
): Promise<DonationData[]> {
    const {
        limitCount = 50,
        lastDoc,
        orderByField = 'backedAt',
        orderDirection = 'desc',
    } = options;

    try {
        let q = query(
            collection(db, 'backed-projects'),
            where('projectId', '==', projectId),
            orderBy(orderByField, orderDirection),
            limit(limitCount)
        );

        // Add pagination
        if (lastDoc) {
            q = query(q, startAfter(lastDoc));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as DonationData)
        );
    } catch (error) {
        console.error('Error fetching project donations:', error);
        return [];
    }
}

/**
 * Gets all donations by a specific user
 */
export async function getUserDonations(
    userId: string,
    options: PaginationOptions = {}
): Promise<DonationData[]> {
    const {
        limitCount = 50,
        lastDoc,
        orderByField = 'backedAt',
        orderDirection = 'desc',
    } = options;

    try {
        let q = query(
            collection(db, 'backed-projects'),
            where('userId', '==', userId),
            orderBy(orderByField, orderDirection),
            limit(limitCount)
        );

        // Add pagination
        if (lastDoc) {
            q = query(q, startAfter(lastDoc));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as DonationData)
        );
    } catch (error) {
        console.error('Error fetching user donations:', error);
        return [];
    }
}

/**
 * Calculates donation statistics for a project
 */
export async function getDonationStats(
    projectId: string
): Promise<DonationStats> {
    try {
        const donations = await getProjectDonations(projectId, { limitCount: 1000 });

        if (donations.length === 0) {
            return {
                totalAmount: 0,
                totalDonations: 0,
                averageDonation: 0,
                topDonation: 0,
                uniqueDonors: 0,
                anonymousDonations: 0,
                recentDonations: [],
            };
        }

        const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
        const amounts = donations.map((d) => d.amount);
        const topDonation = Math.max(...amounts);
        const uniqueDonors = new Set(donations.map((d) => d.userId)).size;
        const anonymousDonations = donations.filter((d) => d.anonymous).length;
        const recentDonations = donations.slice(0, 10);

        return {
            totalAmount,
            totalDonations: donations.length,
            averageDonation: totalAmount / donations.length,
            topDonation,
            uniqueDonors,
            anonymousDonations,
            recentDonations,
        };
    } catch (error) {
        console.error('Error calculating donation stats:', error);
        return {
            totalAmount: 0,
            totalDonations: 0,
            averageDonation: 0,
            topDonation: 0,
            uniqueDonors: 0,
            anonymousDonations: 0,
            recentDonations: [],
        };
    }
}

/**
 * Gets top donors for a project
 */
export async function getTopDonors(
    projectId: string,
    limitCount: number = 10
): Promise<DonationData[]> {
    try {
        const donations = await getProjectDonations(projectId, {
            orderByField: 'amount',
            orderDirection: 'desc',
            limitCount,
        });

        // Filter out duplicates by userId, keeping highest donation
        const topDonorsMap = new Map<string, DonationData>();
        for (const donation of donations) {
            const existing = topDonorsMap.get(donation.userId);
            if (!existing || donation.amount > existing.amount) {
                topDonorsMap.set(donation.userId, donation);
            }
        }

        return Array.from(topDonorsMap.values())
            .sort((a, b) => b.amount - a.amount)
            .slice(0, limitCount);
    } catch (error) {
        console.error('Error fetching top donors:', error);
        return [];
    }
}

/**
 * Checks if a user has backed a specific project
 */
export async function hasUserBackedProject(
    userId: string,
    projectId: string
): Promise<boolean> {
    try {
        const q = query(
            collection(db, 'backed-projects'),
            where('userId', '==', userId),
            where('projectId', '==', projectId),
            limit(1)
        );

        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error('Error checking if user backed project:', error);
        return false;
    }
}

/**
 * Gets user's total donation amount for a project
 */
export async function getUserProjectDonationTotal(
    userId: string,
    projectId: string
): Promise<number> {
    try {
        const q = query(
            collection(db, 'backed-projects'),
            where('userId', '==', userId),
            where('projectId', '==', projectId)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.reduce((sum, doc) => {
            const data = doc.data() as DonationData;
            return sum + data.amount;
        }, 0);
    } catch (error) {
        console.error('Error getting user project donation total:', error);
        return 0;
    }
}

/**
 * Sends notifications about a new donation
 * Notifies the project creator
 */
async function sendDonationNotifications(
    donation: DonationData,
    projectId: string
): Promise<void> {
    try {
        // Get project details
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);

        if (!projectDoc.exists()) {
            console.error('Project not found for notification');
            return;
        }

        const project = projectDoc.data() as FirestoreProject;
        const creatorId = project.creatorId;

        // Don't notify if creator donated to own project (shouldn't happen, but just in case)
        if (creatorId === donation.userId) {
            return;
        }

        // Create notification for creator
        const notificationRef = doc(collection(db, 'notifications'));
        await setDoc(notificationRef, {
            id: notificationRef.id,
            userId: creatorId,
            type: 'new_supporter',
            title: 'New Donation Received! 🎉',
            message: donation.anonymous
                ? `Anonymous supporter donated ₹${donation.amount.toLocaleString('en-IN')} to your project "${project.title}"`
                : `${donation.displayName} donated ₹${donation.amount.toLocaleString('en-IN')} to your project "${project.title}"`,
            projectId: projectId,
            projectTitle: project.title,
            relatedUserId: donation.anonymous ? null : donation.userId,
            relatedUserName: donation.anonymous ? null : donation.displayName,
            createdAt: Timestamp.now(),
            read: false,
        });

        // Log activity for creator (they backed a project)
        const creatorActivityRef = doc(collection(db, 'user-activities'));
        await setDoc(creatorActivityRef, {
            id: creatorActivityRef.id,
            userId: creatorId,
            type: 'new_backer',
            data: {
                projectId: projectId,
                projectTitle: project.title,
                amount: donation.amount,
                backerName: donation.anonymous ? 'Anonymous Supporter' : donation.displayName,
                anonymous: donation.anonymous,
            },
            createdAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Error sending donation notifications:', error);
        // Don't throw - notifications are non-critical
    }
}

/**
 * Recalculates project statistics from donations
 * Use this to fix any data inconsistencies
 */
export async function recalculateProjectStats(
    projectId: string
): Promise<{ raised: number; supporters: number }> {
    try {
        const donations = await getProjectDonations(projectId, { limitCount: 10000 });

        const raised = donations.reduce((sum, d) => sum + d.amount, 0);
        const supporters = new Set(donations.map((d) => d.userId)).size;

        // Update project with recalculated stats
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, {
            raised,
            supporters,
            updatedAt: Timestamp.now(),
        });

        return { raised, supporters };
    } catch (error) {
        console.error('Error recalculating project stats:', error);
        throw error;
    }
}

/**
 * Gets recent donations across all projects
 * Useful for admin dashboard or global activity feed
 */
export async function getRecentDonations(
    limitCount: number = 20
): Promise<DonationData[]> {
    try {
        const q = query(
            collection(db, 'backed-projects'),
            orderBy('backedAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as DonationData)
        );
    } catch (error) {
        console.error('Error fetching recent donations:', error);
        return [];
    }
}
