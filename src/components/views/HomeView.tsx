import React, { useState } from 'react';
import {
  Sun,
  ShoppingBag,
  Wrench,
  ShieldAlert,
  ShieldCheck,
  Star,
  ChevronRight,
  Zap,
  ArrowRight,
  Phone,
  Clock,
  CheckCircle2,
  Heart,
  ShoppingCart,
  Youtube,
  Play,
  ExternalLink,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProductStore } from '../../store/useProductStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { useCompanySettingsStore } from '../../store/useCompanySettingsStore';
import { Product, Branch } from '../../types';
import { ConcentricSpinner } from '../common/ConcentricSpinner';
import { getYouTubeEmbedUrl, detectVideoAspectRatio } from '../common/HowToUseAppSection';
import { getStockStatus } from '../../utils/stockUtils';

interface HomeViewProps {
  setActiveTab: (tab: string) => void;
  openProductModal: (product: Product) => void;
  openBranchMapModal?: (branch: Branch) => void;
  openAuthModal?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  setActiveTab,
  openProductModal,
  openAuthModal,
}) => {
  const { t, language } = useLanguage();
  const { user } = useAuthStore();
  const { settings } = useCompanySettingsStore();
  const { products, reviews, setCategory, isLoading } = useProductStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const addToCart = useCartStore((s) => s.addToCart);

  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});

  const isStaffOrAdmin =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'ADMIN' ||
    user?.role === 'STAFF_ADMIN' ||
    user?.role === 'MANAGER';

  const rawVideoUrl = settings.tutorialVideoUrl?.trim() || '';
  const embedUrl = getYouTubeEmbedUrl(rawVideoUrl);

  const videoTitle =
    settings.tutorialVideoTitle?.trim() ||
    (language === 'sw'
      ? 'Jinsi ya Kutumia App ya YMA ENERGY GROUP'
      : 'How to Use YMA ENERGY GROUP App');

  const videoDesc =
    settings.tutorialVideoDesc?.trim() ||
    (language === 'sw'
      ? 'Tazama video fupi ya hatua kwa hatua kujifunza jinsi ya kuagiza bidhaa za sola, kuomba fundi wa ufungaji, na kufuatilia oda yako.'
      : 'Watch this quick step-by-step tutorial to learn how to purchase solar hardware, request certified installation, and track deliveries.');

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

  const toggleReviewExpand = (id: string) => {
    setExpandedReviews((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const featuredProducts = products.slice(0, 4);
  const pinnedReviews = reviews.filter((r) => r.isPinned);
  const displayReviews = pinnedReviews.length > 0 ? pinnedReviews : reviews;

  return (
    <div className="space-y-4 sm:space-y-5 pb-8">
      {/* Hello / Hero Banner Section with Integrated YouTube Tutorial Video */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white p-4 sm:p-5 lg:p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Hello Banner Header Content */}
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold border border-amber-500/30">
            <Sun className="w-3 h-3 text-amber-400 animate-spin" />
            <span>{t('brandName')}</span>
          </div>

          <h1 className="text-base sm:text-2xl lg:text-3xl font-black tracking-tight leading-snug">
            {t('heroTitle')}
          </h1>

          <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed max-w-2xl">
            {t('heroSubtitle')}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <button
              onClick={() => setActiveTab('shop')}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-[11px] sm:text-xs shadow-md flex items-center gap-1.5 transition-all hover:scale-[1.01] active:scale-95"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{t('heroCtaShop')}</span>
            </button>

            <button
              onClick={() => setActiveTab('services')}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-[11px] sm:text-xs border border-white/20 backdrop-blur-md flex items-center gap-1.5 transition-all hover:scale-[1.01] active:scale-95"
            >
              <Wrench className="w-3.5 h-3.5 text-sky-400" />
              <span>{t('quickActionServices')}</span>
            </button>
          </div>
        </div>

        {/* Integrated YouTube Tutorial Video inside Hello Section - ONLY visible if admin configured a valid link */}
        {embedUrl && (() => {
          const videoRatio = detectVideoAspectRatio(rawVideoUrl, settings.tutorialVideoAspectRatio);
          return (
            <div className="relative z-10 pt-3 border-t border-white/10 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-extrabold border border-rose-500/30">
                    <Youtube className="w-3 h-3 text-rose-400" />
                    <span>{language === 'sw' ? 'Mwongozo wa App' : 'Video Tutorial'}</span>
                  </span>
                  <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate max-w-md">
                    {videoTitle}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {rawVideoUrl && (
                    <a
                      href={rawVideoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-bold"
                    >
                      <span>YouTube</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {isStaffOrAdmin && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('admin')}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-amber-500 text-white font-bold text-[10px] border border-white/15 transition-colors"
                      title="Badilisha video na umbile lake kwenye Admin Dashboard"
                    >
                      <Settings className="w-2.5 h-2.5 text-amber-300" />
                      <span>Admin</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Dynamic Responsive Video Frame matching source ratio (Vertical 9:16, Square 1:1, or Landscape 16:9) */}
              <div className="flex justify-center w-full py-1">
                <div
                  className={`relative overflow-hidden bg-black transition-all duration-300 ${
                    videoRatio === '9:16'
                      ? 'aspect-[9/16] w-full max-w-[260px] sm:max-w-[290px] rounded-2xl border-2 border-white/20 shadow-2xl ring-2 ring-rose-500/20'
                      : videoRatio === '1:1'
                      ? 'aspect-square w-full max-w-[300px] sm:max-w-[350px] rounded-2xl border-2 border-white/20 shadow-xl'
                      : 'aspect-video w-full max-w-xl rounded-xl border border-white/15 shadow-md'
                  }`}
                >
                  <iframe
                    src={embedUrl}
                    title={videoTitle}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* Quick Action Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: t('quickActionShop'), icon: ShoppingBag, color: 'text-amber-500', action: () => setActiveTab('shop') },
          { label: t('quickActionServices'), icon: Wrench, color: 'text-sky-500', action: () => setActiveTab('services') },
          { label: t('quickActionRepairs'), icon: ShieldAlert, color: 'text-rose-500', action: () => setActiveTab('repairs') },
          { label: t('quickActionWarranty'), icon: ShieldCheck, color: 'text-purple-500', action: () => setActiveTab('account') },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={item.action}
              className="p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all shadow-sm flex items-center gap-2.5 text-left group"
            >
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:scale-105 transition-transform shrink-0">
                <Icon className={`w-4 h-4 sm:w-4 sm:h-4 ${item.color}`} />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                {item.label}
              </span>
            </button>
          );
        })}
      </section>

      {/* Featured Products Grid */}
      <section className="space-y-2 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-black text-slate-900 dark:text-white uppercase tracking-wider">
              {t('featuredProducts')}
            </h2>
          </div>

          <button
            onClick={() => setActiveTab('shop')}
            className="text-[12px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5 hover:underline"
          >
            <span>{t('navShop')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 min-[640px]:grid-cols-3 lg:grid-cols-4 gap-3">
          {isLoading ? (
            <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <ConcentricSpinner
                size="md"
                text={language === 'sw' ? 'Inapakia bidhaa zilizo bora...' : 'Loading featured products...'}
              />
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              {t('noProductsAvailable', 'No products available at this time.')}
            </div>
          ) : (
            featuredProducts.map((prod) => {
            const inWishlist = isInWishlist(prod.id);
            return (
              <div
                key={prod.id}
                className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-auto p-2 space-y-[6px]"
              >
                <div>
                  <div className="h-[115px] relative overflow-hidden bg-slate-100 dark:bg-slate-800/80 rounded-lg">
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-900/80 text-amber-400 backdrop-blur-md max-w-[75%] truncate">
                      {prod.category}
                    </span>
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

                  <div className="pt-1.5 space-y-[6px]">
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

                    <h3
                      onClick={() => openProductModal(prod)}
                      className="text-[13px] font-bold text-slate-900 dark:text-slate-100 line-clamp-2 cursor-pointer hover:text-amber-600 dark:hover:text-amber-400 transition-colors leading-tight"
                    >
                      {prod.name}
                    </h3>

                    <div>
                      <span className="text-[14px] font-black text-[#F59E0B] font-mono tracking-tight block">
                        TZS {prod.priceTzs.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

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
          }))}
        </div>
      </section>

      {/* Customer Reviews - Shortened cards with Read More Expansion */}
      <section className="p-3.5 sm:p-4 rounded-xl bg-slate-900 text-white space-y-2.5 shadow-md border border-slate-800 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <h2 className="text-[18px] font-bold uppercase tracking-wider">{t('verifiedReviews')}</h2>
          </div>
          <span className="text-[11px] text-amber-400 font-semibold">
            5.0 ★★★★★
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {displayReviews.length === 0 ? (
            <div className="col-span-full py-4 text-center text-xs text-slate-400 italic">
              {t('noReviewsYet', 'No customer reviews yet.')}
            </div>
          ) : (
            displayReviews.map((rev) => {
            const isExpanded = !!expandedReviews[rev.id];
            const isLong = rev.comment.length > 80;
            const displayComment = !isExpanded && isLong ? `${rev.comment.slice(0, 80)}...` : rev.comment;

            return (
              <div
                key={rev.id}
                className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1 max-h-[150px] overflow-y-auto"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-amber-400">
                    {rev.customerName}
                  </span>
                  <div className="flex gap-0.5 text-amber-400">
                    {[...Array(Math.max(0, Math.min(5, Math.floor(rev.rating || 5))))].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400" />
                    ))}
                  </div>
                </div>

                <p className="text-[12px] text-slate-300 italic font-medium leading-tight">
                  "{displayComment}"
                  {isLong && (
                    <button
                      onClick={() => toggleReviewExpand(rev.id)}
                      className="ml-1 text-[11px] text-amber-400 font-bold not-italic hover:underline focus:outline-none"
                    >
                      {isExpanded ? 'Less' : 'More'}
                    </button>
                  )}
                </p>

                {rev.adminReply && (
                  <p className="text-[11px] text-slate-400 border-t border-slate-700/80 pt-1 font-sans">
                    <strong className="text-amber-400">YMA:</strong> {rev.adminReply}
                  </p>
                )}
              </div>
            );
          }))}
        </div>
      </section>
    </div>
  );
};
