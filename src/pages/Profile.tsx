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
import { useLanguage } from "@/contexts/LanguageContext";

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { data: profile, isLoading, error } = useProfile(userId);
  const { tr } = useLanguage();

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
            {tr.profile.userNotFound}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.user_id;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <FanWallProfileStats userId={profile.user_id} />
          <SocialStats profile={profile} />
          <div className="lg:col-span-2">
            <FanWallProfileGallery userId={profile.user_id} />
          </div>
          {(profile.show_collection || isOwnProfile) && (
            <CollectionSummaryWidget userId={profile.user_id} />
          )}
          {(profile.show_activity || isOwnProfile) && (
            <ActivityTimeline userId={profile.user_id} />
          )}
          {(profile.show_collection || isOwnProfile) && (
            <PersonalityInsights userId={profile.user_id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
