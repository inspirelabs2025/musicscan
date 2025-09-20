import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, MessageCircle, Eye } from "lucide-react";
import { Profile } from "@/hooks/useProfile";
import { useToggleFollow, useIsFollowing } from "@/hooks/useFollows";
import { useAuth } from "@/contexts/AuthContext";

interface UserCardProps {
  profile: Profile;
  onMessage?: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
  showActions?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({ 
  profile, 
  onMessage, 
  onViewProfile,
  showActions = true 
}) => {
  const { user } = useAuth();
  const { data: isFollowing, isLoading: isFollowingLoading } = useIsFollowing(profile.user_id);
  const toggleFollow = useToggleFollow();

  const isOwnProfile = user?.id === profile.user_id;

  const handleFollow = () => {
    toggleFollow.mutate(profile.user_id);
  };

  const handleMessage = () => {
    if (onMessage) {
      onMessage(profile.user_id);
    }
  };

  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile(profile.user_id);
    }
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback>
              {profile.first_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">
                {profile.first_name || "Gebruiker"}
              </h3>
              {!profile.is_public && (
                <Badge variant="secondary" className="text-xs">
                  Privé
                </Badge>
              )}
            </div>

            {profile.bio && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {profile.bio}
              </p>
            )}

            {profile.location && (
              <p className="text-xs text-muted-foreground mb-2">
                📍 {profile.location}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {profile.total_followers} volgers
              </span>
              <span>
                {profile.total_following} volgend
              </span>
            </div>
          </div>

          {showActions && !isOwnProfile && (
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                variant={isFollowing ? "outline" : "default"}
                onClick={handleFollow}
                disabled={isFollowingLoading || toggleFollow.isPending}
                className="min-w-20"
              >
                {isFollowing ? "Ontvolgen" : "Volgen"}
              </Button>

              {profile.allow_messages && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMessage}
                  className="min-w-20"
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Bericht
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={handleViewProfile}
                className="min-w-20"
              >
                <Eye className="h-3 w-3 mr-1" />
                Bekijk
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserCard;