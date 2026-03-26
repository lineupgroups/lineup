import { useMemo } from 'react';
import { useProjectContext } from './useProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { useProjectsByCreator } from './useProjects';

/**
 * A contextual hook that returns projects filtered by the selected project.
 * If a specific project is selected, returns only that project.
 * If "All Projects" is selected, returns all creator's projects.
 */
export function useContextualProjects() {
    const { user } = useAuth();
    const { projects: allProjects, loading, error } = useProjectsByCreator(user?.uid || '');
    const { selectedProjectId, selectedProject } = useProjectContext();

    const projects = useMemo(() => {
        if (selectedProjectId && selectedProject) {
            // Return only the selected project
            return [selectedProject];
        }
        // Return all projects
        return allProjects;
    }, [allProjects, selectedProjectId, selectedProject]);

    const isFiltered = selectedProjectId !== null;

    return {
        projects,
        allProjects,
        loading,
        error,
        isFiltered,
        selectedProjectId,
        selectedProject
    };
}

export default useContextualProjects;
