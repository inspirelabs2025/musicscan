import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CollectionStats {
  totalItems: number;
  totalCDs: number;
  totalVinyls: number;
  totalValue: number;
  averageValue: number;
  mostValuableItem: any;
  itemsWithPricing: number;
  itemsWithoutPricing: number;
  genres: { genre: string; count: number; value: number }[];
  artists: { artist: string; count: number; value: number }[];
  years: { year: number; count: number }[];
  conditions: { condition: string; count: number }[];
  priceRanges: { range: string; count: number }[];
  // Enhanced data for tabs
  typeBreakdown: {
    cd: {
      totalItems: number;
      totalValue: number;
      averageValue: number;
      topGenres: { genre: string; count: number; value: number }[];
      topArtists: { artist: string; count: number; value: number }[];
      priceRanges: { range: string; count: number }[];
      yearRange: { oldest: number; newest: number };
    };
    vinyl: {
      totalItems: number;
      totalValue: number;
      averageValue: number;
      topGenres: { genre: string; count: number; value: number }[];
      topArtists: { artist: string; count: number; value: number }[];
      priceRanges: { range: string; count: number }[];
      yearRange: { oldest: number; newest: number };
    };
  };
  genreDetails: {
    [genre: string]: {
      count: number;
      value: number;
      averageValue: number;
      topArtists: { artist: string; count: number; value: number }[];
      cdCount: number;
      vinylCount: number;
      priceRanges: { range: string; count: number }[];
      yearSpread: { min: number; max: number };
    };
  };
  decadeBreakdown: {
    [decade: string]: {
      count: number;
      value: number;
      topGenres: { genre: string; count: number }[];
      cdCount: number;
      vinylCount: number;
    };
  };
  valueSegments: {
    budget: { count: number; items: any[]; averageValue: number };
    midRange: { count: number; items: any[]; averageValue: number };
    premium: { count: number; items: any[]; averageValue: number };
    collectors: { count: number; items: any[]; averageValue: number };
  };
  allItems: any[];
}

