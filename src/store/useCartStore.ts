import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, PaymentMethod } from '../types';
import { useToastStore } from './useToastStore';

interface CartState {
  items: CartItem[];
  couponCode: string;
  isCouponApplied: boolean;
  couponDiscountPercent: number;
  
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  selectedRegion: string;
  selectedDistrict: string;
  
  paymentMethod: PaymentMethod;
  paymentPhone: string;
  transactionRef: string;
  
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  
  setShippingInfo: (info: {
    customerName?: string;
    customerPhone?: string;
    shippingAddress?: string;
    selectedRegion?: string;
    selectedDistrict?: string;
  }) => void;
  
  setPaymentInfo: (info: {
    paymentMethod?: PaymentMethod;
    paymentPhone?: string;
    transactionRef?: string;
  }) => void;
  
  autoGenerateRef: () => string;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: '',
      isCouponApplied: false,
      couponDiscountPercent: 0,

  customerName: '',
  customerPhone: '',
  shippingAddress: '',
  selectedRegion: 'Dar es Salaam',
  selectedDistrict: '',

  paymentMethod: 'M-Pesa',
  paymentPhone: '',
  transactionRef: '',

  addToCart: (product, quantity = 1) => {
    if (product.stock <= 0) {
      useToastStore.getState().showToast({
        title: 'Stok Umeisha! (Out of Stock) 🚫',
        message: `Samahani, bidhaa "${product.name}" haina stok kwa sasa.`,
        type: 'error',
      });
      return;
    }

    let isExceeded = false;
    set((state) => {
      const existingIndex = state.items.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const currentQty = state.items[existingIndex].quantity;
        if (currentQty >= product.stock) {
          isExceeded = true;
          return state;
        }
        const updated = [...state.items];
        const newQty = Math.min(product.stock, currentQty + quantity);
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
        return { items: updated };
      }
      return { items: [...state.items, { product, quantity: Math.min(product.stock, quantity) }] };
    });

    if (isExceeded) {
      useToastStore.getState().showToast({
        title: 'Ukomo wa Stok Umetimia! ⚠️',
        message: `Huwezi kuongeza zaidi. Stok iliyopo dukani ni vipande ${product.stock} pekee.`,
        type: 'info',
      });
    } else {
      useToastStore.getState().showToast({
        title: 'Bidhaa Imeongezwa (Added to Cart) 🛒',
        message: `"${product.name}" imeongezwa kwenye kikapu chako kwa mafanikio.`,
        type: 'success',
      });
    }
  },

  removeFromCart: (productId) => {
    set((state) => ({ items: state.items.filter((item) => item.product.id !== productId) }));
  },

  updateQuantity: (productId, quantity) => {
    set((state) => ({
      items: state.items
        .map((item) => {
          if (item.product.id === productId) {
            const validQty = Math.max(1, Math.min(item.product.stock, quantity));
            return { ...item, quantity: validQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0),
    }));
  },

  clearCart: () => {
    set({
      items: [],
      couponCode: '',
      isCouponApplied: false,
      couponDiscountPercent: 0,
    });
  },

  applyCoupon: (code) => {
    if (code.trim().toUpperCase() === 'SOLAR2026') {
      set({
        couponCode: 'SOLAR2026',
        isCouponApplied: true,
        couponDiscountPercent: 10,
      });
      return true;
    }
    return false;
  },

  removeCoupon: () => {
    set({
      couponCode: '',
      isCouponApplied: false,
      couponDiscountPercent: 0,
    });
  },

  setShippingInfo: (info) => {
    set((state) => ({
      customerName: info.customerName ?? state.customerName,
      customerPhone: info.customerPhone ?? state.customerPhone,
      shippingAddress: info.shippingAddress ?? state.shippingAddress,
      selectedRegion: info.selectedRegion ?? state.selectedRegion,
      selectedDistrict: info.selectedDistrict ?? state.selectedDistrict,
    }));
  },

  setPaymentInfo: (info) => {
    set((state) => ({
      paymentMethod: info.paymentMethod ?? state.paymentMethod,
      paymentPhone: info.paymentPhone ?? state.paymentPhone,
      transactionRef: info.transactionRef ?? state.transactionRef,
    }));
  },

  autoGenerateRef: () => {
    const prefixes = ['QX', 'MP', 'TZ', 'CR', 'NM'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const newRef = `${randomPrefix}${randomDigits}.${Math.floor(10 + Math.random() * 90)}`;
    set({ transactionRef: newRef });
    return newRef;
  },
    }),
    {
      name: 'yma_cart_storage',
    }
  )
);
