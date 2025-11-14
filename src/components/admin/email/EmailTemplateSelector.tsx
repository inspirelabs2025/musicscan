import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface EmailTemplateSelectorProps {
  templateType: 'daily_digest' | 'weekly_discussion';
  onTemplateTypeChange: (type: 'daily_digest' | 'weekly_discussion') => void;
  selectedTemplateId?: string;
  onTemplateSelect: (id: string) => void;
}

export const EmailTemplateSelector = ({
  templateType,
  onTemplateTypeChange,
  selectedTemplateId,
  onTemplateSelect,
}: EmailTemplateSelectorProps) => {
  const { data: templates, isLoading } = useQuery({
    queryKey: ['email-templates', templateType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_type', templateType)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Template Type</label>
        <Select value={templateType} onValueChange={onTemplateTypeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily_digest">Daily Email Digest</SelectItem>
            <SelectItem value="weekly_discussion">Weekly Discussion Email</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!isLoading && templates && templates.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Template Versie</label>
          <Select value={selectedTemplateId} onValueChange={onTemplateSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Selecteer een template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <div className="flex items-center gap-2">
                    <span>{template.name}</span>
                    {template.is_active && (
                      <Badge variant="secondary" className="text-xs">Actief</Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {format(new Date(template.created_at), 'dd MMM yyyy')}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};
