import React from "react";
import { Camera, Lightbulb } from "lucide-react";
import type { PhotoGuidance } from "@/hooks/useCDScanPipeline";

interface PhotoGuidancePanelProps {
  guidance: PhotoGuidance[];
  missingFields: string[];
}

const fieldEmoji: Record<string, string> = {
  matrix: "💿",
  ifpi: "🔍",
  barcode: "📊",
  catno: "🏷️",
};

export const PhotoGuidancePanel = React.memo(({ guidance, missingFields }: PhotoGuidancePanelProps) => {
  if (guidance.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2 text-amber-800 dark:text-amber-300">
        <Camera className="h-4 w-4" />
        Volgende beste foto's
      </h3>
      <p className="text-xs text-amber-700 dark:text-amber-400">
        De volgende velden zijn niet gedetecteerd. Betere foto's kunnen de match verbeteren:
      </p>
      <div className="space-y-2">
        {guidance.map((g) => (
          <div
            key={g.field}
            className="flex gap-2 rounded-md bg-white/60 dark:bg-white/5 p-2.5 text-sm"
          >
            <span className="text-lg shrink-0">{fieldEmoji[g.field] || "📷"}</span>
            <div>
              <div className="font-medium text-amber-900 dark:text-amber-200 capitalize">
                {g.field === "ifpi" ? "IFPI codes" : g.field}
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">{g.instruction}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-500">
        <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          Hoe meer technische identifiers (matrix, IFPI, barcode, catalogusnummer) zichtbaar zijn,
          hoe nauwkeuriger de match.
        </span>
      </div>
    </div>
  );
});

PhotoGuidancePanel.displayName = "PhotoGuidancePanel";
