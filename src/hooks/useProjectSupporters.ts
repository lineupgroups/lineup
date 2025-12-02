import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ProjectSupporter {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    amount: number;
    rewardTier?: string;
    location?: string;
    createdAt: Date;
}

export const useProjectSupporters = (projectId: string) => {
    const [supporters, setSupporters] = useState<ProjectSupporter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!projectId) {
            setLoading(false);
            return;
        }

        const fetchSupporters = async () => {
            try {
                setLoading(true);
                setError(null);

                const pledgesRef = collection(db, 'pledges');
                const pledgesQuery = query(
                    pledgesRef,
                    where('projectId', '==', projectId),
                    orderBy('createdAt', 'desc')
                );

                const pledgesSnapshot = await getDocs(pledgesQuery);

                const supportersList: ProjectSupporter[] = pledgesSnapshot.docs.map(doc => {
                    const pledge = doc.data();
                    return {
                        id: doc.id,
                        userId: pledge.userId,
                        userName: pledge.userName || 'Anonymous',
                        userAvatar: pledge.userAvatar,
                        amount: pledge.amount || 0,
                        rewardTier: pledge.rewardTitle || pledge.rewardId,
                        location: pledge.location,
                        createdAt: pledge.createdAt?.toDate() || new Date()
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
    }, [projectId]);

    return { supporters, loading, error };
};
