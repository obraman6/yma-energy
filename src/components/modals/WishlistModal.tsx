import React from 'react';
import { X, Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useProductStore } from '../../store/useProductStore';
import { useCartStore } from '../../store/useCartStore';
import { Product } from '../../types';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProduct: (product: Product) => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  onOpenProduct,
}) => {
  const savedIds = useWishlistStore((s) => s.savedProductIds);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const products = useProductStore((s) => s.products);
  const addToCart = useCartStore((s) => s.addToCart);

  if (!isOpen) return null;

  const savedProducts = products.filter((p) => savedIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <h2 className="text-base font-bold">Saved Solar Favorites ({savedProducts.length})</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg bg-white/10 hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          {savedProducts.length === 0 ? (
            <div className="text-center py-8 space-y-2 text-slate-500">
              <Heart className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-bold">Your wishlist is empty.</p>
              <p className="text-xs">Click the heart icon on any product to save it for later.</p>
            </div>
          ) : (
            savedProducts.map((prod) => (
              <div
                key={prod.id}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={prod.imageUrl}
                    alt={prod.name}
                    className="w-14 h-14 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <h3
                      onClick={() => {
                        onClose();
                        onOpenProduct(prod);
                      }}
                      className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:text-amber-500"
                    >
                      {prod.name}
                    </h3>
                    <p className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                      TZS {prod.priceTzs.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => addToCart(prod, 1)}
                    className="p-2 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 flex items-center gap-1"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                  <button
                    onClick={() => toggleWishlist(prod.id)}
                    className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
