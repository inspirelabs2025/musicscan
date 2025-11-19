import { sendGAEvent } from '@/hooks/useGoogleAnalytics';

export interface GA4Item {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_category2?: string;
  item_variant?: string;
  price: number;
  quantity: number;
}

/**
 * Format product data for GA4 e-commerce tracking
 */
export const formatGA4Item = (product: any, quantity = 1): GA4Item => {
  return {
    item_id: product.id,
    item_name: `${product.artist} - ${product.title}`,
    item_category: product.categories?.[0] || product.media_type || 'unknown',
    item_category2: product.media_type,
    item_variant: product.selected_style || product.selected_size || undefined,
    price: product.price,
    quantity,
  };
};

/**
 * Track product view event
 */
export const trackProductView = (product: any) => {
  const item = formatGA4Item(product);
  
  sendGAEvent('view_item', {
    currency: 'EUR',
    value: item.price,
    items: [item],
  });
  
  console.log('📊 GA4: view_item', item);
};

/**
 * Track add to cart event
 */
export const trackAddToCart = (product: any, selectedStyle?: string, selectedSize?: string) => {
  const item = formatGA4Item({
    ...product,
    selected_style: selectedStyle,
    selected_size: selectedSize,
  });
  
  sendGAEvent('add_to_cart', {
    currency: 'EUR',
    value: item.price,
    items: [item],
  });
  
  console.log('📊 GA4: add_to_cart', item);
};

/**
 * Track begin checkout event
 */
export const trackBeginCheckout = (items: any[], totalPrice: number) => {
  const formattedItems = items.map(item => formatGA4Item(item));
  
  sendGAEvent('begin_checkout', {
    currency: 'EUR',
    value: totalPrice,
    items: formattedItems,
  });
  
  console.log('📊 GA4: begin_checkout', { value: totalPrice, items: formattedItems });
};

/**
 * Track purchase event
 */
export const trackPurchase = (
  orderId: string,
  items: any[],
  totalPrice: number,
  shippingCost: number = 0
) => {
  // Check if we already tracked this order
  const trackedKey = `ga_purchase_tracked_${orderId}`;
  if (sessionStorage.getItem(trackedKey)) {
    console.log('📊 GA4: purchase already tracked for order', orderId);
    return;
  }
  
  const formattedItems = items.map(item => formatGA4Item(item));
  
  sendGAEvent('purchase', {
    transaction_id: orderId,
    currency: 'EUR',
    value: totalPrice,
    shipping: shippingCost,
    items: formattedItems,
  });
  
  // Mark as tracked
  sessionStorage.setItem(trackedKey, 'true');
  
  console.log('📊 GA4: purchase', { 
    transaction_id: orderId, 
    value: totalPrice, 
    items: formattedItems 
  });
};
