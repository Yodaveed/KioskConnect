import { create } from "zustand";
import { persist } from "zustand/middleware";

export const ORDER_STEPS = {
  MENU: "menu",
  BASE: "base",
  SAUCE: "sauce",
  TOPPINGS: "toppings",
  REVIEW: "review",
  PINTS: "pints",
  FREEZE_STICKS: "freeze-sticks",
  CONFIRMATION: "confirmation",
} as const;

export type OrderStep = (typeof ORDER_STEPS)[keyof typeof ORDER_STEPS];

interface OrderModifier {
  name: string;
  price: number;
}

interface OrderItem {
  id: number;
  name: string;
  category: string;
  price: number;
  modifiers?: OrderModifier[];
}

interface OrderDraft {
  customerName: string;
  base: OrderItem | null;
  sauces: OrderItem[];
  toppings: OrderItem[];
}

interface OrderState {
  currentStep: OrderStep;
  selectedMenuId?: number;
  order: OrderDraft;
  totalPrice: number;
  orderNumber?: string;

  // Actions
  setStep: (step: OrderStep) => void;
  setSelectedMenuId: (menuId: number) => void;
  setCustomerName: (customerName: string) => void;
  selectBase: (item: OrderItem) => void;
  toggleBase: (item: OrderItem) => void;
  toggleSauce: (item: OrderItem) => void;
  toggleTopping: (item: OrderItem) => void;
  calculateTotal: () => void;
  resetOrder: () => void;
  setOrderNumber: (orderNumber: string) => void;
}

const emptyOrder = (): OrderDraft => ({
  customerName: "",
  base: null,
  sauces: [],
  toppings: [],
});

const normalizeStep = (step: unknown): OrderStep => {
  switch (step) {
    case 1:
    case ORDER_STEPS.BASE:
      return ORDER_STEPS.BASE;
    case 2:
    case ORDER_STEPS.SAUCE:
      return ORDER_STEPS.SAUCE;
    case 3:
    case ORDER_STEPS.TOPPINGS:
      return ORDER_STEPS.TOPPINGS;
    case 4:
    case ORDER_STEPS.REVIEW:
      return ORDER_STEPS.REVIEW;
    case 5:
    case ORDER_STEPS.PINTS:
      return ORDER_STEPS.PINTS;
    case 6:
    case ORDER_STEPS.FREEZE_STICKS:
      return ORDER_STEPS.FREEZE_STICKS;
    case 7:
    case ORDER_STEPS.CONFIRMATION:
      return ORDER_STEPS.CONFIRMATION;
    case 0:
    case ORDER_STEPS.MENU:
    default:
      return ORDER_STEPS.MENU;
  }
};

export const useOrder = create<OrderState>()(
  persist(
    (set, get) => ({
      currentStep: ORDER_STEPS.MENU,
      selectedMenuId: undefined,
      order: emptyOrder(),
      totalPrice: 0,
      orderNumber: undefined,

      setStep: (step) => set({ currentStep: step }),

      setSelectedMenuId: (menuId) => set({ selectedMenuId: menuId }),

      setCustomerName: (customerName) => {
        set((state) => ({
          order: { ...state.order, customerName },
        }));
      },

      selectBase: (item) => {
        set((state) => ({
          order: { ...state.order, base: item },
        }));
        get().calculateTotal();
      },

      toggleBase: (item) => {
        get().selectBase(item);
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
        
        if (state.order.base) {
          total += state.order.base.price;
          if (state.order.base.modifiers) {
            total += state.order.base.modifiers.reduce(
              (sum, mod) => sum + mod.price,
              0
            );
          }
        }
        
        state.order.sauces.forEach((sauce) => {
          total += sauce.price;
        });
        
        state.order.toppings.forEach((topping) => {
          total += topping.price;
        });
        
        set({ totalPrice: total });
      },

      resetOrder: () => {
        set({
          currentStep: ORDER_STEPS.MENU,
          selectedMenuId: undefined,
          order: emptyOrder(),
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
      version: 2,
      migrate: (persistedState: any) => ({
        ...persistedState,
        currentStep: normalizeStep(persistedState?.currentStep),
        order: {
          ...emptyOrder(),
          ...(persistedState?.order || {}),
          base: persistedState?.order?.base || null,
          customerName: persistedState?.order?.customerName || "",
          sauces: Array.isArray(persistedState?.order?.sauces) ? persistedState.order.sauces : [],
          toppings: Array.isArray(persistedState?.order?.toppings) ? persistedState.order.toppings : [],
        },
      }),
    }
  )
);
