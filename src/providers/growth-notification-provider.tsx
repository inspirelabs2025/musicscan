import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'sonner';
import { MessageSquare, Brain } from 'lucide-react';

interface GrowthNotificationContextType {
  showChatAINotification: () => void;
}

const GrowthNotificationContext = createContext<GrowthNotificationContextType | undefined>(undefined);

interface GrowthNotificationProviderProps {
  children: ReactNode;
}

const GROWTH_NOTIFICATION_STORAGE_KEY = 'growth_notifications_shown';

export const GrowthNotificationProvider = ({ children }: GrowthNotificationProviderProps) => {
  const [shownNotifications, setShownNotifications] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(GROWTH_NOTIFICATION_STORAGE_KEY);
    if (stored) {
      setShownNotifications(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(GROWTH_NOTIFICATION_STORAGE_KEY, JSON.stringify(shownNotifications));
  }, [shownNotifications]);

  const showNotification = (id: string, message: string, icon: ReactNode, action?: { label: string; onClick: () => void }) => {
    if (shownNotifications.includes(id)) {
      return; // Notification already shown
    }

    toast.info(message, {
      icon: icon,
      duration: 8000, // Show for 8 seconds
      action: action,
      onAutoClose: () => {
        // todo: Track notification dismissal "growth_notification_auto_dismiss"
      },
      onDismiss: () => {
        // todo: Track notification dismissal "growth_notification_manual_dismiss"
      },
      onClose: () => {
        setShownNotifications((prev) => [...prev, id]);
      },
    });
    // todo: Track notification impression "growth_notification_impression" with id
  };

  const showChatAINotification = () => {
    showNotification(
      'chat_ai_feature_promo',
      'Discover our new Chat and AI features to boost your productivity!',
      <div className="flex items-center gap-1">
        <MessageSquare className="h-4 w-4 text-blue-400" />
        <Brain className="h-4 w-4 text-purple-400" />
      </div>,
      {
        label: 'Tell me more',
        onClick: () => {
          // todo: Track notification CTA click "growth_notification_cta_click" with id
          // Redirect or open a modal with more info
          console.log('User clicked "Tell me more" for Chat/AI promo');
          // For demonstration, navigate to a placeholder or open a specific guide.
          // e.g., window.location.href = '/features/chat-ai';
        },
      }
    );
  };

  const value = {
    showChatAINotification,
  };

  return (
    <GrowthNotificationContext.Provider value={value}>
      {children}
    </GrowthNotificationContext.Provider>
  );
};

export const useGrowthNotifications = () => {
  const context = useContext(GrowthNotificationContext);
  if (context === undefined) {
    throw new Error('useGrowthNotifications must be used within a GrowthNotificationProvider');
  }
  return context;
};
