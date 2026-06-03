import { useState, useMemo, useEffect } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, Save, Trash2, Users, Inbox, ShoppingBag, UserCheck, Loader2, FileText, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

type Recipient = { email: string; name?: string | null; source: string; meta?: any };

const quillModules = {
  toolbar: {
    container: [
      [{ font: [] }, { size: ["small", false, "large", "huge"] }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ script: "sub" }, { script: "super" }],
      [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
      [{ align: [] }, { direction: "rtl" }],
      ["blockquote", "code-block"],
      ["link", "image", "video"],
      ["clean"],
    ],
    handlers: {
      image: function (this: any) {
        const input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", "image/*");
        input.click();
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (e) => {
            const range = this.quill.getSelection(true);
            this.quill.insertEmbed(range.index, "image", e.target?.result);
            this.quill.setSelection(range.index + 1, 0);
          };
          reader.readAsDataURL(file);
        };
      },
    },
  },
  clipboard: { matchVisual: false },
};

const quillFormats = [
  "font", "size", "header",
  "bold", "italic", "underline", "strike",
  "color", "background", "script",
  "list", "bullet", "indent",
  "align", "direction",
  "blockquote", "code-block",
  "link", "image", "video",
];

export default function AdminEmailCenter() {
  return (
    <AdminGuard>
      <AdminEmailCenterContent />
    </AdminGuard>
  );
}

function AdminEmailCenterContent() {
  const { toast } = useToast();
  const qc = useQueryClient();

  // Compose state
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [bgColor, setBgColor] = useState("#f4f4f5");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templateName, setTemplateName] = useState("");

  // Recipient state
  const [manualInput, setManualInput] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<Map<string, Recipient>>(new Map());
  const [testEmail, setTestEmail] = useState("");
  const [recipientTab, setRecipientTab] = useState<"manual" | "users" | "newsletter" | "discogs">("manual");
  const [filter, setFilter] = useState("");

  // Recipients from edge fn
  const { data: recipients, isLoading: recipientsLoading, error: recipientsError, refetch: refetchRecipients } = useQuery({
    queryKey: ["email-center-recipients"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("email-center-recipients", {
        body: {},
      });
      if (error) throw error;
      return data as { users?: any[]; newsletter?: any[]; discogs?: any[] };
    },
  });

  // Templates
  const { data: templates } = useQuery({
    queryKey: ["email-center-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_center_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Campaigns
  const { data: campaigns, refetch: refetchCampaigns } = useQuery({
    queryKey: ["email-center-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_center_campaigns")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Logs
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const { data: sends } = useQuery({
    queryKey: ["email-center-sends", selectedCampaignId],
    queryFn: async () => {
      if (!selectedCampaignId) return [];
      const { data, error } = await supabase
        .from("email_center_sends")
        .select("*")
        .eq("campaign_id", selectedCampaignId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCampaignId,
  });

  // Recipient list for active tab
  const activeList: Recipient[] = useMemo(() => {
    if (recipientTab === "manual") {
      const lines = manualInput
        .split(/[\s,;\n]+/)
        .map(s => s.trim())
        .filter(s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
      return Array.from(new Set(lines.map(s => s.toLowerCase()))).map(email => ({ email, source: "manual" }));
    }
    const src = recipientTab === "users" ? recipients?.users : recipientTab === "newsletter" ? recipients?.newsletter : recipients?.discogs;
    let list = (src || []).map((r: any) => ({ email: r.email, name: r.name, meta: r.meta, source: recipientTab }));
    if (filter.trim()) {
      const q = filter.trim().toLowerCase();
      list = list.filter(r => r.email.toLowerCase().includes(q) || (r.name || "").toLowerCase().includes(q));
    }
    return list;
  }, [recipientTab, recipients, manualInput, filter]);

  const toggleEmail = (r: Recipient) => {
    const next = new Map(selectedEmails);
    const key = r.email.toLowerCase();
    if (next.has(key)) next.delete(key);
    else next.set(key, r);
    setSelectedEmails(next);
  };

  const selectAllVisible = () => {
    const next = new Map(selectedEmails);
    for (const r of activeList) next.set(r.email.toLowerCase(), r);
    setSelectedEmails(next);
  };
  const clearVisible = () => {
    const next = new Map(selectedEmails);
    for (const r of activeList) next.delete(r.email.toLowerCase());
    setSelectedEmails(next);
  };

  // When switching to manual tab, auto-select manual entries
  useEffect(() => {
    if (recipientTab === "manual") {
      const next = new Map(selectedEmails);
      // Remove previously auto-added manual ones first
      for (const [k, v] of next) if (v.source === "manual") next.delete(k);
      for (const r of activeList) next.set(r.email.toLowerCase(), r);
      setSelectedEmails(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualInput, recipientTab]);

  // Template handlers
  const loadTemplate = (id: string) => {
    const t = templates?.find((x: any) => x.id === id);
    if (!t) return;
    setSubject(t.subject);
    setBody(t.html_content);
    setSelectedTemplateId(id);
    setTemplateName(t.name);
  };

  const saveTemplate = useMutation({
    mutationFn: async () => {
      if (!templateName.trim() || !subject.trim() || !body.trim()) {
        throw new Error("Naam, onderwerp en bericht zijn verplicht");
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (selectedTemplateId) {
        const { error } = await supabase
          .from("email_center_templates")
          .update({ name: templateName, subject, html_content: body })
          .eq("id", selectedTemplateId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("email_center_templates")
          .insert({ name: templateName, subject, html_content: body, created_by: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Template opgeslagen" });
      qc.invalidateQueries({ queryKey: ["email-center-templates"] });
    },
    onError: (e: any) => toast({ title: "Fout", description: e.message, variant: "destructive" }),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_center_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Template verwijderd" });
      qc.invalidateQueries({ queryKey: ["email-center-templates"] });
      setSelectedTemplateId("");
      setTemplateName("");
    },
  });

  // Send
  const send = useMutation({
    mutationFn: async ({ test }: { test: boolean }) => {
      if (!subject.trim() || !body.trim()) throw new Error("Onderwerp en bericht zijn verplicht");
      let recipientsPayload: Recipient[];
      if (test) {
        if (!testEmail.trim()) throw new Error("Geef een test emailadres");
        recipientsPayload = [{ email: testEmail.trim(), source: "test" }];
      } else {
        recipientsPayload = Array.from(selectedEmails.values());
        if (recipientsPayload.length === 0) throw new Error("Geen ontvangers geselecteerd");
      }
      const { data, error } = await supabase.functions.invoke("send-email-center", {
        body: {
          subject,
          html_content: body,
          recipients: recipientsPayload.map(r => ({ email: r.email, name: r.name || null })),
          test_mode: test,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast({
        title: data?.test_mode ? "Test verzonden" : "Verzonden",
        description: `Verstuurd: ${data?.sent ?? 0} | Mislukt: ${data?.failed ?? 0} | Totaal: ${data?.total ?? 0}`,
      });
      refetchCampaigns();
    },
    onError: (e: any) => toast({ title: "Fout bij versturen", description: e.message, variant: "destructive" }),
  });

  // Sync ALL Discogs orders (paginates through entire marketplace history)
  const syncDiscogs = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("discogs-sync-all-orders", { body: {} });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      const totalSaved = (data?.summary || []).reduce((a: number, s: any) => a + (s.orders_saved || 0), 0);
      const totalEmails = (data?.summary || []).reduce((a: number, s: any) => a + (s.orders_with_email || 0), 0);
      toast({
        title: "Discogs sync klaar",
        description: `${totalSaved} orders opgeslagen, ${totalEmails} met email`,
      });
      refetchRecipients();
    },
    onError: (e: any) => toast({ title: "Sync mislukt", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="w-full min-w-0 p-4 space-y-6">
        <div className="flex items-center gap-3">
          <Mail className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Email Center</h1>
            <p className="text-muted-foreground text-sm">Verstuur emails naar adressen via Resend</p>
          </div>
        </div>

        <Tabs defaultValue="compose">
          <TabsList>
            <TabsTrigger value="compose"><Mail className="h-4 w-4 mr-2" />Compose</TabsTrigger>
            <TabsTrigger value="templates"><FileText className="h-4 w-4 mr-2" />Templates</TabsTrigger>
            <TabsTrigger value="logs"><Inbox className="h-4 w-4 mr-2" />Logs</TabsTrigger>
          </TabsList>

          {/* COMPOSE */}
          <TabsContent value="compose" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Bericht */}
              <Card>
                <CardHeader>
                  <CardTitle>Bericht</CardTitle>
                  <CardDescription>Onderwerp en HTML inhoud. Gebruik <code>{`{{name}}`}</code> voor personalisatie.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <select
                      className="flex-1 h-10 border rounded-md px-2 bg-background text-sm"
                      value={selectedTemplateId}
                      onChange={(e) => e.target.value ? loadTemplate(e.target.value) : (setSelectedTemplateId(""), setTemplateName(""))}
                    >
                      <option value="">— Kies template —</option>
                      {templates?.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Onderwerp</Label>
                    <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email onderwerp" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label>Bericht (HTML)</Label>
                      <span className="text-xs text-muted-foreground">Tip: gebruik kop, kleur, afbeelding, links & uitlijning voor een rijke opmaak</span>
                    </div>
                    <div className="bg-background border rounded-md email-rich-editor">
                      <ReactQuill
                        theme="snow"
                        value={body}
                        onChange={setBody}
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="Schrijf hier je email. Voeg koppen, afbeeldingen, kleuren en knoppen toe..."
                      />
                    </div>
                    {body && (
                      <details className="mt-3">
                        <summary className="text-sm font-medium cursor-pointer text-muted-foreground hover:text-foreground">
                          📧 Live preview tonen
                        </summary>
                        <div className="mt-2 border rounded-md p-4 bg-white max-h-[500px] overflow-auto">
                          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: body }} />
                        </div>
                      </details>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 items-center pt-2 border-t">
                    <Input
                      placeholder="Template naam"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="max-w-xs"
                    />
                    <Button variant="outline" size="sm" onClick={() => saveTemplate.mutate()} disabled={saveTemplate.isPending}>
                      <Save className="h-4 w-4 mr-1" />
                      {selectedTemplateId ? "Update template" : "Sla op als template"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recipients */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Ontvangers
                    <Badge variant="secondary">{selectedEmails.size} geselecteerd</Badge>
                  </CardTitle>
                  <CardDescription>Kies uit een bron of plak emailadressen</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Tabs value={recipientTab} onValueChange={(v: any) => setRecipientTab(v)}>
                    <TabsList className="flex flex-wrap h-auto">
                      <TabsTrigger value="manual">Plakken</TabsTrigger>
                      <TabsTrigger value="users"><UserCheck className="h-3 w-3 mr-1" />Users</TabsTrigger>
                      <TabsTrigger value="newsletter"><Mail className="h-3 w-3 mr-1" />Newsletter</TabsTrigger>
                      <TabsTrigger value="discogs"><ShoppingBag className="h-3 w-3 mr-1" />Discogs</TabsTrigger>
                    </TabsList>

                    <TabsContent value="manual" className="space-y-2">
                      <Textarea
                        rows={6}
                        placeholder="email1@example.com, email2@example.com&#10;email3@example.com"
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">{activeList.length} geldige adressen herkend</p>
                    </TabsContent>

                    {(["users", "newsletter", "discogs"] as const).map(t => (
                      <TabsContent key={t} value={t} className="space-y-2">
                        <div className="flex gap-2 items-center flex-wrap">
                          <Input placeholder="Zoek email of naam..." value={filter} onChange={(e) => setFilter(e.target.value)} className="flex-1 min-w-[180px]" />
                          <Button variant="outline" size="sm" onClick={() => refetchRecipients()}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          {t === "discogs" && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={syncDiscogs.isPending}
                              onClick={() => syncDiscogs.mutate()}
                              title="Haalt ALLE Discogs orders op (alle pagina's) en slaat buyer emails op"
                            >
                              {syncDiscogs.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                              Sync alle Discogs orders
                            </Button>
                          )}
                        </div>
                        <div className="flex gap-2 text-xs">
                          <Button variant="ghost" size="sm" onClick={selectAllVisible}>Alles selecteren ({activeList.length})</Button>
                          <Button variant="ghost" size="sm" onClick={clearVisible}>Wissen</Button>
                        </div>
                        <div className="border rounded-md max-h-80 overflow-y-auto divide-y">
                          {recipientsError ? (
                            <div className="p-4 text-center text-sm text-destructive">
                              Ontvangers laden mislukt. Klik op verversen.
                            </div>
                          ) : recipientsLoading ? (
                            <div className="p-4 text-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Laden...</div>
                          ) : activeList.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">Geen resultaten</div>
                          ) : (
                            activeList.slice(0, 500).map(r => {
                              const key = r.email.toLowerCase();
                              const checked = selectedEmails.has(key);
                              return (
                                <label key={key} className="flex items-center gap-3 p-2 hover:bg-muted/40 cursor-pointer text-sm">
                                  <Checkbox checked={checked} onCheckedChange={() => toggleEmail(r)} />
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate font-medium">{r.email}</div>
                                    {r.name && <div className="text-xs text-muted-foreground truncate">{r.name}</div>}
                                  </div>
                                </label>
                              );
                            })
                          )}
                        </div>
                        {activeList.length > 500 && (
                          <p className="text-xs text-muted-foreground">Toont eerste 500 van {activeList.length}. Filter om te verfijnen.</p>
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Send bar */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[220px]">
                    <Label>Test emailadres (alleen jezelf)</Label>
                    <Input type="email" placeholder="jij@example.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
                  </div>
                  <Button variant="outline" onClick={() => send.mutate({ test: true })} disabled={send.isPending}>
                    {send.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Stuur test
                  </Button>
                  <Button onClick={() => send.mutate({ test: false })} disabled={send.isPending || selectedEmails.size === 0}>
                    {send.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Verstuur naar {selectedEmails.size} ontvangers
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TEMPLATES */}
          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Opgeslagen templates</CardTitle>
                <CardDescription>Beheer herbruikbare email templates</CardDescription>
              </CardHeader>
              <CardContent>
                {!templates || templates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nog geen templates.</p>
                ) : (
                  <div className="divide-y border rounded-md">
                    {templates.map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between p-3 gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{t.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{t.subject}</div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => loadTemplate(t.id)}>Laden</Button>
                        <Button variant="ghost" size="sm" onClick={() => { if (confirm("Verwijder template?")) deleteTemplate.mutate(t.id); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* LOGS */}
          <TabsContent value="logs">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Campagnes</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y max-h-[600px] overflow-y-auto">
                    {campaigns?.map((c: any) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCampaignId(c.id)}
                        className={`w-full text-left p-3 hover:bg-muted/40 ${selectedCampaignId === c.id ? "bg-muted/60" : ""}`}
                      >
                        <div className="text-sm font-medium truncate">{c.subject}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(c.created_at), "dd MMM HH:mm", { locale: nl })}
                          {c.test_mode && <Badge variant="outline" className="ml-2 text-[10px]">TEST</Badge>}
                        </div>
                        <div className="flex gap-2 mt-1 text-xs">
                          <Badge variant="secondary">{c.total_count} totaal</Badge>
                          <Badge className="bg-green-500/10 text-green-700">{c.sent_count} sent</Badge>
                          {c.failed_count > 0 && <Badge variant="destructive">{c.failed_count} fail</Badge>}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Verzendingen</CardTitle>
                  <CardDescription>{selectedCampaignId ? `Campagne ${selectedCampaignId.slice(0, 8)}...` : "Kies een campagne"}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {!selectedCampaignId ? (
                    <p className="p-4 text-sm text-muted-foreground">Selecteer een campagne om verzendingen te zien.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b bg-muted/30">
                          <tr>
                            <th className="text-left p-2">Email</th>
                            <th className="text-left p-2">Status</th>
                            <th className="text-left p-2">Verzonden</th>
                            <th className="text-left p-2">Error</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sends?.map((s: any) => (
                            <tr key={s.id} className="border-b">
                              <td className="p-2 truncate max-w-[220px]">{s.recipient_email}</td>
                              <td className="p-2">
                                <Badge
                                  variant="outline"
                                  className={
                                    s.status === "sent" ? "bg-green-500/10 text-green-700" :
                                    s.status === "failed" ? "bg-red-500/10 text-red-700" :
                                    "bg-muted text-muted-foreground"
                                  }
                                >{s.status}</Badge>
                              </td>
                              <td className="p-2 text-muted-foreground text-xs">{s.sent_at ? format(new Date(s.sent_at), "dd MMM HH:mm", { locale: nl }) : "-"}</td>
                              <td className="p-2 text-xs text-red-600 truncate max-w-[200px]">{s.error_message || ""}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
    </div>
  );
}
