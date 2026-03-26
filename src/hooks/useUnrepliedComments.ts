import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface UnrepliedCommentInfo {
    count: number;
    projectId: string;
    projectTitle: string;
}

// D-MISS-03: Hook to get count of unreplied comments across all creator projects
export const useUnrepliedComments = (creatorId: string) => {
    const [unrepliedCount, setUnrepliedCount] = useState(0);
    const [unrepliedByProject, setUnrepliedByProject] = useState<UnrepliedCommentInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!creatorId) {
            setLoading(false);
            return;
        }

        const fetchUnrepliedComments = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get all projects by this creator
                const projectsRef = collection(db, 'projects');
                const projectsQuery = query(projectsRef, where('creatorId', '==', creatorId));
                const projectsSnapshot = await getDocs(projectsQuery);

                if (projectsSnapshot.empty) {
                    setUnrepliedCount(0);
                    setUnrepliedByProject([]);
                    setLoading(false);
                    return;
                }

                const projectMap = new Map<string, string>();
                projectsSnapshot.docs.forEach(doc => {
                    projectMap.set(doc.id, doc.data().title);
                });

                const projectIds = Array.from(projectMap.keys());
                let totalUnreplied = 0;
                const byProject: UnrepliedCommentInfo[] = [];

                // For each project, get comments that aren't from the creator
                // A comment is "unreplied" if it's not from the creator and has no reply from the creator
                for (const projectId of projectIds.slice(0, 10)) { // Limit to 10 projects
                    try {
                        const commentsRef = collection(db, 'project-comments');
                        const commentsQuery = query(
                            commentsRef,
                            where('projectId', '==', projectId)
                        );
                        const commentsSnapshot = await getDocs(commentsQuery);


                        // Filter comments that are not from the creator and have no creator reply
                        const comments = commentsSnapshot.docs.map(doc => {
                            const data = doc.data();
                            return {
                                id: doc.id,
                                // Note: replies use parentCommentId, not parentId
                                parentCommentId: data.parentCommentId as string | undefined,
                                userId: data.userId as string,
                                isDeleted: data.isDeleted as boolean | undefined
                            };
                        });

                        // Group comments by parent (to find replies)
                        // Root comments have no parentCommentId
                        // Exclude deleted comments from the count
                        const rootComments = comments.filter(c =>
                            !c.parentCommentId &&
                            c.userId !== creatorId &&
                            c.isDeleted !== true
                        );

                        // For each root comment, check if creator has replied
                        let projectUnreplied = 0;
                        rootComments.forEach(comment => {
                            const hasCreatorReply = comments.some(
                                c => c.parentCommentId === comment.id && c.userId === creatorId
                            );
                            if (!hasCreatorReply) {
                                projectUnreplied++;
                            }
                        });

                        if (projectUnreplied > 0) {
                            byProject.push({
                                count: projectUnreplied,
                                projectId,
                                projectTitle: projectMap.get(projectId) || 'Unknown Project'
                            });
                            totalUnreplied += projectUnreplied;
                        }
                    } catch (err) {
                        console.error(`Error fetching comments for project ${projectId}:`, err);
                    }
                }

                setUnrepliedCount(totalUnreplied);
                setUnrepliedByProject(byProject);
            } catch (err) {
                console.error('Error fetching unreplied comments:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch unreplied comments');
            } finally {
                setLoading(false);
            }
        };

        fetchUnrepliedComments();
    }, [creatorId]);

    return { unrepliedCount, unrepliedByProject, loading, error };
};
