import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Crown, MessageCircle, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const FeaturedUsersWidget = () => {
  const { user } = useAuth();

  const { data: featuredUsers, isLoading } = useQuery({
    queryKey: ['featuredUsers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_public', true)
        .neq('user_id', user?.id || '')
        .limit(3);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  if (isLoading) {
    return (
      <Card className="border-2 hover:border-vinyl-gold/50 transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-vinyl-gold" />
            👑 Muziekvrienden van de Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 hover:border-vinyl-gold/50 transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-vinyl-gold animate-pulse" />
          👑 Muziekvrienden van de Week
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {featuredUsers?.map((profile, index) => (
          <div key={profile.user_id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-vinyl-gold/5 transition-colors group">
            <div className="relative">
              <Avatar className="w-12 h-12 border-2 border-vinyl-gold/20">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback>{profile.first_name?.[0] || '?'}</AvatarFallback>
              </Avatar>
              {index === 0 && (
                <div className="absolute -top-1 -right-1">
                  <Crown className="w-4 h-4 text-vinyl-gold" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{profile.first_name || 'Muziekliefhebber'}</p>
                <Badge variant="outline" className="text-xs">
                  🎵 {Math.floor(Math.random() * 500) + 50} albums
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {profile.bio || 'Passie voor vinyl en muziek ontdekking'}
              </p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <MessageCircle className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};