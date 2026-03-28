import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AiNudge } from '@/components/ui/ai-nudge'; // Import the new AI Nudge component

interface Project {
  id: string;
  name: string;
}

const fetchProjectDetails = async (projectId: string): Promise<Project> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
  if (error) throw new Error(error.message);
  return data;
};

const fetchChatMessagesCount = async (projectId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact' })
    .eq('project_id', projectId);
  if (error) throw new Error(error.message);
  return count || 0;
};

const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [showChatNudge, setShowChatNudge] = useState(false);

  const { data: project, isLoading: loadingProject } = useQuery<Project, Error>({
    queryKey: ['projectDetails', projectId],
    queryFn: () => fetchProjectDetails(projectId!),
    enabled: !!projectId,
  });

  const { data: chatMessagesCount, isLoading: loadingChatCount } = useQuery<number, Error>({
    queryKey: ['chatMessagesCount', projectId],
    queryFn: () => fetchChatMessagesCount(projectId!),
    enabled: !!projectId,
  });

  useEffect(() => {
    if (!loadingChatCount && chatMessagesCount === 0) {
      setShowChatNudge(true);
    } else {
      setShowChatNudge(false);
    }
  }, [chatMessagesCount, loadingChatCount]);

  if (loadingProject || loadingChatCount) {
    return <div className="text-center py-8">Loading project details...</div>;
  }

  if (!project) {
    return <div className="text-center py-8 text-red-500">Project not found.</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{project.name}</h1>
      <p className="text-lg mb-4">Welcome to your project dashboard. Here you can manage all aspects of your project.</p>

      {showChatNudge && (
        <div className="mb-6">
          <AiNudge message="💬 Er zijn pas 0 chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen!" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Example cards for project overview */}
        <div className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Project Progress</h2>
          <p>Current status: On track</p>
          <p>Tasks completed: 10/15</p>
        </div>

        <div className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Team Members</h2>
          <p>Alice, Bob, Carol</p>
          <p>Total members: 3</p>
        </div>

        <div className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Recent Activity</h2>
          <p>Last update: 2 hours ago</p>
          <p>New files: 2</p>
        </div>
      </div>
    </div>
  );
};

export default ProjectView;
