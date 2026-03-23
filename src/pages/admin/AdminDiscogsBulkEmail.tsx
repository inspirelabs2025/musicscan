import { useState, useMemo } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Send, Users, Mail, Globe, Clock, CheckCircle2, XCircle, Loader2, FileText, Eye } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface EmailTemplate {
  id: string;
  name: string;
  subject_nl: string;
  subject_en: string;
  body_nl: string;
  body_en: string;
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: "promo",
    name: "Promotie / Nieuwe Producten",
    subject_nl: "Nieuwe items beschikbaar bij MusicScan!",
    subject_en: "New items available at MusicScan!",
    body_nl: `<h1>Hallo {{username}},</h1><p>Bedankt voor je eerdere aankoop bij ons op Discogs!</p><p>We hebben weer nieuwe items toegevoegd aan onze collectie. Bekijk ons volledige aanbod op:</p><p><a href="https://musicscan.app/shop"><strong>Bekijk Shop</strong></a></p><p>Met vriendelijke groet,<br/>MusicScan Team</p>`,
    body_en: `<h1>Hi {{username}},</h1><p>Thank you for your previous purchase from us on Discogs!</p><p>We've added new items to our collection. Check out our full catalog at:</p><p><a href="https://musicscan.app/shop"><strong>Visit Shop</strong></a></p><p>Best regards,<br/>MusicScan Team</p>`,
  },
  {
    id: "review",
    name: "Review Verzoek",
    subject_nl: "Hoe bevalt je aankoop?",
    subject_en: "How's your purchase?",
    body_nl: `<h1>Hallo {{username}},</h1><p>We hopen dat je blij bent met je aankoop! Als je even de tijd hebt, zou je ons willen beoordelen op Discogs?</p><p>Je feedback helpt andere kopers en helpt ons om onze service te verbeteren.</p><p>Bedankt!<br/>MusicScan Team</p>`,
    body_en: `<h1>Hi {{username}},</h1><p>We hope you're enjoying your purchase! If you have a moment, would you mind leaving us a review on Discogs?</p><p>Your feedback helps other buyers and helps us improve our service.</p><p>Thank you!<br/>MusicScan Team</p>`,
  },
  {
    id: "custom",
    name: "Eigen Bericht",
    subject_nl: "",
    subject_en: "",
    body_nl: "",
    body_en: "",
  },
];

