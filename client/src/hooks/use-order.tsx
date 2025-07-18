import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OrderItem {
  id: number;
  name: string;
  category: string;
  price: number;
  modifiers?: { name: string; price: number }[];
}

interface OrderState {
  currentStep: number;
  selectedMenuId?: number;
  order: {
    bases: OrderItem[];
    sauces: OrderItem[];
    toppings: OrderItem[];
  };
  totalPrice: number;
  orderNumber?: string;
  
  // Actions
  setStep: (step: number) => void;
  setSelectedMenuId: (menuId: number) => void;
  toggleBase: (item: OrderItem) => void;
  toggleSauce: (item: OrderItem) => void;
  toggleTopping: (item: OrderItem) => void;
  calculateTotal: () => void;
  resetOrder: () => void;
  setOrderNumber: (orderNumber: string) => void;
}

export const useOrder = create<OrderState>()(
  persist(
    (set, get) => ({
      currentStep: 0, // Start at 0 for menu selection
      selectedMenuId: undefined,
      order: {
        bases: [],
        sauces: [],
        toppings: [],
      },
      totalPrice: 0,
      orderNumber: undefined,

      setStep: (step) => set({ currentStep: step }),

      setSelectedMenuId: (menuId) => set({ selectedMenuId: menuId }),

      toggleBase: (item) => {
        set((state) => {
          const existingIndex = state.order.bases.findIndex(
            (base) => base.id === item.id
          );
          
          let newBases;
          if (existingIndex !== -1) {
            newBases = state.order.bases.filter(
              (base) => base.id !== item.id
            );
          } else {
            newBases = [...state.order.bases, item];
          }
          
          return {
            order: { ...state.order, bases: newBases },
          };
        });
        get().calculateTotal();
      },

      toggleSauce: (item) => {
        set((state) => {
          const existingIndex = state.order.sauces.findIndex(
            (sauce) => sauce.id === item.id
          );
          
          let newSauces;
          if (existingIndex !== -1) {
            newSauces = state.order.sauces.filter(
              (sauce) => sauce.id !== item.id
            );
          } else {
            newSauces = [...state.order.sauces, item];
          }
          
          return {
            order: { ...state.order, sauces: newSauces },
          };
        });
        get().calculateTotal();
      },

      toggleTopping: (item) => {
        set((state) => {
          const existingIndex = state.order.toppings.findIndex(
            (topping) => topping.id === item.id
          );
          
          let newToppings;
          if (existingIndex !== -1) {
            newToppings = state.order.toppings.filter(
              (topping) => topping.id !== item.id
            );
          } else {
            newToppings = [...state.order.toppings, item];
          }
          
          return {
            order: { ...state.order, toppings: newToppings },
          };
        });
        get().calculateTotal();
      },

      calculateTotal: () => {
        const state = get();
        let total = 0;
        
        // Calculate bases total
        state.order.bases.forEach((base) => {
          total += base.price;
          if (base.modifiers) {
            total += base.modifiers.reduce((sum, mod) => sum + mod.price, 0);
          }
        });
        
        // Calculate sauces total
        state.order.sauces.forEach((sauce) => {
          total += sauce.price;
        });
        
        // Calculate toppings total
        state.order.toppings.forEach((topping) => {
          total += topping.price;
        });
        
        set({ totalPrice: total });
      },

      resetOrder: () => {
        set({
          currentStep: 0,
          selectedMenuId: undefined,
          order: {
            bases: [],
            sauces: [],
            toppings: [],
          },
          totalPrice: 0,
          orderNumber: undefined,
        });
      },

      setOrderNumber: (orderNumber) => {
        set({ orderNumber });
      },
    }),
    {
      name: "ic-pasta-order",
    }
  )
);
