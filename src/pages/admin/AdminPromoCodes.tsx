import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Copy, Loader2, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const AdminPromoCodes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [code, setCode] = useState('');
  const [credits, setCredits] = useState(5);
  const [maxUses, setMaxUses] = useState<number | ''>('');
  const [description, setDescription] = useState('');

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ['admin-promo-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('promo_codes').insert({
        code: code.toUpperCase().trim(),
        credits_amount: credits,
        max_uses: maxUses || null,
        description: description || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      toast.success('Promocode aangemaakt!');
      setDialogOpen(false);
      setCode('');
      setCredits(5);
      setMaxUses('');
      setDescription('');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('promo_codes').update({ is_active: active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('promo_codes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      toast.success('Verwijderd');
    },
  });

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'MS-';
    for (let i = 0; i < 6; i++) result += chars[Math.floor(Math.random() * chars.length)];
    setCode(result);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Promocodes</h1>
            <p className="text-muted-foreground">Beheer promocodes voor gratis scan credits</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nieuwe Code</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nieuwe Promocode</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label>Code</Label>
                  <div className="flex gap-2">
                    <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="WELKOM2026" required maxLength={30} className="uppercase" />
                    <Button type="button" variant="outline" onClick={generateCode}>Genereer</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Aantal credits</Label>
                  <Input type="number" value={credits} onChange={(e) => setCredits(Number(e.target.value))} min={1} max={1000} required />
                </div>
                <div className="space-y-2">
                  <Label>Max gebruikers (leeg = onbeperkt)</Label>
                  <Input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value ? Number(e.target.value) : '')} min={1} />
                </div>
                <div className="space-y-2">
                  <Label>Beschrijving (optioneel)</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Welkomstcode voor nieuwe gebruikers" />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Aanmaken
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader><CardTitle>Alle Codes</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Gebruik</TableHead>
                    <TableHead>Beschrijving</TableHead>
                    <TableHead>Actief</TableHead>
                    <TableHead>Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.map((pc: any) => (
                    <TableRow key={pc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{pc.code}</code>
                          <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(pc.code); toast.success('Gekopieerd!'); }}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{pc.credits_amount}</Badge></TableCell>
                      <TableCell>{pc.current_uses}{pc.max_uses ? ` / ${pc.max_uses}` : ' / ∞'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{pc.description || '-'}</TableCell>
                      <TableCell>
                        <Switch checked={pc.is_active} onCheckedChange={(v) => toggleMutation.mutate({ id: pc.id, active: v })} />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => { if (confirm('Verwijderen?')) deleteMutation.mutate(pc.id); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {codes.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nog geen promocodes</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPromoCodes;
