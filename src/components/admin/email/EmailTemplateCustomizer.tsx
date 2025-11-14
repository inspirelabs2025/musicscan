import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { EmailTemplateSelector } from './EmailTemplateSelector';
import { TemplateConfigForm } from './TemplateConfigForm';
import { EmailTemplatePreview } from './EmailTemplatePreview';
import { generatePreviewHTML } from './EmailPreviewGenerator';
import { Mail, Save, Check, RotateCcw, Eye } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const defaultConfig: Record<string, any> = {
  daily_digest: {
    branding: {
      companyName: 'MusicScan',
      fromEmail: 'noreply@musicscan.app',
      replyToEmail: 'support@musicscan.app',
    },
    styling: {
      headerGradientStart: '#9b87f5',
      headerGradientEnd: '#F97316',
      accentColor: '#8B5CF6',
      backgroundColor: '#f9fafb',
      textColor: '#1f2937',
      linkColor: '#8B5CF6',
    },
    content: {
      showSections: {
        releases: true,
        blogs: true,
        stats: true,
        news: true,
      },
      introText: 'Welkom bij je dagelijkse MusicScan update! Ontdek de nieuwste releases, blogs en community highlights.',
      outroText: 'Bedankt voor het lezen! Blijf ontdekken en deel je muziekmomenten.',
      ctaButtonText: 'Bezoek MusicScan',
      ctaButtonUrl: 'https://musicscan.app',
    },
    footer: {
      footerText: 'Je ontvangt deze email omdat je geabonneerd bent op MusicScan updates.',
      socialLinks: {},
      unsubscribeText: 'Wil je deze emails niet meer ontvangen?',
    },
  },
  weekly_discussion: {
    branding: {
      companyName: 'MusicScan',
      fromEmail: 'noreply@musicscan.app',
      replyToEmail: 'support@musicscan.app',
    },
    styling: {
      headerGradientStart: '#10b981',
      headerGradientEnd: '#3b82f6',
      accentColor: '#10b981',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      linkColor: '#10b981',
    },
    content: {
      showSections: {
        albumCover: true,
        artistInfo: true,
      },
      headerText: 'Nieuwe Wekelijkse Discussie op MusicScan Forum!',
      ctaButtonText: 'Doe Mee aan Discussie',
      ctaButtonUrl: 'https://musicscan.app/forum',
    },
    footer: {
      footerText: 'Je ontvangt deze email omdat je geabonneerd bent op forum notificaties.',
      socialLinks: {},
      unsubscribeText: 'Notificaties uitschakelen?',
    },
  },
};

export const EmailTemplateCustomizer = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [templateType, setTemplateType] = useState<'daily_digest' | 'weekly_discussion'>('daily_digest');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>();
  const [templateName, setTemplateName] = useState('');
  const [config, setConfig] = useState<any>(defaultConfig[templateType]);
  const [previewHtml, setPreviewHtml] = useState('');
  const [testEmail, setTestEmail] = useState('');

  // Fetch active template when template type changes
  const { data: activeTemplate } = useQuery({
    queryKey: ['active-template', templateType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_type', templateType)
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Load template when selected
  useEffect(() => {
    if (activeTemplate) {
      setSelectedTemplateId(activeTemplate.id);
      setTemplateName(activeTemplate.name);
      setConfig(activeTemplate.config as any);
      if (activeTemplate.preview_html) {
        setPreviewHtml(activeTemplate.preview_html);
      }
    } else {
      setConfig(defaultConfig[templateType]);
      setTemplateName(`Default ${templateType === 'daily_digest' ? 'Daily Digest' : 'Weekly Discussion'}`);
    }
  }, [activeTemplate, templateType]);

  // Generate preview HTML whenever config changes
  useEffect(() => {
    if (config) {
      const html = generatePreviewHTML(config, templateType);
      setPreviewHtml(html);
    }
  }, [config, templateType]);

  // Save template mutation
  const saveMutation = useMutation({
    mutationFn: async ({ isActive }: { isActive: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // If activating, deactivate other templates of same type
      if (isActive) {
        await supabase
          .from('email_templates')
          .update({ is_active: false })
          .eq('template_type', templateType);
      }

      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          template_type: templateType,
          name: templateName,
          is_active: isActive,
          config: config,
          preview_html: previewHtml,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      queryClient.invalidateQueries({ queryKey: ['active-template'] });
      toast({
        title: isActive ? 'Template geactiveerd' : 'Template opgeslagen',
        description: isActive 
          ? 'De template is succesvol geactiveerd en wordt nu gebruikt voor emails.'
          : 'De template is opgeslagen als concept.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Fout bij opslaan',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Send test email mutation
  const testEmailMutation = useMutation({
    mutationFn: async () => {
      const functionName = templateType === 'daily_digest' 
        ? 'daily-email-digest' 
        : 'send-weekly-discussion-notification';
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { 
          testEmail,
          useCustomTemplate: true,
          templateConfig: config,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Test email verzonden',
        description: `Email is verzonden naar ${testEmail}`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Fout bij versturen',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleReset = () => {
    setConfig(defaultConfig[templateType]);
    setTemplateName(`Default ${templateType === 'daily_digest' ? 'Daily Digest' : 'Weekly Discussion'}`);
    toast({
      title: 'Template gereset',
      description: 'Standaard instellingen hersteld',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Template Editor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <EmailTemplateSelector
            templateType={templateType}
            onTemplateTypeChange={(type) => setTemplateType(type)}
            selectedTemplateId={selectedTemplateId}
            onTemplateSelect={setSelectedTemplateId}
          />

          <div>
            <Label>Template Naam</Label>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Bijv. Zomer 2025 Template"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Aanpassingen</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <TemplateConfigForm
                config={config}
                onChange={setConfig}
                templateType={templateType}
              />
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Preview */}
        <div>
          <EmailTemplatePreview
            html={previewHtml || '<p class="text-muted-foreground text-center p-8">Preview wordt gegenereerd...</p>'}
            isLoading={false}
          />
        </div>
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Test Email
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Test Email Versturen</DialogTitle>
                  <DialogDescription>
                    Verstuur een test email met de huidige template configuratie
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Email Adres</Label>
                    <Input
                      type="email"
                      placeholder="test@example.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={() => testEmailMutation.mutate()}
                    disabled={!testEmail || testEmailMutation.isPending}
                    className="w-full"
                  >
                    {testEmailMutation.isPending ? 'Versturen...' : 'Verstuur Test'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              onClick={() => saveMutation.mutate({ isActive: false })}
              disabled={saveMutation.isPending || !templateName}
            >
              <Save className="mr-2 h-4 w-4" />
              Opslaan als Concept
            </Button>

            <Button
              onClick={() => saveMutation.mutate({ isActive: true })}
              disabled={saveMutation.isPending || !templateName}
            >
              <Check className="mr-2 h-4 w-4" />
              Activeren
            </Button>

            <Button variant="ghost" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset naar Default
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
