import { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getProject } from '../../lib/firestore';
import { FirestoreProject } from '../../types/firestore';
import { Bookmark } from 'lucide-react';
import ProjectCard from '../projects/ProjectCard';
import LoadingSpinner from '../common/LoadingSpinner';

interface BookmarkedProjectsTabProps {
    userId: string;
    isOwnProfile?: boolean;
}

interface BookmarkData {
    projectId: string;
    projectTitle: string;
    savedAt: any;
}

export default function BookmarkedProjectsTab({ userId, isOwnProfile = false }: BookmarkedProjectsTabProps) {
    const [projects, setProjects] = useState<FirestoreProject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBookmarkedProjects = async () => {
            if (!userId) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                // Fetch bookmarks from user's subcollection
                const bookmarksRef = collection(db, 'users', userId, 'bookmarks');
                const bookmarksQuery = query(bookmarksRef, orderBy('savedAt', 'desc'));
                const bookmarksSnap = await getDocs(bookmarksQuery);

                const bookmarks: BookmarkData[] = bookmarksSnap.docs.map(doc => ({
                    projectId: doc.id,
                    ...doc.data()
                } as BookmarkData));

                // Fetch project details for each bookmark
                const projectPromises = bookmarks.map(async (bookmark) => {
                    try {
                        const project = await getProject(bookmark.projectId);
                        return project;
                    } catch (err) {
                        console.warn(`Failed to fetch project ${bookmark.projectId}:`, err);
                        return null;
                    }
                });

                const projectResults = await Promise.all(projectPromises);
                const validProjects = projectResults.filter((p): p is FirestoreProject => p !== null);

                setProjects(validProjects);
            } catch (err) {
                console.error('Error fetching bookmarked projects:', err);
                setError('Failed to load saved projects');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBookmarkedProjects();
    }, [userId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="text-center py-24 bg-neutral-900/20 rounded-[3rem] border border-neutral-800 border-dashed">
                <div className="w-24 h-24 mx-auto mb-8 bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-800">
                    <Bookmark className="w-8 h-8 text-neutral-700" />
                </div>
                <h3 className="text-2xl font-black text-brand-white italic uppercase tracking-tight mb-4">
                    {isOwnProfile ? 'Your Collection is Empty' : 'No Saved Insights'}
                </h3>
                <p className="text-neutral-500 max-w-sm mx-auto font-medium">
                    {isOwnProfile
                        ? 'Bookmark projects that resonate with you to build your personal lineup.'
                        : 'This user has not yet curated their personal project lineup.'}
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
            ))}
        </div>
    );
}
