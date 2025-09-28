import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import SocialNavigation from "@/components/social/SocialNavigation";
import UserCard from "@/components/social/UserCard";
import MessagingInterface from "@/components/social/MessagingInterface";
import { CommunityStatsWidget } from "@/components/social/CommunityStatsWidget";
import { FeaturedUsersWidget } from "@/components/social/FeaturedUsersWidget";
import { ActiveConversationsWidget } from "@/components/social/ActiveConversationsWidget";
import { QuickActionsHero } from "@/components/social/QuickActionsHero";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Loader2, MessageCircle, Sparkles, Heart, Users as UsersIcon } from "lucide-react";
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
      return (data || []).map((item: any) => item.following).filter(Boolean) as Profile[];
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
      <div className="space-y-8 animate-fade-in">
        {/* Discovery Header */}
        <Card className="border-2 hover:border-vinyl-purple/50 transition-all duration-300 bg-gradient-to-br from-card via-card to-vinyl-purple/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Search className="w-6 h-6 text-vinyl-purple animate-pulse" />
              🔍 Muziek Community Ontdekken
            </CardTitle>
            <p className="text-muted-foreground">
              Vind verzamelaars met dezelfde passie voor muziek als jij
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Zoek verzamelaars op naam, bio of muziekstijl..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-lg border-2 hover:border-vinyl-purple/50 focus:border-vinyl-purple transition-colors"
                />
              </div>
              <Button size="lg" className="h-12 px-8 bg-gradient-to-r from-vinyl-purple to-vinyl-purple/80">
                <Search className="w-5 h-5 mr-2" />
                Zoeken
              </Button>
            </div>
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {isSearching ? `🎯 Zoekresultaten voor "${searchQuery}"` : "👥 Alle beschikbare verzamelaars"}
              </p>
              <div className="text-sm text-vinyl-purple font-medium">
                {usersToShow?.length || 0} gevonden
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Featured Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FeaturedUsersWidget />
          <ActiveConversationsWidget />
        </div>

        {/* Users Grid */}
        {isLoading ? (
          <Card className="border-2">
            <CardContent className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-vinyl-purple" />
                <p className="text-muted-foreground text-lg">🎵 Muziekvrienden laden...</p>
              </div>
            </CardContent>
          </Card>
        ) : usersToShow && usersToShow.length > 0 ? (
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <UsersIcon className="w-6 h-6 text-vinyl-gold" />
              👥 Community Leden
            </h3>
            <div className="grid gap-6">
              {usersToShow.map((profile) => (
                <div key={profile.user_id} className="transform hover:scale-[1.02] transition-transform duration-200">
                  <UserCard
                    profile={profile}
                    onMessage={handleMessage}
                    onViewProfile={handleViewProfile}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Card className="border-2 border-dashed border-vinyl-purple/30">
            <CardContent className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <Search className="w-16 h-16 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground text-lg">
                  {isSearching 
                    ? `🔍 Geen verzamelaars gevonden voor "${searchQuery}"`
                    : "👥 Nog geen verzamelaars beschikbaar"
                  }
                </p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Probeer een andere zoekterm of kom later terug als er meer leden zijn
                </p>
              </div>
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
    <div className="min-h-screen bg-gradient-to-br from-background via-vinyl-purple/3 to-background">
      {/* Musical Background Elements */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 left-10 text-4xl animate-pulse">🎵</div>
        <div className="absolute top-40 right-20 text-3xl animate-pulse delay-500">🎶</div>
        <div className="absolute bottom-40 left-20 text-4xl animate-pulse delay-1000">👥</div>
        <div className="absolute bottom-20 right-10 text-3xl animate-pulse delay-700">💬</div>
      </div>

      <div className="container mx-auto px-4 py-8 relative space-y-8">
        {/* Welcome Header */}
        <div className="text-center animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-vinyl-purple animate-pulse" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-vinyl-purple via-primary to-vinyl-gold bg-clip-text text-transparent">
              👥 Muziek Community Hub
            </h1>
            <Heart className="w-8 h-8 text-vinyl-gold animate-pulse delay-300" />
          </div>
          <p className="text-muted-foreground text-lg">
            ✨ Ontdek, verbind en deel je passie voor muziek met gelijkgestemde verzamelaars
          </p>
        </div>

        {/* Quick Actions Hero */}
        <section className="animate-fade-in delay-200">
          <QuickActionsHero 
            onDiscoverUsers={() => setActiveTab("discover")}
            onStartConversation={() => setActiveTab("messages")}
          />
        </section>

        {/* Community Stats */}
        <section className="animate-fade-in delay-300">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-vinyl-purple" />
            📊 Community Stats
          </h2>
          <CommunityStatsWidget />
        </section>

        {/* Enhanced Navigation */}
        <section className="animate-fade-in delay-400">
          <SocialNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </section>

        {/* Main Content Area */}
        <section className="min-h-96 animate-fade-in delay-500">
          {activeTab === "discover" && renderDiscoverTab()}
          {activeTab === "following" && renderFollowingTab()}
          {activeTab === "messages" && renderMessagesTab()}
          {activeTab === "settings" && renderSettingsTab()}
        </section>
      </div>
    </div>
  );
};

export default Social;