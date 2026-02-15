import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserStats } from "@/hooks/useUserStats";
import { NewUsersSection } from "@/components/NewUsersSection";
import { StatCard } from "@/components/StatCard";
import UserCard from "@/components/social/UserCard";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Users, Loader2, UserPlus, Calendar, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/hooks/useProfile";
import { useCreateConversation } from "@/hooks/useConversations";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const Community: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { tr } = useLanguage();
  const c = tr.community;
  const [searchQuery, setSearchQuery] = useState("");
  const createConversation = useCreateConversation();

  const { data: userStats, isLoading: isLoadingStats } = useUserStats();

  // Get all public users with pagination
  const { data: allUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["community-users", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*")
        .eq("is_public", true)
        .order('created_at', { ascending: false });

      if (user?.id) {
        query = query.neq("user_id", user.id);
      }

      if (searchQuery.trim()) {
        query = query.or(`first_name.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return data as Profile[];
    },
    enabled: true,
  });

  const handleMessage = async (userId: string) => {
    try {
      const conversation = await createConversation.mutateAsync({
        participantIds: [userId],
        isGroup: false,
      });
      
      toast({
        title: c.conversationStarted,
        description: c.conversationStartedDesc,
      });
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">{c.title}</h1>
        <p className="text-muted-foreground text-lg">{c.subtitle}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title={c.totalMembers}
          value={isLoadingStats ? "..." : `${userStats?.totalUsers || 0}`}
          subtitle={c.musicExplorers}
          icon={Users}
        />
        <StatCard
          title={c.newMembers7d}
          value={isLoadingStats ? "..." : `${userStats?.newUsersLast7Days || 0}`}
          subtitle={c.thisWeek}
          icon={UserPlus}
        />
        <StatCard
          title={c.newMembers30d}
          value={isLoadingStats ? "..." : `${userStats?.newUsersLast30Days || 0}`}
          subtitle={c.thisMonth}
          icon={TrendingUp}
        />
      </div>

      {/* New Users Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">{c.newMusicExplorers}</h2>
        <NewUsersSection />
      </div>

      {/* All Members Section */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {c.allMembers} ({allUsers?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={c.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? `${c.searchResults} "${searchQuery}"` : c.allAvailable}
            </p>
          </CardContent>
        </Card>

        {isLoadingUsers ? (
          <Card>
            <CardContent className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">{c.loadingMembers}</p>
            </CardContent>
          </Card>
        ) : allUsers && allUsers.length > 0 ? (
          <div className="grid gap-4">
            {allUsers.map((profile) => (
              <UserCard
                key={profile.user_id}
                profile={profile}
                onMessage={user ? handleMessage : undefined}
                onViewProfile={handleViewProfile}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchQuery 
                  ? `${c.noMembersFound} "${searchQuery}"`
                  : c.noMembersAvailable
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Community;
