import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Project, ProjectInsert, ProjectUpdate } from '@/types/Project';
import { supabase } from '@/lib/supabase'; // Assuming you have a supabase client initialized here
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchProjectById } from '@/lib/project-queries';

type ProjectContextType = {
  currentProject: Project | null;
  projects: (Project | null)[];
  isLoading: boolean;
  error: string | null;
  createProject: (project: ProjectInsert) => Promise<Project | null>;
  updateProject: (projectId: string, project: ProjectUpdate) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<void>;
  setCurrentProject: (path: string) => Promise<void>;
  refetchProjects: () => void;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: loadingUser } = useAuth();
  const navigate = useNavigate();
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [projects, setProjects] = useState<(Project | null)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!user?.id) {
      setProjects([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', user.id);

      if (error) {
        throw error;
      }
      setProjects(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching projects:', err.message);
      setError(err.message || 'Failed to fetch projects');
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!loadingUser) {
      fetchProjects();
    }
  }, [loadingUser, fetchProjects]);

  const setCurrentProject = useCallback(async (projectId: string) => {
    if (!projectId) {
      setCurrentProjectState(null);
      return;
    }
    setIsLoading(true);
    try {
      const project = await fetchProjectById(projectId);
      if (project) {
        setCurrentProjectState(project);
      } else {
        navigate('/create-project');
      }
    } catch (err: any) {
      console.error('Error setting current project:', err.message);
      setError(err.message || 'Failed to set current project');
      setCurrentProjectState(null);
      navigate('/create-project'); // Redirect if project not found or error
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const createProject = useCallback(async (projectData: ProjectInsert) => {
    setIsLoading(true);
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      const { data, error } = await supabase
        .from('projects')
        .insert([{ ...projectData, owner_id: user.id }])
        .select()
        .single();

      if (error) {
        throw error;
      }
      setProjects(prev => [...prev, data]);
      setCurrentProjectState(data);
      setError(null);
      return data;
    } catch (err: any) {
      console.error('Error creating project:', err.message);
      setError(err.message || 'Failed to create project');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const updateProject = useCallback(async (projectId: string, projectData: ProjectUpdate) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', projectId)
        .select()
        .single();

      if (error) {
        throw error;
      }
      setProjects(prev => prev.map(p => (p?.id === projectId ? data : p)));
      setCurrentProjectState(data);
      setError(null);
      return data;
    } catch (err: any) {
      console.error('Error updating project:', err.message);
      setError(err.message || 'Failed to update project');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteProject = useCallback(async (projectId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        throw error;
      }
      setProjects(prev => prev.filter(p => p?.id !== projectId));
      if (currentProject?.id === projectId) {
        setCurrentProjectState(null);
      }
      setError(null);
    } catch (err: any) {
      console.error('Error deleting project:', err.message);
      setError(err.message || 'Failed to delete project');
    } finally {
      setIsLoading(false);
    }
  }, [currentProject?.id]);

  const refetchProjects = useCallback(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        projects,
        isLoading,
        error,
        createProject,
        updateProject,
        deleteProject,
        setCurrentProject,
        refetchProjects
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
