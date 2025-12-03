import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  Bell, Plus, Pencil, Trash2, Eye, EyeOff, 
  Clock, MousePointerClick, ArrowUpFromLine, FileText,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { 
  useSitePopups, 
  useCreatePopup, 
  useUpdatePopup, 
  useDeletePopup,
  SitePopup 
} from '@/hooks/useSitePopups';

const TRIGGER_TYPES = [
  { value: 'time_on_page', label: 'Tijd op pagina', icon: Clock, description: 'Toon na X seconden' },
  { value: 'scroll_depth', label: 'Scroll diepte', icon: ArrowUpFromLine, description: 'Toon bij X% scroll' },
  { value: 'exit_intent', label: 'Exit intent', icon: MousePointerClick, description: 'Toon bij verlaten pagina' },
  { value: 'page_visit', label: 'Pagina bezoek', icon: FileText, description: 'Toon bij bepaalde pagina' },
];

const POPUP_TYPES = [
  { value: 'quiz_prompt', label: 'Quiz Uitnodiging' },
  { value: 'newsletter', label: 'Nieuwsbrief' },
  { value: 'promo', label: 'Promotie' },
  { value: 'announcement', label: 'Aankondiging' },
  { value: 'custom', label: 'Aangepast' },
];

const FREQUENCY_OPTIONS = [
  { value: 'once_per_session', label: 'Eén keer per sessie' },
  { value: 'once_per_day', label: 'Eén keer per dag' },
  { value: 'once_ever', label: 'Eén keer (ooit)' },
  { value: 'always', label: 'Altijd' },
];

type PopupFormData = Omit<SitePopup, 'id' | 'views_count' | 'clicks_count' | 'dismissals_count' | 'created_at' | 'updated_at'>;

const defaultFormData: PopupFormData = {
  name: '',
  popup_type: 'custom',
  title: '',
  description: '',
  button_text: '',
  button_url: '',
  image_url: '',
  trigger_type: 'time_on_page',
  trigger_value: 30,
  trigger_pages: null,
  exclude_pages: null,
  display_frequency: 'once_per_session',
  max_displays: 1,
  priority: 0,
  show_to_guests: true,
  show_to_users: true,
  is_active: true,
  start_date: null,
  end_date: null,
};

