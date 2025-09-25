import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Users, MessageCircle, Share2, MapPin, Globe, Calendar, Music } from "lucide-react";
import { Link } from "react-router-dom";
import { Profile } from "@/hooks/useProfile";
import { useToggleFollow, useIsFollowing } from "@/hooks/useFollows";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

interface ProfileHeaderProps {
  profile: Profile;
  isOwnProfile: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, isOwnProfile }) => {
  const { user } = useAuth();
  const { data: isFollowing, isLoading: isFollowingLoading } = useIsFollowing(profile.user_id);
  const toggleFollow = useToggleFollow();

  const handleFollow = () => {
    toggleFollow.mutate(profile.user_id);
  };

  const handleMessage = () => {
    // TODO: Implement messaging functionality
    console.log("Open message dialog for user:", profile.user_id);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    // TODO: Add toast notification
  };

  const joinedDate = new Date(profile.created_at);
  const lastActiveDate = new Date(profile.last_active_at);

  return (
    <Card className="overflow-hidden">
      <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20" />
      <CardHeader className="relative pb-2">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Avatar */}
          <Avatar className="h-24 w-24 -mt-12 border-4 border-background shadow-lg">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-2xl">
              {profile.first_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">
                {profile.first_name || "Gebruiker"}
              </h1>
              {!profile.is_public && (
                <Badge variant="secondary">
                  Privé
                </Badge>
              )}
            </div>

            {profile.bio && (
              <p className="text-muted-foreground mb-4 text-lg leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Location and Website */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {profile.location}
                </span>
              )}
              {profile.website && (
                <a 
                  href={profile.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  Website
                </a>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Lid sinds {formatDistanceToNow(joinedDate, { locale: nl, addSuffix: false })}
              </span>
            </div>

            {/* Stats */}
            <div className="flex gap-6 text-sm">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <strong>{profile.total_followers}</strong> volgers
              </span>
              <span>
                <strong>{profile.total_following}</strong> volgend
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          {!isOwnProfile && user && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  onClick={handleFollow}
                  disabled={isFollowingLoading || toggleFollow.isPending}
                >
                  {isFollowing ? "Ontvolgen" : "Volgen"}
                </Button>

                {profile.allow_messages && (
                  <Button
                    variant="outline"
                    onClick={handleMessage}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Bericht
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Collection Button */}
              {profile.show_collection && (
                <Button
                  variant="secondary"
                  className="w-full"
                  asChild
                >
                  <Link to={`/collection/${profile.user_id}`}>
                    <Music className="h-4 w-4 mr-2" />
                    Bekijk Collectie
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Separator className="mb-4" />
        <div className="text-xs text-muted-foreground">
          Laatst actief {formatDistanceToNow(lastActiveDate, { locale: nl, addSuffix: true })}
        </div>
      </CardContent>
    </Card>
  );
};