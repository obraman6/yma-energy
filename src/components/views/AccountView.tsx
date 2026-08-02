import React, { useState, useMemo } from 'react';
import {
  User as UserIcon,
  ShoppingBag,
  Heart,
  Wrench,
  Truck,
  ShieldCheck,
  MapPin,
  Bell,
  MessageSquare,
  HelpCircle,
  Settings,
  LogOut,
  ChevronDown,
  ChevronUp,
  Lock,
  Mail,
  Phone,
  QrCode,
  FileText,
  ShieldAlert,
  Send,
  ExternalLink,
  Cpu,
  Camera,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrdersStore } from '../../store/useOrdersStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useServicesStore } from '../../store/useServicesStore';
import { useRepairsStore } from '../../store/useRepairsStore';
import { useWarrantyStore } from '../../store/useWarrantyStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useProductStore } from '../../store/useProductStore';
import { useToastStore } from '../../store/useToastStore';
import { Order, Warranty, ServiceRequest, RepairRequest } from '../../types';
import { ConfirmModal } from '../modals/ConfirmModal';

interface AccountViewProps {
  onOpenAdminConsole: () => void;
  onOpenTechnicianPortal?: () => void;
  onOpenInvoiceModal: (order: Order) => void;
  onOpenDeliveryModal: (order: Order) => void;
  onOpenClaimModal: (warranty: Warranty) => void;
  onOpenQrScanner: () => void;
  onOpenLiveChat: () => void;
  onOpenWishlistModal?: () => void;
  onOpenTechnicianStatusModal?: (item: ServiceRequest | RepairRequest) => void;
}