export default function AdminDiscogsBulkEmail() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("promo");
  const [language, setLanguage] = useState<string>("nl");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [subject, setSubject] = useState(DEFAULT_TEMPLATES[0].subject_nl);
  const [body, setBody] = useState(DEFAULT_TEMPLATES[0].body_nl);
  const [sending, setSending] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // Fetch unique contacts from discogs_orders
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ["discogs-bulk-email-contacts", countryFilter],
    queryFn: async () => {
      let query = supabase
        .from("discogs_orders")
        .select("buyer_email, buyer_username, shipping_address")
        .not("buyer_email", "is", null);

      const { data, error } = await query;
      if (error) throw error;

      // Deduplicate by email
      const seen = new Map<string, { email: string; username: string; address: string | null }>();
      for (const row of data || []) {
        if (!row.buyer_email) continue;
        const email = row.buyer_email.toLowerCase();
        if (!seen.has(email)) {
          seen.set(email, {
            email: row.buyer_email,
            username: row.buyer_username || "Buyer",
            address: row.shipping_address,
          });
        }
      }

      let contacts = Array.from(seen.values());

      // Filter by country
      if (countryFilter === "nl") {
        contacts = contacts.filter(c =>
          c.address && (c.address.toLowerCase().includes("nederland") || c.address.toLowerCase().includes("netherlands"))
        );
      } else if (countryFilter === "intl") {
        contacts = contacts.filter(c =>
          !c.address || (!c.address.toLowerCase().includes("nederland") && !c.address.toLowerCase().includes("netherlands"))
        );
      }

      return contacts;
    },
  });

  // Fetch past campaigns
  const { data: campaigns } = useQuery({
    queryKey: ["discogs-bulk-email-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discogs_bulk_email_campaigns")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = DEFAULT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSubject(language === "nl" ? template.subject_nl : template.subject_en);
      setBody(language === "nl" ? template.body_nl : template.body_en);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    const template = DEFAULT_TEMPLATES.find(t => t.id === selectedTemplate);
    if (template && selectedTemplate !== "custom") {
      setSubject(lang === "nl" ? template.subject_nl : template.subject_en);
      setBody(lang === "nl" ? template.body_nl : template.body_en);
    }
  };

  const sendCampaign = useMutation({
    mutationFn: async () => {
      if (!contacts || contacts.length === 0) throw new Error("Geen ontvangers");
      if (!subject.trim() || !body.trim()) throw new Error("Onderwerp en inhoud zijn verplicht");

      // 1. Create campaign
      const { data: campaign, error: campError } = await supabase
        .from("discogs_bulk_email_campaigns")
        .insert({
          subject,
          html_content: body,
          language,
          country_filter: countryFilter,
          recipient_count: contacts.length,
          status: "pending",
        })
        .select()
        .single();

      if (campError) throw campError;

      // 2. Create individual sends
      const sends = contacts.map(c => ({
        campaign_id: campaign.id,
        buyer_email: c.email,
        buyer_username: c.username,
        status: "pending" as const,
      }));

      // Insert in batches of 100
      for (let i = 0; i < sends.length; i += 100) {
        const batch = sends.slice(i, i + 100);
        const { error: sendError } = await supabase
          .from("discogs_bulk_email_sends")
          .insert(batch);
        if (sendError) throw sendError;
      }

      // 3. Trigger edge function
      const { data, error } = await supabase.functions.invoke("send-discogs-bulk-email", {
        body: { campaignId: campaign.id },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Campaign verzonden!",
        description: `${data.sent} verzonden, ${data.failed} mislukt van ${data.total} totaal`,
      });
      queryClient.invalidateQueries({ queryKey: ["discogs-bulk-email-campaigns"] });
      setSending(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Fout bij verzenden",
        description: error.message,
        variant: "destructive",
      });
      setSending(false);
    },
  });

  const handlePreview = () => {
    if (!contacts || contacts.length === 0) return;
    const sample = contacts[0];
    const previewBody = body.replace(/\{\{username\}\}/g, sample.username);
    setPreviewHtml(previewBody);
  };

  const handleSend = () => {
    setSending(true);
    sendCampaign.mutate();
  };

  return (
    <AdminGuard>
      <div className="w-full min-w-0 p-4 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Discogs Bulk Email</h1>
          <p className="text-muted-foreground">
            Verstuur emails naar Discogs kopers (NL & EN)
          </p>
        </div>

        <Tabs defaultValue="compose" className="space-y-6">
          <TabsList>
            <TabsTrigger value="compose" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Opstellen
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Geschiedenis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Ontvangers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Regio</label>
                    <Select value={countryFilter} onValueChange={setCountryFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle landen</SelectItem>
                        <SelectItem value="nl">Nederland</SelectItem>
                        <SelectItem value="intl">Internationaal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Taal</label>
                    <Select value={language} onValueChange={handleLanguageChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nl">🇳🇱 Nederlands</SelectItem>
                        <SelectItem value="en">🇬🇧 Engels</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {contactsLoading ? "Laden..." : `${contacts?.length || 0} ontvangers`}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Template</label>
                    <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_TEMPLATES.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Compose */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Email Opstellen
                  </CardTitle>
                  <CardDescription>
                    Gebruik {"{{username}}"} als placeholder voor de kopersnaam
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Onderwerp</label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Email onderwerp..."
                      className="text-base"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Inhoud</label>
                    <div className="[&_.ql-container]:min-h-[250px] [&_.ql-editor]:min-h-[250px] [&_.ql-toolbar]:rounded-t-md [&_.ql-container]:rounded-b-md [&_.ql-container]:border-border [&_.ql-toolbar]:border-border">
                      <ReactQuill
                        theme="snow"
                        value={body}
                        onChange={setBody}
                        modules={{
                          toolbar: [
                            [{ header: [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline'],
                            [{ color: [] }, { background: [] }],
                            [{ align: [] }],
                            [{ list: 'ordered' }, { list: 'bullet' }],
                            ['link', 'image'],
                            ['clean'],
                          ],
                        }}
                        placeholder="Typ je email bericht..."
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      onClick={handlePreview}
                      disabled={!contacts || contacts.length === 0}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      onClick={handleSend}
                      disabled={sending || !contacts || contacts.length === 0 || !subject.trim() || !body.trim()}
                      className="min-h-[44px]"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {sending ? "Verzenden..." : `Verstuur naar ${contacts?.length || 0} ontvangers`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview */}
            {previewHtml && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Email Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-white rounded-lg border p-4">
                    <div className="mb-4 pb-3 border-b">
                      <p className="text-sm text-muted-foreground">Onderwerp: <strong className="text-foreground">{subject}</strong></p>
                    </div>
                    <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Verzonden Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                {!campaigns || campaigns.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nog geen campaigns verzonden.</p>
                ) : (
                  <div className="space-y-3">
                    {campaigns.map((campaign: any) => (
                      <div key={campaign.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{campaign.subject}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span>{format(new Date(campaign.created_at), "d MMM yyyy HH:mm", { locale: nl })}</span>
                            <Badge variant="outline">{campaign.language?.toUpperCase()}</Badge>
                            <Badge variant="outline">{campaign.country_filter === "nl" ? "🇳🇱 NL" : campaign.country_filter === "intl" ? "🌍 Intl" : "🌐 Alle"}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 ml-4">
                          <div className="flex items-center gap-1 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>{campaign.sent_count}</span>
                          </div>
                          {campaign.failed_count > 0 && (
                            <div className="flex items-center gap-1 text-sm">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span>{campaign.failed_count}</span>
                            </div>
                          )}
                          <Badge variant={campaign.status === "completed" ? "default" : campaign.status === "sending" ? "secondary" : "outline"}>
                            {campaign.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminGuard>
  );
}
