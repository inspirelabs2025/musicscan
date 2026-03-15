import AppLayout from '@/components/app/AppLayout';
import PageHeader from '@/components/app/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ChatPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Chat"
        description="Start een gesprek met je team of AI assistent."
      />
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Welkom in de Chat</CardTitle>
            <CardDescription>Hier kun je chatten over je project.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Nog geen chatberichten. Begin een nieuw gesprek!</p>
            {/* 
              TODO: Implement actual chat functionality here.
              This would typically involve:
              - An input field for messages
              - Display area for messages
              - Integration with a backend for message storage and real-time updates
              - Optionally, integration with an AI agent
            */}
            <div className="mt-4 p-4 border rounded-md h-64 flex items-center justify-center bg-muted/20">
              <p className="text-muted-foreground">Jouw chatgeschiedenis verschijnt hier.</p>
            </div>
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Typ je bericht..."
                className="flex-grow p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                Verzend
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
