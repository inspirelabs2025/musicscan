import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUnifiedScansStats = () => {
  return useQuery({
    queryKey: ["unified-scans-stats"],
    queryFn: async () => {
      // Get user_id once to avoid multiple auth calls
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Fetch data from all three tables for the current user
      const [aiScansResult, cdScansResult, vinylScansResult] = await Promise.all([
        supabase.from("ai_scan_results").select("*").eq("user_id", user.id),
        supabase.from("cd_scan").select("*").eq("user_id", user.id),
        supabase.from("vinyl2_scan").select("*").eq("user_id", user.id)
      ]);

      if (aiScansResult.error) throw aiScansResult.error;
      if (cdScansResult.error) throw cdScansResult.error;
      if (vinylScansResult.error) throw vinylScansResult.error;

      const aiScans = aiScansResult.data || [];
      const cdScans = cdScansResult.data || [];
      const vinylScans = vinylScansResult.data || [];

      // Calculate combined statistics
      const totalScans = aiScans.length + cdScans.length + vinylScans.length;
      
      // AI scans have status fields
      const aiCompletedScans = aiScans.filter(scan => scan.status === "completed").length;
      const aiFailedScans = aiScans.filter(scan => scan.status === "failed").length;
      const aiPendingScans = aiScans.filter(scan => scan.status === "pending").length;
      
      // CD and Vinyl scans are considered completed (they exist = completed)
      const completedScans = aiCompletedScans + cdScans.length + vinylScans.length;
      const failedScans = aiFailedScans;
      const pendingScans = aiPendingScans;

      // Calculate confidence (only AI scans have confidence scores)
      const completedWithConfidence = aiScans.filter(scan => 
        scan.status === "completed" && scan.confidence_score !== null
      );
      const avgConfidence = completedWithConfidence.length > 0 
        ? completedWithConfidence.reduce((sum, scan) => sum + (scan.confidence_score || 0), 0) / completedWithConfidence.length
        : 0;

      // Media type breakdown
      const aiVinylCount = aiScans.filter(scan => scan.media_type === "vinyl").length;
      const aiCdCount = aiScans.filter(scan => scan.media_type === "cd").length;
      
      const mediaTypeBreakdown = {
        vinyl: aiVinylCount + vinylScans.length,
        cd: aiCdCount + cdScans.length
      };

      // Top artists from all tables
      const allArtists = [
        ...aiScans.filter(scan => scan.artist).map(scan => scan.artist!),
        ...cdScans.filter(scan => scan.artist).map(scan => scan.artist!),
        ...vinylScans.filter(scan => scan.artist).map(scan => scan.artist!)
      ];

      const topArtists = allArtists.reduce((acc, artist) => {
        acc[artist] = (acc[artist] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topArtistsList = Object.entries(topArtists)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([artist, count]) => ({ artist, count }));

      return {
        totalScans,
        completedScans,
        failedScans,
        pendingScans,
        successRate: totalScans > 0 ? (completedScans / totalScans) * 100 : 0,
        avgConfidence,
        mediaTypeBreakdown,
        topArtists: topArtistsList,
        // Additional breakdown by source
        sourceBreakdown: {
          aiScans: aiScans.length,
          cdScans: cdScans.length,
          vinylScans: vinylScans.length
        }
      };
    }
  });
};