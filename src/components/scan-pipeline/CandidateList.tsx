import React from "react";
import { ExternalLink, Trophy, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScanCandidate } from "@/hooks/useCDScanPipeline";

interface CandidateListProps {
  candidates: ScanCandidate[];
  matchStatus: string;
  selectedReleaseId: number | null;
  onSelectCandidate?: (releaseId: number) => void;
}

export const CandidateList = React.memo(({ candidates, matchStatus, selectedReleaseId, onSelectCandidate }: CandidateListProps) => {
  if (candidates.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        {matchStatus === "single_match" ? (
          <>
            <Trophy className="h-4 w-4 text-green-600" />
            Bevestigde match
          </>
        ) : (
          <>
            <Medal className="h-4 w-4 text-amber-600" />
            Mogelijke releases ({candidates.length})
          </>
        )}
      </h3>
      <div className="space-y-2">
        {candidates.map((c, i) => (
          <div
            key={c.release_id}
            className={`rounded-lg border p-3 text-sm transition-colors ${
              c.release_id === selectedReleaseId
                ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                : "hover:bg-muted/50"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">#{i + 1}</span>
                  <span className="font-medium truncate">{c.title}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {c.year && (
                    <span className="text-xs text-muted-foreground">{c.year}</span>
                  )}
                  {c.country && (
                    <span className="text-xs text-muted-foreground">· {c.country}</span>
                  )}
                  <span className="text-xs font-mono text-muted-foreground">
                    · Score: {(c.score * 100).toFixed(0)}%
                  </span>
                </div>
                {c.reason.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {c.reason.map((r, ri) => (
                      <span key={ri} className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => window.open(`https://www.discogs.com/release/${c.release_id}`, "_blank")}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
                {matchStatus !== "single_match" && onSelectCandidate && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => onSelectCandidate(c.release_id)}
                  >
                    Selecteer
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

CandidateList.displayName = "CandidateList";
