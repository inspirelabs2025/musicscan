import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Check, X, AlertTriangle, Sparkles, ChevronRight, Eye, EyeOff, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MatrixCharacter {
  char: string;
  confidence: number;
  position: number;
  alternatives?: string[];
}

export interface MatrixVerificationData {
  matrixNumber: string | null;
  matrixCharacters: MatrixCharacter[];
  overallConfidence: number;
  needsVerification: boolean;
  mediaType: 'vinyl' | 'cd';
  photoUrl?: string;
}

interface MatrixVerificationStepProps {
  data: MatrixVerificationData;
  onVerified: (verifiedMatrix: string, corrections: Array<{ position: number; original: string; corrected: string }>) => void;
  onSkip: () => void;
  isLoading?: boolean;
}

// Common OCR confusables for quick corrections
const COMMON_CONFUSABLES: Record<string, string[]> = {
  '0': ['O', 'Q', 'D'],
  'O': ['0', 'Q', 'D'],
  '1': ['I', 'l', '7', '!'],
  'I': ['1', 'l', '!'],
  'l': ['1', 'I', '!'],
  '5': ['S', '6'],
  'S': ['5', '8'],
  '8': ['B', '3', '&'],
  'B': ['8', '3', '6'],
  '6': ['G', 'b', '&'],
  'G': ['6', 'C'],
  '2': ['Z', '?'],
  'Z': ['2', '7'],
  '9': ['g', 'q'],
  'q': ['9', 'g'],
  '?': ['7', '2'],
};

