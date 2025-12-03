import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, Download, Trash2, Search, Users, TrendingUp, Calendar, MailX } from 'lucide-react';
import { useNewsletterSubscribers } from '@/hooks/useNewsletterSubscribers';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function NewsletterSubscribersSection() {
  const { subscribers, stats, isLoading, deleteSubscriber, unsubscribe, exportToCsv } = useNewsletterSubscribers();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSubscribers = subscribers?.filter(s => 
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.source?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string, email: string) => {
    try {
      await deleteSubscriber.mutateAsync(id);
      toast({
        title: 'Subscriber verwijderd',
        description: `${email} is verwijderd uit de lijst.`,
      });
    } catch (error) {
      toast({
        title: 'Fout',
        description: 'Kon subscriber niet verwijderen.',
        variant: 'destructive',
      });
    }
  };

  const handleUnsubscribe = async (id: string, email: string) => {
    try {
      await unsubscribe.mutateAsync(id);
      toast({
        title: 'Uitgeschreven',
        description: `${email} is uitgeschreven.`,
      });
    } catch (error) {
      toast({
        title: 'Fout',
        description: 'Kon niet uitschrijven.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Totaal</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stats?.total || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Actief</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-green-500">{stats?.active || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Deze week</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-blue-500">{stats?.thisWeek || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Deze maand</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-purple-500">{stats?.thisMonth || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Source Breakdown */}
      {stats?.bySource && Object.keys(stats.bySource).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Inschrijvingen per bron</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.bySource).map(([source, count]) => (
                <Badge key={source} variant="secondary">
                  {source}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscribers Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Newsletter Subscribers
              </CardTitle>
              <CardDescription>
                Beheer je nieuwsbrief inschrijvingen
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToCsv}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek op email of bron..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Laden...</div>
          ) : filteredSubscribers?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Geen resultaten gevonden' : 'Nog geen subscribers'}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Bron</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Welkomstmail</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscribers?.map((subscriber) => (
                    <TableRow key={subscriber.id}>
                      <TableCell className="font-medium">{subscriber.email}</TableCell>
                      <TableCell>
                        {new Date(subscriber.subscribed_at).toLocaleDateString('nl-NL')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{subscriber.source || 'popup'}</Badge>
                      </TableCell>
                      <TableCell>
                        {subscriber.unsubscribed_at ? (
                          <Badge variant="destructive">Uitgeschreven</Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-500">Actief</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {subscriber.welcome_email_sent ? (
                          <Badge variant="secondary">✓ Verzonden</Badge>
                        ) : (
                          <Badge variant="outline">Niet verzonden</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {!subscriber.unsubscribed_at && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnsubscribe(subscriber.id, subscriber.email)}
                              title="Uitschrijven"
                            >
                              <MailX className="h-4 w-4" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title="Verwijderen">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Subscriber verwijderen?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Weet je zeker dat je {subscriber.email} wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(subscriber.id, subscriber.email)}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Verwijderen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