export const useUnifiedCollectionStats = () => {
  return useQuery({
    queryKey: ["unified-collection-stats"],
    queryFn: async (): Promise<CollectionStats> => {
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Fetch data from all three tables
      const [aiScanResult, cdResult, vinylResult] = await Promise.all([
        supabase.from("ai_scan_results").select("*").eq("user_id", user.id),
        supabase.from("cd_scan").select("*").eq("user_id", user.id),
        supabase.from("vinyl2_scan").select("*").eq("user_id", user.id)
      ]);

      if (aiScanResult.error) throw aiScanResult.error;
      if (cdResult.error) throw cdResult.error;
      if (vinylResult.error) throw vinylResult.error;

      // Normalize AI scan data to match cd/vinyl scan format
      const normalizedAIScans = (aiScanResult.data || [])
        .filter(scan => scan.status === "completed") // Only include completed scans
        .map(scan => ({
          ...scan,
          format: scan.media_type === "cd" ? "CD" : "Vinyl",
          // AI scans don't have calculated_advice_price, but they might have other price fields
          calculated_advice_price: null,
          median_price: null,
          marketplace_price: null
        }));

      // Combine and process data
      const allItems = [
        ...normalizedAIScans,
        ...(cdResult.data || []).map(item => ({ ...item, format: 'CD' })),
        ...(vinylResult.data || []).map(item => ({ ...item, format: 'Vinyl' }))
      ];

      const totalItems = allItems.length;
      const totalCDs = allItems.filter(item => item.format === 'CD').length;
      const totalVinyls = allItems.filter(item => item.format === 'Vinyl').length;

      // Calculate pricing stats
      const itemsWithPricing = allItems.filter(item => 
        item.calculated_advice_price || item.median_price || item.marketplace_price
      );
      
      const totalValue = itemsWithPricing.reduce((sum, item) => {
        const price = item.calculated_advice_price || item.median_price || item.marketplace_price || 0;
        return sum + Number(price);
      }, 0);

      const averageValue = itemsWithPricing.length > 0 ? totalValue / itemsWithPricing.length : 0;
      
      const mostValuableItem = itemsWithPricing.length > 0 ? itemsWithPricing.reduce((max, item) => {
        const price = item.calculated_advice_price || item.median_price || item.marketplace_price || 0;
        const maxPrice = max.calculated_advice_price || max.median_price || max.marketplace_price || 0;
        return Number(price) > Number(maxPrice) ? item : max;
      }, itemsWithPricing[0]) : null;

      // Genre analysis
      const genreMap = new Map();
      allItems.forEach(item => {
        if (item.genre) {
          const price = item.calculated_advice_price || item.median_price || item.marketplace_price || 0;
          const existing = genreMap.get(item.genre) || { count: 0, value: 0 };
          genreMap.set(item.genre, {
            count: existing.count + 1,
            value: existing.value + Number(price)
          });
        }
      });

      const genres = Array.from(genreMap.entries()).map(([genre, data]) => ({
        genre,
        count: data.count,
        value: data.value
      })).sort((a, b) => b.count - a.count);

      // Artist analysis
      const artistMap = new Map();
      allItems.forEach(item => {
        if (item.artist) {
          const price = item.calculated_advice_price || item.median_price || item.marketplace_price || 0;
          const existing = artistMap.get(item.artist) || { count: 0, value: 0 };
          artistMap.set(item.artist, {
            count: existing.count + 1,
            value: existing.value + Number(price)
          });
        }
      });

      const artists = Array.from(artistMap.entries()).map(([artist, data]) => ({
        artist,
        count: data.count,
        value: data.value
      })).sort((a, b) => b.count - a.count);

      // Year analysis
      const yearMap = new Map();
      allItems.forEach(item => {
        if (item.year) {
          const existing = yearMap.get(item.year) || 0;
          yearMap.set(item.year, existing + 1);
        }
      });

      const years = Array.from(yearMap.entries()).map(([year, count]) => ({
        year,
        count
      })).sort((a, b) => a.year - b.year);

      // Condition analysis
      const conditionMap = new Map();
      allItems.forEach(item => {
        const condition = item.condition_grade || 'Unknown';
        const existing = conditionMap.get(condition) || 0;
        conditionMap.set(condition, existing + 1);
      });

      const conditions = Array.from(conditionMap.entries()).map(([condition, count]) => ({
        condition,
        count
      }));

      // Price range analysis
      const priceRanges = [
        { range: '€0-10', count: 0 },
        { range: '€10-25', count: 0 },
        { range: '€25-50', count: 0 },
        { range: '€50-100', count: 0 },
        { range: '€100+', count: 0 }
      ];

      itemsWithPricing.forEach(item => {
        const price = item.calculated_advice_price || item.median_price || item.marketplace_price || 0;
        const numPrice = Number(price);
        if (numPrice <= 10) priceRanges[0].count++;
        else if (numPrice <= 25) priceRanges[1].count++;
        else if (numPrice <= 50) priceRanges[2].count++;
        else if (numPrice <= 100) priceRanges[3].count++;
        else priceRanges[4].count++;
      });

      // Helper function to get price ranges for a subset of items
      const getPriceRanges = (items: any[]) => {
        const ranges = [
          { range: '€0-10', count: 0 },
          { range: '€10-25', count: 0 },
          { range: '€25-50', count: 0 },
          { range: '€50-100', count: 0 },
          { range: '€100+', count: 0 }
        ];
        items.forEach(item => {
          const price = item.calculated_advice_price || item.median_price || item.marketplace_price || 0;
          const numPrice = Number(price);
          if (numPrice <= 10) ranges[0].count++;
          else if (numPrice <= 25) ranges[1].count++;
          else if (numPrice <= 50) ranges[2].count++;
          else if (numPrice <= 100) ranges[3].count++;
          else ranges[4].count++;
        });
        return ranges;
      };

      // Type breakdown analysis
      const cdItems = allItems.filter(item => item.format === 'CD');
      const vinylItems = allItems.filter(item => item.format === 'Vinyl');
      
      const cdItemsWithPricing = cdItems.filter(item => 
        item.calculated_advice_price || item.median_price || item.marketplace_price
      );
      const vinylItemsWithPricing = vinylItems.filter(item => 
        item.calculated_advice_price || item.median_price || item.marketplace_price
      );

      const cdValue = cdItemsWithPricing.reduce((sum, item) => {
        const price = item.calculated_advice_price || item.median_price || item.marketplace_price || 0;
        return sum + Number(price);
      }, 0);

      const vinylValue = vinylItemsWithPricing.reduce((sum, item) => {
        const price = item.calculated_advice_price || item.median_price || item.marketplace_price || 0;
        return sum + Number(price);
      }, 0);

      // Get top genres/artists for each type
      const getTopGenres = (items: any[]) => {
        const genreMap = new Map();
        items.forEach(item => {
          if (item.genre) {
            const price = item.calculated_advice_price || item.median_price || item.marketplace_price || 0;
            const existing = genreMap.get(item.genre) || { count: 0, value: 0 };
            genreMap.set(item.genre, {
              count: existing.count + 1,
              value: existing.value + Number(price)
            });
          }
        });
        return Array.from(genreMap.entries()).map(([genre, data]) => ({
          genre,
          count: data.count,
          value: data.value
        })).sort((a, b) => b.count - a.count).slice(0, 5);
      };

      const getTopArtists = (items: any[]) => {
        const artistMap = new Map();
        items.forEach(item => {
          if (item.artist) {
            const price = item.calculated_advice_price || item.median_price || item.marketplace_price || 0;
            const existing = artistMap.get(item.artist) || { count: 0, value: 0 };
            artistMap.set(item.artist, {
              count: existing.count + 1,
              value: existing.value + Number(price)
            });
          }
        });
        return Array.from(artistMap.entries()).map(([artist, data]) => ({
          artist,
          count: data.count,
          value: data.value
        })).sort((a, b) => b.count - a.count).slice(0, 5);
      };

      const getYearRange = (items: any[]) => {
        const years = items.filter(item => item.year).map(item => item.year);
        return years.length > 0 ? { oldest: Math.min(...years), newest: Math.max(...years) } : { oldest: 0, newest: 0 };
      };

      const typeBreakdown = {
        cd: {
          totalItems: totalCDs,
          totalValue: cdValue,
          averageValue: cdItemsWithPricing.length > 0 ? cdValue / cdItemsWithPricing.length : 0,
          topGenres: getTopGenres(cdItems),
          topArtists: getTopArtists(cdItems),
          priceRanges: getPriceRanges(cdItemsWithPricing),
          yearRange: getYearRange(cdItems)
        },
        vinyl: {
          totalItems: totalVinyls,
          totalValue: vinylValue,
          averageValue: vinylItemsWithPricing.length > 0 ? vinylValue / vinylItemsWithPricing.length : 0,
          topGenres: getTopGenres(vinylItems),
          topArtists: getTopArtists(vinylItems),
          priceRanges: getPriceRanges(vinylItemsWithPricing),
          yearRange: getYearRange(vinylItems)
        }
      };

      // Genre details
      const genreDetails: any = {};
      genres.forEach(genre => {
        const genreItems = allItems.filter(item => item.genre === genre.genre);
        const genreItemsWithPricing = genreItems.filter(item => 
          item.calculated_advice_price || item.median_price || item.marketplace_price
        );
        const genreYears = genreItems.filter(item => item.year).map(item => item.year);
        
        genreDetails[genre.genre] = {
          count: genre.count,
          value: genre.value,
          averageValue: genreItemsWithPricing.length > 0 ? genre.value / genreItemsWithPricing.length : 0,
          topArtists: getTopArtists(genreItems),
          cdCount: genreItems.filter(item => item.format === 'CD').length,
          vinylCount: genreItems.filter(item => item.format === 'Vinyl').length,
          priceRanges: getPriceRanges(genreItemsWithPricing),
          yearSpread: genreYears.length > 0 ? { min: Math.min(...genreYears), max: Math.max(...genreYears) } : { min: 0, max: 0 }
        };
      });

      // Decade breakdown
      const decadeBreakdown: any = {};
      allItems.forEach(item => {
        if (item.year) {
          const decade = Math.floor(item.year / 10) * 10;
          const decadeKey = `${decade}s`;
          if (!decadeBreakdown[decadeKey]) {
            decadeBreakdown[decadeKey] = {
              count: 0,
              value: 0,
              topGenres: new Map(),
              cdCount: 0,
              vinylCount: 0
            };
          }
          const price = item.calculated_advice_price || item.median_price || item.marketplace_price || 0;
          decadeBreakdown[decadeKey].count++;
          decadeBreakdown[decadeKey].value += Number(price);
          
          if (item.format === 'CD') decadeBreakdown[decadeKey].cdCount++;
          if (item.format === 'Vinyl') decadeBreakdown[decadeKey].vinylCount++;
          
          if (item.genre) {
            const existing = decadeBreakdown[decadeKey].topGenres.get(item.genre) || 0;
            decadeBreakdown[decadeKey].topGenres.set(item.genre, existing + 1);
          }
        }
      });

      // Convert topGenres Maps to arrays
      Object.keys(decadeBreakdown).forEach(decade => {
        decadeBreakdown[decade].topGenres = Array.from(decadeBreakdown[decade].topGenres.entries())
          .map(([genre, count]) => ({ genre, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);
      });

      // Value segments
      const budget = itemsWithPricing.filter(item => {
        const price = item.calculated_advice_price || item.median_price || item.marketplace_price || 0;
        return Number(price) <= 10;
      });
      const midRange = itemsWithPricing.filter(item => {
        const price = item.calculated_advice_price || item.median_price || item.marketplace_price || 0;
        const numPrice = Number(price);
        return numPrice > 10 && numPrice <= 50;
      });
      const premium = itemsWithPricing.filter(item => {
        const price = item.calculated_advice_price || item.median_price || item.marketplace_price || 0;
        const numPrice = Number(price);
        return numPrice > 50 && numPrice <= 100;
      });
      const collectors = itemsWithPricing.filter(item => {
        const price = item.calculated_advice_price || item.median_price || item.marketplace_price || 0;
        return Number(price) > 100;
      });

      const valueSegments = {
        budget: {
          count: budget.length,
          items: budget.slice(0, 10), // Top 10 for display
          averageValue: budget.length > 0 ? budget.reduce((sum, item) => {
            const price = item.calculated_advice_price || item.median_price || item.marketplace_price || 0;
            return sum + Number(price);
          }, 0) / budget.length : 0
        },
        midRange: {
          count: midRange.length,
          items: midRange.slice(0, 10),
          averageValue: midRange.length > 0 ? midRange.reduce((sum, item) => {
            const price = item.calculated_advice_price || item.median_price || item.marketplace_price || 0;
            return sum + Number(price);
          }, 0) / midRange.length : 0
        },
        premium: {
          count: premium.length,
          items: premium.slice(0, 10),
          averageValue: premium.length > 0 ? premium.reduce((sum, item) => {
            const price = item.calculated_advice_price || item.median_price || item.marketplace_price || 0;
            return sum + Number(price);
          }, 0) / premium.length : 0
        },
        collectors: {
          count: collectors.length,
          items: collectors.slice(0, 10),
          averageValue: collectors.length > 0 ? collectors.reduce((sum, item) => {
            const price = item.calculated_advice_price || item.median_price || item.marketplace_price || 0;
            return sum + Number(price);
          }, 0) / collectors.length : 0
        }
      };

      return {
        totalItems,
        totalCDs,
        totalVinyls,
        totalValue,
        averageValue,
        mostValuableItem,
        itemsWithPricing: itemsWithPricing.length,
        itemsWithoutPricing: totalItems - itemsWithPricing.length,
        genres,
        artists,
        years,
        conditions,
        priceRanges,
        typeBreakdown,
        genreDetails,
        decadeBreakdown,
        valueSegments,
        allItems
      };
    }
  });
};