export const MatrixVerificationStep: React.FC<MatrixVerificationStepProps> = ({
  data,
  onVerified,
  onSkip,
  isLoading = false,
}) => {
  const [characters, setCharacters] = useState<MatrixCharacter[]>(data.matrixCharacters);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [showPhoto, setShowPhoto] = useState(false);
  const [corrections, setCorrections] = useState<Array<{ position: number; original: string; corrected: string }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize characters from data
  useEffect(() => {
    if (data.matrixCharacters.length > 0) {
      setCharacters(data.matrixCharacters);
    } else if (data.matrixNumber) {
      // Create character array from string if no character-level data
      setCharacters(
        data.matrixNumber.split('').map((char, index) => ({
          char,
          confidence: 0.85, // Default confidence
          position: index,
          alternatives: COMMON_CONFUSABLES[char] || [],
        }))
      );
    }
  }, [data]);

  // Focus input when character is selected
  useEffect(() => {
    if (selectedIndex !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedIndex]);

  const getConfidenceColor = useCallback((confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-400';
    if (confidence >= 0.7) return 'bg-yellow-500/20 border-yellow-500 text-yellow-700 dark:text-yellow-400';
    return 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-400 animate-pulse';
  }, []);

  const handleCharacterClick = useCallback((index: number) => {
    setSelectedIndex(index);
    setCustomInput('');
  }, []);

  const handleCorrection = useCallback((index: number, newChar: string) => {
    const oldChar = characters[index].char;
    
    if (oldChar !== newChar) {
      setCorrections(prev => [
        ...prev.filter(c => c.position !== index),
        { position: index, original: oldChar, corrected: newChar }
      ]);
    }

    setCharacters(prev => prev.map((c, i) => 
      i === index 
        ? { ...c, char: newChar, confidence: 1.0 } // User-verified = 100% confidence
        : c
    ));
    setSelectedIndex(null);
    setCustomInput('');
  }, [characters]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (selectedIndex === null) return;

    if (e.key === 'Escape') {
      setSelectedIndex(null);
      setCustomInput('');
    } else if (e.key === 'Enter' && customInput) {
      handleCorrection(selectedIndex, customInput.charAt(0).toUpperCase());
    } else if (e.key === 'ArrowLeft' && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
      setCustomInput('');
    } else if (e.key === 'ArrowRight' && selectedIndex < characters.length - 1) {
      setSelectedIndex(selectedIndex + 1);
      setCustomInput('');
    }
  }, [selectedIndex, customInput, characters.length, handleCorrection]);

  const handleConfirmAll = useCallback(() => {
    const verifiedMatrix = characters.map(c => c.char).join('');
    onVerified(verifiedMatrix, corrections);
  }, [characters, corrections, onVerified]);

  const uncertainCount = characters.filter(c => c.confidence < 0.9).length;
  const currentMatrix = characters.map(c => c.char).join('');
  const hasChanges = corrections.length > 0;

  // Get alternatives for selected character
  const getAlternatives = useCallback((char: string): string[] => {
    const builtIn = COMMON_CONFUSABLES[char] || [];
    const fromData = characters.find(c => c.char === char)?.alternatives || [];
    return [...new Set([...builtIn, ...fromData])];
  }, [characters]);

  return (
    <Card className="border-primary/50 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Bevestig Matrix Nummer
          </div>
          {uncertainCount > 0 ? (
            <Badge variant="destructive" className="animate-pulse">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {uncertainCount} onzeker{uncertainCount !== 1 ? 'e' : ''} karakter{uncertainCount !== 1 ? 's' : ''}
            </Badge>
          ) : (
            <Badge variant="default" className="bg-green-500">
              <Check className="h-3 w-3 mr-1" />
              Hoge zekerheid
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Info text */}
        <p className="text-sm text-muted-foreground">
          {data.mediaType === 'cd' 
            ? 'Matrix nummer uit de binnenste ring van de CD. Klik op onzekere karakters om te corrigeren.'
            : 'Matrix nummer uit de dead wax / runout groove. Klik op onzekere karakters om te corrigeren.'
          }
        </p>

        {/* Photo toggle */}
        {data.photoUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPhoto(!showPhoto)}
            className="w-full"
          >
            {showPhoto ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showPhoto ? 'Verberg foto' : 'Bekijk originele foto'}
          </Button>
        )}

        {/* Photo preview */}
        {showPhoto && data.photoUrl && (
          <div className="rounded-lg overflow-hidden border">
            <img 
              src={data.photoUrl} 
              alt="Matrix foto" 
              className="w-full max-h-48 object-contain bg-black"
            />
          </div>
        )}

        {/* Character display */}
        <div 
          className="flex flex-wrap gap-1 p-4 bg-muted/50 rounded-lg justify-center"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {characters.map((char, index) => {
            const isSelected = selectedIndex === index;
            const isUncertain = char.confidence < 0.9;
            
            return (
              <div key={index} className="relative">
                <button
                  onClick={() => handleCharacterClick(index)}
                  disabled={isLoading}
                  className={cn(
                    "inline-flex items-center justify-center w-10 h-12 rounded-lg border-2 font-mono text-xl transition-all",
                    getConfidenceColor(char.confidence),
                    isSelected && "ring-2 ring-primary ring-offset-2 scale-110",
                    isUncertain && "cursor-pointer hover:scale-105",
                    !isUncertain && "opacity-80",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                  title={`${(char.confidence * 100).toFixed(0)}% zeker`}
                >
                  {char.char === ' ' ? '␣' : char.char}
                </button>

                {/* Correction popup */}
                {isSelected && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-20 bg-popover border rounded-lg shadow-xl p-3 min-w-[160px]">
                    <p className="text-xs text-muted-foreground mb-2 text-center">
                      Is dit "{char.char}"?
                    </p>
                    
                    {/* Quick actions */}
                    <div className="flex gap-1 justify-center mb-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-3 text-green-600 hover:bg-green-500/10"
                        onClick={() => {
                          handleCorrection(index, char.char);
                        }}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Ja
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-3 text-muted-foreground"
                        onClick={() => setSelectedIndex(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Alternatives */}
                    {getAlternatives(char.char).length > 0 && (
                      <div className="border-t pt-2 mt-2">
                        <p className="text-xs text-muted-foreground mb-1 text-center">
                          Alternatief?
                        </p>
                        <div className="flex gap-1 justify-center flex-wrap">
                          {getAlternatives(char.char).map((alt, altIdx) => (
                            <Button
                              key={altIdx}
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 font-mono"
                              onClick={() => handleCorrection(index, alt)}
                            >
                              {alt}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Custom input */}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex gap-1">
                        <Input
                          ref={inputRef}
                          value={customInput}
                          onChange={(e) => setCustomInput(e.target.value.slice(0, 1))}
                          placeholder="..."
                          className="h-8 w-full text-center font-mono"
                          maxLength={1}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && customInput) {
                              handleCorrection(index, customInput.toUpperCase());
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          className="h-8 px-2"
                          disabled={!customInput}
                          onClick={() => handleCorrection(index, customInput.toUpperCase())}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Keyboard hint */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Keyboard className="h-3 w-3" />
          <span>Pijltjes om te navigeren, Enter om te bevestigen, Esc om te annuleren</span>
        </div>

        {/* Summary */}
        {hasChanges && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {corrections.length} correctie{corrections.length !== 1 ? 's' : ''} gemaakt
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {data.matrixNumber} → {currentMatrix}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onSkip}
            disabled={isLoading}
            className="flex-1"
          >
            Overslaan
          </Button>
          <Button
            onClick={handleConfirmAll}
            disabled={isLoading}
            className="flex-1"
          >
            {uncertainCount === 0 ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Bevestigen
              </>
            ) : (
              <>
                <ChevronRight className="h-4 w-4 mr-2" />
                Doorgaan met {uncertainCount} onzeker
              </>
            )}
          </Button>
        </div>

        {/* Gamification hint */}
        <p className="text-xs text-center text-muted-foreground">
          <Sparkles className="h-3 w-3 inline mr-1" />
          Jouw verificaties verbeteren de herkenning voor iedereen!
        </p>
      </CardContent>
    </Card>
  );
};

export default MatrixVerificationStep;
