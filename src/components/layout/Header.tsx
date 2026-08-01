import React, { useState, useRef, useEffect } from 'react';
import {
  Sun,
  Moon,
  Search,
  ShoppingCart,
  Heart,
  User as UserIcon,
  Globe,
  Bell,
  X,
  ChevronRight,
  Home,
  ShoppingBag,
  Wrench,
  ShieldAlert,
  Info,
  PhoneCall,
  User,
  Smartphone,
  Volume2,
  VolumeX,
  CheckCheck,
  Send,
  Sparkles,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useProductStore } from '../../store/useProductStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { Product } from '../../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openProductModal: (product: Product) => void;
  openWishlistModal: () => void;
  openAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  openProductModal,
  openWishlistModal,
  openAuthModal,
}) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuthStore();
  const cartItems = useCartStore((s) => s.items) || [];
  const savedIds = useWishlistStore((s) => s.savedProductIds) || [];
  const { products: rawProducts, setSearchQuery, searchQuery } = useProductStore();
  const products = rawProducts || [];

  const [localSearch, setLocalSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifTab, setNotifTab] = useState<'inapp' | 'push'>('inapp');
  const searchRefDesktop = useRef<HTMLDivElement>(null);
  const searchRefMobile = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const {
    notifications: rawNotifications,
    unreadCount,
    pushPermission,
    isSoundEnabled,
    markAsRead,
    markAllAsRead,
    clearAll,
    requestPushPermission,
    toggleSound,
    playAlertSound,
    addNotification,
  } = useNotificationStore();
  const notifications = rawNotifications || [];

  const cartCount = cartItems.reduce((acc, i) => acc + (i?.quantity || 0), 0);

  const filteredSuggestions = localSearch.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(localSearch.toLowerCase()) ||
          p.category.toLowerCase().includes(localSearch.toLowerCase()) ||
          p.specifications.toLowerCase().includes(localSearch.toLowerCase())
      )
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        searchRefDesktop.current && !searchRefDesktop.current.contains(target) &&
        searchRefMobile.current && !searchRefMobile.current.contains(target)
      ) {
        setShowSuggestions(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearch);
    setActiveTab('shop');
    setShowSuggestions(false);
  };

  const desktopNavItems = [
    { id: 'home', label: t('navHome'), icon: Home },
    { id: 'shop', label: t('navShop'), icon: ShoppingBag },
    { id: 'services', label: t('navServices'), icon: Wrench },
    { id: 'repairs', label: t('navRepairs'), icon: ShieldAlert },
    { id: 'about', label: t('navAbout'), icon: Info },
    { id: 'contact', label: t('navContact'), icon: PhoneCall },
    { id: 'cart', label: t('cart'), icon: ShoppingCart, badge: cartCount },
    {
      id: 'account',
      label: user ? (user.role === 'ADMIN' ? t('adminPanel') : t('account')) : t('login'),
      icon: User,
      action: !user ? openAuthModal : undefined,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-6">
        {/* Main Header Bar */}
        <div className="flex items-center justify-between h-11 lg:h-13 gap-2 sm:gap-4">
          {/* Brand Logo & Name */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 cursor-pointer group shrink-0"
            id="brand-logo-btn"
          >
            <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center text-white shadow-sm shadow-amber-500/20 group-hover:scale-105 transition-transform border border-amber-500/30 shrink-0">
              <img
                src="/logo.svg"
                alt="YMA Energy Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <Sun className="w-4 h-4 lg:w-5 lg:h-5 text-amber-400 animate-pulse hidden" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-sm lg:text-base tracking-tight text-slate-900 dark:text-white">
                  YMA <span className="text-amber-600 dark:text-amber-500">ENERGY</span>
                </span>
                <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/40">
                  GROUP
                </span>
              </div>
              <p className="hidden md:block text-[10px] text-slate-500 dark:text-slate-400 font-medium -mt-0.5">
                {t('brandTagline')}
              </p>
            </div>
          </div>

          {/* Search Bar Component */}
          {/* Desktop/Tablet Inline Search Bar (sm:flex) */}
          <div ref={searchRefDesktop} className="hidden sm:block flex-1 max-w-[42%] lg:max-w-[360px] mx-2 relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => {
                  setLocalSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-9 pr-7 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-400 h-9 px-3"
                id="search-input-desktop"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalSearch('');
                    setSearchQuery('');
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 divide-y divide-slate-100 dark:divide-slate-700 max-h-72 overflow-y-auto">
                {filteredSuggestions.slice(0, 5).map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      openProductModal(prod);
                      setShowSuggestions(false);
                    }}
                    className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer flex items-center justify-between transition-colors gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-8 h-8 object-cover rounded border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                          {prod.name}
                        </p>
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                          TZS {prod.priceTzs.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Control Utility Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-1 sm:p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors h-7 sm:h-8 w-7 sm:w-8 flex items-center justify-center shrink-0"
              title={theme === 'dark' ? 'Badili kwenda Light Mode' : 'Badili kwenda Dark Mode'}
              id="theme-toggle-btn"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-slate-600" />
              )}
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-0.5 sm:gap-1 transition-colors h-7 sm:h-8 shrink-0"
              title="Switch Language"
              id="lang-toggle-btn"
            >
              <Globe className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span className="font-bold">{language === 'en' ? 'SW' : 'EN'}</span>
            </button>

            {/* Notification Bell */}
            <div ref={notificationRef} className="relative shrink-0">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) {
                    markAllAsRead();
                  }
                }}
                className="p-1 sm:p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 relative transition-colors h-7 sm:h-8 w-7 sm:w-8 flex items-center justify-center shrink-0"
                title="Taarifa & Alert Hub"
                id="notification-bell-btn"
              >
                <Bell className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel (Dual Channels) */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Top Bar */}
                  <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">{t('notificationHub')}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleSound}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] flex items-center gap-1 transition-colors"
                        title={isSoundEnabled ? 'Chime ON' : 'Chime OFF'}
                      >
                        {isSoundEnabled ? (
                          <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Channel Tabs */}
                  <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-1 text-[11px] font-bold">
                    <button
                      onClick={() => setNotifTab('inapp')}
                      className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                        notifTab === 'inapp'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>{t('inAppNotifications')} ({notifications.length})</span>
                    </button>

                    <button
                      onClick={() => setNotifTab('push')}
                      className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                        notifTab === 'push'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>{t('pushNotifications')}</span>
                    </button>
                  </div>

                  {/* TAB 1: In-App Notifications */}
                  {notifTab === 'inapp' && (
                    <div className="p-2 space-y-2">
                      <div className="flex items-center justify-between px-1 text-[10px] text-slate-500 font-medium border-b border-slate-100 dark:border-slate-800 pb-1">
                        <span>{t('inAppNotifications')}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={markAllAsRead}
                            className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5"
                          >
                            <CheckCheck className="w-3 h-3" />
                            <span>{t('markAllRead')}</span>
                          </button>
                          <button
                            onClick={clearAll}
                            className="text-rose-500 hover:underline flex items-center gap-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{t('clearAll')}</span>
                          </button>
                        </div>
                      </div>

                      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-xs italic">
                            {t('noNotifications')}
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => markAsRead(n.id)}
                              className={`p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer space-y-1 my-1 border ${
                                !n.isRead
                                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                                  : 'border-transparent'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                  {!n.isRead && (
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                  )}
                                  {language === 'sw' ? n.titleSw || n.title : n.title}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono">{n.time}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                                {language === 'sw' ? n.messageSw || n.message : n.message}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: System Push Notifications Settings & Test */}
                  {notifTab === 'push' && (
                    <div className="p-3 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                            <Smartphone className="w-4 h-4 text-amber-500" />
                            <span>{t('pushNotifications')}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              pushPermission === 'granted'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                            }`}
                          >
                            {pushPermission === 'granted' ? (language === 'sw' ? 'Imewezeshwa' : 'Enabled') : (language === 'sw' ? 'Hijawezeshwa' : 'Disabled')}
                          </span>
                        </div>

                        {pushPermission !== 'granted' && (
                          <button
                            onClick={async () => {
                              const ok = await requestPushPermission();
                              if (ok) {
                                addNotification({
                                  title: '🔔 Push Enabled Successfully',
                                  titleSw: '🔔 Push Imewezeshwa Kikamilifu',
                                  message: 'System notifications are now active.',
                                  messageSw: 'Arifa za mfumo sasa hivi zinafanya kazi kikamilifu.',
                                  type: 'system',
                                  isPush: true,
                                });
                              }
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all hover:scale-[1.01]"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{t('enablePush')}</span>
                          </button>
                        )}
                      </div>

                      {/* Live Test Controls */}
                      <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2">
                        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                          <button
                            onClick={() => {
                              playAlertSound();
                            }}
                            className="py-1.5 px-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[10px] flex items-center justify-center gap-1 hover:border-amber-500"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                            <span>{t('testChime')}</span>
                          </button>

                          <button
                            onClick={() => {
                              addNotification({
                                title: '☀️ YMA Alert Test',
                                titleSw: '☀️ Majaribio ya Arifa YMA',
                                message: 'New 200Ah Lithium Batteries arrived in stock!',
                                messageSw: 'Betri mpya za Lithium 200Ah zimeingia stoo!',
                                type: 'promo',
                                isPush: true,
                              });
                            }}
                            className="py-1.5 px-2 rounded-lg bg-slate-900 text-amber-400 font-bold text-[10px] flex items-center justify-center gap-1 hover:bg-slate-800"
                          >
                            <Send className="w-3 h-3" />
                            <span>{t('testPush')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-2 text-center bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:underline"
                    >
                      {t('closeNotifications')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile/Tablet Cart button */}
            <div className="flex lg:hidden items-center gap-1 shrink-0">
              <button
                onClick={() => setActiveTab('cart')}
                className={`p-1 sm:p-1.5 rounded-lg border relative h-7 sm:h-8 w-7 sm:w-8 flex items-center justify-center shrink-0 ${
                  activeTab === 'cart'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dedicated Search Bar (visible on screens < 640px) */}
        <div className="block sm:hidden pb-2 pt-0.5">
          <div ref={searchRefMobile} className="relative w-full">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => {
                  setLocalSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-8 pr-8 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-400 h-8"
                id="search-input-mobile"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalSearch('');
                    setSearchQuery('');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Suggestions Dropdown for Mobile */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 divide-y divide-slate-100 dark:divide-slate-700 max-h-60 overflow-y-auto">
                {filteredSuggestions.slice(0, 5).map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      openProductModal(prod);
                      setShowSuggestions(false);
                    }}
                    className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer flex items-center justify-between transition-colors gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-8 h-8 object-cover rounded border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                          {prod.name}
                        </p>
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                          TZS {prod.priceTzs.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Navigation Bar (1024px and above) */}
        <nav className="hidden lg:flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 py-1">
          <div className="flex items-center gap-1">
            {desktopNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all relative ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  id={`desktop-nav-${item.id}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-white text-amber-600'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live ERB Engineers Online
            </span>
          </div>
        </nav>
      </div>
    </header>
  );
};
