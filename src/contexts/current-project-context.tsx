import React, { createContext, useCallback, useEffect, useState, ReactNode } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { Database } from '@/supabase-types';
import { useSupabase } from './supabase-provider';
import { useQueryClient } from '@tanstack/react-query';

type Project = Database['public']['Tables']['projects']['Row'] & {
  chatMessagesCount?: number; // Add chatMessagesCount to Project type
};

interface CurrentProjectContextType {
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  isLoading: boolean;
  fetchProjectById: (projectId: string) => Promise<Project | null>;
}

export const CurrentProjectContext = createContext<CurrentProjectContextType>({
  currentProject: null,
  setCurrentProject: () => {},
  isLoading: false,
  fetchProjectById: async () => null,
});

interface CurrentProjectProviderProps {
  children: ReactNode;
}

export const CurrentProjectProvider: React.FC<CurrentProjectProviderProps> = ({ children }) => {
  const { session, supabase } = useSupabase();
  const initialProject = useLoaderData() as Project | null;
  const [currentProject, setCurrentProject] = useState<Project | null>(initialProject);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const fetchProjectById = useCallback(async (projectId: string): Promise<Project | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, chat_messages(count)') // Select chat messages count
        .eq('id', projectId)
        .single();

      if (error) throw error;

      if (data) {
        // Extract count from the chat_messages array if it exists
        const chatMessagesCount = data.chat_messages ? data.chat_messages[0]?.count || 0 : 0;
        const projectWithCount = { ...data, chatMessagesCount: chatMessagesCount } as Project;
        setCurrentProject(projectWithCount);
        return projectWithCount;
      }
      return null;
    } catch (error) {
      console.error('Error fetching project:', error);
      setCurrentProject(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (session?.user && initialProject && initialProject.id && !currentProject) {
      fetchProjectById(initialProject.id);
    }
  }, [session, initialProject, currentProject, fetchProjectById]);

  // When the currentProject changes, invalidate related queries to refetch fresh data
  useEffect(() => {
    if (currentProject) {
      queryClient.invalidateQueries({ queryKey: ['chats', currentProject.id] });
      queryClient.invalidateQueries({ queryKey: ['project', currentProject.id] });
    }
  }, [currentProject, queryClient]);

  return (
    <CurrentProjectContext.Provider value={{ currentProject, setCurrentProject, isLoading, fetchProjectById }}>
      {children}
    </CurrentProjectContext.Provider>
  );
};
