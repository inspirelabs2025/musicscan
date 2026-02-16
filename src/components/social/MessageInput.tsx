import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { useSendMessage } from '@/hooks/useConversations';
import { useLanguage } from '@/contexts/LanguageContext';

interface MessageInputProps {
  conversationId: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ conversationId }) => {
  const [message, setMessage] = useState('');
  const sendMessage = useSendMessage();
  const { tr } = useLanguage();
  const s = tr.socialUI;

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      await sendMessage.mutateAsync({ conversationId, content: message.trim() });
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 p-4 border-t bg-background">
      <Textarea
        placeholder={s.typePlaceholder}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-[40px] max-h-32 resize-none flex-1"
        rows={1}
      />
      <Button
        onClick={handleSend}
        disabled={!message.trim() || sendMessage.isPending}
        size="icon"
        className="self-end mb-0.5"
      >
        {sendMessage.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default MessageInput;
