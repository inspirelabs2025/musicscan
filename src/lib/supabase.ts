import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Basic type definitions for messages and projects - extend as needed
interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  project_id: string;
}

interface Project {
  id: string;
  name: string;
  created_at: string;
  owner_id: string;
}

// Example: Fetch chat messages for a project
export const getChatMessages = async (projectId: string): Promise<Message[]> => {
  if (!projectId) {
    console.warn('getChatMessages called without a projectId');
    return [];
  }
  const { data, error } = await supabase
    .from('messages') // Assuming your table is named 'messages'
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching chat messages:', error);
    throw error;
  }

  return data || [];
};

// Example: Fetch projects for a user
export const getProjects = async (userId: string): Promise<Project[]> => {
  const { data, error } = await supabase
    .from('projects') // Assuming your table is named 'projects'
    .select('*')
    .eq('owner_id', userId);

  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }

  return data || [];
};

// You can add more Supabase related functions here
