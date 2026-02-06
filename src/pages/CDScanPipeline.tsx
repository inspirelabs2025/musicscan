import React, { useState, useCallback } from "react";
import { Disc3, ArrowLeft, Loader2, RotateCcw, CheckCircle, AlertTriangle, XCircle, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScannerUploadZone } from "@/components/scanner/ScannerUploadZone";
import { ExtractionFields } from "@/components/scan-pipeline/ExtractionFields";
import { CandidateList } from "@/components/scan-pipeline/CandidateList";
import { PhotoGuidancePanel } from "@/components/scan-pipeline/PhotoGuidancePanel";
import { AuditLog } from "@/components/scan-pipeline/AuditLog";
import { useCDScanPipeline } from "@/hooks/useCDScanPipeline";
import { useNavigate } from "react-router-dom";

const statusConfig = {
  single_match: { icon: CheckCircle, label: "Exact match", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" },
  multiple_candidates: { icon: AlertTriangle, label: "Meerdere mogelijkheden", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" },
  no_match: { icon: XCircle, label: "Geen match", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" },
  needs_more_photos: { icon: Camera, label: "Meer foto's nodig", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" },
};

const CDScanPipelinePage = () => {
  const navigate = useNavigate();
  const { isAnalyzing, result, error, analyze, reset } = useCDScanPipeline();
  const [files, setFiles] = useState<File[]>([]);

  const handleFileAdd = useCallback((file: File) => {
    setFiles((prev) => [...prev, file]);
  }, []);

  const handleFileRemove = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleAnalyze = useCallback(async () => {
    await analyze(files);
  }, [files, analyze]);

  const handleReset = useCallback(() => {
    setFiles([]);
    reset();
  }, [reset]);

  const requiredCount = 4; // front, back, disc hub, booklet
  const canAnalyze = files.length >= 2 && !isAnalyzing;

  const status = result ? statusConfig[result.discogs_match_status] : null;
  const StatusIcon = status?.icon || CheckCircle;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Disc3 className="h-6 w-6" />
              CD Scanner — Collector Grade
            </h1>
            <p className="text-sm text-muted-foreground">
              Nauwkeurige identificatie met auditeerbaar resultaat
            </p>
          </div>
        </div>

        {/* Upload zone */}
        {!result && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Upload CD foto's</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScannerUploadZone
                mediaType="cd"
                files={files}
                onFileAdd={handleFileAdd}
                onFileRemove={handleFileRemove}
                isAnalyzing={isAnalyzing}
                requiredCount={requiredCount}
              />

              <div className="flex gap-2">
                <Button
                  onClick={handleAnalyze}
                  disabled={!canAnalyze}
                  className="flex-1"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyseren...
                    </>
                  ) : (
                    <>
                      <Disc3 className="h-4 w-4 mr-2" />
                      Analyseer ({files.length} foto's)
                    </>
                  )}
                </Button>
                {files.length > 0 && !isAnalyzing && (
                  <Button variant="outline" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && !result && (
          <Card className="border-destructive">
            <CardContent className="pt-4">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Status banner */}
            <div className={`rounded-lg border p-4 ${status?.bg}`}>
              <div className="flex items-center gap-2">
                <StatusIcon className={`h-5 w-5 ${status?.color}`} />
                <div>
                  <span className={`font-semibold ${status?.color}`}>{status?.label}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    Confidence: {(result.overall_confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              {result.artist && (
                <p className="mt-1 text-lg font-bold text-foreground">
                  {result.artist} — {result.title}
                </p>
              )}
              {result.discogs_url && (
                <a
                  href={result.discogs_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline mt-1 block"
                >
                  Bekijk op Discogs →
                </a>
              )}
            </div>

            {/* Extractions */}
            <Card>
              <CardContent className="pt-4">
                <ExtractionFields extractions={result.extractions} />
              </CardContent>
            </Card>

            {/* Photo guidance (when needed) */}
            {result.photo_guidance.length > 0 && (
              <PhotoGuidancePanel
                guidance={result.photo_guidance}
                missingFields={result.missing_fields}
              />
            )}

            {/* Candidates */}
            {result.candidates.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <CandidateList
                    candidates={result.candidates}
                    matchStatus={result.discogs_match_status}
                    selectedReleaseId={result.discogs_release_id}
                  />
                </CardContent>
              </Card>
            )}

            {/* Audit log */}
            <AuditLog entries={result.audit} />

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                <RotateCcw className="h-4 w-4 mr-2" />
                Nieuwe scan
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CDScanPipelinePage;
