import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ScanExtraction {
  field: string;
  raw: string | null;
  normalized: string | null;
  confidence: number;
  source: string | null;
}

export interface ScanCandidate {
  release_id: number;
  score: number;
  reason: string[];
  title: string;
  year?: number;
  country?: string;
}

export interface PhotoGuidance {
  field: string;
  instruction: string;
}

export interface AuditEntry {
  step: string;
  detail: string;
  timestamp: string;
}

export interface PipelineResult {
  sessionId: string;
  artist: string | null;
  title: string | null;
  discogs_match_status: "single_match" | "multiple_candidates" | "no_match" | "needs_more_photos";
  discogs_release_id: number | null;
  discogs_url: string | null;
  overall_confidence: number;
  candidates: ScanCandidate[];
  extractions: ScanExtraction[];
  missing_fields: string[];
  photo_guidance: PhotoGuidance[];
  audit: AuditEntry[];
}

export const useCDScanPipeline = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const analyze = useCallback(async (files: File[]) => {
    if (files.length < 2) {
      toast({ title: "Te weinig foto's", description: "Minimaal 2 foto's nodig", variant: "destructive" });
      return null;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const imageUrls = await Promise.all(files.map(fileToBase64));

      const { data, error: fnError } = await supabase.functions.invoke("cd-scan-pipeline", {
        body: { imageUrls },
      });

      if (fnError) throw fnError;
      if (!data?.success) throw new Error(data?.error || "Pipeline failed");

      const pipelineResult: PipelineResult = {
        sessionId: data.sessionId,
        artist: data.result.artist,
        title: data.result.title,
        discogs_match_status: data.result.discogs_match_status,
        discogs_release_id: data.result.discogs_release_id,
        discogs_url: data.result.discogs_url,
        overall_confidence: data.result.overall_confidence,
        candidates: data.result.candidates || [],
        extractions: data.result.extractions || [],
        missing_fields: data.result.missing_fields || [],
        photo_guidance: data.result.photo_guidance || [],
        audit: data.result.audit || [],
      };

      setResult(pipelineResult);

      const statusLabels: Record<string, string> = {
        single_match: "✅ Exact match gevonden!",
        multiple_candidates: "🔍 Meerdere mogelijke releases",
        no_match: "❌ Geen match gevonden",
        needs_more_photos: "📸 Meer foto's nodig",
      };

      toast({
        title: statusLabels[pipelineResult.discogs_match_status] || "Analyse voltooid",
        description: `${pipelineResult.artist || "Onbekend"} - ${pipelineResult.title || "Onbekend"} (${(pipelineResult.overall_confidence * 100).toFixed(0)}% confidence)`,
      });

      return pipelineResult;
    } catch (err: any) {
      const msg = err.message || "Onbekende fout";
      setError(msg);
      toast({ title: "Analyse mislukt", description: msg, variant: "destructive" });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { isAnalyzing, result, error, analyze, reset };
};
