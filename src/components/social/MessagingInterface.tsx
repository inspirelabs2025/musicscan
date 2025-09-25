import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import MessagesList from './MessagesList';
import ChatWindow from './ChatWindow';
import { Conversation } from '@/hooks/useConversations';

const MessagingInterface: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showConversationList, setShowConversationList] = useState(true);

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowConversationList(false); // Hide list on mobile
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    setShowConversationList(true);
  };

  return (
    <div className="h-[600px] flex">
      {/* Conversations List */}
      <div className={`
        w-full lg:w-80 lg:border-r
        ${showConversationList ? 'block' : 'hidden lg:block'}
      `}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Berichten</h3>
            <Button variant="ghost" size="sm">
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-4 h-full overflow-y-auto">
          <MessagesList
            onConversationSelect={handleConversationSelect}
            selectedConversationId={selectedConversation?.id}
          />
        </div>
      </div>

      {/* Chat Window */}
      <div className={`
        flex-1 min-w-0
        ${!showConversationList || selectedConversation ? 'block' : 'hidden lg:block'}
      `}>
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            onBack={handleBackToList}
          />
        ) : (
          <Card className="h-full flex items-center justify-center border-0 lg:border">
            <div className="text-center p-8">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Selecteer een gesprek</h3>
              <p className="text-muted-foreground">
                Kies een gesprek uit de lijst om te beginnen met chatten.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MessagingInterface;