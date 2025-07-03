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
    base?: OrderItem;
    sauce?: OrderItem;
    toppings: OrderItem[];
  };
  totalPrice: number;
  orderNumber?: string;
  
  // Actions
  setStep: (step: number) => void;
  setSelectedMenuId: (menuId: number) => void;
  selectBase: (item: OrderItem) => void;
  selectSauce: (item: OrderItem) => void;
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
        toppings: [],
      },
      totalPrice: 0,
      orderNumber: undefined,

      setStep: (step) => set({ currentStep: step }),

      setSelectedMenuId: (menuId) => set({ selectedMenuId: menuId }),

      selectBase: (item) => {
        set((state) => ({
          order: { ...state.order, base: item },
        }));
        get().calculateTotal();
      },

      selectSauce: (item) => {
        set((state) => ({
          order: { ...state.order, sauce: item },
        }));
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
        
        if (state.order.base) {
          total += state.order.base.price;
          if (state.order.base.modifiers) {
            total += state.order.base.modifiers.reduce((sum, mod) => sum + mod.price, 0);
          }
        }
        
        if (state.order.sauce) {
          total += state.order.sauce.price;
        }
        
        state.order.toppings.forEach((topping) => {
          total += topping.price;
        });
        
        set({ totalPrice: total });
      },

      resetOrder: () => {
        set({
          currentStep: 0,
          selectedMenuId: undefined,
          order: { toppings: [] },
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
