import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, MessageCircle, Search, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useConversations } from "@/hooks/useConversations";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { tr } = useLanguage();

  const unreadCount = conversations?.filter(conv => 
    conv.last_message?.sender_id !== user?.id && 
    new Date(conv.updated_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length || 0;

  const navItems = [
    {
      id: "discover" as const,
      label: tr.social.discover,
      icon: Search,
      badge: null,
    },
    {
      id: "following" as const,
      label: tr.social.following,
      icon: Users,
      badge: profile?.total_following || 0,
    },
    {
      id: "messages" as const,
      label: tr.social.messages,
      icon: MessageCircle,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      id: "settings" as const,
      label: tr.social.settings,
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <nav className="flex flex-wrap gap-3 p-6 bg-gradient-to-r from-card via-card to-vinyl-purple/5 rounded-xl border-2 border-vinyl-purple/20 hover:border-vinyl-purple/40 transition-all duration-300">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        
        return (
          <Button
            key={item.id}
            variant={isActive ? "default" : "outline"}
            size="lg"
            onClick={() => onTabChange(item.id)}
            className={`relative h-14 px-6 transition-all duration-300 group ${
              isActive 
                ? "bg-gradient-to-r from-vinyl-purple to-vinyl-purple/80 shadow-lg" 
                : "hover:bg-vinyl-purple/10 hover:border-vinyl-purple/50"
            }`}
          >
            <Icon className={`h-5 w-5 mr-3 ${isActive ? "animate-pulse" : "group-hover:animate-pulse"}`} />
            <span className="font-medium">{item.label}</span>
            {item.badge !== null && item.badge > 0 && (
              <Badge 
                variant="secondary" 
                className={`ml-3 px-2 py-1 text-xs min-w-6 h-6 ${
                  isActive ? "bg-white/20 text-white" : "bg-vinyl-purple/20 text-vinyl-purple"
                }`}
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
