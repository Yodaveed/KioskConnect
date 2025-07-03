import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  customerName: string;
  menuType: string;
  orderData: any;
  totalPrice: number;
  timestamp: Date;
}

interface CartState {
  cartId: string | null;
  items: CartItem[];
  isActive: boolean;
  
  // Actions
  setCartId: (cartId: string) => void;
  addItem: (item: Omit<CartItem, 'id' | 'timestamp'>) => void;
  removeItem: (itemId: string) => void;
  updateItem: (itemId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getItemsByCustomer: (customerName: string) => CartItem[];
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      cartId: null,
      items: [],
      isActive: false,

      setCartId: (cartId: string) => set({ cartId, isActive: true }),

      addItem: (item) => set((state) => ({
        items: [
          ...state.items,
          {
            ...item,
            id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            timestamp: new Date()
          }
        ]
      })),

      removeItem: (itemId) => set((state) => ({
        items: state.items.filter(item => item.id !== itemId)
      })),

      updateItem: (itemId, updates) => set((state) => ({
        items: state.items.map(item => 
          item.id === itemId ? { ...item, ...updates } : item
        )
      })),

      clearCart: () => set({
        cartId: null,
        items: [],
        isActive: false
      }),

      getCartTotal: () => {
        return get().items.reduce((total, item) => total + item.totalPrice, 0);
      },

      getItemsByCustomer: (customerName: string) => {
        return get().items.filter(item => item.customerName === customerName);
      }
    }),
    {
      name: 'ic-pasta-cart',
      partialize: (state) => ({
        cartId: state.cartId,
        items: state.items,
        isActive: state.isActive
      })
    }
  )
);