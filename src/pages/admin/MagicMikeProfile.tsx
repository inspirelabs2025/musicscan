import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bot, Save, Plus, Trash2, Globe, FileText, MessageSquare, Loader2, ExternalLink, Pencil, X } from "lucide-react";

interface AgentProfile {
  id: string;
  agent_name: string;
  display_name: string;
  system_prompt: string;
  is_active: boolean;
  updated_at: string;
}

interface KnowledgeSource {
  id: string;
  agent_id: string;
  source_type: 'document' | 'website' | 'text';
  title: string;
  content: string | null;
  source_url: string | null;
  file_url: string | null;
  is_active: boolean;
  created_at: string;
}

export default function MagicMikeProfile() {
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [knowledge, setKnowledge] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState("");
  
  // New knowledge source form
  const [newSourceType, setNewSourceType] = useState<'website' | 'text'>('website');
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newContent, setNewContent] = useState("");
  const [addingSource, setAddingSource] = useState(false);
  const [scrapingUrl, setScrapingUrl] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, knowledgeRes] = await Promise.all([
        supabase
          .from('ai_agent_profiles')
          .select('*')
          .eq('agent_name', 'magic_mike')
          .single(),
        supabase
          .from('ai_agent_knowledge')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (profileRes.error) throw profileRes.error;
      
      const p = profileRes.data as AgentProfile;
      setProfile(p);
      setEditedPrompt(p.system_prompt);

      // Filter knowledge for this agent
      const agentKnowledge = (knowledgeRes.data || []).filter(
        (k: any) => k.agent_id === p.id
      ) as KnowledgeSource[];
      setKnowledge(agentKnowledge);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Fout bij laden van profiel');
    } finally {
      setLoading(false);
    }
  };

  const savePrompt = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('ai_agent_profiles')
        .update({ system_prompt: editedPrompt })
        .eq('id', profile.id);

      if (error) throw error;
      toast.success('Systeem prompt opgeslagen!');
      setProfile(prev => prev ? { ...prev, system_prompt: editedPrompt } : null);
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast.error('Fout bij opslaan');
    } finally {
      setSaving(false);
    }
  };

  const scrapeWebsite = async (url: string) => {
    setScrapingUrl(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-knowledge-url', {
        body: { url },
      });

      if (error) throw error;
      return data?.content || '';
    } catch (error) {
      console.error('Error scraping:', error);
      toast.error('Kon website niet laden. Voer handmatig content in.');
      return '';
    } finally {
      setScrapingUrl(false);
    }
  };

  const addKnowledgeSource = async () => {
    if (!profile || !newTitle.trim()) {
      toast.error('Titel is verplicht');
      return;
    }
    setAddingSource(true);
    try {
      let content = newContent;

      // If website, try to scrape content
      if (newSourceType === 'website' && newUrl && !content) {
        content = await scrapeWebsite(newUrl);
      }

      if (!content?.trim()) {
        if (newSourceType === 'website') {
          toast.error('Kon geen content ophalen van de website. Probeer het opnieuw of voer handmatig content in.');
        } else {
          toast.error('Content is verplicht');
        }
        setAddingSource(false);
        return;
      }

      const { data, error } = await supabase
        .from('ai_agent_knowledge')
        .insert({
          agent_id: profile.id,
          source_type: newSourceType,
          title: newTitle.trim(),
          content: content.trim(),
          source_url: newSourceType === 'website' ? newUrl : null,
        })
        .select()
        .single();

      if (error) throw error;
      
      setKnowledge(prev => [data as KnowledgeSource, ...prev]);
      setNewTitle("");
      setNewUrl("");
      setNewContent("");
      toast.success('Kennisbron toegevoegd!');
    } catch (error) {
      console.error('Error adding knowledge:', error);
      toast.error('Fout bij toevoegen');
    } finally {
      setAddingSource(false);
    }
  };

  const toggleKnowledgeActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('ai_agent_knowledge')
        .update({ is_active: !currentActive })
        .eq('id', id);

      if (error) throw error;
      setKnowledge(prev => prev.map(k => k.id === id ? { ...k, is_active: !currentActive } : k));
      toast.success(currentActive ? 'Bron gedeactiveerd' : 'Bron geactiveerd');
    } catch (error) {
      toast.error('Fout bij bijwerken');
    }
  };

  const deleteKnowledgeSource = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze kennisbron wilt verwijderen?')) return;
    try {
      const { error } = await supabase
        .from('ai_agent_knowledge')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setKnowledge(prev => prev.filter(k => k.id !== id));
      toast.success('Kennisbron verwijderd');
    } catch (error) {
      toast.error('Fout bij verwijderen');
    }
  };

  const startEditing = (source: KnowledgeSource) => {
    setEditingId(source.id);
    setEditTitle(source.title);
    setEditContent(source.content || "");
    setEditUrl(source.source_url || "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
    setEditUrl("");
  };

  const saveEdit = async () => {
    if (!editingId || !editTitle.trim() || !editContent.trim()) {
      toast.error('Titel en content zijn verplicht');
      return;
    }
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from('ai_agent_knowledge')
        .update({
          title: editTitle.trim(),
          content: editContent.trim(),
          source_url: editUrl.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);

      if (error) throw error;
      setKnowledge(prev => prev.map(k => k.id === editingId ? {
        ...k,
        title: editTitle.trim(),
        content: editContent.trim(),
        source_url: editUrl.trim() || null,
      } : k));
      cancelEditing();
      toast.success('Kennisbron bijgewerkt!');
    } catch (error) {
      console.error('Error saving knowledge:', error);
      toast.error('Fout bij opslaan');
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-5xl">
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Magic Mike 🎩 Profiel</h1>
            <p className="text-muted-foreground">Beheer de chat instructies en kennisbronnen</p>
          </div>
        </div>

        <Tabs defaultValue="prompt" className="space-y-4">
          <TabsList>
            <TabsTrigger value="prompt" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Systeem Prompt
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="gap-2">
              <FileText className="w-4 h-4" />
              Kennisbronnen ({knowledge.length})
            </TabsTrigger>
          </TabsList>

          {/* === SYSTEM PROMPT TAB === */}
          <TabsContent value="prompt" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chat Instructies</CardTitle>
                <CardDescription>
                  Dit is de systeem prompt die Magic Mike gebruikt. Wijzigingen worden direct actief bij het volgende gesprek.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  className="min-h-[500px] font-mono text-sm"
                  placeholder="Systeem prompt..."
                />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {editedPrompt.length} karakters · Laatste update: {profile?.updated_at ? new Date(profile.updated_at).toLocaleString('nl-NL') : '-'}
                  </p>
                  <Button onClick={savePrompt} disabled={saving || editedPrompt === profile?.system_prompt}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Opslaan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === KNOWLEDGE SOURCES TAB === */}
          <TabsContent value="knowledge" className="space-y-4">
            {/* Add new source */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nieuwe Kennisbron Toevoegen</CardTitle>
                <CardDescription>
                  Voeg websites of tekst toe die Magic Mike kan gebruiken als context bij het beantwoorden van vragen.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={newSourceType === 'website' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewSourceType('website')}
                  >
                    <Globe className="w-4 h-4 mr-1" /> Website
                  </Button>
                  <Button
                    variant={newSourceType === 'text' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewSourceType('text')}
                  >
                    <FileText className="w-4 h-4 mr-1" /> Tekst
                  </Button>
                </div>

                <Input
                  placeholder="Titel (bijv. 'Discogs Matrix Gids')"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />

                {newSourceType === 'website' && (
                  <div className="space-y-2">
                    <Input
                      placeholder="https://example.com/page"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      De inhoud wordt automatisch opgehaald. Je kunt de content hieronder ook handmatig aanpassen.
                    </p>
                  </div>
                )}

                <Textarea
                  placeholder={newSourceType === 'website' 
                    ? "Laat leeg om automatisch te scrapen, of plak hier de relevante content..."
                    : "Plak hier de kennistekst die Magic Mike moet leren..."
                  }
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="min-h-[150px]"
                />

                <Button 
                  onClick={addKnowledgeSource} 
                  disabled={addingSource || !newTitle.trim()}
                >
                  {addingSource || scrapingUrl ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {scrapingUrl ? 'Website laden...' : 'Kennisbron Toevoegen'}
                </Button>
              </CardContent>
            </Card>

            {/* Existing sources */}
            <div className="space-y-3">
              {knowledge.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Nog geen kennisbronnen toegevoegd. Voeg websites of tekst toe om Magic Mike slimmer te maken.
                  </CardContent>
                </Card>
              ) : (
                knowledge.map((source) => (
                  <Card key={source.id} className={!source.is_active ? 'opacity-50' : ''}>
                    <CardContent className="pt-4">
                      {editingId === source.id ? (
                        <div className="space-y-3">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Titel"
                          />
                          {source.source_type === 'website' && (
                            <Input
                              value={editUrl}
                              onChange={(e) => setEditUrl(e.target.value)}
                              placeholder="https://..."
                            />
                          )}
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[300px] font-mono text-sm"
                            placeholder="Content..."
                          />
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                              {editContent.length} karakters
                            </p>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={cancelEditing}>
                                <X className="w-4 h-4 mr-1" /> Annuleren
                              </Button>
                              <Button size="sm" onClick={saveEdit} disabled={savingEdit}>
                                {savingEdit ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                                Opslaan
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {source.source_type === 'website' ? (
                                <Globe className="w-4 h-4 text-primary shrink-0" />
                              ) : (
                                <FileText className="w-4 h-4 text-primary shrink-0" />
                              )}
                              <span className="font-medium truncate">{source.title}</span>
                              <Badge variant={source.is_active ? 'default' : 'secondary'} className="text-xs">
                                {source.is_active ? 'Actief' : 'Inactief'}
                              </Badge>
                            </div>
                            
                            {source.source_url && (
                              <a 
                                href={source.source_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1 mb-1"
                              >
                                {source.source_url} <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {source.content?.substring(0, 200)}...
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {source.content?.length || 0} karakters · {new Date(source.created_at).toLocaleDateString('nl-NL')}
                            </p>
                          </div>

                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditing(source)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleKnowledgeActive(source.id, source.is_active)}
                            >
                              {source.is_active ? 'Deactiveer' : 'Activeer'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteKnowledgeSource(source.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

