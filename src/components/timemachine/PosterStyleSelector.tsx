import { Check } from "lucide-react";

interface StyleVariant {
  style: string;
  url: string;
  label: string;
  emoji: string;
}

interface PosterStyleSelectorProps {
  styleVariants: StyleVariant[];
  onStyleSelect: (styleUrl: string, styleName: string) => void;
  currentStyle?: string;
}

export const PosterStyleSelector = ({ 
  styleVariants, 
  onStyleSelect,
  currentStyle 
}: PosterStyleSelectorProps) => {
  if (!styleVariants || styleVariants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Kies je favoriete stijl 🎨</h3>
      <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
        {styleVariants.map((variant) => (
          <button
            key={variant.style}
            onClick={() => onStyleSelect(variant.url, variant.style)}
            className={`
              group relative aspect-square rounded-lg overflow-hidden 
              border-2 transition-all hover:scale-105 hover:shadow-lg
              ${currentStyle === variant.style 
                ? 'border-primary shadow-lg ring-2 ring-primary/20' 
                : 'border-border hover:border-primary/50'}
            `}
          >
            {/* Thumbnail */}
            <img 
              src={variant.url} 
              alt={variant.label}
              className="w-full h-full object-cover"
            />
            
            {/* Overlay with label */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end text-white text-center p-2 pb-3">
              <span className="text-2xl mb-1">{variant.emoji}</span>
              <span className="text-xs font-medium leading-tight">{variant.label}</span>
            </div>
            
            {/* Selected indicator */}
            {currentStyle === variant.style && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1 shadow-lg">
                <Check className="h-3 w-3" />
              </div>
            )}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        ✨ Alle stijlen zijn dezelfde prijs - kies gewoon je favoriet!
      </p>
    </div>
  );
};
