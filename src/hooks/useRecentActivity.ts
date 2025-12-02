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

                // Fetch recent pledges
                try {
                    const pledgesRef = collection(db, 'pledges');
                    const pledgesQuery = query(
                        pledgesRef,
                        where('projectId', 'in', projectIds.slice(0, 10)), // Firestore 'in' limit
                        orderBy('createdAt', 'desc'),
                        firestoreLimit(limit)
                    );
                    const pledgesSnapshot = await getDocs(pledgesQuery);

                    pledgesSnapshot.docs.forEach(doc => {
                        const pledge = doc.data();
                        allActivities.push({
                            id: `pledge-${doc.id}`,
                            type: 'pledge',
                            title: 'New supporter!',
                            description: `${pledge.userName || 'Someone'} pledged ₹${pledge.amount?.toLocaleString('en-IN') || 0}`,
                            projectId: pledge.projectId,
                            projectTitle: projectMap.get(pledge.projectId),
                            userId: pledge.userId,
                            userName: pledge.userName,
                            createdAt: pledge.createdAt?.toDate() || new Date()
                        });
                    });
                } catch (err) {
                    console.error('Error fetching pledges:', err);
                }

                // Fetch recent comments
                try {
                    const commentsRef = collection(db, 'comments');
                    const commentsQuery = query(
                        commentsRef,
                        where('projectId', 'in', projectIds.slice(0, 10)),
                        orderBy('createdAt', 'desc'),
                        firestoreLimit(limit)
                    );
                    const commentsSnapshot = await getDocs(commentsQuery);

                    commentsSnapshot.docs.forEach(doc => {
                        const comment = doc.data();
                        if (!comment.isCreatorComment) { // Only show supporter comments
                            allActivities.push({
                                id: `comment-${doc.id}`,
                                type: 'comment',
                                title: 'New comment',
                                description: `${comment.userName} commented: "${comment.content.substring(0, 50)}${comment.content.length > 50 ? '...' : ''}"`,
                                projectId: comment.projectId,
                                projectTitle: projectMap.get(comment.projectId),
                                userId: comment.userId,
                                userName: comment.userName,
                                createdAt: comment.createdAt?.toDate() || new Date()
                            });
                        }
                    });
                } catch (err) {
                    console.error('Error fetching comments:', err);
                }

                // Fetch recent likes
                try {
                    const interactionsRef = collection(db, 'interactions');
                    const likesQuery = query(
                        interactionsRef,
                        where('projectId', 'in', projectIds.slice(0, 10)),
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
                            title: 'Project liked',
                            description: `${like.userName || 'Someone'} liked your project`,
                            projectId: like.projectId,
                            projectTitle: projectMap.get(like.projectId),
                            userId: like.userId,
                            userName: like.userName,
                            createdAt: like.createdAt?.toDate() || new Date()
                        });
                    });
                } catch (err) {
                    console.error('Error fetching likes:', err);
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
