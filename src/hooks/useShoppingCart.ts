import { useState, useEffect } from 'react';
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
}

const CART_STORAGE_KEY = 'music-shop-cart';

export const useShoppingCart = () => {
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
      // Check if item is already in cart
      const existingItem = prevItems.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevItems; // Item already in cart, don't add duplicate
      }
      return [...prevItems, item];
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
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

  const isInCart = (itemId: string) => {
    return items.some(item => item.id === itemId);
  };

  const checkout = async (shippingAddress?: any, buyerName?: string) => {
    if (items.length === 0) {
      throw new Error('No items in cart');
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-shop-payment', {
        body: {
          items: items.map(item => ({
            id: item.id,
            type: item.media_type
          })),
          shippingAddress,
          buyerName
        }
      });

      if (error) throw error;

      // Clear cart on successful checkout initiation
      clearCart();
      
      return data;
    } catch (error) {
      console.error('Checkout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    items,
    addToCart,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getItemCount,
    isInCart,
    checkout,
    isLoading
  };
};