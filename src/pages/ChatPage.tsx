import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ChatPage() {
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Chat</CardTitle>
          <CardDescription>Start een gesprek met je team of AI assistent.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nog geen chatberichten. Begin een nieuw gesprek!</p>
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
  );
}
