import { useMemo } from "react";
import { AIScanResult } from "./useInfiniteAIScans";

export interface DuplicateInfo {
  isDuplicate: boolean;
  duplicateCount: number;
  duplicateIds: string[];
}

/**
 * Hook to detect duplicate AI scan results based on artist, title, media_type, and catalog_number
 */
export const useDuplicateDetection = (allScans: AIScanResult[]) => {
  const duplicateMap = useMemo(() => {
    const map = new Map<string, DuplicateInfo>();
    const groupedByKey = new Map<string, AIScanResult[]>();

    // Group scans by unique key
    allScans.forEach(scan => {
      // Create a key based on artist, title, media_type, and catalog_number
      const key = `${scan.artist || ''}_${scan.title || ''}_${scan.media_type || ''}_${scan.catalog_number || ''}`.toLowerCase();
      
      if (!groupedByKey.has(key)) {
        groupedByKey.set(key, []);
      }
      groupedByKey.get(key)!.push(scan);
    });

    // Identify duplicates
    groupedByKey.forEach((scans, key) => {
      const isDuplicate = scans.length > 1;
      const duplicateIds = scans.map(scan => scan.id);
      
      scans.forEach(scan => {
        map.set(scan.id, {
          isDuplicate,
          duplicateCount: scans.length,
          duplicateIds
        });
      });
    });

    return map;
  }, [allScans]);

  const getDuplicateInfo = (scanId: string): DuplicateInfo => {
    return duplicateMap.get(scanId) || {
      isDuplicate: false,
      duplicateCount: 1,
      duplicateIds: [scanId]
    };
  };

  const duplicateStats = useMemo(() => {
    const totalDuplicates = Array.from(duplicateMap.values()).filter(info => info.isDuplicate).length;
    const uniqueDuplicateGroups = new Set(
      Array.from(duplicateMap.values())
        .filter(info => info.isDuplicate)
        .map(info => info.duplicateIds.sort().join(','))
    ).size;

    return {
      totalDuplicates,
      uniqueDuplicateGroups
    };
  }, [duplicateMap]);

  return {
    getDuplicateInfo,
    duplicateStats
  };
};