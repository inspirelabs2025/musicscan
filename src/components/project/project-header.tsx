import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useProjectById } from '@/hooks/use-project-by-id';
import { Button } from '@/components/ui/button';
import { PlusCircle, MessageSquare } from 'lucide-react';
import { useChatMessagesCount } from '@/hooks/use-chat-messages-count';
import AiNudge from '@/components/ui/ai-nudge';

const ProjectHeader: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading, error } = useProjectById(projectId);
  const { data: chatMessagesCount } = useChatMessagesCount(projectId);

  const showChatNudge = chatMessagesCount === 0;

  if (isLoading) {
    return <div>Loading project...</div>;
  }

  if (error || !project) {
    return <div>Error loading project.</div>;
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0 px-4 py-4 md:px-6 bg-header text-header-foreground border-b">
      <div className="flex-1">
        <h1 className="text-2xl font-bold tracking-tight">{project.project_name}</h1>
        <p className="text-sm text-header-foreground/80">{project.description || 'No description provided.'}</p>
      </div>
      <div className="flex items-center space-x-2">
        <Button asChild variant="secondary" className="flex items-center space-x-2">
          <Link to={`/project/${projectId}/chat`}>
            <MessageSquare className="h-4 w-4" />
            <span>Chat</span>
          </Link>
        </Button>
        <Button asChild>
          <Link to={`/project/${projectId}/create-idea`}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Nieuw Idee
          </Link>
        </Button>
      </div>

      {/* Chat Nudge */}
      <AiNudge
        isVisible={showChatNudge}
        storageKey={`chat-nudge-${projectId}`}
        title="Probeer de chat!" 
        message="Er zijn pas 0 chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen!"
        variant="chat-nudge"
        link={{ href: `/project/${projectId}/chat`, text: 'Ga naar chat' }}
      />
    </div>
  );
};

export default ProjectHeader;
