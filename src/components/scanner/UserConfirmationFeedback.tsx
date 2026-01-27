import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Check, X, Pencil, Sparkles, Trophy, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConfirmationField {
  field: string;
  label: string;
  value: string;
  confidence: number;
  alternatives?: string[];
}

interface UserConfirmationFeedbackProps {
  scanId?: string;
  fields: ConfirmationField[];
  onConfirm?: (field: string, isCorrect: boolean, correctedValue?: string) => void;
  className?: string;
}

/**
 * Quick confirmation UI for scan results
 * Allows users to confirm or correct 1-2 key fields
 * Feels like feedback, but trains AI accuracy
 */
export const UserConfirmationFeedback = React.memo(({
  scanId,
  fields,
  onConfirm,
  className
}: UserConfirmationFeedbackProps) => {
  const { toast } = useToast();
  const [confirmedFields, setConfirmedFields] = useState<Record<string, boolean>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [contributionCount, setContributionCount] = useState(0);

  // Only show fields with low confidence
  const uncertainFields = fields.filter(f => f.confidence < 0.85);

  const saveFeedback = useCallback(async (
    field: string, 
    originalValue: string, 
    isCorrect: boolean, 
    correctedValue?: string
  ) => {
    try {
      // Save to database for AI training
      const { error } = await supabase
        .from('ai_scan_results')
        .update({
          manual_edits: {
            field,
            original: originalValue,
            confirmed: isCorrect,
            corrected: correctedValue,
            timestamp: new Date().toISOString()
          }
        })
        .eq('id', scanId);

      if (error) {
        console.error('Error saving feedback:', error);
      }
    } catch (err) {
      console.error('Failed to save feedback:', err);
    }
  }, [scanId]);

  const handleConfirm = useCallback((field: ConfirmationField, isCorrect: boolean) => {
    setConfirmedFields(prev => ({ ...prev, [field.field]: true }));
    setContributionCount(prev => prev + 1);
    
    if (scanId) {
      saveFeedback(field.field, field.value, isCorrect);
    }
    
    if (onConfirm) {
      onConfirm(field.field, isCorrect);
    }

    // Show appreciation
    toast({
      title: "Bedankt! 🎉",
      description: "Je feedback verbetert de herkenning",
    });
  }, [onConfirm, saveFeedback, scanId, toast]);

  const handleEdit = useCallback((field: ConfirmationField) => {
    setEditingField(field.field);
    setEditValue(field.value);
  }, []);

  const handleSaveEdit = useCallback((field: ConfirmationField) => {
    setConfirmedFields(prev => ({ ...prev, [field.field]: true }));
    setEditingField(null);
    setContributionCount(prev => prev + 1);
    
    if (scanId) {
      saveFeedback(field.field, field.value, false, editValue);
    }
    
    if (onConfirm) {
      onConfirm(field.field, false, editValue);
    }

    toast({
      title: "Correctie opgeslagen! ✨",
      description: "Dit helpt toekomstige scans te verbeteren",
    });
  }, [editValue, onConfirm, saveFeedback, scanId, toast]);

  const handleCancelEdit = useCallback(() => {
    setEditingField(null);
    setEditValue('');
  }, []);

  // All confirmed - show success
  if (uncertainFields.length === 0 || uncertainFields.every(f => confirmedFields[f.field])) {
    return (
      <div className={cn("p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <ThumbsUp className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                Scan bevestigd!
              </p>
              <p className="text-xs text-muted-foreground">
                Klaar om op te slaan
              </p>
            </div>
          </div>
          {contributionCount > 0 && (
            <Badge className="bg-primary/20 text-primary border-primary/30">
              <Trophy className="h-3 w-3 mr-1" />
              +{contributionCount} bijdrage{contributionCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Even checken
        </h4>
        <span className="text-xs text-muted-foreground">
          {uncertainFields.filter(f => !confirmedFields[f.field]).length} item(s)
        </span>
      </div>

      {/* Fields to confirm */}
      {uncertainFields.map(field => {
        if (confirmedFields[field.field]) return null;
        
        const isEditing = editingField === field.field;
        const confidencePercent = Math.round(field.confidence * 100);

        return (
          <Card key={field.field} className="overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{field.label}</span>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    field.confidence >= 0.7 ? "bg-yellow-500/10 text-yellow-600" : "bg-orange-500/10 text-orange-600"
                  )}
                >
                  {confidencePercent}% zeker
                </Badge>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="font-medium"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(field)}
                      className="flex-1"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Opslaan
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      Annuleer
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-medium text-lg mb-3">{field.value}</p>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-green-600 hover:bg-green-500/10 hover:border-green-500"
                      onClick={() => handleConfirm(field, true)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Klopt!
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEdit(field)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Aanpassen
                    </Button>
                  </div>

                  {/* Quick alternatives */}
                  {field.alternatives && field.alternatives.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Of bedoelde je:</p>
                      <div className="flex flex-wrap gap-1">
                        {field.alternatives.slice(0, 3).map((alt, idx) => (
                          <Button
                            key={idx}
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => {
                              setEditValue(alt);
                              handleSaveEdit({ ...field, value: alt });
                            }}
                          >
                            {alt}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Contribution counter */}
      {contributionCount > 0 && (
        <div className="text-center">
          <Badge variant="secondary" className="text-xs">
            <Trophy className="h-3 w-3 mr-1" />
            {contributionCount} bijdrage{contributionCount !== 1 ? 's' : ''} deze sessie
          </Badge>
        </div>
      )}
    </div>
  );
});

UserConfirmationFeedback.displayName = 'UserConfirmationFeedback';
