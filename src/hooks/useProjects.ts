import { useState, useEffect, useCallback } from 'react';
import {
  getProjects,
  getProject,
  getFeaturedProjects,
  getRecentActiveProjects,
  getProjectsByCategory,
  getProjectsByCreator,
  searchProjects,
  createProject,
  updateProject,
  deleteProject,
  FirestoreProject,
  CreateProjectData,
  UpdateProjectData
} from '../lib/firestore';
import toast from 'react-hot-toast';

export const useProjects = () => {
  const [projects, setProjects] = useState<FirestoreProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects
  };
};

export const useProject = (projectId: string) => {
  const [project, setProject] = useState<FirestoreProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getProject(projectId);
        setProject(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch project');
        toast.error('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  return {
    project,
    loading,
    error
  };
};

export const useFeaturedProjects = () => {
  const [projects, setProjects] = useState<FirestoreProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeaturedProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFeaturedProjects();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch featured projects');
      toast.error('Failed to load featured projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    refetch: fetchFeaturedProjects
  };
};

export const useRecentActiveProjects = () => {
  const [projects, setProjects] = useState<FirestoreProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentActiveProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRecentActiveProjects();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recent projects');
      toast.error('Failed to load recent projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentActiveProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    refetch: fetchRecentActiveProjects
  };
};

export const useProjectsByCategory = (category: string) => {
  const [projects, setProjects] = useState<FirestoreProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectsByCategory = async () => {
    if (!category || category === 'All') {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getProjectsByCategory(category);
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsByCategory();
  }, [category]);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjectsByCategory
  };
};

export const useProjectsByCreator = (creatorId: string) => {
  const [projects, setProjects] = useState<FirestoreProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectsByCreator = async () => {
    if (!creatorId) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getProjectsByCreator(creatorId);
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsByCreator();
  }, [creatorId]);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjectsByCreator
  };
};

export const useProjectSearch = (searchTerm: string) => {
  const [projects, setProjects] = useState<FirestoreProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (term: string) => {
    if (!term.trim()) {
      setProjects([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await searchProjects(term);
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search projects');
      toast.error('Failed to search projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(searchTerm);
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, search]); // Added search to dependencies

  return {
    projects,
    loading,
    error,
    search
  };
};

export const useProjectMutations = () => {
  const [loading, setLoading] = useState(false);

  const createProjectMutation = async (projectData: CreateProjectData) => {
    try {
      setLoading(true);
      const projectId = await createProject(projectData);
      toast.success('Project created successfully!');
      return projectId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProjectMutation = async (projectId: string, updateData: UpdateProjectData) => {
    try {
      setLoading(true);
      await updateProject(projectId, updateData);
      toast.success('Project updated successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProjectMutation = async (projectId: string) => {
    try {
      setLoading(true);
      await deleteProject(projectId);
      toast.success('Project deleted successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createProject: createProjectMutation,
    updateProject: updateProjectMutation,
    deleteProject: deleteProjectMutation
  };
};
