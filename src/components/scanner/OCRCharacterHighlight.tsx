import React, { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, HelpCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CharacterConfidence {
  char: string;
  confidence: number;
  position: number;
  alternatives?: string[];
}

interface OCRResult {
  text: string;
  characters?: CharacterConfidence[];
  overallConfidence?: number;
  type?: 'matrix' | 'catalog' | 'ifpi' | 'label';
}

interface OCRCharacterHighlightProps {
  ocrResults: OCRResult[];
  onCharacterConfirm?: (result: OCRResult, charIndex: number, confirmed: boolean, correctedChar?: string) => void;
  className?: string;
}

/**
 * Character-level OCR result display with confidence highlighting
 * Allows users to confirm/correct individual characters
 */
export const OCRCharacterHighlight = React.memo(({
  ocrResults,
  onCharacterConfirm,
  className
}: OCRCharacterHighlightProps) => {
  const [confirmedChars, setConfirmedChars] = useState<Record<string, boolean>>({});
  const [selectedChar, setSelectedChar] = useState<{ resultIdx: number; charIdx: number } | null>(null);

  const getConfidenceColor = useCallback((confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/40';
    if (confidence >= 0.7) return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/40';
    if (confidence >= 0.5) return 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/40';
    return 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/40 animate-pulse';
  }, []);

  const getConfidenceLabel = useCallback((confidence: number) => {
    if (confidence >= 0.9) return 'Zeker';
    if (confidence >= 0.7) return 'Waarschijnlijk';
    if (confidence >= 0.5) return 'Onzeker';
    return 'Hulp nodig';
  }, []);

  const getTypeIcon = useCallback((type?: string) => {
    switch (type) {
      case 'matrix': return '🔢';
      case 'catalog': return '📦';
      case 'ifpi': return '💿';
      case 'label': return '🏷️';
      default: return '📝';
    }
  }, []);

  const handleCharClick = useCallback((resultIdx: number, charIdx: number, char: CharacterConfidence) => {
    // Only allow interaction with uncertain characters
    if (char.confidence >= 0.9) return;
    setSelectedChar({ resultIdx, charIdx });
  }, []);

  const handleConfirm = useCallback((resultIdx: number, charIdx: number, isCorrect: boolean, correctedChar?: string) => {
    const key = `${resultIdx}-${charIdx}`;
    setConfirmedChars(prev => ({ ...prev, [key]: true }));
    setSelectedChar(null);
    
    if (onCharacterConfirm) {
      onCharacterConfirm(ocrResults[resultIdx], charIdx, isCorrect, correctedChar);
    }
  }, [ocrResults, onCharacterConfirm]);

  if (!ocrResults || ocrResults.length === 0) {
    return null;
  }

  // Filter to show only results with uncertain characters
  const resultsWithUncertainty = ocrResults.filter(result => 
    result.characters?.some(c => c.confidence < 0.9) || (result.overallConfidence && result.overallConfidence < 0.9)
  );

  if (resultsWithUncertainty.length === 0) {
    return (
      <div className={cn("p-3 rounded-lg bg-green-500/10 border border-green-500/30", className)}>
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <Check className="h-4 w-4" />
          <span className="text-sm font-medium">Alle tekst met hoge zekerheid herkend!</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Herkende Tekst
        </h4>
        <Badge variant="outline" className="text-xs">
          {resultsWithUncertainty.length} item{resultsWithUncertainty.length !== 1 ? 's' : ''} te bevestigen
        </Badge>
      </div>

      {/* Results */}
      {ocrResults.map((result, resultIdx) => {
        const hasUncertainty = result.characters?.some(c => c.confidence < 0.9);
        
        return (
          <div 
            key={resultIdx}
            className={cn(
              "p-3 rounded-lg border",
              hasUncertainty ? "bg-muted/50" : "bg-green-500/5 border-green-500/20"
            )}
          >
            {/* Type label */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">{getTypeIcon(result.type)}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {result.type || 'Code'}
              </span>
              {result.overallConfidence && (
                <Badge 
                  variant="outline" 
                  className={cn("text-xs ml-auto", getConfidenceColor(result.overallConfidence))}
                >
                  {getConfidenceLabel(result.overallConfidence)}
                </Badge>
              )}
            </div>

            {/* Character display */}
            <div className="flex flex-wrap gap-1 font-mono text-lg">
              {result.characters ? (
                result.characters.map((char, charIdx) => {
                  const key = `${resultIdx}-${charIdx}`;
                  const isConfirmed = confirmedChars[key];
                  const isSelected = selectedChar?.resultIdx === resultIdx && selectedChar?.charIdx === charIdx;
                  const isInteractive = char.confidence < 0.9 && !isConfirmed;

                  return (
                    <div key={charIdx} className="relative">
                      <span
                        onClick={() => isInteractive && handleCharClick(resultIdx, charIdx, char)}
                        className={cn(
                          "inline-flex items-center justify-center w-8 h-10 rounded border-2 transition-all",
                          getConfidenceColor(char.confidence),
                          isConfirmed && "opacity-50",
                          isInteractive && "cursor-pointer hover:scale-110 hover:shadow-md",
                          isSelected && "ring-2 ring-primary ring-offset-2"
                        )}
                        title={`${(char.confidence * 100).toFixed(0)}% zeker`}
                      >
                        {char.char}
                        {isConfirmed && (
                          <Check className="absolute -top-1 -right-1 h-3 w-3 text-green-500" />
                        )}
                      </span>

                      {/* Confirmation popup */}
                      {isSelected && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-10 bg-popover border rounded-lg shadow-lg p-2 min-w-[120px]">
                          <p className="text-xs text-muted-foreground mb-2 text-center">
                            Is dit "{char.char}"?
                          </p>
                          <div className="flex gap-1 justify-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-green-600 hover:bg-green-500/10"
                              onClick={() => handleConfirm(resultIdx, charIdx, true)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Ja
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-red-600 hover:bg-red-500/10"
                              onClick={() => handleConfirm(resultIdx, charIdx, false)}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Nee
                            </Button>
                          </div>
                          {/* Alternatives */}
                          {char.alternatives && char.alternatives.length > 0 && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="text-xs text-muted-foreground mb-1 text-center">
                                Alternatief?
                              </p>
                              <div className="flex gap-1 justify-center flex-wrap">
                                {char.alternatives.map((alt, altIdx) => (
                                  <Button
                                    key={altIdx}
                                    size="sm"
                                    variant="outline"
                                    className="h-6 w-6 p-0 font-mono"
                                    onClick={() => handleConfirm(resultIdx, charIdx, false, alt)}
                                  >
                                    {alt}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                // Fallback for results without character-level confidence
                <span className="text-base">{result.text}</span>
              )}
            </div>

            {/* Help text for uncertain chars */}
            {hasUncertainty && !Object.keys(confirmedChars).some(k => k.startsWith(`${resultIdx}-`)) && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <HelpCircle className="h-3 w-3" />
                Klik op onzekere tekens om te bevestigen
              </p>
            )}
          </div>
        );
      })}

      {/* Gamification hint */}
      <div className="text-center text-xs text-muted-foreground py-2">
        <Sparkles className="h-3 w-3 inline mr-1" />
        Jouw bevestigingen helpen de herkenning te verbeteren!
      </div>
    </div>
  );
});

OCRCharacterHighlight.displayName = 'OCRCharacterHighlight';
