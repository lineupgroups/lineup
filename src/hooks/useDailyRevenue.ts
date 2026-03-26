import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface DailyRevenueData {
    date: string;
    amount: number;
    supporters: number;
}

export const useDailyRevenue = (creatorId: string, days: number = 7) => {
    const [revenueData, setRevenueData] = useState<DailyRevenueData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!creatorId) {
            setLoading(false);
            return;
        }

        const fetchDailyRevenue = async () => {
            try {
                setLoading(true);
                setError(null);

                // Calculate date range
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - days);

                // Get all projects by this creator
                const projectsRef = collection(db, 'projects');
                const projectsQuery = query(projectsRef, where('creatorId', '==', creatorId));
                const projectsSnapshot = await getDocs(projectsQuery);
                const projectIds = projectsSnapshot.docs.map(doc => doc.id);

                if (projectIds.length === 0) {
                    setRevenueData([]);
                    setLoading(false);
                    return;
                }

                // Get donations for these projects within date range
                // Note: Firestore 'in' query limited to 10 items, batch if needed
                const batchedProjectIds = projectIds.slice(0, 10);
                const donationsRef = collection(db, 'backed-projects');
                const donationsQuery = query(
                    donationsRef,
                    where('projectId', 'in', batchedProjectIds),
                    where('backedAt', '>=', Timestamp.fromDate(startDate)),
                    where('backedAt', '<=', Timestamp.fromDate(endDate))
                );

                const donationsSnapshot = await getDocs(donationsQuery);

                // Group by day
                const dailyMap = new Map<string, { amount: number; supporters: Set<string> }>();

                donationsSnapshot.docs.forEach(doc => {
                    const donation = doc.data();
                    const date = donation.backedAt.toDate();
                    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

                    if (!dailyMap.has(dateKey)) {
                        dailyMap.set(dateKey, { amount: 0, supporters: new Set() });
                    }

                    const dayData = dailyMap.get(dateKey)!;
                    dayData.amount += donation.amount || 0;
                    dayData.supporters.add(donation.userId);
                });

                // Fill in missing days with zero values
                const result: DailyRevenueData[] = [];
                for (let i = days - 1; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const dateKey = date.toISOString().split('T')[0];

                    const dayData = dailyMap.get(dateKey) || { amount: 0, supporters: new Set() };
                    result.push({
                        date: dateKey,
                        amount: dayData.amount,
                        supporters: dayData.supporters.size
                    });
                }

                setRevenueData(result);
            } catch (err) {
                console.error('Error fetching daily revenue:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch revenue data');
            } finally {
                setLoading(false);
            }
        };

        fetchDailyRevenue();
    }, [creatorId, days]);

    return { revenueData, loading, error };
};
