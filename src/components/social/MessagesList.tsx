import React from 'react';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, MessageCircle, Plus } from 'lucide-react';
import { Conversation } from '@/hooks/useConversations';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface MessagesListProps {
  onConversationSelect: (conversation: Conversation) => void;
  selectedConversationId?: string;
}

const MessagesList: React.FC<MessagesListProps> = ({
  onConversationSelect,
  selectedConversationId,
}) => {
  const { user } = useAuth();
  const { data: conversations, isLoading } = useConversations();

  // Get the other participant for a conversation
  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants?.find(p => p.user_id !== user?.id);
  };

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return format(date, 'HH:mm');
    } else if (diffInHours < 48) {
      return 'Gisteren';
    } else {
      return format(date, 'dd/MM');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Gesprekken laden...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-medium mb-2">Nog geen gesprekken</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start een gesprek door een bericht te sturen naar andere gebruikers.
          </p>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nieuw gesprek starten
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        const otherParticipant = getOtherParticipant(conversation);
        const isSelected = conversation.id === selectedConversationId;
        
        return (
          <Button
            key={conversation.id}
            variant="ghost"
            onClick={() => onConversationSelect(conversation)}
            className={cn(
              "w-full h-auto p-3 justify-start hover:bg-muted/50",
              isSelected && "bg-muted"
            )}
          >
            <div className="flex items-center gap-3 w-full">
              <Avatar className="h-12 w-12">
                <AvatarImage src={otherParticipant?.avatar_url || undefined} />
                <AvatarFallback>
                  {otherParticipant?.first_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium truncate">
                    {otherParticipant?.first_name || 'Onbekende gebruiker'}
                  </h4>
                  {conversation.last_message && (
                    <span className="text-xs text-muted-foreground">
                      {formatLastMessageTime(conversation.last_message.created_at)}
                    </span>
                  )}
                </div>
                
                {conversation.last_message ? (
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.last_message.sender_id === user?.id && "Je: "}
                    {conversation.last_message.content}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Nog geen berichten
                  </p>
                )}
              </div>
            </div>
          </Button>
        );
      })}
    </div>
  );
};

export default MessagesList;