export const AccountView: React.FC<AccountViewProps> = ({
  onOpenAdminConsole,
  onOpenTechnicianPortal,
  onOpenInvoiceModal,
  onOpenDeliveryModal,
  onOpenClaimModal,
  onOpenQrScanner,
  onOpenLiveChat,
  onOpenWishlistModal,
  onOpenTechnicianStatusModal,
}) => {
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, login, register, resetPassword, logout, updateProfile } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast({
        title: 'Picha ni Kubwa Mno! ⚠️',
        message: 'Tafadhali chagua picha yenye ukubwa chini ya 5MB.',
        type: 'error',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      await updateProfile({ avatarUrl: dataUrl });
      showToast({
        title: 'Picha ya Profaili Imesasishwa! 📸',
        message: 'Picha yako mpya ya profaili imehifadhiwa kutoka kwenye kifaa chako.',
        type: 'success',
      });
    };
    reader.readAsDataURL(file);
  };

  const orders = useOrdersStore((s) => s.orders) || [];
  const savedProductIds = useWishlistStore((s) => s.savedProductIds) || [];
  const serviceRequests = useServicesStore((s) => s.serviceRequests) || [];
  const repairRequests = useRepairsStore((s) => s.repairRequests) || [];
  const { warranties: rawWarranties, claims: rawClaims } = useWarrantyStore();
  const warranties = rawWarranties || [];
  const claims = rawClaims || [];
  const { notifications: rawNotifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();
  const notifications = rawNotifications || [];
  const products = useProductStore((s) => s.products) || [];
  const reviews = useProductStore((s) => s.reviews) || [];

  const myOrders = useMemo(() => {
    if (!user) return [];
    if (user.role === 'ADMIN') return orders;
    return orders.filter(
      (o) => o.userId === user.id || (user.phone && o.customerPhone === user.phone) || (user.name && o.customerName === user.name)
    );
  }, [orders, user]);

  const myServiceRequests = useMemo(() => {
    if (!user) return [];
    if (user.role === 'ADMIN') return serviceRequests;
    return serviceRequests.filter(
      (sr) => sr.userId === user.id || (user.phone && sr.phone === user.phone) || (user.name && sr.customerName === user.name)
    );
  }, [serviceRequests, user]);

  const myRepairRequests = useMemo(() => {
    if (!user) return [];
    if (user.role === 'ADMIN') return repairRequests;
    return repairRequests.filter(
      (rr) => rr.userId === user.id || (user.phone && rr.phone === user.phone) || (user.name && rr.customerName === user.name)
    );
  }, [repairRequests, user]);

  const myWarranties = useMemo(() => {
    if (!user) return [];
    if (user.role === 'ADMIN') return warranties;
    return warranties.filter(
      (w) => w.userId === user.id
    );
  }, [warranties, user]);

  // Accordion expanded state
  const [expandedIndex, setExpandedIndex] = useState<number | null>(1); // Default expand Orders

  // Logout modal state
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Auth form state (Logged out)
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [resetMessage, setResetMessage] = useState('');

  // Edit profile state
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');

  const toggleAccordion = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'login') {
      if (!email.trim() || !password) {
        showToast({
          title: 'Taarifa Hazijakamilika',
          message: 'Tafadhali weka barua pepe na nenosiri (email na password).',
          type: 'warning',
        });
        return;
      }
      const res = await login(email.trim(), password);
      if (!res.success) {
        showToast({
          title: 'Akaunti Haipatikani ❌',
          message: res.message || 'Tafadhali kagua email au password na ujaribu tena.',
          type: 'warning',
        });
      } else if (res.user && (res.user.role === 'ADMIN' || res.user.role === 'MANAGER')) {
        onOpenAdminConsole();
      }
    } else if (authMode === 'forgot') {
      if (!email.trim()) {
        showToast({
          title: 'Email Inatakiwa',
          message: 'Tafadhali weka email yako.',
          type: 'warning',
        });
        return;
      }
      const res = await resetPassword(email.trim());
      setResetMessage(res.message);
      showToast({
        title: 'Maelekezo Yametumwa 📩',
        message: 'If an account with this email exists, a password reset link has been sent.',
        type: 'success',
      });
    } else {
      if (!name.trim() || !email.trim()) {
        showToast({
          title: 'Taarifa Hazijakamilika',
          message: 'Tafadhali jaza Jina Kamili na Barua Pepe.',
          type: 'warning',
        });
        return;
      }
      if (password.length < 6) {
        showToast({
          title: 'Nenosiri Dhaifu',
          message: 'Nenosiri lazima liwe na angalau herufi 6.',
          type: 'warning',
        });
        return;
      }
      if (password !== confirmPassword) {
        showToast({
          title: 'Nenosiri Halifanani!',
          message: 'Tafadhali hakikisha nenosiri na confirm password vinafanana.',
          type: 'warning',
        });
        return;
      }

      // Customer Registration
      const res = await register(name.trim(), email.trim(), phone.trim() || '+255 700 000 000', password);
      if (res.success && res.user) {
        showToast({
          title: 'Akaunti ya Mteja Imetengenezwa! 🔥',
          message: `Karibu ${res.user.name}, akaunti yako ya Customer iko tayari!`,
          type: 'success',
        });
      } else {
        showToast({
          title: 'Hitilafu ya Usajili ❌',
          message: res.message || 'Kuna tatizo katika kusajili.',
          type: 'warning',
        });
      }
    }
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name: editName, phone: editPhone });
    showToast({
      title: 'Profile Updated',
      message: 'Taarifa zako zimehifadhiwa vyema.',
      type: 'success',
    });
  };

  // LOGGED OUT STATE
  if (!user) {
    return (
      <div className="max-w-md mx-auto py-6 space-y-5">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto shadow-md shadow-amber-500/20 font-black text-lg">
            YMA
          </div>
          <h1 className="text-lg font-extrabold text-slate-900 dark:text-white">
            {t('accountTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign in to track live orders, warranty claims, and service bookings.
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg space-y-3.5">
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => {
                setResetMessage('');
                setAuthMode('login');
              }}
              className={`py-1.5 text-xs font-bold rounded-lg transition-colors ${
                authMode === 'login'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setResetMessage('');
                setAuthMode('register');
              }}
              className={`py-1.5 text-xs font-bold rounded-lg transition-colors ${
                authMode === 'register'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-3">
            {authMode === 'register' && (
              <>
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300">
                  <strong>Note:</strong> All new public registrations are created as <strong>Customer</strong> accounts.
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Emanuel Kimaro"
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+255 712 987 654"
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mteja@gmail.com"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            {authMode !== 'forgot' && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Password *
                    </label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setResetMessage('');
                          setAuthMode('forgot');
                        }}
                        className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>

                {authMode === 'register' && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      required
                    />
                  </div>
                )}
              </>
            )}

            {authMode === 'login' && (
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span>Remember Me</span>
                </label>
              </div>
            )}

            {authMode === 'forgot' && resetMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs">
                {resetMessage}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 transition-colors"
            >
              {authMode === 'login' ? 'Sign In' : authMode === 'forgot' ? 'Send Password Reset Link' : 'Create Account'}
            </button>

            {authMode === 'forgot' && (
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="w-full text-center text-xs text-slate-500 hover:underline font-bold block pt-1"
              >
                ← Back to Login
              </button>
            )}
          </form>
        </div>
      </div>
    );
  }

  // LOGGED IN STATE - 16 Category Accordion Hub
  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-16">
      {/* Profile Header Card */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative group shrink-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-amber-500/30"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white font-black text-xl flex items-center justify-center">
                {user.name.charAt(0)}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              title={t('uploadPhotoTooltip', 'Weka/Badilisha picha kutoka kwenye kifaa chako')}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-amber-500 text-white shadow-md hover:bg-amber-600 transition-transform active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfileImageUpload}
              className="hidden"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {user.name}
              </h1>
              <span
                className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'
                    ? 'bg-slate-900 dark:bg-slate-100 text-amber-400 dark:text-slate-900'
                    : user.role === 'STAFF_ADMIN'
                    ? 'bg-purple-600 text-white'
                    : user.role === 'MANAGER'
                    ? 'bg-sky-600 text-white'
                    : user.role === 'TECHNICIAN'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                }`}
              >
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
            <p className="text-xs font-mono text-slate-400">{user.phone}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {user.role === 'TECHNICIAN' && onOpenTechnicianPortal && (
            <button
              onClick={onOpenTechnicianPortal}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{t('technicianPortalBtn', 'Technician Portal')}</span>
            </button>
          )}

          {(user.role === 'SUPER_ADMIN' || user.role === 'STAFF_ADMIN' || user.role === 'ADMIN' || user.role === 'MANAGER') && (
            <button
              onClick={onOpenAdminConsole}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-100 dark:to-white text-white dark:text-slate-900 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm"
              id="open-admin-console-btn"
            >
              <Cpu className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
              <span>Console / Administration</span>
            </button>
          )}
        </div>
      </div>

      {/* 16 Accordion Category Hub */}
      <div className="space-y-3">
        {/* 1. Profile Manager */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <button
            onClick={() => toggleAccordion(0)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <div className="flex items-center gap-3">
              <UserIcon className="w-5 h-5 text-amber-500" />
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                {t('wasifuWako')}
              </span>
            </div>
            {expandedIndex === 0 ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedIndex === 0 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3 text-xs">
              <form onSubmit={handleProfileSave} className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold"
                >
                  Save Profile Changes
                </button>
              </form>
            </div>
          )}
        </div>

        {/* 2. Orders History & E-Receipt Downloads */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <button
            onClick={() => toggleAccordion(1)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-sky-500" />
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                {t('odaZangu')} ({myOrders.length})
              </span>
            </div>
            {expandedIndex === 1 ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedIndex === 1 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3 text-xs">
              {myOrders.length === 0 ? (
                <p className="text-slate-500 italic">No orders placed yet.</p>
              ) : (
                myOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
                        #{ord.orderNumber}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        {ord.status}
                      </span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300">
                      Total: <strong className="font-mono">TZS {ord.totalAmountTzs.toLocaleString()}</strong> ({(ord.items || []).length} Items)
                    </p>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => onOpenInvoiceModal(ord)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-500" />
                        <span>E-Receipt Invoice</span>
                      </button>

                      <button
                        onClick={() => onOpenDeliveryModal(ord)}
                        className="px-3 py-1.5 rounded-lg bg-sky-600 text-white font-bold flex items-center gap-1"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Live Delivery Tracker</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 3. Wishlist */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <button
            onClick={() => toggleAccordion(2)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-rose-500" />
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                {t('bidhaaZilizohifadhiwa')} ({savedProductIds.length})
              </span>
            </div>
            {expandedIndex === 2 ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedIndex === 2 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2 text-xs">
              {onOpenWishlistModal && (
                <button
                  onClick={onOpenWishlistModal}
                  className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm mb-3"
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>Open Wishlist Manager ({savedProductIds.length})</span>
                </button>
              )}
              {savedProductIds.length === 0 ? (
                <p className="text-slate-500 italic">No items saved in wishlist.</p>
              ) : (
                savedProductIds.map((pid) => {
                  const prod = products.find((p) => p.id === pid);
                  if (!prod) return null;
                  return (
                    <div
                      key={pid}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                    >
                      <span className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {prod.name}
                      </span>
                      <span className="font-mono text-amber-600 dark:text-amber-500 font-bold">
                        TZS {prod.priceTzs.toLocaleString()}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* 4. Service Bookings & Emergency Repairs */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <button
            onClick={() => toggleAccordion(3)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <div className="flex items-center gap-3">
              <Wrench className="w-5 h-5 text-emerald-500" />
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                {t('hudumaZaSolar')} ({myServiceRequests.length + myRepairRequests.length})
              </span>
            </div>
            {expandedIndex === 3 ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedIndex === 3 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-4 text-xs">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t('serviceInstallationRequests', 'Maombi ya Huduma ya Solar')}</span>
                </h4>
                {myServiceRequests.length === 0 ? (
                  <p className="text-slate-500 italic">{t('noServiceRequestsYet', 'Bado hujatuma ombi lolote la huduma.')}</p>
                ) : (
                  myServiceRequests.map((sr) => (
                    <div
                      key={sr.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black font-mono text-amber-600 dark:text-amber-400">
                          #{sr.requestNumber}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            sr.status === 'Completed' || sr.status === 'Imekamilika'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {(sr.status === 'Completed' || sr.status === 'Imekamilika') ? '✅ ' : ''}{sr.status}
                        </span>
                      </div>

                      <p className="font-extrabold text-slate-900 dark:text-slate-100">
                        {sr.serviceName}
                      </p>

                      {sr.assignedTechnician ? (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 dark:text-slate-300 font-semibold">
                              {t('assignedTechnicianLabel', 'Fundi Aliyepangiwa')}: <strong className="text-slate-900 dark:text-white">{sr.assignedTechnician}</strong>
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                              {sr.techResponseStatus === 'ACCEPTED' ? '✅ Dispatched' : '⏳ Pending'}
                            </span>
                          </div>
                          {sr.assignedTechnicianPhone && (
                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                              <span className="text-amber-600 dark:text-amber-400 font-mono font-bold flex items-center gap-1">
                                <Phone className="w-3 h-3 text-amber-500" />
                                <span>{sr.assignedTechnicianPhone}</span>
                              </span>
                              <a
                                href={`tel:${sr.assignedTechnicianPhone}`}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-extrabold text-[10px] flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{t('callBtn', 'Piga Simu')}</span>
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">{t('waitingForTechAssignment', 'Inasubiri upangaji wa fundi kutoka makao makuu...')}</p>
                      )}

                      {onOpenTechnicianStatusModal && (
                        <button
                          onClick={() => onOpenTechnicianStatusModal(sr)}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/20 transition-all"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>{t('liveTechnicianTracker', 'Tazama Status ya Fundi')}</span>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                  <span>{t('emergencyRepairTickets', 'Tiketi za Matengenezo')}</span>
                </h4>
                {myRepairRequests.length === 0 ? (
                  <p className="text-slate-500 italic">{t('noRepairTicketsYet', 'Bado hujafungua tiketi ya matengenezo.')}</p>
                ) : (
                  myRepairRequests.map((rr) => (
                    <div
                      key={rr.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black font-mono text-amber-600 dark:text-amber-400">
                          #{rr.requestNumber}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            rr.status === 'Resolved' || rr.status === 'Completed' || rr.status === 'Imerekebishwa'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {(rr.status === 'Resolved' || rr.status === 'Completed' || rr.status === 'Imerekebishwa') ? '✅ ' : ''}{rr.status}
                        </span>
                      </div>

                      <p className="font-extrabold text-slate-900 dark:text-slate-100">
                        {rr.equipmentType}
                      </p>

                      {rr.assignedTechnician ? (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 dark:text-slate-300 font-semibold">
                              {t('assignedTechnicianLabel', 'Fundi Aliyepangiwa')}: <strong className="text-slate-900 dark:text-white">{rr.assignedTechnician}</strong>
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                              {rr.techResponseStatus === 'ACCEPTED' ? '✅ Dispatched' : '⏳ Pending'}
                            </span>
                          </div>
                          {rr.assignedTechnicianPhone && (
                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                              <span className="text-amber-600 dark:text-amber-400 font-mono font-bold flex items-center gap-1">
                                <Phone className="w-3 h-3 text-amber-500" />
                                <span>{rr.assignedTechnicianPhone}</span>
                              </span>
                              <a
                                href={`tel:${rr.assignedTechnicianPhone}`}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-extrabold text-[10px] flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{t('callBtn', 'Piga Simu')}</span>
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">{t('waitingForEmergencyTech', 'Inasubiri upangaji wa fundi wa dharura...')}</p>
                      )}

                      {onOpenTechnicianStatusModal && (
                        <button
                          onClick={() => onOpenTechnicianStatusModal(rr)}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/20 transition-all"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>{t('liveTechnicianTracker', 'Tazama Status ya Fundi')}</span>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 5. Warranties & Replacement Claims */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <button
            onClick={() => toggleAccordion(4)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-purple-500" />
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                {t('dhamana')} ({myWarranties.length})
              </span>
            </div>
            {expandedIndex === 4 ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedIndex === 4 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3 text-xs">
              {myWarranties.length === 0 ? (
                <p className="text-slate-500 italic">No active warranties.</p>
              ) : (
                myWarranties.map((w) => (
                  <div key={w.id} className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between font-mono font-bold text-amber-600 dark:text-amber-400">
                      <span>{w.serialNumber}</span>
                      <span className="text-emerald-600 font-sans">{w.status}</span>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{w.productName}</p>
                    <p className="text-slate-500">Coverage: {w.warrantyPeriod}</p>
                    <button
                      onClick={() => onOpenClaimModal(w)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-bold"
                    >
                      File Replacement Claim
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 6. Notifications */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <button
            onClick={() => toggleAccordion(5)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-amber-500" />
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                {t('taarifaZako')} ({notifications.filter((n) => !n.isRead).length} Unread)
              </span>
            </div>
            {expandedIndex === 5 ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedIndex === 5 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <button onClick={markAllAsRead} className="font-bold text-amber-600 underline">
                  Mark All Read
                </button>
                <button onClick={clearAll} className="font-bold text-rose-600 underline">
                  Clear All
                </button>
              </div>

              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                    n.isRead
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 font-bold'
                  }`}
                >
                  <p className="text-slate-900 dark:text-slate-100">
                    {language === 'sw' ? (n.titleSw || n.title) : n.title}
                  </p>
                  <p className="text-slate-500 font-normal">
                    {language === 'sw' ? (n.messageSw || n.message) : n.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 7. 24/7 Support */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <button
            onClick={() => toggleAccordion(6)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-sky-500" />
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                {t('msaadaWateja')}
              </span>
            </div>
            {expandedIndex === 6 ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedIndex === 6 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2 text-xs">
              <button
                onClick={onOpenLiveChat}
                className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between font-bold text-slate-900 dark:text-slate-100"
              >
                <span>{t('chatWithUs')}</span>
                <MessageSquare className="w-4 h-4 text-amber-500" />
              </button>

              <a
                href="https://wa.me/255622359874"
                target="_blank"
                rel="noreferrer"
                className="w-full p-3 rounded-xl bg-emerald-600 text-white flex items-center justify-between font-bold"
              >
                <span>{t('whatsappUs')}</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <a
                href="tel:+255622359874"
                className="w-full p-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-between font-bold"
              >
                <span>{t('callUs')}</span>
                <Phone className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        {/* 8. Settings & Logout */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {t('languageLabel', 'Lugha')}
            </span>
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-bold"
            >
              {language === 'en' ? 'Switch to Kiswahili' : 'Switch to English'}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Dark Mode Theme
            </span>
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200"
            >
              Toggle ({theme.toUpperCase()})
            </button>
          </div>

          <button
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('ondokaAkaunti')}</span>
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={() => {
          logout();
          setIsLogoutConfirmOpen(false);
        }}
        title={t('logoutConfirmTitle', 'Thibitisha Kujitoa')}
        message={t('logoutConfirmMsg', 'Je, una uhakika unataka kutoka kwenye akaunti yako ya YMA Energy?')}
        type="logout"
      />
    </div>
  );
};
