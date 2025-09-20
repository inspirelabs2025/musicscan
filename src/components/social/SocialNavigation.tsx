import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, MessageCircle, Search, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useConversations } from "@/hooks/useConversations";

interface SocialNavigationProps {
  activeTab: "discover" | "following" | "messages" | "settings";
  onTabChange: (tab: "discover" | "following" | "messages" | "settings") => void;
}

const SocialNavigation: React.FC<SocialNavigationProps> = ({ 
  activeTab, 
  onTabChange 
}) => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: conversations } = useConversations();

  const unreadCount = conversations?.filter(conv => 
    conv.last_message?.sender_id !== user?.id && 
    // Simple unread logic - in a real app you'd track read status
    new Date(conv.updated_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length || 0;

  const navItems = [
    {
      id: "discover" as const,
      label: "Ontdekken",
      icon: Search,
      badge: null,
    },
    {
      id: "following" as const,
      label: "Volgend",
      icon: Users,
      badge: profile?.total_following || 0,
    },
    {
      id: "messages" as const,
      label: "Berichten",
      icon: MessageCircle,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      id: "settings" as const,
      label: "Instellingen",
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <nav className="flex flex-wrap gap-2 p-4 bg-card rounded-lg border">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        
        return (
          <Button
            key={item.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onTabChange(item.id)}
            className="relative"
          >
            <Icon className="h-4 w-4 mr-2" />
            {item.label}
            {item.badge !== null && item.badge > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-2 px-1.5 py-0.5 text-xs min-w-5 h-5"
              >
                {item.badge > 99 ? "99+" : item.badge}
              </Badge>
            )}
          </Button>
        );
      })}
    </nav>
  );
};

export default SocialNavigation;