import React, { useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuditEntry } from "@/hooks/useCDScanPipeline";

interface AuditLogProps {
  entries: AuditEntry[];
}

const stepColors: Record<string, string> = {
  extraction_start: "text-blue-600",
  barcode_normalized: "text-green-600",
  catno_rejected: "text-red-600",
  matrix_rejected: "text-red-600",
  search_barcode: "text-blue-600",
  search_catno: "text-blue-600",
  search_artist_title: "text-amber-600",
  scoring_complete: "text-purple-600",
  confidence_cap: "text-amber-600",
  single_match: "text-green-700",
  multiple_candidates: "text-amber-700",
  no_candidates: "text-red-600",
};

export const AuditLog = React.memo(({ entries }: AuditLogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (entries.length === 0) return null;

  return (
    <div className="rounded-lg border">
      <Button
        variant="ghost"
        className="w-full justify-between px-3 py-2 h-auto"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <FileText className="h-4 w-4" />
          Audit log — Waarom denken wij dit ({entries.length} stappen)
        </span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
      {isOpen && (
        <div className="border-t p-3 space-y-1 max-h-80 overflow-y-auto">
          {entries.map((entry, i) => (
            <div key={i} className="flex gap-2 text-xs font-mono">
              <span className={`shrink-0 font-semibold ${stepColors[entry.step] || "text-muted-foreground"}`}>
                [{entry.step}]
              </span>
              <span className="text-foreground/80 break-all">{entry.detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

AuditLog.displayName = "AuditLog";
