import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useProjectsByCreator } from '../hooks/useProjects';
import { FirestoreProject } from '../types/firestore';

// ============================================================================
// Types
// ============================================================================

export interface ProjectContextType {
    // Selected project state
    selectedProjectId: string | null;       // null = "All Projects"
    selectedProject: FirestoreProject | null; // Full project object when selected

    // Actions
    setSelectedProjectId: (projectId: string | null) => void;
    clearSelection: () => void;

    // Creator's projects list
    projects: FirestoreProject[];
    loading: boolean;
    error: string | null;

    // Helper methods
    getProjectById: (projectId: string) => FirestoreProject | null;
    hasProjects: boolean;
    activeProjectsCount: number;

    // Refresh projects list
    refreshProjects: () => void;
}

// Local storage key for persisting selection
const SELECTED_PROJECT_KEY = 'lineup_selected_project';

// ============================================================================
// Context
// ============================================================================

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// ============================================================================
// Hook
// ============================================================================

export const useProjectContext = (): ProjectContextType => {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProjectContext must be used within a ProjectProvider');
    }
    return context;
};

// ============================================================================
// Provider
// ============================================================================

interface ProjectProviderProps {
    children: React.ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
    const { user } = useAuth();
    const { projects, loading, error, refetch } = useProjectsByCreator(user?.uid || '');

    // Initialize selection from localStorage
    const [selectedProjectId, setSelectedProjectIdState] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null;
        try {
            const stored = localStorage.getItem(SELECTED_PROJECT_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    // Persist selection to localStorage
    useEffect(() => {
        try {
            if (selectedProjectId) {
                localStorage.setItem(SELECTED_PROJECT_KEY, JSON.stringify(selectedProjectId));
            } else {
                localStorage.removeItem(SELECTED_PROJECT_KEY);
            }
        } catch (error) {
            console.error('Error saving project selection to localStorage:', error);
        }
    }, [selectedProjectId]);

    // Clear selection if user logs out or changes
    useEffect(() => {
        if (!user) {
            setSelectedProjectIdState(null);
        }
    }, [user]);

    // Clear selection if the selected project no longer exists
    useEffect(() => {
        if (selectedProjectId && projects.length > 0) {
            const projectExists = projects.some(p => p.id === selectedProjectId);
            if (!projectExists) {
                setSelectedProjectIdState(null);
            }
        }
    }, [projects, selectedProjectId]);

    // Get the full project object for the selected project
    const selectedProject = useMemo(() => {
        if (!selectedProjectId) return null;
        return projects.find(p => p.id === selectedProjectId) || null;
    }, [projects, selectedProjectId]);

    // Set selected project ID
    const setSelectedProjectId = useCallback((projectId: string | null) => {
        setSelectedProjectIdState(projectId);
    }, []);

    // Clear selection (go back to "All Projects")
    const clearSelection = useCallback(() => {
        setSelectedProjectIdState(null);
    }, []);

    // Get project by ID helper
    const getProjectById = useCallback((projectId: string): FirestoreProject | null => {
        return projects.find(p => p.id === projectId) || null;
    }, [projects]);

    // Computed values
    const hasProjects = projects.length > 0;
    const activeProjectsCount = useMemo(() =>
        projects.filter(p => p.status === 'active').length,
        [projects]
    );

    // Context value
    const value: ProjectContextType = useMemo(() => ({
        selectedProjectId,
        selectedProject,
        setSelectedProjectId,
        clearSelection,
        projects,
        loading,
        error,
        getProjectById,
        hasProjects,
        activeProjectsCount,
        refreshProjects: refetch
    }), [
        selectedProjectId,
        selectedProject,
        setSelectedProjectId,
        clearSelection,
        projects,
        loading,
        error,
        getProjectById,
        hasProjects,
        activeProjectsCount,
        refetch
    ]);

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
};

export default ProjectContext;
