import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistState {
  savedProductIds: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      savedProductIds: [],

      toggleWishlist: (productId) => {
        set((state) => {
          const exists = state.savedProductIds.includes(productId);
          if (exists) {
            return { savedProductIds: state.savedProductIds.filter((id) => id !== productId) };
          }
          return { savedProductIds: [...state.savedProductIds, productId] };
        });
      },

      isInWishlist: (productId) => {
        return (get().savedProductIds || []).includes(productId);
      },
    }),
    {
      name: 'yma_wishlist_storage',
    }
  )
);
