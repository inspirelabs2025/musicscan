import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageSquareText } from "lucide-react";
import { AiNudge } from "@/components/ui/ai-nudge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

const ProjectNudge: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNudge, setShowNudge] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    const pathParts = location.pathname.split("/");
    const projId = pathParts[2];
    if (location.pathname.startsWith("/projects/") && projId && projId !== projectId) {
      setProjectId(projId);
      // Ensure nudge is reset for a new project
      setShowNudge(false);
    } else if (!location.pathname.startsWith("/projects/")) {
      setProjectId(null);
      setShowNudge(false);
    }
  }, [location.pathname, projectId]);

  const { data: chatCount, isLoading } = useQuery({
    queryKey: ["projectChatCount", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      if (error) throw error;
      return count;
    },
    enabled: !!projectId && !showNudge, // Only run query if there's a project and nudge isn't already shown
  });

  useEffect(() => {
    if (!isLoading && projectId && chatCount !== null && chatCount === 0) {
      const dismissedForProject = localStorage.getItem(`chat_nudge_dismissed_${projectId}`);
      if (!dismissedForProject) {
        setShowNudge(true);
      }
    } else if (!isLoading && projectId && chatCount !== null && chatCount > 0) {
      setShowNudge(false);
    }
  }, [chatCount, isLoading, projectId]);

  const handleDismiss = () => {
    if (projectId) {
      localStorage.setItem(`chat_nudge_dismissed_${projectId}`, "true");
    }
    setShowNudge(false);
  };

  const handleNavigateToChat = () => {
    if (projectId) {
      navigate(`/projects/${projectId}/chat`);
      handleDismiss(); // Dismiss nudge after navigating
    }
  };

  if (!projectId || chatCount === null || chatCount > 0 || !showNudge) {
    return null; // Don't show if no project, still loading, or chat has messages, or already dismissed/hidden
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <AiNudge
        open={showNudge}
        onClose={handleDismiss}
        variant="default"
        icon={<MessageSquareText className="h-6 w-6" />}
        title="Heb je de chat al geprobeerd?"
        description="Er zijn pas 0 chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen!"
        action={
          <Button
            variant="ai-nudge"
            onClick={handleNavigateToChat}
            className="mt-2"
          >
            Ga naar Chat
          </Button>
        }
      />
    </div>
  );
};

export default ProjectNudge;
