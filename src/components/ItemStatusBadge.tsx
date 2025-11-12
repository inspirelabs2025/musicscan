import { Badge } from "@/components/ui/badge";
import { UnifiedScanResult } from "@/hooks/useInfiniteUnifiedScans";
import { ShoppingCart, Eye, Scan, AlertTriangle, CheckCircle } from "lucide-react";

interface ItemStatusBadgeProps {
  item: UnifiedScanResult;
  showMultiple?: boolean;
}

export const ItemStatusBadge = ({ item, showMultiple = false }: ItemStatusBadgeProps) => {
  const isCollectionItem = item.source_table === 'cd_scan' || item.source_table === 'vinyl2_scan';
  const isAIScan = item.source_table === 'ai_scan_results';

  if (isAIScan) {
    return (
      <Badge variant="secondary" className="text-xs">
        <Scan className="w-3 h-3 mr-1" />
        Smart Scan
      </Badge>
    );
  }

  if (!isCollectionItem) return null;

  const badges = [];

  // Primary status badge
  if (!item.calculated_advice_price) {
    badges.push(
      <Badge key="incomplete" variant="secondary" className="text-xs bg-gray-100 text-gray-700 border-gray-200">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Onvolledig
      </Badge>
    );
  } else if (item.is_for_sale) {
    badges.push(
      <Badge key="for-sale" variant="default" className="text-xs bg-green-600 hover:bg-green-700 text-white">
        <ShoppingCart className="w-3 h-3 mr-1" />
        Te koop
      </Badge>
    );
  } else {
    badges.push(
      <Badge key="ready" variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
        <CheckCircle className="w-3 h-3 mr-1" />
        Winkel-klaar
      </Badge>
    );
  }

  // Additional badges when showMultiple is true
  if (showMultiple) {
    if (item.is_public && !item.is_for_sale) {
      badges.push(
        <Badge key="public" variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
          <Eye className="w-3 h-3 mr-1" />
          Publiek
        </Badge>
      );
    }
  }

  return <div className="flex items-center gap-1 flex-wrap">{badges}</div>;
};

// Helper function to get item status for logic
export const getItemStatus = (item: UnifiedScanResult): 'incomplete' | 'ready_for_shop' | 'for_sale' | 'ai_scan' => {
  if (item.source_table === 'ai_scan_results') return 'ai_scan';
  if (!item.calculated_advice_price) return 'incomplete';
  if (item.is_for_sale) return 'for_sale';
  return 'ready_for_shop';
};

// Helper function to check if item is ready for shop
export const isItemReadyForShop = (item: UnifiedScanResult): boolean => {
  return !!(
    item.calculated_advice_price && 
    !item.is_for_sale && 
    (item.source_table === 'cd_scan' || item.source_table === 'vinyl2_scan')
  );
};