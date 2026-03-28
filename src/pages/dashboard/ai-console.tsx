import { useState } from 'react';
import { DashboardShell } from '@/layouts/dashboard-shell';
import { Brain, CornerDownLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAIFeatureUsageCount, incrementAIFeatureUsageCount } from '@/lib/ab-test';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

export function DashboardAIConsolePage() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const currentAiUsage = getAIFeatureUsageCount();

  const handleSendMessage = async () => {
    if (prompt.trim() === '') return;

    const newUserMessage: Message = { id: Date.now().toString(), role: 'user', content: prompt };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setPrompt('');
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: `AI antwoord op: "${newUserMessage.content}". Dit is een gesimuleerd antwoord, maar stel je voor dat dit je helpt met creatieve content! AI gebruik: ${currentAiUsage + 1}`,
      };
      setMessages((prevMessages) => [...prevMessages, aiResponse]);
      setIsLoading(false);
      incrementAIFeatureUsageCount(); // Increment usage count on successful AI interaction
    }, 1500);
  };

  return (
    <DashboardShell title="AI Assistant" description="Laat AI je helpen met jouw projecten!">
      <div className="grid h-full grid-rows-[1fr_auto] gap-4">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> AI Chat
            </CardTitle>
            <CardDescription>Begin een gesprek met de AI assistant.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full pr-4">
              <div className="flex flex-col gap-4 p-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                    <Brain className="h-16 w-16 mb-4" />
                    <p className="text-center">Stel een vraag of geef een opdracht om te beginnen.</p>
                  </div>
                )}
                {messages.map((message) => (
                  <div key={message.id} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                    {message.role === 'ai' && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/ai-avatar.png" alt="AI Assistant" />
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`rounded-lg p-3 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                      ${message.role === 'user' ? 'rounded-br-none' : 'rounded-bl-none'}`}
                      style={{ maxWidth: '75%' }}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/user-avatar.png" alt="User" />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/ai-avatar.png" alt="AI Assistant" />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg bg-muted p-3">
                      <div className="h-4 w-16 animate-pulse rounded bg-muted-foreground/50" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="mt-auto border-t p-4">
            <div className="relative w-full flex items-center">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Stel je vraag of geef een opdracht aan de AI Assistant..."
                className="min-h-12 resize-none pr-12 shadow-none focus-visible:ring-0"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-3 top-3 h-8 w-8"
                onClick={handleSendMessage}
                disabled={isLoading || prompt.trim() === ''}
              >
                <CornerDownLeft className="h-4 w-4" />
                <span className="sr-only">Verstuur bericht</span>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </DashboardShell>
  );
}
