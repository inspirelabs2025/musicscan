import React, { useEffect, useRef } from 'react';
import { useConversationMessages } from '@/hooks/useConversations';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, MessageCircle } from 'lucide-react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { Conversation } from '@/hooks/useConversations';
import { supabase } from '@/integrations/supabase/client';

interface ChatWindowProps {
  conversation: Conversation;
  onBack: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, onBack }) => {
  const { user } = useAuth();
  const { data: messages, isLoading } = useConversationMessages(conversation.id);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get the other participant (not the current user)
  const otherParticipant = conversation.participants?.find(
    p => p.user_id !== user?.id
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to real-time message updates
  useEffect(() => {
    const channel = supabase
      .channel(`conversation-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        () => {
          // The useConversationMessages query will automatically refetch
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-background/95 backdrop-blur">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        {otherParticipant && (
          <>
            <Avatar>
              <AvatarImage src={otherParticipant.avatar_url || undefined} />
              <AvatarFallback>
                {otherParticipant.first_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">
                {otherParticipant.first_name || 'Onbekende gebruiker'}
              </h3>
              <p className="text-sm text-muted-foreground">Online</p>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Berichten laden...</p>
            </div>
          </div>
        ) : messages && messages.length > 0 ? (
          <>
            {messages.map((message, index) => {
              const isCurrentUser = message.sender_id === user?.id;
              const prevMessage = messages[index - 1];
              const showAvatar = !prevMessage || 
                prevMessage.sender_id !== message.sender_id ||
                new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 300000; // 5 minutes

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isCurrentUser={isCurrentUser}
                  showAvatar={showAvatar}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">Nog geen berichten</h3>
              <p className="text-sm text-muted-foreground">
                Start een gesprek door een bericht te sturen!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <MessageInput conversationId={conversation.id} />
    </div>
  );
};

export default ChatWindow;