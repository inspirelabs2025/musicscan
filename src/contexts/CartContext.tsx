import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CartItem {
  id: string;
  media_type: 'cd' | 'vinyl' | 'product' | 'art';
  artist: string;
  title: string;
  price: number;
  condition_grade: string;
  seller_id: string;
  image?: string;
  selected_style?: string;
  selected_size?: string;
  selected_color?: string;
  cart_key?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getItemCount: () => number;
  isInCart: (itemId: string) => boolean;
  checkout: (shippingAddress?: any, buyerName?: string) => Promise<any>;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'music-shop-cart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to parse saved cart:', error);
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (item: CartItem) => {
    setItems(prevItems => {
      // Generate cart_key for variant tracking
      const cart_key = `${item.id}_${item.selected_style || 'default'}_${item.selected_size || 'NA'}_${item.selected_color || 'NA'}`;
      const itemWithKey = { ...item, cart_key };
      
      // Check if this exact variant exists
      const existingItem = prevItems.find(cartItem => cartItem.cart_key === cart_key);
      if (existingItem) {
        return prevItems;
      }
      return [...prevItems, itemWithKey];
    });
  };

  const removeFromCart = (itemKeyOrId: string) => {
    setItems(prevItems => prevItems.filter(item => item.cart_key !== itemKeyOrId && item.id !== itemKeyOrId));
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.price, 0);
  };

  const getItemCount = () => {
    return items.length;
  };

  const isInCart = (itemKeyOrId: string) => {
    return items.some(item => item.cart_key === itemKeyOrId || item.id === itemKeyOrId);
  };

  const checkout = async (shippingAddress?: any, buyerName?: string) => {
    if (items.length === 0) {
      throw new Error('No items in cart');
    }

    setIsLoading(true);
    console.log('[CartContext] Starting checkout with items:', items.map(i => ({ 
      id: i.id, 
      type: i.media_type, 
      style: i.selected_style 
    })));
    
    try {
      const requestBody = {
        items: items.map(item => ({
          id: item.id,
          type: item.media_type,
          selected_style: item.selected_style,
          selected_size: item.selected_size,
          selected_color: item.selected_color
        })),
        shippingAddress,
        buyerName
      };
      
      console.log('[CartContext] Invoking create-shop-payment with:', requestBody);
      
      const { data, error } = await supabase.functions.invoke('create-shop-payment', {
        body: requestBody
      });

      console.log('[CartContext] Edge function response:', { data, error });

      if (error) {
        console.error('[CartContext] Edge function error:', error);
        throw new Error(error.message || 'Checkout failed');
      }

      if (!data?.url) {
        console.error('[CartContext] No checkout URL received:', data);
        throw new Error('No checkout URL received');
      }

      console.log('[CartContext] Checkout successful, clearing cart');
      clearCart();
      
      return data;
    } catch (error) {
      console.error('[CartContext] Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Er is iets misgegaan bij het afrekenen';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      clearCart,
      getTotalPrice,
      getItemCount,
      isInCart,
      checkout,
      isLoading
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
