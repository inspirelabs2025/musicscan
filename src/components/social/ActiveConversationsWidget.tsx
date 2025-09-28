import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Plus, Clock } from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

export const ActiveConversationsWidget = () => {
  const { data: conversations, isLoading } = useConversations();

  const recentConversations = conversations?.slice(0, 3) || [];

  if (isLoading) {
    return (
      <Card className="border-2 hover:border-vinyl-purple/50 transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-vinyl-purple" />
            💬 Actieve Gesprekken
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
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
    <Card className="border-2 hover:border-vinyl-purple/50 transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-vinyl-purple animate-pulse" />
            💬 Actieve Gesprekken
          </CardTitle>
          <Button size="sm" variant="outline" className="h-8 hover:bg-vinyl-purple/10">
            <Plus className="w-4 h-4 mr-1" />
            Nieuw
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentConversations.length > 0 ? (
          recentConversations.map((conversation) => (
            <div key={conversation.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-vinyl-purple/5 transition-colors group cursor-pointer">
              <Avatar className="w-10 h-10 border border-vinyl-purple/20">
                <AvatarImage src={conversation.participants?.[0]?.avatar_url} />
                <AvatarFallback>
                  {conversation.participants?.[0]?.first_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm truncate">
                    {conversation.participants?.[0]?.first_name || 'Onbekend'}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(conversation.updated_at), { 
                      addSuffix: true,
                      locale: nl 
                    })}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {conversation.last_message?.content || 'Geen berichten...'}
                </p>
              </div>
              <div className="w-3 h-3 bg-vinyl-purple rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground mb-3">
              Nog geen gesprekken gestart
            </p>
            <Button size="sm" className="bg-gradient-to-r from-vinyl-purple to-vinyl-purple/80">
              <Plus className="w-4 h-4 mr-2" />
              Start een Gesprek
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};