import React from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, UserPlus, Reply, Music, Mic2, Trophy, BarChart3, Newspaper, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNotifications, type Notification } from "@/hooks/useNotifications";

interface NotificationItemProps {
  notification: Notification;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const { markAsRead } = useNotifications();

  const getNotificationIcon = () => {
    switch (notification.type) {
      case "photo_like":
      case "comment_like":
        return <Heart className="h-4 w-4 text-primary" />;
      case "photo_comment":
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case "comment_reply":
        return <Reply className="h-4 w-4 text-green-500" />;
      case "follow":
        return <UserPlus className="h-4 w-4 text-purple-500" />;
      case "new_content":
        return notification.icon === 'artist' 
          ? <Mic2 className="h-4 w-4 text-orange-500" />
          : <Music className="h-4 w-4 text-primary" />;
      case "badge_earned":
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case "collection_milestone":
        return <BarChart3 className="h-4 w-4 text-green-500" />;
      case "new_news":
        return <Newspaper className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getNotificationText = () => {
    // Use custom message if available (system notifications)
    if (notification.message) return notification.message;

    const actorName = notification.actor?.first_name || "Iemand";
    switch (notification.type) {
      case "photo_like":
        return `${actorName} vond je foto leuk`;
      case "photo_comment":
        return `${actorName} heeft gereageerd op je foto`;
      case "comment_like":
        return `${actorName} vond je reactie leuk`;
      case "comment_reply":
        return `${actorName} heeft gereageerd op je reactie`;
      case "follow":
        return `${actorName} volgt je nu`;
      default:
        return "Nieuwe melding";
    }
  };

  const getNotificationLink = () => {
    // Use custom link if available
    if (notification.link) return notification.link;
    if (notification.photo_id) return `/fanwall/${notification.photo_id}`;
    if (notification.type === "follow" && notification.actor?.user_id) {
      return `/profile/${notification.actor.user_id}`;
    }
    return "/dashboard";
  };

  const handleClick = () => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  const isSystemNotification = !notification.actor || notification.actor.user_id === notification.user_id;

  return (
    <Link
      to={getNotificationLink()}
      onClick={handleClick}
      className={cn(
        "flex gap-3 p-4 hover:bg-muted/50 transition-colors",
        !notification.is_read && "bg-muted/30"
      )}
    >
      <div className="relative">
        {isSystemNotification ? (
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            {getNotificationIcon()}
          </div>
        ) : (
          <>
            <Avatar className="h-10 w-10">
              <AvatarImage src={notification.actor?.avatar_url || undefined} />
              <AvatarFallback>
                {notification.actor?.first_name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
              {getNotificationIcon()}
            </div>
          </>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{getNotificationText()}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { 
            addSuffix: true, 
            locale: nl 
          })}
        </p>
      </div>

      {!notification.is_read && (
        <div className="flex-shrink-0 self-center">
          <div className="h-2 w-2 rounded-full bg-primary" />
        </div>
      )}
    </Link>
  );
};
