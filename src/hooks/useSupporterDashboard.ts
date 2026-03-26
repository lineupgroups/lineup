import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserDonations } from '../lib/donationService';
import { getProjectUpdates } from '../lib/projectUpdates';
import { FirestoreProjectUpdate } from '../types/firestore';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface UpdateWithProject extends FirestoreProjectUpdate {
    projectTitle: string;
    projectImage: string;
}

interface SupporterStats {
    totalBacked: number;
    projectsSupported: number;
    creatorsHelped: number;
    projectsReachedGoal: number;
    uniqueCategories: number;
    averageDonation: number;
}

export function useSupporterDashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<SupporterStats>({
        totalBacked: 0,
        projectsSupported: 0,
        creatorsHelped: 0,
        projectsReachedGoal: 0,
        uniqueCategories: 0,
        averageDonation: 0
    });
    const [recentUpdates, setRecentUpdates] = useState<UpdateWithProject[]>([]);
    const [backedProjectIds, setBackedProjectIds] = useState<string[]>([]);

    const loadDashboardData = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Get all user donations
            const donations = await getUserDonations(user.uid, { limitCount: 100 });

            if (donations.length === 0) {
                setLoading(false);
                return;
            }

            // Calculate unique projects, creators, and total amount
            const projectIds = new Set<string>();
            const creatorIds = new Set<string>();
            const categories = new Set<string>();
            let totalAmount = 0;
            let projectsReachedGoal = 0;

            // Gather all project data
            const projectDataPromises = donations.map(async (donation) => {
                projectIds.add(donation.projectId);
                totalAmount += donation.amount;

                try {
                    const projectDoc = await getDoc(doc(db, 'projects', donation.projectId));
                    if (projectDoc.exists()) {
                        const projectData = projectDoc.data();
                        creatorIds.add(projectData.createdBy || projectData.creatorId);
                        if (projectData.category) {
                            categories.add(projectData.category);
                        }
                        // Check if project reached its goal
                        if (projectData.raised >= projectData.goal) {
                            projectsReachedGoal++;
                        }
                        return projectData;
                    }
                } catch (error) {
                    console.error('Error fetching project:', error);
                }
                return null;
            });

            await Promise.all(projectDataPromises);

            // Set stats
            setStats({
                totalBacked: totalAmount,
                projectsSupported: projectIds.size,
                creatorsHelped: creatorIds.size,
                projectsReachedGoal,
                uniqueCategories: categories.size,
                averageDonation: donations.length > 0 ? totalAmount / donations.length : 0
            });

            setBackedProjectIds(Array.from(projectIds));

            // Fetch recent updates from backed projects
            const allUpdates: UpdateWithProject[] = [];
            const projectIdArray = Array.from(projectIds).slice(0, 10); // Limit to 10 projects

            await Promise.all(
                projectIdArray.map(async (projectId) => {
                    try {
                        const updates = await getProjectUpdates(projectId);
                        const projectDoc = await getDoc(doc(db, 'projects', projectId));
                        const projectData = projectDoc.exists() ? projectDoc.data() : null;

                        updates.slice(0, 3).forEach((update) => {
                            allUpdates.push({
                                ...update,
                                projectTitle: projectData?.title || 'Unknown Project',
                                projectImage: projectData?.image || ''
                            });
                        });
                    } catch (error) {
                        console.error(`Error fetching updates for project ${projectId}:`, error);
                    }
                })
            );

            // Sort updates by date (most recent first)
            allUpdates.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.createdAt?.toDate?.() || new Date(0);
                return dateB.getTime() - dateA.getTime();
            });

            setRecentUpdates(allUpdates.slice(0, 10)); // Keep only 10 most recent

        } catch (error) {
            console.error('Error loading supporter dashboard:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    return {
        loading,
        stats,
        recentUpdates,
        backedProjectIds,
        refresh: loadDashboardData
    };
}
