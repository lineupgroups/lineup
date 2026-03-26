import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit as firestoreLimit, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Activity {
    id: string;
    type: 'pledge' | 'comment' | 'like' | 'milestone' | 'update';
    title: string;
    description: string;
    projectId?: string;
    projectTitle?: string;
    userId?: string;
    userName?: string;
    amount?: number;
    createdAt: Date;
}

export const useRecentActivity = (creatorId: string, limit: number = 10) => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!creatorId) {
            setLoading(false);
            return;
        }

        const fetchActivities = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get creator's projects
                const projectsRef = collection(db, 'projects');
                const projectsQuery = query(projectsRef, where('creatorId', '==', creatorId));
                const projectsSnapshot = await getDocs(projectsQuery);

                const projectMap = new Map<string, string>();
                projectsSnapshot.docs.forEach(doc => {
                    projectMap.set(doc.id, doc.data().title);
                });

                const projectIds = Array.from(projectMap.keys());

                if (projectIds.length === 0) {
                    setActivities([]);
                    setLoading(false);
                    return;
                }

                const allActivities: Activity[] = [];

                // Fetch recent donations from backed-projects collection (CORRECT collection)
                try {
                    // Firestore 'in' query limited to 10 items, so batch if needed
                    const batchedProjectIds = projectIds.slice(0, 10);
                    const donationsRef = collection(db, 'backed-projects');
                    const donationsQuery = query(
                        donationsRef,
                        where('projectId', 'in', batchedProjectIds),
                        orderBy('backedAt', 'desc'),
                        firestoreLimit(limit * 2) // Get more to properly identify first-time backers
                    );
                    const donationsSnapshot = await getDocs(donationsQuery);

                    // Track seen users to identify first-time vs repeat supporters
                    // Process in REVERSE order (oldest first) to identify first donations
                    const allDonations = donationsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    // Sort by date ascending to find first donations per user per project
                    const sortedAsc = [...allDonations].sort((a: any, b: any) => {
                        const aTime = a.backedAt?.toMillis?.() || 0;
                        const bTime = b.backedAt?.toMillis?.() || 0;
                        return aTime - bTime;
                    });

                    // Track first donation per user per project
                    const firstDonationKey = new Set<string>();
                    sortedAsc.forEach((donation: any) => {
                        const userKey = `${donation.userId || 'anon'}-${donation.projectId}`;
                        if (!firstDonationKey.has(userKey)) {
                            firstDonationKey.add(userKey);
                        }
                    });

                    // Now create activities - check if each donation was the first one
                    const seenInThisBatch = new Set<string>();
                    allDonations.forEach((donation: any) => {
                        const displayName = donation.anonymous ? 'Anonymous Supporter' : (donation.displayName || 'Someone');
                        const userKey = `${donation.userId || 'anon'}-${donation.projectId}`;

                        // Check if this is their first donation for this project
                        // by seeing how many donations exist before this one
                        const donationsBefore = sortedAsc.filter((d: any) => {
                            const dKey = `${d.userId || 'anon'}-${d.projectId}`;
                            const dTime = d.backedAt?.toMillis?.() || 0;
                            const thisTime = donation.backedAt?.toMillis?.() || 0;
                            return dKey === userKey && dTime < thisTime;
                        });

                        const isFirstDonation = donationsBefore.length === 0;
                        seenInThisBatch.add(userKey);

                        allActivities.push({
                            id: `pledge-${donation.id}`,
                            type: 'pledge',
                            title: isFirstDonation ? 'New supporter! 🎉' : 'Repeat support 🔁',
                            description: `${displayName} backed with ₹${donation.amount?.toLocaleString('en-IN') || 0}`,
                            projectId: donation.projectId,
                            projectTitle: projectMap.get(donation.projectId),
                            userId: donation.anonymous ? undefined : donation.userId,
                            userName: displayName,
                            amount: donation.amount,
                            createdAt: donation.backedAt?.toDate() || new Date()
                        });
                    });
                } catch (err) {
                    console.error('Error fetching donations from backed-projects:', err);
                }

                // Fetch recent comments from project-comments collection (CORRECT collection)
                try {
                    const batchedProjectIds = projectIds.slice(0, 10);
                    const commentsRef = collection(db, 'project-comments');
                    const commentsQuery = query(
                        commentsRef,
                        where('projectId', 'in', batchedProjectIds),
                        orderBy('createdAt', 'desc'),
                        firestoreLimit(limit)
                    );
                    const commentsSnapshot = await getDocs(commentsQuery);

                    commentsSnapshot.docs.forEach(doc => {
                        const comment = doc.data();
                        // Only show supporter comments, not creator's own replies
                        if (!comment.isCreatorReply && comment.userId !== creatorId) {
                            const contentPreview = comment.content?.substring(0, 50) || '';
                            allActivities.push({
                                id: `comment-${doc.id}`,
                                type: 'comment',
                                title: 'New comment 💬',
                                description: `${comment.userName || 'Someone'} said: "${contentPreview}${comment.content?.length > 50 ? '...' : ''}"`,
                                projectId: comment.projectId,
                                projectTitle: projectMap.get(comment.projectId),
                                userId: comment.userId,
                                userName: comment.userName,
                                createdAt: comment.createdAt?.toDate() || new Date()
                            });
                        }
                    });
                } catch (err) {
                    console.error('Error fetching comments from project-comments:', err);
                }

                // Fetch recent likes from interactions collection
                try {
                    const batchedProjectIds = projectIds.slice(0, 10);
                    const interactionsRef = collection(db, 'interactions');
                    const likesQuery = query(
                        interactionsRef,
                        where('projectId', 'in', batchedProjectIds),
                        where('type', '==', 'like'),
                        orderBy('createdAt', 'desc'),
                        firestoreLimit(limit)
                    );
                    const likesSnapshot = await getDocs(likesQuery);

                    likesSnapshot.docs.forEach(doc => {
                        const like = doc.data();
                        allActivities.push({
                            id: `like-${doc.id}`,
                            type: 'like',
                            title: 'Project liked ❤️',
                            description: `${like.userName || 'Someone'} liked your project`,
                            projectId: like.projectId,
                            projectTitle: projectMap.get(like.projectId),
                            userId: like.userId,
                            userName: like.userName,
                            createdAt: like.createdAt?.toDate() || new Date()
                        });
                    });
                } catch (err) {
                    // This might fail if index doesn't exist, that's okay
                    console.log('Likes query may require composite index:', err);
                }

                // Fetch recent project updates from project-updates collection
                try {
                    const batchedProjectIds = projectIds.slice(0, 10);
                    const updatesRef = collection(db, 'project-updates');
                    const updatesQuery = query(
                        updatesRef,
                        where('projectId', 'in', batchedProjectIds),
                        orderBy('createdAt', 'desc'),
                        firestoreLimit(5)
                    );
                    const updatesSnapshot = await getDocs(updatesQuery);

                    updatesSnapshot.docs.forEach(doc => {
                        const update = doc.data();
                        allActivities.push({
                            id: `update-${doc.id}`,
                            type: 'update',
                            title: 'Update posted 📝',
                            description: update.title || 'New project update',
                            projectId: update.projectId,
                            projectTitle: projectMap.get(update.projectId),
                            createdAt: update.createdAt?.toDate() || new Date()
                        });
                    });
                } catch (err) {
                    console.log('Updates query error:', err);
                }

                // Sort all activities by date and limit
                allActivities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                setActivities(allActivities.slice(0, limit));

            } catch (err) {
                console.error('Error fetching activities:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch activities');
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, [creatorId, limit]);

    return { activities, loading, error };
};
