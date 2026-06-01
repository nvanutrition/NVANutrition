'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  flavor?: string;
  unit?: string;   // e.g. 'g' | 'kg' | 'serving'
  sku?: string;
  image: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string, flavor?: string, unit?: string) => void;
  updateQuantity: (id: string, quantity: number, flavor?: string, unit?: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item: CartItem) => {
        set((state) => {
          const existingItem = state.items.find(
            (i) => i.id === item.id && i.flavor === item.flavor && i.unit === item.unit
          );
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === item.id && i.flavor === item.flavor && i.unit === item.unit
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        });
      },
      removeItem: (id: string, flavor?: string, unit?: string) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.id === id && i.flavor === flavor && i.unit === unit)
          ),
        }));
      },
      updateQuantity: (id: string, quantity: number, flavor?: string, unit?: string) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id && i.flavor === flavor && i.unit === unit
              ? { ...i, quantity: Math.max(0, quantity) }
              : i
          ).filter((i) => i.quantity > 0),
        }));
      },
      clearCart: () => set({ items: [] }),
      getTotalPrice: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
      getTotalItems: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    { name: 'cart-storage' }
  )
);
