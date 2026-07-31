import React, { useState } from 'react';
import {
  X,
  Star,
  Shield,
  Check,
  Plus,
  Minus,
  ShoppingCart,
  Zap,
  Heart,
  MessageSquare,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { Product } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useCartStore } from '../../store/useCartStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useProductStore } from '../../store/useProductStore';
import { useAuthStore } from '../../store/useAuthStore';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onGoToCart: () => void;
  onRequireAuth?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onGoToCart,
  onRequireAuth,
}) => {
  const { t } = useLanguage();
  const addToCart = useCartStore((s) => s.addToCart);
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { reviews, addReview } = useProductStore();
  const { user } = useAuthStore();

  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Review Form State
  const [ratingScore, setRatingScore] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [reviewerName, setReviewerName] = useState(user?.name || '');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  if (!product) return null;

  const images = product.additionalImages?.length
    ? product.additionalImages
    : [product.imageUrl];

  const productReviews = (reviews || []).filter((r) => r.productId === product.id);
  const inWishlist = isInWishlist(product.id);

  const checkAuth = () => {
    if (!user) {
      if (onRequireAuth) {
        onRequireAuth();
      }
      return false;
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!checkAuth()) return;
    addToCart(product, quantity);
  };

  const handleBuyNow = () => {
    if (!checkAuth()) return;
    addToCart(product, quantity);
    onClose();
    onGoToCart();
  };

  const handleToggleWishlist = () => {
    if (!checkAuth()) return;
    toggleWishlist(product.id);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkAuth()) return;
    if (!commentText.trim()) return;

    addReview({
      productId: product.id,
      productName: product.name,
      customerName: reviewerName || 'Verified Buyer',
      rating: ratingScore,
      comment: commentText,
    });

    setReviewSubmitted(true);
    setCommentText('');
    setTimeout(() => setReviewSubmitted(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Modal Close & Wishlist Top Bar */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <button
            onClick={handleToggleWishlist}
            className="p-2.5 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 shadow-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title={t('wishlist')}
          >
            <Heart
              className={`w-5 h-5 ${
                inWishlist ? 'fill-rose-500 text-rose-500' : 'text-slate-500'
              }`}
            />
          </button>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 shadow-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[85vh] overflow-y-auto space-y-8">
          {/* Main Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div className="space-y-3">
              <div className="aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 relative">
                <img
                  src={images[selectedImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm">
                  {product.category}
                </span>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImageIndex === idx
                          ? 'border-amber-500 ring-2 ring-amber-500/30'
                          : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details & Specs */}
            <div className="space-y-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {product.name}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                    <Star className="w-4 h-4 fill-amber-500" />
                    <span>{product.rating}</span>
                  </div>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {productReviews.length} Verified Reviews
                  </span>
                </div>
              </div>

              {/* Price & Stock */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                    Price (TZS)
                  </span>
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-500">
                    TZS {product.priceTzs.toLocaleString()}
                  </span>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      product.stock > 0
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    {product.stock > 0
                      ? `${product.stock} In Stock`
                      : t('outOfStock')}
                  </span>
                </div>
              </div>

              {/* Warranty Badge */}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
                <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{product.warrantyPeriod}</span>
              </div>

              {/* Specifications String Breakdown */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  {t('specifications')}
                </h3>
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 leading-relaxed">
                  {product.specifications}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  {t('description')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Quantity Picker & Action Buttons */}
              <div className="pt-4 space-y-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Quantity
                  </span>
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-slate-900 dark:text-slate-100">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity((q) => Math.min(product.stock, q + 1))
                      }
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className="py-3 px-4 rounded-xl border-2 border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{t('addToCart')}</span>
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={product.stock === 0}
                    className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" />
                    <span>{t('buyNow')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Reviews Section */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-500" />
              <span>{t('customerReviews')}</span>
            </h2>

            {/* Add Review Form */}
            <form
              onSubmit={handleReviewSubmit}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
            >
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t('writeReview')}
              </h3>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{t('yourRating')}:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingScore(star)}
                      className="p-1"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= ratingScore
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="Your Name (e.g. Godwin - Arusha)"
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={t('yourComment')}
                rows={2}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
                required
              />

              <div className="flex items-center justify-between">
                {reviewSubmitted ? (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ✓ Review submitted successfully!
                  </span>
                ) : <span />}

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t('submitReview')}</span>
                </button>
              </div>
            </form>

            {/* List Reviews */}
            <div className="space-y-3">
              {productReviews.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  No reviews yet for this product. Be the first to leave feedback!
                </p>
              ) : (
                productReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {rev.customerName}
                        </span>
                        {rev.isPinned && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-bold">
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-amber-500 text-xs font-bold gap-0.5">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        <span>{rev.rating}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      "{rev.comment}"
                    </p>

                    {rev.adminReply && (
                      <div className="p-2.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/50 text-[11px] text-amber-900 dark:text-amber-200 font-medium">
                        <span className="font-bold block text-amber-700 dark:text-amber-400">
                          YMA Energy Reply:
                        </span>
                        {rev.adminReply}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
