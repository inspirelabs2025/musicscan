import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCcw, Settings2, Sparkles } from 'lucide-react';
import { MatrixEnhancementParams, DEFAULT_PARAMS } from '@/utils/matrixEnhancementPipeline';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface MatrixParameterControlsProps {
  params: MatrixEnhancementParams;
  onChange: (params: MatrixEnhancementParams) => void;
  onReset: () => void;
  isProcessing?: boolean;
  className?: string;
}

export function MatrixParameterControls({
  params,
  onChange,
  onReset,
  isProcessing = false,
  className
}: MatrixParameterControlsProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const updateParam = <K extends keyof MatrixEnhancementParams>(
    key: K,
    value: MatrixEnhancementParams[K]
  ) => {
    onChange({ ...params, [key]: value });
  };

  // Ensure blockSize is always odd
  const handleBlockSizeChange = (value: number) => {
    const oddValue = value % 2 === 0 ? value + 1 : value;
    updateParam('adaptiveBlockSize', oddValue);
  };

  return (
    <Card className={cn('w-full', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto hover:bg-transparent">
                <Settings2 className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Geavanceerde Instellingen</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {isOpen ? '(klik om te sluiten)' : '(klik om te openen)'}
                </span>
              </Button>
            </CollapsibleTrigger>
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              disabled={isProcessing}
              className="gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Quick presets */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChange(DEFAULT_PARAMS)}
                disabled={isProcessing}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Standaard
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChange({
                  ...params,
                  claheClipLimit: 3.0,
                  highlightStrength: 70,
                  unsharpAmount: 1.5
                })}
                disabled={isProcessing}
              >
                Hoge Reflectie
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChange({
                  ...params,
                  claheClipLimit: 1.5,
                  unsharpAmount: 0.5,
                  adaptiveC: 8
                })}
                disabled={isProcessing}
              >
                Zachte Gravure
              </Button>
            </div>

            {/* CLAHE Controls */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Contrast (CLAHE)</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Clip Limit</Label>
                  <span className="text-sm text-muted-foreground font-mono">
                    {params.claheClipLimit.toFixed(1)}
                  </span>
                </div>
                <Slider
                  value={[params.claheClipLimit]}
                  onValueChange={([v]) => updateParam('claheClipLimit', v)}
                  min={1}
                  max={5}
                  step={0.1}
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground">
                  Hogere waarde = meer lokaal contrast
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Tile Grootte</Label>
                  <span className="text-sm text-muted-foreground font-mono">
                    {params.claheTileSize}×{params.claheTileSize}
                  </span>
                </div>
                <Select
                  value={String(params.claheTileSize)}
                  onValueChange={(v) => updateParam('claheTileSize', Number(v))}
                  disabled={isProcessing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8">8×8 (fijn)</SelectItem>
                    <SelectItem value="16">16×16 (standaard)</SelectItem>
                    <SelectItem value="24">24×24 (grof)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Highlight Suppression */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Reflectie Onderdrukking</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Sterkte</Label>
                  <span className="text-sm text-muted-foreground font-mono">
                    {params.highlightStrength}%
                  </span>
                </div>
                <Slider
                  value={[params.highlightStrength]}
                  onValueChange={([v]) => updateParam('highlightStrength', v)}
                  min={0}
                  max={100}
                  step={5}
                  disabled={isProcessing}
                />
              </div>
            </div>

            {/* Unsharp Mask */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Verscherping</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Radius</Label>
                  <span className="text-sm text-muted-foreground font-mono">
                    {params.unsharpRadius.toFixed(1)}
                  </span>
                </div>
                <Slider
                  value={[params.unsharpRadius]}
                  onValueChange={([v]) => updateParam('unsharpRadius', v)}
                  min={0.3}
                  max={1.2}
                  step={0.1}
                  disabled={isProcessing}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Hoeveelheid</Label>
                  <span className="text-sm text-muted-foreground font-mono">
                    {params.unsharpAmount.toFixed(1)}
                  </span>
                </div>
                <Slider
                  value={[params.unsharpAmount]}
                  onValueChange={([v]) => updateParam('unsharpAmount', v)}
                  min={0}
                  max={2}
                  step={0.1}
                  disabled={isProcessing}
                />
              </div>
            </div>

            {/* Adaptive Threshold */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">OCR Drempel</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Blokgrootte</Label>
                  <span className="text-sm text-muted-foreground font-mono">
                    {params.adaptiveBlockSize}
                  </span>
                </div>
                <Slider
                  value={[params.adaptiveBlockSize]}
                  onValueChange={([v]) => handleBlockSizeChange(Math.round(v))}
                  min={11}
                  max={51}
                  step={2}
                  disabled={isProcessing}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Constante (C)</Label>
                  <span className="text-sm text-muted-foreground font-mono">
                    {params.adaptiveC}
                  </span>
                </div>
                <Slider
                  value={[params.adaptiveC]}
                  onValueChange={([v]) => updateParam('adaptiveC', v)}
                  min={-10}
                  max={10}
                  step={1}
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground">
                  Hogere waarde = meer tekst als zwart
                </p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
