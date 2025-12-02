import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Supporter {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    amount: number;
    projectId: string;
    projectTitle?: string;
    createdAt: Date;
    rewardTier?: string;
}

export const useRecentSupporters = (creatorId: string, limit: number = 5) => {
    const [supporters, setSupporters] = useState<Supporter[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!creatorId) {
            setLoading(false);
            return;
        }

        const fetchSupporters = async () => {
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
                    setSupporters([]);
                    setTotalCount(0);
                    setLoading(false);
                    return;
                }

                // Get all pledges for count
                const allPledgesQuery = query(
                    collection(db, 'pledges'),
                    where('projectId', 'in', projectIds.slice(0, 10))
                );
                const allPledgesSnapshot = await getDocs(allPledgesQuery);
                setTotalCount(allPledgesSnapshot.size);

                // Get recent pledges
                const recentPledgesQuery = query(
                    collection(db, 'pledges'),
                    where('projectId', 'in', projectIds.slice(0, 10)),
                    orderBy('createdAt', 'desc'),
                    firestoreLimit(limit)
                );
                const recentPledgesSnapshot = await getDocs(recentPledgesQuery);

                const supportersList: Supporter[] = recentPledgesSnapshot.docs.map(doc => {
                    const pledge = doc.data();
                    return {
                        id: doc.id,
                        userId: pledge.userId,
                        userName: pledge.userName || 'Anonymous',
                        userAvatar: pledge.userAvatar,
                        amount: pledge.amount || 0,
                        projectId: pledge.projectId,
                        projectTitle: projectMap.get(pledge.projectId),
                        createdAt: pledge.createdAt?.toDate() || new Date(),
                        rewardTier: pledge.rewardId
                    };
                });

                setSupporters(supportersList);
            } catch (err) {
                console.error('Error fetching supporters:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch supporters');
            } finally {
                setLoading(false);
            }
        };

        fetchSupporters();
    }, [creatorId, limit]);

    return { supporters, totalCount, loading, error };
};
