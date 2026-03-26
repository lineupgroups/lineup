import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FirestoreComment } from '../types/firestore';

interface CreatorComment extends FirestoreComment {
    projectTitle?: string;
    hasCreatorReply: boolean;
    replyContent?: string;
    repliedAt?: Timestamp;
}

interface CommentStats {
    total: number;
    unreplied: number;
    replied: number;
    thisWeek: number;
    avgResponseTimeHours: number | null;
}

// Hook to fetch all comments across all creator's projects
export const useCreatorComments = (creatorId: string) => {
    const [comments, setComments] = useState<CreatorComment[]>([]);
    const [stats, setStats] = useState<CommentStats>({
        total: 0,
        unreplied: 0,
        replied: 0,
        thisWeek: 0,
        avgResponseTimeHours: null
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchComments = useCallback(async () => {
        if (!creatorId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Step 1: Get all projects by this creator
            const projectsRef = collection(db, 'projects');
            const projectsQuery = query(projectsRef, where('creatorId', '==', creatorId));
            const projectsSnapshot = await getDocs(projectsQuery);

            if (projectsSnapshot.empty) {
                setComments([]);
                setStats({ total: 0, unreplied: 0, replied: 0, thisWeek: 0, avgResponseTimeHours: null });
                setLoading(false);
                return;
            }

            // Create project map for titles
            const projectMap = new Map<string, string>();
            projectsSnapshot.docs.forEach(doc => {
                projectMap.set(doc.id, doc.data().title);
            });

            const projectIds = Array.from(projectMap.keys());

            // Step 2: Fetch all comments for these projects
            const allComments: CreatorComment[] = [];
            let totalResponseTime = 0;
            let responseCount = 0;

            // Calculate one week ago
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            for (const projectId of projectIds) {
                try {
                    const commentsRef = collection(db, 'project-comments');
                    const commentsQuery = query(
                        commentsRef,
                        where('projectId', '==', projectId),
                        where('isDeleted', '==', false),
                        orderBy('createdAt', 'desc')
                    );
                    const commentsSnapshot = await getDocs(commentsQuery);

                    const projectComments = commentsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as FirestoreComment[];

                    // Process each root comment (not from creator, not a reply)
                    const rootComments = projectComments.filter(
                        c => !c.parentCommentId && c.userId !== creatorId
                    );

                    rootComments.forEach(comment => {
                        // Find if creator has replied
                        const creatorReply = projectComments.find(
                            c => c.parentCommentId === comment.id && c.userId === creatorId
                        );

                        const hasCreatorReply = !!creatorReply;

                        // Calculate response time if replied
                        if (hasCreatorReply && creatorReply && comment.createdAt && creatorReply.createdAt) {
                            const commentTime = comment.createdAt.toDate().getTime();
                            const replyTime = creatorReply.createdAt.toDate().getTime();
                            const diffHours = (replyTime - commentTime) / (1000 * 60 * 60);
                            if (diffHours > 0 && diffHours < 168) { // Less than a week
                                totalResponseTime += diffHours;
                                responseCount++;
                            }
                        }

                        allComments.push({
                            ...comment,
                            projectTitle: projectMap.get(projectId),
                            hasCreatorReply,
                            replyContent: creatorReply?.content,
                            repliedAt: creatorReply?.createdAt
                        });
                    });
                } catch (err) {
                    console.error(`Error fetching comments for project ${projectId}:`, err);
                }
            }

            // Sort by createdAt descending
            allComments.sort((a, b) => {
                const aTime = a.createdAt?.toDate?.().getTime() || 0;
                const bTime = b.createdAt?.toDate?.().getTime() || 0;
                return bTime - aTime;
            });

            // Calculate stats
            const total = allComments.length;
            const unreplied = allComments.filter(c => !c.hasCreatorReply).length;
            const replied = allComments.filter(c => c.hasCreatorReply).length;
            const thisWeek = allComments.filter(c => {
                const commentDate = c.createdAt?.toDate?.();
                return commentDate && commentDate >= oneWeekAgo;
            }).length;
            const avgResponseTimeHours = responseCount > 0
                ? Math.round((totalResponseTime / responseCount) * 10) / 10
                : null;

            setComments(allComments);
            setStats({
                total,
                unreplied,
                replied,
                thisWeek,
                avgResponseTimeHours
            });
        } catch (err) {
            console.error('Error fetching creator comments:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch comments');
        } finally {
            setLoading(false);
        }
    }, [creatorId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    return {
        comments,
        stats,
        loading,
        error,
        refetch: fetchComments
    };
};

export type { CreatorComment, CommentStats };
