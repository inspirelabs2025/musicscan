import { UnifiedScanResult } from "@/hooks/useInfiniteUnifiedScans";
import { Tables } from "@/integrations/supabase/types";

// Type for original AIScanResult 
export type AIScanResult = Tables<"ai_scan_results">;

// Adapter to convert UnifiedScanResult to AIScanResult for modal compatibility
export function convertToAIScanResult(unifiedScan: UnifiedScanResult): AIScanResult | null {
  // Only convert AI scan results - other types don't have all required fields
  if (unifiedScan.source_table !== 'ai_scan_results') {
    return null;
  }

  // Create a compatible AIScanResult
  return {
    id: unifiedScan.id,
    created_at: unifiedScan.created_at,
    updated_at: unifiedScan.updated_at,
    user_id: unifiedScan.user_id,
    photo_urls: unifiedScan.photo_urls,
    media_type: unifiedScan.media_type,
    condition_grade: unifiedScan.condition_grade,
    artist: unifiedScan.artist,
    title: unifiedScan.title,
    label: unifiedScan.label,
    catalog_number: unifiedScan.catalog_number,
    discogs_id: unifiedScan.discogs_id,
    discogs_url: unifiedScan.discogs_url,
    confidence_score: unifiedScan.confidence_score,
    status: unifiedScan.status,
    error_message: unifiedScan.error_message,
    ai_description: unifiedScan.ai_description,
    search_queries: unifiedScan.search_queries,
    genre: unifiedScan.genre,
    country: unifiedScan.country,
    format: unifiedScan.format,
    style: unifiedScan.style,
    barcode: unifiedScan.barcode,
    matrix_number: unifiedScan.matrix_number,
    comments: unifiedScan.comments,
    is_flagged_incorrect: unifiedScan.is_flagged_incorrect || false,
    // Required fields that may not exist in UnifiedScanResult but are required for AIScanResult
    analysis_data: null,
    edit_history: [],
    manual_edits: {},
    master_id: null,
    updated_by: null,
    year: unifiedScan.year || null
  } as AIScanResult;
}