import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Bot, Sparkles, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChatMessage {
  id: string;
  message: string;
  sender_type: 'user' | 'assistant';
  created_at: string;
}

const useRecentChatMessages = () => {
  return useQuery({
    queryKey: ['recent-chat-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, message, sender_type, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      return data as ChatMessage[];
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const ChatWidget = () => {
  const { data: messages, isLoading } = useRecentChatMessages();
  const { tr } = useLanguage();
  const d = tr.dashboardUI;

  const quickPrompts = [
    d.promptRarestAlbums,
    d.promptTopGenres,
    d.promptRecommendations,
    d.promptCollectionValue,
  ];

  return (
    <Card className="border-2 hover:border-vinyl-gold/50 transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-vinyl-gold animate-pulse" />
          {d.chatWithYourMusic}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isLoading && messages && messages.length > 0 ? (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground mb-2">{d.lastConversation}</div>
            <div className="bg-accent/10 p-3 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">
                {messages[0].sender_type === 'user' ? `👤 ${d.you}` : `🤖 ${d.assistant}`}
              </div>
              <div className="text-sm line-clamp-2">
                {messages[0].message}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-3">
            <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">
              {d.startAConversation}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">{d.askMeSomething}</div>
          <div className="grid grid-cols-1 gap-1">
            {quickPrompts.slice(0, 2).map((prompt, index) => (
              <Button 
                key={index}
                asChild
                variant="ghost"
                size="sm"
                className="h-auto p-2 text-xs text-left justify-start hover:bg-vinyl-gold/10"
              >
                <Link to={`/collection-chat?prompt=${encodeURIComponent(prompt)}`}>
                  <Sparkles className="w-3 h-3 mr-2 flex-shrink-0" />
                  <span className="line-clamp-1">{prompt}</span>
                </Link>
              </Button>
            ))}
          </div>
        </div>

        <Button asChild className="w-full bg-gradient-to-r from-vinyl-gold to-vinyl-gold/80">
          <Link to="/collection-chat">
            <MessageSquare className="w-4 h-4 mr-2" />
            {d.openChat}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};
