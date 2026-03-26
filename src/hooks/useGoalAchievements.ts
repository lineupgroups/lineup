import { useState, useEffect, useCallback } from 'react';
import { FirestoreProject } from '../types/firestore';

export interface GoalAchievement {
    projectId: string;
    projectTitle: string;
    raised: number;
    goal: number;
    percentFunded: number;
    milestone: number; // The milestone reached (25, 50, 75, 100)
    justReachedGoal: boolean;
    reachedAt?: Date;
}

// Milestone thresholds to celebrate
const MILESTONES = [25, 50, 75, 100];

/**
 * D-MISS-02: Hook to track goal achievements and trigger celebrations
 * Now supports ALL milestones: 25%, 50%, 75%, 100%
 */
export const useGoalAchievements = (projects: FirestoreProject[]) => {
    const [achievements, setAchievements] = useState<GoalAchievement[]>([]);
    const [newAchievement, setNewAchievement] = useState<GoalAchievement | null>(null);
    const [celebrationShown, setCelebrationShown] = useState<Set<string>>(new Set());

    // Check localStorage for previously shown celebrations
    useEffect(() => {
        const storedCelebrations = localStorage.getItem('lineup_shown_celebrations');
        if (storedCelebrations) {
            try {
                setCelebrationShown(new Set(JSON.parse(storedCelebrations)));
            } catch {
                // Invalid JSON, reset
                localStorage.removeItem('lineup_shown_celebrations');
            }
        }
    }, []);

    // Check for goal achievements at ALL milestone thresholds
    useEffect(() => {
        if (!projects || projects.length === 0) return;

        const allAchievements: GoalAchievement[] = [];
        let newlyAchieved: GoalAchievement | null = null;

        projects.forEach(project => {
            const goal = project.goal || project.fundingGoal || 0;
            const raised = project.raised || 0;
            const percentFunded = goal > 0 ? (raised / goal) * 100 : 0;

            // Check each milestone threshold
            MILESTONES.forEach(milestone => {
                if (percentFunded >= milestone) {
                    // Create unique key for this project + milestone combo
                    const celebrationKey = `${project.id}_${milestone}`;

                    const achievement: GoalAchievement = {
                        projectId: project.id,
                        projectTitle: project.title,
                        raised,
                        goal,
                        percentFunded,
                        milestone,
                        justReachedGoal: !celebrationShown.has(celebrationKey)
                    };

                    allAchievements.push(achievement);

                    // Check if this is a new achievement (not yet celebrated)
                    // Only show the HIGHEST uncelebrated milestone to avoid multiple popups
                    if (achievement.justReachedGoal && !newlyAchieved) {
                        newlyAchieved = achievement;
                    }
                }
            });
        });

        setAchievements(allAchievements);

        // Only set new achievement if we haven't shown celebration yet
        if (newlyAchieved) {
            const celebrationKey = `${newlyAchieved.projectId}_${newlyAchieved.milestone}`;
            if (!celebrationShown.has(celebrationKey)) {
                setNewAchievement(newlyAchieved);
            }
        }
    }, [projects, celebrationShown]);

    // Mark celebration as shown for a specific project + milestone
    const markCelebrationShown = useCallback((projectId: string, milestone?: number) => {
        setCelebrationShown(prev => {
            const newSet = new Set(prev);
            // If milestone is provided, use project_milestone key, otherwise fall back to just projectId
            const key = milestone ? `${projectId}_${milestone}` : projectId;
            newSet.add(key);
            // Persist to localStorage
            localStorage.setItem('lineup_shown_celebrations', JSON.stringify([...newSet]));
            return newSet;
        });
        setNewAchievement(null);
    }, []);

    // Dismiss the celebration
    const dismissCelebration = useCallback(() => {
        if (newAchievement) {
            markCelebrationShown(newAchievement.projectId, newAchievement.milestone);
        }
    }, [newAchievement, markCelebrationShown]);

    // Get highest achieved milestone for a project
    const getHighestMilestone = useCallback((projectId: string): number => {
        const projectAchievements = achievements.filter(a => a.projectId === projectId);
        if (projectAchievements.length === 0) return 0;
        return Math.max(...projectAchievements.map(a => a.milestone));
    }, [achievements]);

    return {
        achievements,
        newAchievement,
        dismissCelebration,
        markCelebrationShown,
        getHighestMilestone,
        hasAchievements: achievements.length > 0
    };
};
