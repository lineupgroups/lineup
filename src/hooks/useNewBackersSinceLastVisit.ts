import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useNewBackersSinceLastVisit = (creatorId: string) => {
    const [newBackersCount, setNewBackersCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Key for local storage
    const STORAGE_KEY = `lineup_last_backers_visit_${creatorId}`;

    const fetchNewBackers = useCallback(async () => {
        if (!creatorId) {
            setLoading(false);
            return;
        }

        try {
            // Get last visit timestamp
            const lastVisitStr = localStorage.getItem(STORAGE_KEY);

            // If never visited, default to now (so count starts at 0)
            // This prevents showing "All backers ever" as new on first login
            if (!lastVisitStr) {
                // Initialize storage with current time if missing
                localStorage.setItem(STORAGE_KEY, new Date().toISOString());
                setNewBackersCount(0);
                setLoading(false);
                return;
            }

            const lastVisitDate = new Date(lastVisitStr);

            // Get projects owned by creator
            const projectsRef = collection(db, 'projects');
            const projectsQuery = query(projectsRef, where('creatorId', '==', creatorId));
            const projectsSnapshot = await getDocs(projectsQuery);

            if (projectsSnapshot.empty) {
                setNewBackersCount(0);
                setLoading(false);
                return;
            }

            const projectIds = projectsSnapshot.docs.map(doc => doc.id);
            // Firestore 'in' query is limited to 10 items
            // For now, we only check the first 10 projects
            const batchedProjectIds = projectIds.slice(0, 10);

            // Query recent donations for these projects
            // We filter by date in memory to avoid needing a composite index
            const donationsQuery = query(
                collection(db, 'backed-projects'),
                where('projectId', 'in', batchedProjectIds)
            );

            const donationsSnapshot = await getDocs(donationsQuery);

            // Count donations that happened after last visit
            let count = 0;
            donationsSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.backedAt && data.backedAt.toDate() > lastVisitDate) {
                    count++;
                }
            });

            setNewBackersCount(count);

        } catch (error) {
            console.error('Error fetching new backers count:', error);
        } finally {
            setLoading(false);
        }
    }, [creatorId]);

    useEffect(() => {
        fetchNewBackers();
    }, [fetchNewBackers]);

    const markAsVisited = useCallback(() => {
        const now = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, now);
        setNewBackersCount(0);
    }, [creatorId]);

    return { newBackersCount, markAsVisited, loading, refreshBackersCount: fetchNewBackers };
};
