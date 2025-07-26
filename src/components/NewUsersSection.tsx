import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Sparkles, Music, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface User {
  id: string;
  email: string;
  created_at: string;
  first_name?: string;
}

const useRecentUsers = () => {
  return useQuery({
    queryKey: ['recent-users'],
    queryFn: async () => {
      // Get recent users (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('cd_scan')
        .select('user_id, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique users and their first scan date
      const uniqueUsers = new Map();
      data?.forEach(scan => {
        if (!uniqueUsers.has(scan.user_id)) {
          uniqueUsers.set(scan.user_id, scan.created_at);
        }
      });

      // Get user profiles for first names
      const userIds = Array.from(uniqueUsers.keys());
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name')
        .in('user_id', userIds);

      // Create profile map for quick lookup
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.first_name]) || []);

      // Convert to array and sort by join date
      const users = Array.from(uniqueUsers.entries())
        .map(([userId, joinedAt]) => ({
          id: userId,
          email: `muziekliefhebber-${userId.slice(0, 6)}`, // Anonymous display
          created_at: joinedAt,
          first_name: profileMap.get(userId) || 'Nieuwe Ontdekker'
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 6); // Show last 6 users

      return users;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

const UserCard: React.FC<{ user: User; index: number }> = ({ user, index }) => {
  const joinDate = new Date(user.created_at).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short'
  });

  const avatarEmojis = ['🎵', '🎶', '🎼', '🎸', '🥁', '🎺', '🎻', '🎹', '🎤', '🎧'];
  const avatar = avatarEmojis[index % avatarEmojis.length];

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-vinyl-purple/30 hover-scale animate-fade-in bg-gradient-to-br from-card via-card to-accent/5">
      <CardContent className="p-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-vinyl-purple/5 via-transparent to-vinyl-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative z-10">
          <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-vinyl-purple to-vinyl-gold rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-md">
            <span className="text-xl">{avatar}</span>
            <Sparkles className="w-3 h-3 text-white absolute -top-1 -right-1 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground/90 group-hover:text-vinyl-purple transition-colors">
              {user.first_name}
            </div>
            <div className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
              {joinDate}
            </div>
            <div className="flex items-center justify-center gap-1 text-xs text-vinyl-gold">
              <Star className="w-3 h-3 fill-current" />
              <span>Begonnen</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const NewUsersSection: React.FC = () => {
  const { data: users, isLoading } = useRecentUsers();

  if (isLoading) {
    return (
      <section className="py-12 bg-gradient-to-r from-accent/5 via-background to-accent/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Users className="w-6 h-6 text-vinyl-purple" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-vinyl-purple to-vinyl-gold bg-clip-text text-transparent">
                🌟 Nieuwe Muziekontdekkers
              </h2>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 max-w-5xl mx-auto">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-[140px] w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!users || users.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gradient-to-r from-accent/5 via-background to-accent/5 relative overflow-hidden">
      {/* Background Musical Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-1/4 animate-pulse">🎵</div>
        <div className="absolute top-20 right-1/4 animate-pulse delay-300">🎶</div>
        <div className="absolute bottom-20 left-1/3 animate-pulse delay-600">♪</div>
        <div className="absolute bottom-10 right-1/3 animate-pulse delay-900">♫</div>
      </div>
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Users className="w-6 h-6 text-vinyl-purple animate-pulse" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-vinyl-purple to-vinyl-gold bg-clip-text text-transparent">
              🌟 Nieuwe Muziekontdekkers
            </h2>
            <Music className="w-6 h-6 text-vinyl-gold animate-pulse delay-300" />
          </div>
          <p className="text-muted-foreground">
            Welkom aan onze nieuwste leden die hun muziekavontuur zijn begonnen! 🎉
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 max-w-5xl mx-auto">
          {users.map((user, index) => (
            <UserCard key={user.id} user={user} index={index} />
          ))}
        </div>
        
        <div className="text-center mt-6 animate-fade-in delay-300">
          <p className="text-sm text-muted-foreground">
            🎵 Word jij de volgende? Start je eigen muziekavontuur! ✨
          </p>
        </div>
      </div>
    </section>
  );
};