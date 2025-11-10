import React from "react";
import { useParams, Navigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { CollectionSummaryWidget } from "@/components/profile/CollectionSummaryWidget";
import { ActivityTimeline } from "@/components/profile/ActivityTimeline";
import { PersonalityInsights } from "@/components/profile/PersonalityInsights";
import { SocialStats } from "@/components/profile/SocialStats";
import { FanWallProfileGallery } from "@/components/profile/FanWallProfileGallery";
import { FanWallProfileStats } from "@/components/profile/FanWallProfileStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { data: profile, isLoading, error } = useProfile(userId);

  if (!userId) {
    return <Navigate to="/social" replace />;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <Skeleton className="h-48 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Gebruiker niet gevonden of profiel is privé.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.user_id;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Profile Header */}
        <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} />

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* FanWall Stats */}
          <FanWallProfileStats userId={profile.user_id} />

          {/* Social Stats */}
          <SocialStats profile={profile} />

          {/* FanWall Gallery */}
          <div className="lg:col-span-2">
            <FanWallProfileGallery userId={profile.user_id} />
          </div>

          {/* Collection Summary */}
          {(profile.show_collection || isOwnProfile) && (
            <CollectionSummaryWidget userId={profile.user_id} />
          )}

          {/* Activity Timeline */}
          {(profile.show_activity || isOwnProfile) && (
            <ActivityTimeline userId={profile.user_id} />
          )}

          {/* Personality Insights */}
          {(profile.show_collection || isOwnProfile) && (
            <PersonalityInsights userId={profile.user_id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;