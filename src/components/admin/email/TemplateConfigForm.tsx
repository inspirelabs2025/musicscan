import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ColorPicker } from './ColorPicker';
import { Separator } from '@/components/ui/separator';

interface TemplateConfig {
  branding: {
    companyName: string;
    fromEmail: string;
    replyToEmail: string;
  };
  styling: {
    headerGradientStart: string;
    headerGradientEnd: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    linkColor: string;
  };
  content: {
    showSections?: Record<string, boolean>;
    introText?: string;
    outroText?: string;
    headerText?: string;
    ctaButtonText: string;
    ctaButtonUrl: string;
  };
  footer: {
    footerText: string;
    socialLinks: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
    };
    unsubscribeText: string;
  };
}

interface TemplateConfigFormProps {
  config: TemplateConfig;
  onChange: (config: TemplateConfig) => void;
  templateType: 'daily_digest' | 'weekly_discussion';
}

export const TemplateConfigForm = ({ config, onChange, templateType }: TemplateConfigFormProps) => {
  const updateConfig = (section: keyof TemplateConfig, field: string, value: any) => {
    onChange({
      ...config,
      [section]: {
        ...config[section],
        [field]: value,
      },
    });
  };

  const updateNestedConfig = (section: keyof TemplateConfig, subsection: string, field: string, value: any) => {
    onChange({
      ...config,
      [section]: {
        ...config[section],
        [subsection]: {
          ...(config[section] as any)[subsection],
          [field]: value,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Branding */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Branding</h3>
        <div className="space-y-3">
          <div>
            <Label>Bedrijfsnaam</Label>
            <Input
              value={config.branding.companyName}
              onChange={(e) => updateConfig('branding', 'companyName', e.target.value)}
            />
          </div>
          <div>
            <Label>Van Email</Label>
            <Input
              type="email"
              value={config.branding.fromEmail}
              onChange={(e) => updateConfig('branding', 'fromEmail', e.target.value)}
            />
          </div>
          <div>
            <Label>Reply-to Email</Label>
            <Input
              type="email"
              value={config.branding.replyToEmail}
              onChange={(e) => updateConfig('branding', 'replyToEmail', e.target.value)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Styling */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Kleuren & Styling</h3>
        <div className="grid gap-4">
          <ColorPicker
            label="Header Gradient Start"
            value={config.styling.headerGradientStart}
            onChange={(value) => updateConfig('styling', 'headerGradientStart', value)}
          />
          <ColorPicker
            label="Header Gradient Eind"
            value={config.styling.headerGradientEnd}
            onChange={(value) => updateConfig('styling', 'headerGradientEnd', value)}
          />
          <ColorPicker
            label="Accent Kleur"
            description="CTA buttons en links"
            value={config.styling.accentColor}
            onChange={(value) => updateConfig('styling', 'accentColor', value)}
          />
          <ColorPicker
            label="Achtergrond"
            value={config.styling.backgroundColor}
            onChange={(value) => updateConfig('styling', 'backgroundColor', value)}
          />
          <ColorPicker
            label="Text Kleur"
            value={config.styling.textColor}
            onChange={(value) => updateConfig('styling', 'textColor', value)}
          />
          <ColorPicker
            label="Link Kleur"
            value={config.styling.linkColor}
            onChange={(value) => updateConfig('styling', 'linkColor', value)}
          />
        </div>
      </div>

      <Separator />

      {/* Content */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Content Secties</h3>
        
        {templateType === 'daily_digest' && config.content.showSections && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="releases"
                checked={config.content.showSections.releases}
                onCheckedChange={(checked) => 
                  updateNestedConfig('content', 'showSections', 'releases', checked)
                }
              />
              <Label htmlFor="releases" className="cursor-pointer">
                Toon "Nieuwe Releases" sectie
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="blogs"
                checked={config.content.showSections.blogs}
                onCheckedChange={(checked) => 
                  updateNestedConfig('content', 'showSections', 'blogs', checked)
                }
              />
              <Label htmlFor="blogs" className="cursor-pointer">
                Toon "Laatste Blog Posts" sectie
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="stats"
                checked={config.content.showSections.stats}
                onCheckedChange={(checked) => 
                  updateNestedConfig('content', 'showSections', 'stats', checked)
                }
              />
              <Label htmlFor="stats" className="cursor-pointer">
                Toon "Community Stats" sectie
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="news"
                checked={config.content.showSections.news}
                onCheckedChange={(checked) => 
                  updateNestedConfig('content', 'showSections', 'news', checked)
                }
              />
              <Label htmlFor="news" className="cursor-pointer">
                Toon "Nieuwe Nieuws" sectie
              </Label>
            </div>
          </div>
        )}

        {templateType === 'weekly_discussion' && config.content.showSections && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="albumCover"
                checked={config.content.showSections.albumCover}
                onCheckedChange={(checked) => 
                  updateNestedConfig('content', 'showSections', 'albumCover', checked)
                }
              />
              <Label htmlFor="albumCover" className="cursor-pointer">
                Toon album cover
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="artistInfo"
                checked={config.content.showSections.artistInfo}
                onCheckedChange={(checked) => 
                  updateNestedConfig('content', 'showSections', 'artistInfo', checked)
                }
              />
              <Label htmlFor="artistInfo" className="cursor-pointer">
                Toon artist info
              </Label>
            </div>
          </div>
        )}

        <div className="space-y-3 mt-4">
          {templateType === 'daily_digest' && (
            <>
              <div>
                <Label>Intro Tekst</Label>
                <Textarea
                  value={config.content.introText || ''}
                  onChange={(e) => updateConfig('content', 'introText', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label>Outro Tekst</Label>
                <Textarea
                  value={config.content.outroText || ''}
                  onChange={(e) => updateConfig('content', 'outroText', e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}
          
          {templateType === 'weekly_discussion' && (
            <div>
              <Label>Header Tekst</Label>
              <Textarea
                value={config.content.headerText || ''}
                onChange={(e) => updateConfig('content', 'headerText', e.target.value)}
                rows={2}
              />
            </div>
          )}

          <div>
            <Label>CTA Button Tekst</Label>
            <Input
              value={config.content.ctaButtonText}
              onChange={(e) => updateConfig('content', 'ctaButtonText', e.target.value)}
            />
          </div>
          <div>
            <Label>CTA Button URL</Label>
            <Input
              type="url"
              value={config.content.ctaButtonUrl}
              onChange={(e) => updateConfig('content', 'ctaButtonUrl', e.target.value)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Footer */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Footer</h3>
        <div className="space-y-3">
          <div>
            <Label>Footer Tekst</Label>
            <Textarea
              value={config.footer.footerText}
              onChange={(e) => updateConfig('footer', 'footerText', e.target.value)}
              rows={2}
            />
          </div>
          <div>
            <Label>Unsubscribe Tekst</Label>
            <Input
              value={config.footer.unsubscribeText}
              onChange={(e) => updateConfig('footer', 'unsubscribeText', e.target.value)}
            />
          </div>
          <div>
            <Label>Facebook URL (optioneel)</Label>
            <Input
              type="url"
              value={config.footer.socialLinks.facebook || ''}
              onChange={(e) => updateNestedConfig('footer', 'socialLinks', 'facebook', e.target.value)}
            />
          </div>
          <div>
            <Label>Instagram URL (optioneel)</Label>
            <Input
              type="url"
              value={config.footer.socialLinks.instagram || ''}
              onChange={(e) => updateNestedConfig('footer', 'socialLinks', 'instagram', e.target.value)}
            />
          </div>
          <div>
            <Label>Twitter URL (optioneel)</Label>
            <Input
              type="url"
              value={config.footer.socialLinks.twitter || ''}
              onChange={(e) => updateNestedConfig('footer', 'socialLinks', 'twitter', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
