import React from 'react';
import {
  Search,
  Filter,
  Star,
  ShoppingCart,
  Heart,
  Shield,
  Check,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProductStore } from '../../store/useProductStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useCartStore } from '../../store/useCartStore';
import { Product, ProductCategory } from '../../types';
import { ConcentricSpinner } from '../common/ConcentricSpinner';
import { getStockStatus } from '../../utils/stockUtils';

import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';

interface ShopViewProps {
  openProductModal: (product: Product) => void;
  openAuthModal?: () => void;
}

const categoriesList: (ProductCategory | 'All')[] = [
  'All',
  'Solar Panels',
  'Hybrid Inverters',
  'Lithium Batteries',
  'Gel Batteries',
  'Solar Water Heaters',
  'Solar Pumps',
  'Accessories',
];

export const ShopView: React.FC<ShopViewProps> = ({ openProductModal, openAuthModal }) => {
  const { t, language } = useLanguage();
  const { user } = useAuthStore();
  const {
    products,
    selectedCategory,
    setCategory,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    isLoading,
  } = useProductStore();

  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const addToCart = useCartStore((s) => s.addToCart);

  const checkAuth = () => {
    if (!user) {
      useToastStore.getState().showToast({
        title: 'Ingia kwenye Akaunti (Login Required) 🔒',
        message: 'Tafadhali ingia au jisajili kwanza ili uweze kuongeza bidhaa kwenye kikapu au kupenda (like).',
        type: 'warning',
      });
      openAuthModal?.();
      return false;
    }
    return true;
  };

  const handleAddToCart = (product: Product) => {
    if (!checkAuth()) return;
    addToCart(product, 1);
  };

  const handleToggleWishlist = (productId: string) => {
    if (!checkAuth()) return;
    toggleWishlist(productId);
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'All':
        return t('catAll');
      case 'Solar Panels':
        return t('catSolarPanels');
      case 'Hybrid Inverters':
        return t('catHybridInverters');
      case 'Lithium Batteries':
        return t('catLithiumBatteries');
      case 'Gel Batteries':
        return t('catGelBatteries');
      case 'Solar Water Heaters':
        return t('catSolarWaterHeaters');
      case 'Solar Pumps':
        return t('catSolarPumps');
      case 'Accessories':
        return t('catAccessories');
      default:
        return cat;
    }
  };
  let filtered = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.specifications.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort Logic
  if (sortBy === 'price-asc') {
    filtered.sort((a, b) => a.priceTzs - b.priceTzs);
  } else if (sortBy === 'price-desc') {
    filtered.sort((a, b) => b.priceTzs - a.priceTzs);
  } else if (sortBy === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'stock') {
    filtered.sort((a, b) => b.stock - a.stock);
  }

  return (
    <div className="space-y-4 pb-12">
      {/* Header Title & Product Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-base sm:text-xl font-black text-slate-900 dark:text-white">
            {t('shopTitle')}
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Showing {filtered.length} solar equipment items available
          </p>
        </div>

        {/* Sort Controls Dropdown */}
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="p-1.5 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold focus:ring-1 focus:ring-amber-500 h-8"
            id="sort-select"
          >
            <option value="rating">{t('sortRating')}</option>
            <option value="price-asc">{t('sortPriceAsc')}</option>
            <option value="price-desc">{t('sortPriceDesc')}</option>
            <option value="stock">{t('sortStock')}</option>
          </select>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categoriesList.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {getCategoryLabel(cat)}
          </button>
        ))}
      </div>

      {/* Search Input Bar inside Shop */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter catalog by name, watts, voltage, chemistry..."
          className="w-full pl-8 pr-7 py-1.5 text-[11px] sm:text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 h-8 sm:h-9"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <ConcentricSpinner
            size="lg"
            text={language === 'sw' ? 'Inapakia bidhaa kutoka kwenye duka...' : 'Loading products...'}
            subtext={language === 'sw' ? 'Tafadhali subiri kidogo ⏳' : 'Please wait a moment ⏳'}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No products match your current filters.
          </p>
          <button
            onClick={() => {
              setCategory('All');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 min-[640px]:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((prod) => {
            const inWishlist = isInWishlist(prod.id);
            return (
              <div
                key={prod.id}
                className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-auto p-2 space-y-[6px]"
              >
                <div>
                  {/* 1. Product Image (Height: 115px) */}
                  <div className="h-[115px] relative overflow-hidden bg-slate-100 dark:bg-slate-800/80 rounded-lg">
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* 2. Category Badge */}
                    <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-900/80 text-amber-400 backdrop-blur-md max-w-[75%] truncate">
                      {getCategoryLabel(prod.category)}
                    </span>

                    {/* 3. Wishlist Button (28px x 28px, Icon 16px) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleWishlist(prod.id);
                      }}
                      className="absolute top-1 right-1 w-[28px] h-[28px] flex items-center justify-center rounded-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-md text-slate-600 dark:text-slate-300 hover:text-rose-500 transition-colors shadow-sm"
                      title="Save to favorites"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          inWishlist ? 'fill-rose-500 text-rose-500' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Product Info (Content Spacing: 6px) */}
                  <div className="pt-1.5 space-y-[6px]">
                    {/* Rating & Stock Badge */}
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 text-amber-500 text-[12px] font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        <span>{prod.rating.toFixed(1)}</span>
                      </div>

                      {(() => {
                        const stockInfo = getStockStatus(prod.stock, prod.lowStockThreshold);
                        const label = language === 'sw' ? stockInfo.labelSw : stockInfo.labelEn;
                        return (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 border ${stockInfo.badgeBg} ${stockInfo.badgeText} ${stockInfo.badgeBorder}`}
                          >
                            {label}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Product Title (Max 2 lines) */}
                    <h3
                      onClick={() => openProductModal(prod)}
                      className="text-[13px] font-bold text-slate-900 dark:text-slate-100 line-clamp-2 cursor-pointer hover:text-amber-600 dark:hover:text-amber-400 transition-colors leading-tight"
                    >
                      {prod.name}
                    </h3>

                    {/* Specifications */}
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 font-mono">
                      {prod.specifications}
                    </p>

                    {/* Price (14sp font-black #F59E0B) */}
                    <div>
                      <span className="text-[14px] font-black text-[#F59E0B] font-mono tracking-tight block">
                        TZS {prod.priceTzs.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Add to Cart Button (Height: 28px, Icon: 16px) */}
                <div className="pt-1">
                  <button
                    onClick={() => handleAddToCart(prod)}
                    disabled={prod.stock <= 0}
                    className="w-full h-[28px] rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-[11px] hover:bg-amber-500 dark:hover:bg-amber-500 dark:hover:text-white flex items-center justify-center gap-1 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{prod.stock <= 0 ? 'Stok Umeisha' : t('addToCart')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
