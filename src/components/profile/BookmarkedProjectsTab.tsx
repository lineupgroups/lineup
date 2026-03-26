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
            <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Bookmark className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Saved Projects</h3>
                <p className="text-gray-600">
                    {isOwnProfile
                        ? 'Projects you bookmark will appear here for easy access.'
                        : 'No saved projects to show.'}
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
            ))}
        </div>
    );
}
