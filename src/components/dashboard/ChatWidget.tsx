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
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          {d.chatWithYourMusic}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isLoading && messages && messages.length > 0 ? (
          <div className="bg-muted/40 p-2.5 rounded-lg">
            <div className="text-[11px] text-muted-foreground mb-1">
              {messages[0].sender_type === 'user' ? `👤 ${d.you}` : `🤖 ${d.assistant}`}
            </div>
            <p className="text-sm line-clamp-2">{messages[0].message}</p>
          </div>
        ) : (
          <div className="text-center py-3">
            <MessageSquare className="w-8 h-8 text-muted-foreground/40 mx-auto mb-1.5" />
            <p className="text-sm text-muted-foreground">{d.startAConversation}</p>
          </div>
        )}

        <div className="space-y-1">
          {quickPrompts.map((prompt, i) => (
            <Button key={i} asChild variant="ghost" size="sm" className="h-auto p-2 text-xs justify-start w-full hover:bg-muted/50">
              <Link to={`/collection-chat?prompt=${encodeURIComponent(prompt)}`}>
                <Sparkles className="w-3 h-3 mr-2 shrink-0 text-primary" />
                <span className="line-clamp-1 text-left">{prompt}</span>
              </Link>
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            size="sm"
            onClick={() => window.dispatchEvent(new CustomEvent('open-magic-mike'))}
          >
            <Bot className="w-3.5 h-3.5 mr-1.5" />
            Chat
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/collection-chat">
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              {d.openChat}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
