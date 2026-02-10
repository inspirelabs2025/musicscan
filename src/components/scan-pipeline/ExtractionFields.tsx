import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import type { ScanExtraction } from "@/hooks/useCDScanPipeline";

interface ExtractionFieldsProps {
  extractions: ScanExtraction[];
}

const confidenceColor = (c: number) => {
  if (c >= 0.8) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
  if (c >= 0.5) return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
};

const confidenceIcon = (c: number) => {
  if (c >= 0.8) return <CheckCircle className="h-3.5 w-3.5" />;
  if (c >= 0.5) return <AlertTriangle className="h-3.5 w-3.5" />;
  if (c > 0) return <XCircle className="h-3.5 w-3.5" />;
  return <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />;
};

const fieldLabels: Record<string, string> = {
  barcode: "Barcode",
  catno: "Catalogusnummer",
  matrix: "Matrix code",
  ifpi_master: "IFPI Master",
  ifpi_mould: "IFPI Mould",
  label_code: "Label Code",
  label: "Label",
  country: "Land",
  year_hint: "Jaar",
  genre: "Genre",
};

export const ExtractionFields = React.memo(({ extractions }: ExtractionFieldsProps) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">Geëxtraheerde velden</h3>
      <div className="grid gap-2">
        {extractions.map((ext) => (
          <div
            key={ext.field}
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              {confidenceIcon(ext.confidence)}
              <span className="font-medium text-muted-foreground w-28 shrink-0">
                {fieldLabels[ext.field] || ext.field}
              </span>
              <span className="truncate font-mono text-foreground">
                {ext.normalized || ext.raw || (
                  <span className="text-muted-foreground italic">Niet gedetecteerd</span>
                )}
              </span>
            </div>
            {ext.confidence > 0 && (
              <Badge variant="outline" className={`ml-2 shrink-0 text-xs ${confidenceColor(ext.confidence)}`}>
                {(ext.confidence * 100).toFixed(0)}%
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

ExtractionFields.displayName = "ExtractionFields";
