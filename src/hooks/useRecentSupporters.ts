import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Donation {
    id: string;
    donationId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    amount: number;
    projectId: string;
    projectTitle: string;
    backedAt: Date;
    createdAt: Date;
    anonymous: boolean;
}

export const useRecentSupporters = (creatorId: string, limit: number = 10) => {
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        if (!creatorId) {
            setLoading(false);
            return;
        }

        const fetchDonations = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get creator's projects first
                const projectsRef = collection(db, 'projects');
                const projectsQuery = query(projectsRef, where('creatorId', '==', creatorId));
                const projectsSnapshot = await getDocs(projectsQuery);

                const projectMap = new Map<string, string>();
                projectsSnapshot.docs.forEach(doc => {
                    projectMap.set(doc.id, doc.data().title);
                });

                const projectIds = Array.from(projectMap.keys());

                if (projectIds.length === 0) {
                    setDonations([]);
                    setTotalCount(0);
                    setLoading(false);
                    return;
                }

                // Fetch individual donations from backed-projects collection
                const batchedProjectIds = projectIds.slice(0, 10); // Firestore 'in' query limit
                const donationsRef = collection(db, 'backed-projects');
                const donationsQuery = query(
                    donationsRef,
                    where('projectId', 'in', batchedProjectIds),
                    orderBy('backedAt', 'desc'),
                    firestoreLimit(limit)
                );
                const donationsSnapshot = await getDocs(donationsQuery);

                // Map each donation individually (no grouping)
                const donationsArray: Donation[] = donationsSnapshot.docs.map(doc => {
                    const donation = doc.data();
                    const backedAtDate = donation.backedAt?.toDate() || new Date();
                    return {
                        id: doc.id,
                        donationId: doc.id,
                        userId: donation.userId || '',
                        userName: donation.anonymous ? 'Anonymous' : (donation.displayName || 'Someone'),
                        userAvatar: donation.anonymous ? undefined : donation.photoURL,
                        amount: donation.amount || 0,
                        projectId: donation.projectId,
                        projectTitle: projectMap.get(donation.projectId) || 'Unknown Project',
                        backedAt: backedAtDate,
                        createdAt: backedAtDate,
                        anonymous: donation.anonymous || false
                    };
                });

                setDonations(donationsArray);
                setTotalCount(donationsSnapshot.size);

            } catch (err) {
                console.error('Error fetching donations:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch donations');
            } finally {
                setLoading(false);
            }
        };

        fetchDonations();
    }, [creatorId, limit]);

    // Return as 'supporters' for backward compatibility with widget
    return { supporters: donations, loading, error, totalCount };
};
