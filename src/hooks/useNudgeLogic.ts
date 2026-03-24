import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getChatMessages } from '@/lib/supabase'; // Assuming this function exists
import { toast } from 'sonner';

const CHAT_NUDGE_LOCAL_STORAGE_KEY = 'chat_nudge_dismissed';

export const useNudgeLogic = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isChatNudgeVisible, setIsChatNudgeVisible] = useState(false);
  const [chatMessageCount, setChatMessageCount] = useState(0);

  // Function to extract project ID from URL
  const getProjectIdFromPath = useCallback(() => {
    const match = location.pathname.match(/\/project\/(.+?)(?:\/|$)/);
    return match ? match[1] : null;
  }, [location.pathname]);

  const projectId = user ? getProjectIdFromPath() : null;

  // Fetch chat messages count
  const { data: messages, isLoading: isLoadingMessages, error: messagesError } = useQuery(
    ['chatMessages', projectId], // Query key includes projectId
    () => getChatMessages(projectId as string), // Only fetch if projectId is available
    {
      enabled: !!user && !!projectId, // Only enabled if user and projectId exist
      refetchInterval: 10000, // Refetch every 10 seconds
      onError: (err) => {
        console.error('Error fetching chat messages:', err);
        // Optionally toast.error('Failed to load chat messages.');
      }
    }
  );

  useEffect(() => {
    if (messages) {
      const count = messages.length;
      setChatMessageCount(count);
      const dismissed = localStorage.getItem(CHAT_NUDGE_LOCAL_STORAGE_KEY);
      // Show nudge if no messages, not dismissed, and on a project page not already in chat
      const isOnProjectPage = projectId && location.pathname.includes(`/project/${projectId}`);
      const isInChatTab = location.pathname.includes(`/project/${projectId}/chat`);
      
      if (count === 0 && !dismissed && isOnProjectPage && !isInChatTab) {
        setIsChatNudgeVisible(true);
      } else {
        setIsChatNudgeVisible(false);
      }
    } else if (!isLoadingMessages && !messagesError && projectId) {
      // If no messages and no error, assume 0 for an enabled query
      setChatMessageCount(0);
      const dismissed = localStorage.getItem(CHAT_NUDGE_LOCAL_STORAGE_KEY);
      const isOnProjectPage = projectId && location.pathname.includes(`/project/${projectId}`);
      const isInChatTab = location.pathname.includes(`/project/${projectId}/chat`);

      if (0 === 0 && !dismissed && isOnProjectPage && !isInChatTab) { // Explicitly check if 0 messages
        setIsChatNudgeVisible(true);
      } else {
        setIsChatNudgeVisible(false);
      }
    }
  }, [messages, isLoadingMessages, messagesError, projectId, location.pathname]);

  const dismissChatNudge = useCallback(() => {
    setIsChatNudgeVisible(false);
    try {
      localStorage.setItem(CHAT_NUDGE_LOCAL_STORAGE_KEY, 'true');
      toast.success('Chat herinnering uitgeschakeld.');
    } catch (e) {
      console.error('Failed to set local storage item:', e);
    }
  }, []);

  const handleTryChat = useCallback(() => {
    if (projectId) {
      navigate(`/project/${projectId}/chat`);
      dismissChatNudge(); // Dismiss the nudge once they click to try chat
    } else {
      toast.error('Geen project geselecteerd om de chat te openen.');
    }
  }, [projectId, navigate, dismissChatNudge]);

  return {
    isChatNudgeVisible,
    dismissChatNudge,
    handleTryChat,
    chatMessageCount,
    isLoadingMessages
  };
};
