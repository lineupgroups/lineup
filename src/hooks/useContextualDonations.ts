import { useState, useEffect, useMemo } from 'react';
import { useProjectContext } from './useProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { useProjectsByCreator } from './useProjects';
import { getProjectDonations, DonationData } from '../lib/donationService';

interface DonationWithProject extends DonationData {
    projectTitle: string;
    projectId: string;
}

interface UseContextualDonationsOptions {
    limitCount?: number;
}

/**
 * A contextual hook that returns donations filtered by the selected project.
 * If a specific project is selected, fetches donations only for that project.
 * If "All Projects" is selected, fetches donations for all creator's projects.
 */
export function useContextualDonations(options: UseContextualDonationsOptions = {}) {
    const { limitCount = 100 } = options;
    const { user } = useAuth();
    const { projects: allProjects, loading: projectsLoading } = useProjectsByCreator(user?.uid || '');
    const { selectedProjectId, selectedProject } = useProjectContext();

    const [donations, setDonations] = useState<DonationWithProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Determine which projects to fetch donations for
    const projectsToFetch = useMemo(() => {
        if (selectedProjectId && selectedProject) {
            return [selectedProject];
        }
        return allProjects;
    }, [allProjects, selectedProjectId, selectedProject]);

    // Fetch donations for the relevant projects
    useEffect(() => {
        const fetchDonations = async () => {
            if (projectsToFetch.length === 0) {
                setDonations([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const allPromises = projectsToFetch.map(async (project) => {
                    const projectDonations = await getProjectDonations(project.id, { limitCount });
                    return projectDonations.map(d => ({
                        ...d,
                        projectTitle: project.title,
                        projectId: project.id
                    }));
                });

                const results = await Promise.all(allPromises);
                const flatDonations = results.flat();

                // Sort by date (newest first)
                flatDonations.sort((a, b) => {
                    const dateA = a.backedAt?.toDate?.() || new Date(0);
                    const dateB = b.backedAt?.toDate?.() || new Date(0);
                    return dateB.getTime() - dateA.getTime();
                });

                setDonations(flatDonations);
            } catch (err) {
                console.error('Error fetching donations:', err);
                setError('Failed to load donations');
            } finally {
                setLoading(false);
            }
        };

        if (!projectsLoading) {
            fetchDonations();
        }
    }, [projectsToFetch, projectsLoading, limitCount]);

    // Calculate aggregate stats
    const stats = useMemo(() => {
        const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
        const uniqueSupporters = new Set(donations.filter(d => !d.anonymous).map(d => d.userId)).size;
        const anonymousCount = donations.filter(d => d.anonymous).length;
        const avgDonation = donations.length > 0 ? totalAmount / donations.length : 0;

        return {
            totalAmount,
            totalDonations: donations.length,
            uniqueSupporters,
            anonymousCount,
            avgDonation
        };
    }, [donations]);

    const isFiltered = selectedProjectId !== null;

    return {
        donations,
        stats,
        loading: loading || projectsLoading,
        error,
        isFiltered,
        selectedProjectId,
        selectedProject,
        projectsToFetch
    };
}

export default useContextualDonations;