export default function PopupManager() {
  const { data: popups = [], isLoading } = useSitePopups();
  const createPopup = useCreatePopup();
  const updatePopup = useUpdatePopup();
  const deletePopup = useDeletePopup();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPopup, setSelectedPopup] = useState<SitePopup | null>(null);
  const [formData, setFormData] = useState<PopupFormData>(defaultFormData);
  const [excludePagesInput, setExcludePagesInput] = useState('');
  const [triggerPagesInput, setTriggerPagesInput] = useState('');

  const handleCreate = () => {
    setSelectedPopup(null);
    setFormData(defaultFormData);
    setExcludePagesInput('');
    setTriggerPagesInput('');
    setIsEditorOpen(true);
  };

  const handleEdit = (popup: SitePopup) => {
    setSelectedPopup(popup);
    setFormData({
      name: popup.name,
      popup_type: popup.popup_type,
      title: popup.title,
      description: popup.description || '',
      button_text: popup.button_text || '',
      button_url: popup.button_url || '',
      image_url: popup.image_url || '',
      trigger_type: popup.trigger_type,
      trigger_value: popup.trigger_value,
      trigger_pages: popup.trigger_pages,
      exclude_pages: popup.exclude_pages,
      display_frequency: popup.display_frequency,
      max_displays: popup.max_displays,
      priority: popup.priority,
      show_to_guests: popup.show_to_guests,
      show_to_users: popup.show_to_users,
      is_active: popup.is_active,
      start_date: popup.start_date,
      end_date: popup.end_date,
    });
    setExcludePagesInput(popup.exclude_pages?.join(', ') || '');
    setTriggerPagesInput(popup.trigger_pages?.join(', ') || '');
    setIsEditorOpen(true);
  };

  const handleDelete = (popup: SitePopup) => {
    setSelectedPopup(popup);
    setIsDeleteDialogOpen(true);
  };

  const handleToggleActive = async (popup: SitePopup) => {
    try {
      await updatePopup.mutateAsync({ id: popup.id, is_active: !popup.is_active });
      toast({
        title: popup.is_active ? 'Popup gedeactiveerd' : 'Popup geactiveerd',
      });
    } catch (error) {
      toast({
        title: 'Fout bij bijwerken',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.title) {
      toast({
        title: 'Vul alle verplichte velden in',
        variant: 'destructive',
      });
      return;
    }

    const data: PopupFormData = {
      ...formData,
      exclude_pages: excludePagesInput ? excludePagesInput.split(',').map(s => s.trim()).filter(Boolean) : null,
      trigger_pages: triggerPagesInput ? triggerPagesInput.split(',').map(s => s.trim()).filter(Boolean) : null,
    };

    try {
      if (selectedPopup) {
        await updatePopup.mutateAsync({ id: selectedPopup.id, ...data });
        toast({ title: 'Popup bijgewerkt' });
      } else {
        await createPopup.mutateAsync(data);
        toast({ title: 'Popup aangemaakt' });
      }
      setIsEditorOpen(false);
    } catch (error) {
      toast({
        title: 'Fout bij opslaan',
        variant: 'destructive',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedPopup) return;
    try {
      await deletePopup.mutateAsync(selectedPopup.id);
      toast({ title: 'Popup verwijderd' });
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Fout bij verwijderen',
        variant: 'destructive',
      });
    }
  };

  const getTriggerIcon = (type: string) => {
    const trigger = TRIGGER_TYPES.find(t => t.value === type);
    return trigger?.icon || Clock;
  };

  const calculateCTR = (popup: SitePopup) => {
    if (popup.views_count === 0) return 0;
    return ((popup.clicks_count / popup.views_count) * 100).toFixed(1);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Popup Beheer
            </h1>
            <p className="text-muted-foreground">
              Beheer gedrag-gebaseerde popups voor je website
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe Popup
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Totaal Popups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{popups.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Actieve Popups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {popups.filter(p => p.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Totaal Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {popups.reduce((sum, p) => sum + p.views_count, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Totaal Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {popups.reduce((sum, p) => sum + p.clicks_count, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Popup List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Laden...
              </CardContent>
            </Card>
          ) : popups.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Nog geen popups aangemaakt
              </CardContent>
            </Card>
          ) : (
            popups.map(popup => {
              const TriggerIcon = getTriggerIcon(popup.trigger_type);
              return (
                <Card key={popup.id} className={!popup.is_active ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{popup.name}</h3>
                          <Badge variant={popup.is_active ? 'default' : 'secondary'}>
                            {popup.is_active ? 'Actief' : 'Inactief'}
                          </Badge>
                          <Badge variant="outline">
                            {POPUP_TYPES.find(t => t.value === popup.popup_type)?.label || popup.popup_type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{popup.title}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <TriggerIcon className="h-3 w-3" />
                            {TRIGGER_TYPES.find(t => t.value === popup.trigger_type)?.label}
                            {popup.trigger_value && ` (${popup.trigger_value}${popup.trigger_type === 'scroll_depth' ? '%' : 's'})`}
                          </span>
                          <span>Prioriteit: {popup.priority}</span>
                          <span>{FREQUENCY_OPTIONS.find(f => f.value === popup.display_frequency)?.label}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="font-semibold">{popup.views_count.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Views</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{popup.clicks_count.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Clicks</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{calculateCTR(popup)}%</div>
                          <div className="text-xs text-muted-foreground">CTR</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={popup.is_active}
                          onCheckedChange={() => handleToggleActive(popup)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(popup)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(popup)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Editor Dialog */}
        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedPopup ? 'Popup Bewerken' : 'Nieuwe Popup'}
              </DialogTitle>
              <DialogDescription>
                Configureer de inhoud, trigger en weergave-instellingen
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="font-medium">Basis Informatie</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Naam (intern) *</Label>
                    <Input
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Quiz Popup Homepage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={formData.popup_type}
                      onValueChange={value => setFormData({ ...formData, popup_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {POPUP_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <h4 className="font-medium">Inhoud</h4>
                <div className="space-y-2">
                  <Label>Titel *</Label>
                  <Input
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="🎯 Test je muziekkennis!"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Beschrijving</Label>
                  <Textarea
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Speel onze gratis quiz..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Button Tekst</Label>
                    <Input
                      value={formData.button_text || ''}
                      onChange={e => setFormData({ ...formData, button_text: e.target.value })}
                      placeholder="Start Quiz"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Button URL</Label>
                    <Input
                      value={formData.button_url || ''}
                      onChange={e => setFormData({ ...formData, button_url: e.target.value })}
                      placeholder="/quizzen"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Afbeelding URL (optioneel)</Label>
                  <Input
                    value={formData.image_url || ''}
                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Trigger Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">Trigger Instellingen</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Trigger Type</Label>
                    <Select
                      value={formData.trigger_type}
                      onValueChange={value => setFormData({ ...formData, trigger_type: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRIGGER_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Trigger Waarde 
                      {formData.trigger_type === 'scroll_depth' ? ' (%)' : ' (seconden)'}
                    </Label>
                    <Input
                      type="number"
                      value={formData.trigger_value || ''}
                      onChange={e => setFormData({ ...formData, trigger_value: parseInt(e.target.value) || null })}
                      placeholder={formData.trigger_type === 'scroll_depth' ? '50' : '30'}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Alleen op pagina's (komma-gescheiden, leeg = alle)</Label>
                  <Input
                    value={triggerPagesInput}
                    onChange={e => setTriggerPagesInput(e.target.value)}
                    placeholder="/nieuws, /singles, /artists"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Uitsluiten pagina's (komma-gescheiden)</Label>
                  <Input
                    value={excludePagesInput}
                    onChange={e => setExcludePagesInput(e.target.value)}
                    placeholder="/quizzen, /auth, /login"
                  />
                </div>
              </div>

              {/* Display Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">Weergave Instellingen</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Frequentie</Label>
                    <Select
                      value={formData.display_frequency}
                      onValueChange={value => setFormData({ ...formData, display_frequency: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCY_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prioriteit (hoger = belangrijker)</Label>
                    <Input
                      type="number"
                      value={formData.priority}
                      onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
                Annuleren
              </Button>
              <Button onClick={handleSave} disabled={createPopup.isPending || updatePopup.isPending}>
                {selectedPopup ? 'Opslaan' : 'Aanmaken'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Popup Verwijderen</AlertDialogTitle>
              <AlertDialogDescription>
                Weet je zeker dat je "{selectedPopup?.name}" wilt verwijderen? 
                Dit kan niet ongedaan worden gemaakt.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuleren</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
                Verwijderen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
