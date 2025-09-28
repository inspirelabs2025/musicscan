import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Message } from '@/hooks/useConversations';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  showAvatar?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isCurrentUser, 
  showAvatar = true 
}) => {
  return (
    <div className={cn(
      "flex items-end gap-2 max-w-[80%]",
      isCurrentUser ? "ml-auto flex-row-reverse" : "mr-auto"
    )}>
      {!isCurrentUser && showAvatar && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={message.sender?.avatar_url || undefined} />
          <AvatarFallback>
            {(message.sender?.first_name || (message.sender as any)?.display_name || 'U').charAt(0)}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "rounded-2xl px-4 py-2 max-w-full break-words",
        isCurrentUser 
          ? "bg-primary text-primary-foreground rounded-br-md" 
          : "bg-muted rounded-bl-md"
      )}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <div className={cn(
          "text-xs mt-1 opacity-70",
          isCurrentUser ? "text-right" : "text-left"
        )}>
          {format(new Date(message.created_at), 'HH:mm')}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;