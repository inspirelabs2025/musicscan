import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import SocialNavigation from "@/components/social/SocialNavigation";
import UserCard from "@/components/social/UserCard";
import MessagingInterface from "@/components/social/MessagingInterface";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Loader2, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/hooks/useProfile";
import { useCreateConversation } from "@/hooks/useConversations";
import { useToast } from "@/components/ui/use-toast";

const Social: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"discover" | "following" | "messages" | "settings">("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const createConversation = useCreateConversation();

  // Get all public users
  const { data: allUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_public", true)
        .neq("user_id", user.id)
        .limit(50);

      if (error) throw error;
      return data as Profile[];
    },
    enabled: !!user?.id && activeTab === "discover",
  });

  // Search users (filtered results)
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["userSearch", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .or(`first_name.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`)
        .eq("is_public", true)
        .neq("user_id", user?.id)
        .limit(20);

      if (error) throw error;
      return data as Profile[];
    },
    enabled: searchQuery.length >= 2,
  });

  // Get following users
  const { data: followingUsers, isLoading: isLoadingFollowing } = useQuery({
    queryKey: ["followingUsers", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("user_follows")
        .select(`
          following:profiles!user_follows_following_id_fkey(*)
        `)
        .eq("follower_id", user.id);

      if (error) throw error;
      return data.map(f => f.following).filter(Boolean) as Profile[];
    },
    enabled: !!user?.id && activeTab === "following",
  });

  const handleMessage = async (userId: string) => {
    try {
      const conversation = await createConversation.mutateAsync({
        participantIds: [userId],
        isGroup: false,
      });
      
      // In a real app, you'd navigate to the conversation
      toast({
        title: "Gesprek gestart",
        description: "Je kunt nu berichten uitwisselen.",
      });
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const renderDiscoverTab = () => {
    const isSearching = searchQuery.length >= 2;
    const usersToShow = isSearching ? searchResults : allUsers;
    const isLoading = isSearching ? isSearching : isLoadingUsers;
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gebruikers Ontdekken</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter gebruikers op naam of bio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {isSearching ? `Zoekresultaten voor "${searchQuery}"` : "Alle beschikbare gebruikers"}
            </p>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card>
            <CardContent className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Gebruikers laden...</p>
            </CardContent>
          </Card>
        ) : usersToShow && usersToShow.length > 0 ? (
          <div className="space-y-4">
            <div className="grid gap-4">
              {usersToShow.map((profile) => (
                <UserCard
                  key={profile.user_id}
                  profile={profile}
                  onMessage={handleMessage}
                  onViewProfile={handleViewProfile}
                />
              ))}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                {isSearching 
                  ? `Geen gebruikers gevonden voor "${searchQuery}"`
                  : "Geen gebruikers beschikbaar"
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderFollowingTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Je volgt</h3>
      
      {isLoadingFollowing ? (
        <Card>
          <CardContent className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Laden...</p>
          </CardContent>
        </Card>
      ) : followingUsers && followingUsers.length > 0 ? (
        <div className="grid gap-4">
          {followingUsers.map((profile) => (
            <UserCard
              key={profile.user_id}
              profile={profile}
              onMessage={handleMessage}
              onViewProfile={handleViewProfile}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              Je volgt nog niemand. Ontdek nieuwe gebruikers!
            </p>
            <Button 
              className="mt-4" 
              onClick={() => setActiveTab("discover")}
            >
              Gebruikers Ontdekken
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderMessagesTab = () => (
    <MessagingInterface />
  );

  const renderSettingsTab = () => (
    <Card>
      <CardContent className="text-center py-8">
        <h3 className="text-lg font-medium mb-2">Sociale Instellingen</h3>
        <p className="text-muted-foreground">
          Privacy instellingen en profiel beheer worden binnenkort toegevoegd.
        </p>
      </CardContent>
    </Card>
  );

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              Log in om sociale functies te gebruiken.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Sociale Hub</h1>
        <p className="text-muted-foreground">
          Ontdek andere verzamelaars, volg vrienden en deel je passie voor muziek.
        </p>
      </div>

      <SocialNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="min-h-96">
        {activeTab === "discover" && renderDiscoverTab()}
        {activeTab === "following" && renderFollowingTab()}
        {activeTab === "messages" && renderMessagesTab()}
        {activeTab === "settings" && renderSettingsTab()}
      </div>
    </div>
  );
};

export default Social;