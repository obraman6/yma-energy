import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Package,
  ShoppingBag,
  Wrench,
  ShieldAlert,
  ShieldCheck,
  Star,
  Plus,
  Edit2,
  Trash2,
  FileText,
  UserCheck,
  CheckCircle2,
  XCircle,
  Truck,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  CreditCard,
  ToggleLeft,
  ToggleRight,
  Settings,
  Layers,
  Database,
  Users,
  UserPlus,
  Lock,
  Mail,
  Phone,
  User as UserIcon,
  Shield,
  MessageSquare,
  Clock,
  MessageCircle,
  Building2,
  MapPin,
  Edit3,
  Share2,
  Globe,
  Youtube,
  Video,
  Play,
  ExternalLink,
  Store,
  Eye,
  EyeOff,
  Power,
  Smartphone,
  Send,
  CheckCheck,
} from 'lucide-react';
import { getYouTubeEmbedUrl, detectVideoAspectRatio, VideoAspectRatio } from '../common/HowToUseAppSection';
import { SOCIAL_PLATFORMS, SOCIAL_MEDIA_CONFIG } from '../../config/socialLinks';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { sendCustomerSms, getNativeSmsLink, getWhatsAppLink } from '../../services/smsService';
import { useLanguage } from '../../context/LanguageContext';
import { useProductStore } from '../../store/useProductStore';
import { useOrdersStore } from '../../store/useOrdersStore';
import { useServicesStore } from '../../store/useServicesStore';
import { useRepairsStore } from '../../store/useRepairsStore';
import { useWarrantyStore } from '../../store/useWarrantyStore';
import { usePaymentGatewayStore, PaymentGateway } from '../../store/usePaymentGatewayStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useBranchStore } from '../../store/useBranchStore';
import { useCompanySettingsStore } from '../../store/useCompanySettingsStore';
import { useToastStore } from '../../store/useToastStore';
import { getStockStatus } from '../../utils/stockUtils';
import { Product, OrderStatus, SolarService, UserRole, Branch } from '../../types';
import { ConfirmModal } from '../modals/ConfirmModal';
import { AdminPaymentGatewayModal } from '../modals/AdminPaymentGatewayModal';
import { FirebaseDataInspector } from '../admin/FirebaseDataInspector';

interface AdminDashboardViewProps {
  onBackToCustomerView: () => void;
  onOpenReportModal: () => void;
  onOpenAddProductModal: () => void;
  onOpenEditProductModal: (product: Product) => void;
  onOpenAddServiceModal: () => void;
  onOpenEditServiceModal?: (service: SolarService) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onBackToCustomerView,
  onOpenReportModal,
  onOpenAddProductModal,
  onOpenEditProductModal,
  onOpenAddServiceModal,
  onOpenEditServiceModal,
}) => {
  const { t, language } = useLanguage();
  const showToast = useToastStore((s) => s.showToast);
  const { user: currentUser, users, createStaffUser, updateProfile, deleteUserAccount, updateUserRole } = useAuthStore();

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.email === 'admin@ymaenergy.com';
  const isStaffAdmin = currentUser?.role === 'STAFF_ADMIN';
  const isManager = currentUser?.role === 'MANAGER';

  const [activeAdminTab, setActiveAdminTab] = useState<
    'inventory' | 'orders' | 'services' | 'branches' | 'gateways' | 'repairs' | 'warranty' | 'reviews' | 'inquiries' | 'sms' | 'emails' | 'users' | 'firebase'
  >('inventory');

  const { branches, addBranch, updateBranch, deleteBranch, initFirebaseSync: initBranchSync } = useBranchStore();
  const { settings: companySettings, updateSettings: updateCompanySettings, initFirebaseSync: initSettingsSync } = useCompanySettingsStore();

  useEffect(() => {
    initBranchSync();
    initSettingsSync();
  }, [initBranchSync, initSettingsSync]);

  // Company Contact & Module Settings State
  const [editingEnableShopModule, setEditingEnableShopModule] = useState<boolean>(true);
  const [isTogglingShop, setIsTogglingShop] = useState(false);
  const [editingCompanyPhone, setEditingCompanyPhone] = useState('');
  const [editingCompanyEmail, setEditingCompanyEmail] = useState('');
  const [editingEmergencyPhone, setEditingEmergencyPhone] = useState('');
  const [editingWorkingHours, setEditingWorkingHours] = useState('');
  const [editingHqAddress, setEditingHqAddress] = useState('');
  const [editingTutorialVideoUrl, setEditingTutorialVideoUrl] = useState('');
  const [editingTutorialVideoTitle, setEditingTutorialVideoTitle] = useState('');
  const [editingTutorialVideoDesc, setEditingTutorialVideoDesc] = useState('');
  const [editingTutorialVideoAspectRatio, setEditingTutorialVideoAspectRatio] = useState<'auto' | '16:9' | '9:16' | '1:1'>('auto');
  const [editingSocialLinks, setEditingSocialLinks] = useState<Record<string, string>>({
    facebook: '',
    instagram: '',
    x: '',
    linkedin: '',
    youtube: '',
    tiktok: '',
    whatsapp: '',
    telegram: '',
    github: '',
  });
  const [isSavingCompanySettings, setIsSavingCompanySettings] = useState(false);

  useEffect(() => {
    if (companySettings) {
      setEditingEnableShopModule(companySettings.enableShopModule ?? true);
      setEditingCompanyPhone(companySettings.companyPhone || '');
      setEditingCompanyEmail(companySettings.companyEmail || '');
      setEditingEmergencyPhone(companySettings.emergencyPhone || '');
      setEditingWorkingHours(companySettings.workingHours || '');
      setEditingHqAddress(companySettings.hqAddress || '');
      setEditingTutorialVideoUrl(companySettings.tutorialVideoUrl || '');
      setEditingTutorialVideoTitle(companySettings.tutorialVideoTitle || 'Jinsi ya Kutumia App ya YMA ENERGY GROUP');
      setEditingTutorialVideoDesc(companySettings.tutorialVideoDesc || 'Tazama video fupi kujifunza jinsi ya kununua bidhaa za sola, kuagiza huduma za ufungaji, kuomba fundi wa dharura, na kufuatilia oda yako moja kwa moja.');
      setEditingTutorialVideoAspectRatio(companySettings.tutorialVideoAspectRatio || 'auto');
      setEditingSocialLinks({
        facebook: companySettings.socialLinks?.facebook ?? '',
        instagram: companySettings.socialLinks?.instagram ?? '',
        x: companySettings.socialLinks?.x ?? '',
        linkedin: companySettings.socialLinks?.linkedin ?? '',
        youtube: companySettings.socialLinks?.youtube ?? '',
        tiktok: companySettings.socialLinks?.tiktok ?? '',
        whatsapp: companySettings.socialLinks?.whatsapp ?? '',
        telegram: companySettings.socialLinks?.telegram ?? '',
        github: companySettings.socialLinks?.github ?? '',
      });
    }
  }, [companySettings]);

  // Instant 1-Click Shop Module Visibility Switcher
  const handleToggleShopModule = async (newVal: boolean) => {
    setIsTogglingShop(true);
    try {
      await updateCompanySettings({
        enableShopModule: newVal,
      });
      setEditingEnableShopModule(newVal);
      showToast({
        title: newVal ? 'Duka Limefunguliwa! 🛍️' : 'Duka Limefichwa! 🛠️',
        message: newVal
          ? 'Wateja sasa wanaweza kuona duka (Shop), bidhaa, na kuweka oda mtandaoni.'
          : 'Duka na bidhaa zote zimefichwa kwa wateja. Mfumo sasa unafanya kazi kama App ya Huduma & Matengenezo pekee.',
        type: 'success',
      });
    } catch (err) {
      console.error(err);
      showToast({
        title: 'Hitilafu!',
        message: 'Imeshindwa kubadilisha hali ya duka. Jaribu tena.',
        type: 'error',
      });
    } finally {
      setIsTogglingShop(false);
    }
  };

  const handleSaveCompanySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCompanySettings(true);
    try {
      await updateCompanySettings({
        enableShopModule: editingEnableShopModule,
        companyPhone: editingCompanyPhone,
        companyEmail: editingCompanyEmail,
        emergencyPhone: editingEmergencyPhone,
        workingHours: editingWorkingHours,
        hqAddress: editingHqAddress,
        tutorialVideoUrl: editingTutorialVideoUrl,
        tutorialVideoTitle: editingTutorialVideoTitle,
        tutorialVideoDesc: editingTutorialVideoDesc,
        tutorialVideoAspectRatio: editingTutorialVideoAspectRatio,
        socialLinks: editingSocialLinks,
      });
      showToast({
        title: 'Taarifa na Mipangilio Zimehifadhiwa! 🌐',
        message: 'Mipangilio ya duka, mawasiliano, video, na mitandao zimesasishwa kote kwenye mfumo.',
        type: 'success',
      });
    } catch (err) {
      console.error(err);
      showToast({
        title: 'Kosa!',
        message: 'Imeshindwa kuhifadhi taarifa. Jaribu tena.',
        type: 'error',
      });
    } finally {
      setIsSavingCompanySettings(false);
    }
  };

  // Branch Delete Confirmation State
  const [branchToDelete, setBranchToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingBranch, setIsDeletingBranch] = useState(false);

  const handleConfirmDeleteBranch = async () => {
    if (!branchToDelete) return;
    setIsDeletingBranch(true);
    try {
      await deleteBranch(branchToDelete.id);
      showToast({
        title: 'Tawi Limefutwa 🗑️',
        message: `Tawi la "${branchToDelete.name}" limeondolewa kwenye mfumo.`,
        type: 'info',
      });
    } catch (err) {
      console.error('Error deleting branch:', err);
      showToast({
        title: 'Kosa',
        message: 'Imeshindwa kufuta tawi. Tafadhali jaribu tena.',
        type: 'error',
      });
    } finally {
      setIsDeletingBranch(false);
      setBranchToDelete(null);
    }
  };

  // Branch Management Modal State
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchName, setBranchName] = useState('');
  const [branchCity, setBranchCity] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [branchEmail, setBranchEmail] = useState('');
  const [branchHours, setBranchHours] = useState('Mon - Sat: 08:00 - 18:00');
  const [branchManager, setBranchManager] = useState('');
  const [branchLat, setBranchLat] = useState('-6.772');
  const [branchLng, setBranchLng] = useState('39.231');
  const [branchIsHq, setBranchIsHq] = useState(false);

  const handleOpenNewBranchModal = () => {
    setEditingBranch(null);
    setBranchName('');
    setBranchCity('');
    setBranchAddress('');
    setBranchPhone('+255 ');
    setBranchEmail('');
    setBranchHours('Jumatatu - Jumamosi: 08:00 - 18:00');
    setBranchManager('');
    setBranchLat('-6.772');
    setBranchLng('39.231');
    setBranchIsHq(false);
    setIsBranchModalOpen(true);
  };

  const handleOpenEditBranchModal = (b: Branch) => {
    setEditingBranch(b);
    setBranchName(b.name || '');
    setBranchCity(b.city || '');
    setBranchAddress(b.address || '');
    setBranchPhone(b.phone || '');
    setBranchEmail(b.email || '');
    setBranchHours(b.workingHours || 'Jumatatu - Jumamosi: 08:00 - 18:00');
    setBranchManager(b.managerName || '');
    setBranchLat(String(b.lat ?? b.latitude ?? -6.772));
    setBranchLng(String(b.lng ?? b.longitude ?? 39.231));
    setBranchIsHq(!!b.isHeadquarters);
    setIsBranchModalOpen(true);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim() || !branchCity.trim() || !branchPhone.trim()) {
      showToast({ title: 'Kosa!', message: 'Tafadhali jaza Jina la Tawi, Mji, na Namba ya Simu.', type: 'error' });
      return;
    }

    const branchData = {
      name: branchName,
      city: branchCity,
      address: branchAddress,
      phone: branchPhone,
      email: branchEmail,
      workingHours: branchHours,
      managerName: branchManager,
      lat: parseFloat(branchLat) || -6.772,
      lng: parseFloat(branchLng) || 39.231,
      latitude: parseFloat(branchLat) || -6.772,
      longitude: parseFloat(branchLng) || 39.231,
      isHeadquarters: branchIsHq,
    };

    if (editingBranch) {
      await updateBranch(editingBranch.id, branchData);
      showToast({ title: 'Tawi Limesasishwa! 🏢', message: `Taarifa za tawi la ${branchName} zimehifadhiwa.`, type: 'success' });
    } else {
      await addBranch(branchData);
      showToast({ title: 'Tawi Jipya Limeongezwa! 🏢', message: `Tawi la ${branchName} limeongezwa kwa mafanikio.`, type: 'success' });
    }

    setIsBranchModalOpen(false);
  };

  const handleDeleteBranch = async (id: string, name: string) => {
    if (confirm(`Unahakika unataka kufuta tawi la "${name}"?`)) {
      await deleteBranch(id);
      showToast({ title: 'Tawi Limefutwa 🗑️', message: `Tawi la ${name} limeondolewa kwenye mfumo.`, type: 'info' });
    }
  };

  // Live Customer Inquiries from Firestore
  const [inquiriesList, setInquiriesList] = useState<any[]>([]);
  // Live Email Alerts Log from Firestore
  const [emailAlertsList, setEmailAlertsList] = useState<any[]>([]);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  // Live SMS Alerts Log from Firestore
  const [smsLogsList, setSmsLogsList] = useState<any[]>([]);
  const [isSendingTestSms, setIsSendingTestSms] = useState(false);
  const [testSmsPhone, setTestSmsPhone] = useState('');
  const [testSmsMessage, setTestSmsMessage] = useState('');

  useEffect(() => {
    const inquiriesRef = collection(db, 'inquiries');
    const unsubscribeInquiries = onSnapshot(
      inquiriesRef,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ ...(d.data() as any), _docId: d.id }));
        docs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setInquiriesList(docs);
      },
      (err) => console.error('Error fetching inquiries:', err)
    );

    const emailLogsRef = collection(db, 'email_notifications');
    const unsubscribeEmails = onSnapshot(
      emailLogsRef,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ ...(d.data() as any), _docId: d.id }));
        docs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setEmailAlertsList(docs);
      },
      (err) => console.error('Error fetching email logs:', err)
    );

    const smsLogsRef = collection(db, 'sms_notifications');
    const unsubscribeSms = onSnapshot(
      smsLogsRef,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ ...(d.data() as any), _docId: d.id }));
        docs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setSmsLogsList(docs);
      },
      (err) => console.error('Error fetching SMS logs:', err)
    );

    return () => {
      unsubscribeInquiries();
      unsubscribeEmails();
      unsubscribeSms();
    };
  }, []);

  // Staff Creation Form state
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffRole, setStaffRole] = useState<UserRole>('MANAGER');
  const [staffPassword, setStaffPassword] = useState('');

  const {
    products: rawProducts,
    deleteProduct,
    adjustStock,
    reviews: rawReviews,
    togglePinReview,
    replyToReview,
    deleteReview,
  } = useProductStore();
  const products = rawProducts || [];
  const reviews = rawReviews || [];

  const { orders: rawOrders, updateOrderStatus, assignDriver } = useOrdersStore();
  const orders = rawOrders || [];

  const { services: rawServices, deleteService, serviceRequests: rawServiceRequests, updateRequestStatus, assignEngineer } = useServicesStore();
  const services = rawServices || [];
  const serviceRequests = rawServiceRequests || [];

  const { repairRequests: rawRepairRequests, updateRepairStatus, dispatchTechnician } = useRepairsStore();
  const repairRequests = rawRepairRequests || [];

  const { claims: rawClaims, approveClaim, rejectClaim } = useWarrantyStore();
  const claims = rawClaims || [];

  const { gateways: rawGateways, toggleGatewayStatus, deleteGateway } = usePaymentGatewayStore();
  const gateways = rawGateways || [];
  const safeUsers = users || [];

  // Payment Gateway Modal state
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);
  const [selectedGatewayToEdit, setSelectedGatewayToEdit] = useState<PaymentGateway | null>(null);

  // Confirm Delete Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const promptDelete = (title: string, message: string, action: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        action();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmountTzs, 0);
  const totalOrders = orders.length;
  const totalRepairs = repairRequests.length;
  const activeWarranties = claims.length;

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header & Navigation Bar */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl sm:rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shrink-0">
            <Cpu className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black truncate">YMA Energy Control Console</h1>
              <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider shrink-0 ${
                isSuperAdmin
                  ? 'bg-amber-500 text-white'
                  : isStaffAdmin
                  ? 'bg-purple-600 text-white'
                  : 'bg-sky-600 text-white'
              }`}>
                {isSuperAdmin ? 'SUPER ADMIN' : isStaffAdmin ? 'STAFF ADMIN' : 'OPERATIONS MANAGER'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-amber-400 font-mono truncate mt-0.5">
              Role: {currentUser?.role || 'ADMIN'} • {currentUser?.name || currentUser?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onOpenReportModal}
            className="flex-1 sm:flex-none px-3.5 py-2 sm:py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors"
          >
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Export Report</span>
          </button>

          <button
            onClick={onBackToCustomerView}
            className="flex-1 sm:flex-none px-3.5 py-2 sm:py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/20 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Customer Store</span>
          </button>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-sm min-w-0">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 block truncate">Total Revenue</span>
          <p className="text-sm sm:text-lg font-black text-amber-600 dark:text-amber-500 font-mono truncate">
            TZS {totalRevenue.toLocaleString()}
          </p>
        </div>

        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-sm min-w-0">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 block truncate">Orders Processed</span>
          <p className="text-sm sm:text-lg font-black text-slate-900 dark:text-white font-mono truncate">
            {totalOrders} Orders
          </p>
        </div>

        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-sm min-w-0">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 block truncate">Emergency Repairs</span>
          <p className="text-sm sm:text-lg font-black text-rose-600 dark:text-rose-400 font-mono truncate">
            {totalRepairs} Dispatches
          </p>
        </div>

        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-sm min-w-0">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 block truncate">Active Claims</span>
          <p className="text-sm sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono truncate">
            {activeWarranties} Pending
          </p>
        </div>
      </div>

      {/* MASTER APP OPERATING MODE & SHOP MODULE VISIBILITY CONTROL */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-sm transition-all duration-300 ${
        editingEnableShopModule
          ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-900/5 dark:to-slate-900/40 border-amber-500/30'
          : 'bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-slate-900/5 dark:to-slate-900/40 border-sky-500/30'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 sm:p-3 rounded-2xl shrink-0 ${
              editingEnableShopModule
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
            }`}>
              {editingEnableShopModule ? <Store className="w-5 h-5 sm:w-6 sm:h-6" /> : <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {language === 'sw' ? 'Muundo wa Uendeshaji wa App (Operating Mode)' : 'Application Operating Mode'}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  editingEnableShopModule
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                }`}>
                  {editingEnableShopModule
                    ? (language === 'sw' ? '🛍️ DUKA + HUDUMA (Full Mode)' : '🛍️ SHOP + SERVICES')
                    : (language === 'sw' ? '🔧 HUDUMA & MATENGENEZO TU (Services Only)' : '🔧 SERVICES & REPAIRS ONLY')}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                {editingEnableShopModule
                  ? (language === 'sw'
                      ? 'Duka lipo wazi kwa wateja wote. Wateja wanaweza kuona orodha ya bidhaa za sola, kuweka bidhaa kwenye kikapu, na kuagiza mtandaoni.'
                      : 'Shop module is active for all customers. Product catalog, cart, and e-commerce checkouts are visible and usable.')
                  : (language === 'sw'
                      ? 'Duka na bidhaa zote zimefichwa kwa wateja. App inafanya kazi maalum kwa ajili ya kuomba huduma za ufungaji wa sola, tathmini za kiufundi, na matengenezo ya dharura.'
                      : 'Shop and product catalog are completely hidden from customers. App operates strictly as a solar engineering, field service, and emergency repair platform.')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            <button
              type="button"
              disabled={isTogglingShop}
              onClick={() => handleToggleShopModule(!editingEnableShopModule)}
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
                editingEnableShopModule
                  ? 'bg-slate-900 hover:bg-slate-800 text-amber-400 dark:bg-slate-800 dark:hover:bg-slate-700 border border-amber-500/30'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
              }`}
            >
              {isTogglingShop ? (
                <span>{language === 'sw' ? 'Inabadilisha...' : 'Updating...'}</span>
              ) : editingEnableShopModule ? (
                <>
                  <EyeOff className="w-4 h-4 text-rose-400" />
                  <span>{language === 'sw' ? 'Ficha Duka (Hide Shop)' : 'Hide Shop Module'}</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-emerald-300" />
                  <span>{language === 'sw' ? 'Washa Duka (Enable Shop)' : 'Enable Shop Module'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Tab Navigation Bar (Matching Image 1) */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 px-1 no-scrollbar sm:flex-wrap">
          {[
            {
              id: 'inventory',
              label: 'Catalog & Inventory',
              icon: Package,
              count: products.length,
              statusBadge: !editingEnableShopModule ? (language === 'sw' ? 'Fichwa' : 'Hidden') : undefined,
              show: true,
            },
            {
              id: 'orders',
              label: 'Orders & Logistics',
              icon: ShoppingBag,
              count: orders.length,
              statusBadge: !editingEnableShopModule ? (language === 'sw' ? 'Shop Off' : 'Shop Off') : undefined,
              show: true,
            },
            { id: 'services', label: 'Services & Surveyors', icon: Wrench, count: serviceRequests.length, show: true },
            { id: 'branches', label: '🏢 Matawi & Mipangilio', icon: Building2, count: branches.length, show: true },
            { id: 'inquiries', label: 'Ujumbe wa Wateja', icon: MessageSquare, count: inquiriesList.length, highlight: true, show: true },
            { id: 'sms', label: '📱 SMS Alerts & Wateja', icon: Smartphone, count: smsLogsList.length, highlight: true, show: true },
            { id: 'emails', label: '📧 Email Alerts', icon: Mail, count: emailAlertsList.length, highlight: true, show: true },
            { id: 'gateways', label: 'Payment Gateways', icon: CreditCard, count: gateways.length, show: true },
            { id: 'users', label: 'Staff & Roles Control', icon: Users, count: safeUsers.length, show: isSuperAdmin || isStaffAdmin },
            { id: 'repairs', label: 'Emergency Repairs', icon: ShieldAlert, count: repairRequests.length, show: true },
            { id: 'warranty', label: 'Warranty Claims', icon: ShieldCheck, count: claims.length, show: true },
            { id: 'reviews', label: 'Customer Reviews', icon: Star, count: reviews.length, show: true },
            { id: 'firebase', label: 'Firebase Inspector', icon: Database, count: 'LIVE', show: isSuperAdmin },
          ]
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeAdminTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveAdminTab(item.id as any)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 whitespace-nowrap transition-all duration-150 shrink-0 ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-500/30'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  {item.statusBadge && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                      {item.statusBadge}
                    </span>
                  )}
                  {item.count !== undefined && item.count !== null && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 transition-colors ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.highlight
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-black'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      </div>

      {/* SUB-TAB 1: CATALOG & INVENTORY */}
      {activeAdminTab === 'inventory' && (
        <div className="space-y-4">
          {!editingEnableShopModule && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
              <div className="flex items-start gap-2.5">
                <EyeOff className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    {language === 'sw' ? 'Duka Limefichwa kwa Wateja (Shop is Hidden)' : 'Shop Module is currently Hidden from Customers'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {language === 'sw'
                      ? 'Wateja hawaoni bidhaa au duka kwa sasa. Unaweza kuendelea kuongeza au kurekebisha bidhaa hapa wakati wowote kabla ya kufungua tena.'
                      : 'Customers currently cannot see products or shop pages. You can still manage stock and catalog here before re-opening.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleShopModule(true)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shrink-0 shadow-sm flex items-center gap-1.5 justify-center"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{language === 'sw' ? 'Washa Duka Sasa' : 'Enable Shop Now'}</span>
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Hardware Catalog Management
            </h2>
            <button
              onClick={onOpenAddProductModal}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Solar Product</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-sm"
              >
                <div className="flex gap-3">
                  <img
                    src={prod.imageUrl}
                    alt={prod.name}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                      {prod.name}
                    </h3>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold">
                      TZS {prod.priceTzs.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold">
                        Stock: {prod.stock} Units
                      </span>
                      {(() => {
                        const stockInfo = getStockStatus(prod.stock, prod.lowStockThreshold);
                        return (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${stockInfo.badgeBg} ${stockInfo.badgeText} ${stockInfo.badgeBorder}`}
                          >
                            {stockInfo.labelEn}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-[9px] text-slate-400 font-mono">
                      Threshold: ≤ {prod.lowStockThreshold ?? 5} units
                    </p>
                  </div>
                </div>

                {/* Stock Quick Modifiers */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1 flex-wrap">
                  <div className="flex gap-1 flex-wrap">
                    <button
                      onClick={() => adjustStock(prod.id, 10)}
                      className="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold hover:bg-emerald-200"
                    >
                      +10
                    </button>
                    <button
                      onClick={() => adjustStock(prod.id, -5)}
                      className="px-2 py-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold hover:bg-amber-200"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => adjustStock(prod.id, -prod.stock)}
                      className="px-2 py-1 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold hover:bg-rose-200"
                      title="Set Stock to 0 (Triggers Out of Stock Alert)"
                    >
                      0 (Out)
                    </button>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => onOpenEditProductModal(prod)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        promptDelete(
                          'Thibitisha Kufuta Bidhaa',
                          `Je, una uhakika unataka kufuta bidhaa ya "${prod.name}" kutoka kwenye mfumo?`,
                          () => deleteProduct(prod.id)
                        )
                      }
                      className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ORDERS & LOGISTICS */}
      {activeAdminTab === 'orders' && (
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Order Fulfillment & Driver Dispatch
          </h2>

          <div className="space-y-3">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                      #{ord.orderNumber}
                    </span>
                    <p className="text-xs text-slate-500">
                      Customer: {ord.customerName} ({ord.customerPhone})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Status:
                    </span>
                    <select
                      value={ord.status}
                      onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                      className="p-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                    >
                      <option value="Payment Confirmed">Payment Confirmed</option>
                      <option value="Packed at Branch">Packed at Branch</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-slate-500">Address: {ord.shippingAddress}</p>
                    <p className="text-slate-500">Method: {ord.paymentMethod} ({ord.paymentRef})</p>
                    {ord.driverName && (
                      <p className="text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                        Dereva / Msafirishaji: {ord.driverName} {ord.driverPhone ? `(${ord.driverPhone})` : ''} {ord.driverVehicle ? `• ${ord.driverVehicle}` : ''}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">
                      Panga Dereva / Msafirishaji
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={ord.driverName || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) {
                            assignDriver(ord.id, '', '', '');
                            return;
                          }
                          const foundUser = users.find((u) => u.name === val || u.id === val);
                          if (foundUser) {
                            assignDriver(ord.id, foundUser.name, foundUser.phone || '', '');
                          } else {
                            assignDriver(ord.id, val, '', '');
                          }
                        }}
                        className="flex-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200"
                      >
                        <option value="">-- {ord.driverName ? 'Badilisha / Ondoa Dereva' : 'Chagua Dereva au Mjumbe'} --</option>
                        {users
                          .filter((u) => u.role === 'DRIVER' || u.role === 'TECHNICIAN' || u.role === 'MANAGER' || u.role === 'STAFF_ADMIN')
                          .map((u) => (
                            <option key={u.id} value={u.name}>
                              {u.name} ({u.role}{u.phone ? ` - ${u.phone}` : ''})
                            </option>
                          ))}
                        {users.filter((u) => u.role === 'DRIVER' || u.role === 'TECHNICIAN' || u.role === 'MANAGER' || u.role === 'STAFF_ADMIN').length === 0 && (
                          users.map((u) => (
                            <option key={u.id} value={u.name}>
                              {u.name} ({u.phone || u.email})
                            </option>
                          ))
                        )}
                      </select>
                      {ord.driverName && (
                        <button
                          type="button"
                          onClick={() => assignDriver(ord.id, '', '', '')}
                          className="px-2.5 py-2 text-xs rounded-xl bg-rose-100 dark:bg-rose-950/50 hover:bg-rose-200 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800 shrink-0"
                          title="Ondoa dereva huyu kwenye oda"
                        >
                          Ondoa
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SERVICES OFFERED & FIELD BOOKINGS */}
      {activeAdminTab === 'services' && (
        <div className="space-y-6">
          {/* Section A: Managed Solar Services */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-amber-500" />
                  <span>{t('servicesOfferedTitle', 'Huduma Zinazotolewa na YMA Energy')}</span>
                </h2>
                <p className="text-xs text-slate-500">{t('servicesOfferedSub', 'Hariri au ongeza huduma za ufungaji na ukaguzi wa umeme wa jua.')}</p>
              </div>
              <button
                onClick={onOpenAddServiceModal}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Ongeza Huduma Mpya</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                        {srv.category}
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-600">
                        TZS {srv.basePriceTzs.toLocaleString()}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {srv.nameSw || srv.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {srv.descriptionSw || srv.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onOpenEditServiceModal?.(srv)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-1 justify-center"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                      <span>Hariri</span>
                    </button>

                    <button
                      onClick={() =>
                        promptDelete(
                          'Thibitisha Kufuta Huduma',
                          `Je, una uhakika unataka kufuta huduma ya "${srv.name}"?`,
                          () => deleteService(srv.id)
                        )
                      }
                      className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section B: Customer Service Bookings */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              {t('customerFieldRequests', 'Maombi ya Huduma kutoka kwa Wateja')}
            </h2>

            <div className="space-y-3">
              {serviceRequests.map((sr) => (
                <div
                  key={sr.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-sm text-xs"
                >
                  <div className="flex justify-between font-bold">
                    <span className="font-mono text-amber-600">#{sr.requestNumber} - {sr.serviceName}</span>
                    <span className={(sr.status as string) === 'Completed' || (sr.status as string) === 'Imekamilika' ? "text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1" : "text-sky-600"}>
                      {((sr.status as string) === 'Completed' || (sr.status as string) === 'Imekamilika') ? '✅ ' : ''}{sr.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p>Client: <span className="font-semibold text-slate-800 dark:text-slate-200">{sr.customerName}</span> ({sr.phone}) - {sr.region}{sr.district ? `, ${sr.district}` : ''}</p>
                    {sr.roofType && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] border border-amber-500/20">
                        Nyumba / House: {sr.roofType}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <select
                        onChange={(e) => {
                          const techId = e.target.value;
                          if (!techId) return;
                          const selectedTech = users.find((u) => u.id === techId);
                          if (selectedTech) {
                            assignEngineer(sr.id, selectedTech.name, selectedTech.phone, selectedTech.id, selectedTech.email);
                            showToast({
                              title: 'Mhandisi Amepangwa & SMS Imetumwa! 📲',
                              message: `Huduma imetumwa kwa fundi ${selectedTech.name} na mteja (${sr.customerName}) ametumiwa ujumbe wa SMS moja kwa moja.`,
                              type: 'success',
                            });
                          }
                        }}
                        defaultValue=""
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                      >
                        <option value="" disabled>-- Panga Fundi / Dispatch Tech --</option>
                        {users
                          .filter((u) => u.role === 'TECHNICIAN')
                          .map((tech) => (
                            <option key={tech.id} value={tech.id}>
                              {tech.name} ({tech.phone || tech.email})
                            </option>
                          ))}
                        {users.filter((u) => u.role === 'TECHNICIAN').length === 0 && (
                          <option value="fallback" disabled>Hakuna Mafundi (Ongeza kwenye Staff Control)</option>
                        )}
                      </select>
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                      {sr.assignedTechnician && (
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                          Fundi: {sr.assignedTechnician} ({sr.techResponseStatus || 'PENDING'})
                        </span>
                      )}

                      {/* Manual SMS Resend / Trigger Dropdown */}
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={() => {
                            const promptOption = window.confirm(
                              `Tuma SMS ya Uthibitisho kwa Mteja (${sr.customerName} - ${sr.phone})?\n\nOK = Tuma SMS ya "Fundi Amepangiwa"\nCancel = Usitume`
                            );
                            if (promptOption) {
                              sendCustomerSms({
                                recipient: sr.phone,
                                customerName: sr.customerName,
                                requestNumber: sr.requestNumber,
                                serviceName: sr.serviceName,
                                technicianName: sr.assignedTechnician || 'Mhandisi Wetu',
                                technicianPhone: sr.assignedTechnicianPhone,
                                type: 'technician_assigned',
                              }).then((res) => {
                                showToast({
                                  title: res.success ? 'SMS Imetumwa! 📲' : 'Hitilafu ya SMS ❌',
                                  message: res.message,
                                  type: res.success ? 'success' : 'error',
                                });
                              });
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-sky-500/30 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center gap-1 hover:bg-sky-100 dark:hover:bg-sky-900/50"
                          title="Tuma Ujumbe wa SMS kwa Mteja"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>SMS kwa Mteja</span>
                        </button>
                      </div>

                      <a
                        href={getWhatsAppLink(sr.phone, `Habari ${sr.customerName}, kuhusu ombi lako la huduma #${sr.requestNumber} (${sr.serviceName}) kutoka YMA Energy Group.`)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-1 hover:bg-emerald-500/20"
                        title="Tuma Ujumbe wa WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>

                      <button
                        onClick={() => {
                          updateRequestStatus(sr.id, 'Completed');
                          showToast({
                            title: 'Kazi Imekamilika & SMS Imetumwa! 📲',
                            message: `Kazi imewekwa kuwa imekamilika na SMS ya uthibitisho imetumwa kwa mteja (${sr.phone}).`,
                            type: 'success',
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Kazi Imekamilika</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: BRANCH LOCATIONS & COMPANY CONTACT MANAGEMENT */}
      {activeAdminTab === 'branches' && (
        <div className="space-y-6">
          {/* Company Support & Emergency Contact Info Settings Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Phone className="w-5 h-5 text-amber-500" />
                  <span>{t('companySupportTitle', 'Taarifa za Mawasiliano za Kampuni')}</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('companySupportSub', 'Super Admin & Staff: Hariri namba za simu, barua pepe ya msaada, na masaa ya kazi.')}
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Inaoanishwa na Firestore Live
              </span>
            </div>

            <form onSubmit={handleSaveCompanySettings} className="space-y-4">
              {/* App Operating Mode / Shop Toggle */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {language === 'sw' ? 'Hali ya Duka la Bidhaa (Shop Module)' : 'Shop & Hardware Catalog Module'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingEnableShopModule(!editingEnableShopModule)}
                    className="flex items-center gap-2 text-xs font-extrabold"
                  >
                    <span className={editingEnableShopModule ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>
                      {editingEnableShopModule
                        ? (language === 'sw' ? 'DUKA LIKO WAZI' : 'SHOP ACTIVE')
                        : (language === 'sw' ? 'DUKA LIMEFICHWA' : 'SHOP HIDDEN')}
                    </span>
                    {editingEnableShopModule ? (
                      <ToggleRight className="w-7 h-7 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-400" />
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {editingEnableShopModule
                    ? (language === 'sw'
                        ? 'Wateja wanaweza kuona orodha ya bidhaa, kutafuta, kuongeza kwenye kikapu, na kuagiza mtandaoni.'
                        : 'Customer navigation includes Shop, product listings, cart, and order checkout.')
                    : (language === 'sw'
                        ? 'Duka na kikapu vimefichwa kote kwenye app. Wateja wanaona huduma, matengenezo, na mawasiliano pekee.'
                        : 'Shop, products catalog, and cart are hidden across the customer UI. Only services & repairs are visible.')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t('phoneSupportLabel', 'Namba ya Simu ya Huduma')} *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCompanyPhone}
                    onChange={(e) => setEditingCompanyPhone(e.target.value)}
                    placeholder="+255 622 359 874"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-sky-500" />
                    <span>{t('supportEmailLabel', 'Barua Pepe ya Msaada')} *</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={editingCompanyEmail}
                    onChange={(e) => setEditingCompanyEmail(e.target.value)}
                    placeholder="support@ymaenergy.co.tz"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                    Inatumika kama Target Admin Email kupokea barua pepe za oda na matengenezo.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-rose-500" />
                      <span>{t('emergencyHotlineLabel', 'Hotline ya Dharura')}</span>
                    </label>
                    <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400 font-bold">
                      {editingEmergencyPhone.trim() ? 'Namba Maalum' : 'Inatumia Namba ya Huduma'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={editingEmergencyPhone}
                    onChange={(e) => setEditingEmergencyPhone(e.target.value)}
                    placeholder="Weka namba maalum ya dharura au acha wazi kutumia namba ya huduma"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Namba itakayoonekana kwenye kitufe cha dharura ukurasa wa Matengenezo: <strong className="text-rose-600 dark:text-rose-400 font-mono">{(editingEmergencyPhone.trim() || editingCompanyPhone.trim()) || 'Bado haijawekwa'}</strong>
                  </p>
                </div>

                <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t('workingHoursLabel', 'Saa za Huduma / Kazi')}</span>
                  </label>
                  <input
                    type="text"
                    value={editingWorkingHours}
                    onChange={(e) => setEditingWorkingHours(e.target.value)}
                    placeholder="24/7 Support | Mon - Sat: 08:00 - 18:00"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t('hqAddressLabel', 'Anwani ya Makao Makuu')}</span>
                  </label>
                  <input
                    type="text"
                    value={editingHqAddress}
                    onChange={(e) => setEditingHqAddress(e.target.value)}
                    placeholder="Mikocheni B, Sayansi / Kijitonyama, Dar es Salaam"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* YouTube Tutorial Video Configuration Section */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Youtube className="w-4 h-4 text-rose-600" />
                      <span>Video ya Mwongozo wa App (YouTube Tutorial Video)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Weka link ya video ya YouTube (mfano https://www.youtube.com/watch?v=... au https://youtu.be/...) itakayoonekana kwa wateja wote kwenye ukurasa wa mwanzo chini ya maelezo ya YMA.
                    </p>
                  </div>

                  {editingTutorialVideoUrl.trim() && (
                    <button
                      type="button"
                      onClick={() => setEditingTutorialVideoUrl('')}
                      className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20"
                    >
                      Ondoa Video (Remove Video)
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Youtube className="w-3.5 h-3.5 text-rose-600" />
                        <span>Link ya Video ya YouTube (URL)</span>
                      </label>
                      <input
                        type="url"
                        value={editingTutorialVideoUrl}
                        onChange={(e) => setEditingTutorialVideoUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ au https://youtu.be/..."
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      />
                      <p className="text-[10px] text-slate-500">
                        Inasaidia links za kawaida, YouTube Shorts, na youtu.be links.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Kichwa cha Video (Title)
                      </label>
                      <input
                        type="text"
                        value={editingTutorialVideoTitle}
                        onChange={(e) => setEditingTutorialVideoTitle(e.target.value)}
                        placeholder="Jinsi ya Kutumia App ya YMA ENERGY GROUP"
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Maelezo Mafupi (Description)
                      </label>
                      <textarea
                        rows={2}
                        value={editingTutorialVideoDesc}
                        onChange={(e) => setEditingTutorialVideoDesc(e.target.value)}
                        placeholder="Tazama video fupi ya hatua kwa hatua kujifunza jinsi ya kuagiza vifaa vya sola na kuomba huduma..."
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 resize-none"
                      />
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                        <span>Ukubwa / Umbile la Video (Aspect Ratio)</span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                          {editingTutorialVideoAspectRatio === 'auto'
                            ? `Auto: ${detectVideoAspectRatio(editingTutorialVideoUrl, 'auto')}`
                            : editingTutorialVideoAspectRatio}
                        </span>
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { id: 'auto', label: '🪄 Auto', desc: 'Inatambua yenyewe' },
                          { id: '16:9', label: '🖥️ 16:9', desc: 'Widescreen' },
                          { id: '9:16', label: '📱 9:16', desc: 'Shorts / Reels' },
                          { id: '1:1', label: '🔲 1:1', desc: 'Instagram Post' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setEditingTutorialVideoAspectRatio(opt.id as any)}
                            className={`p-2 rounded-xl text-center border transition-all ${
                              editingTutorialVideoAspectRatio === opt.id
                                ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            <span className="block text-[11px] font-extrabold">{opt.label}</span>
                            <span className="block text-[9px] opacity-80 truncate">{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Real-time YouTube Live Preview with Responsive Ratio */}
                  {(() => {
                    const activeRatio = detectVideoAspectRatio(editingTutorialVideoUrl, editingTutorialVideoAspectRatio);
                    return (
                      <div className="space-y-1 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col items-center justify-center min-h-[220px]">
                        <div className="w-full flex items-center justify-between pb-1">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Play className="w-3.5 h-3.5 text-amber-500" />
                            <span>Hakikisho la Video ({activeRatio})</span>
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                              getYouTubeEmbedUrl(editingTutorialVideoUrl)
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                            }`}
                          >
                            {getYouTubeEmbedUrl(editingTutorialVideoUrl) ? 'Inafanya Kazi' : 'Hakuna Video / Link Batili'}
                          </span>
                        </div>

                        {getYouTubeEmbedUrl(editingTutorialVideoUrl) ? (
                          <div
                            className={`w-full overflow-hidden bg-black border border-slate-700 shadow-md transition-all ${
                              activeRatio === '9:16'
                                ? 'aspect-[9/16] max-w-[200px] rounded-2xl'
                                : activeRatio === '1:1'
                                ? 'aspect-square max-w-[240px] rounded-2xl'
                                : 'aspect-video max-w-full rounded-xl'
                            }`}
                          >
                            <iframe
                              src={getYouTubeEmbedUrl(editingTutorialVideoUrl) || ''}
                              title="Admin Preview"
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        ) : (
                          <div className="aspect-video w-full rounded-xl bg-slate-200/60 dark:bg-slate-800 flex flex-col items-center justify-center text-center p-4 text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 space-y-1">
                            <Youtube className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                            <p className="text-xs font-bold">Weka link ya YouTube hapo pembeni ili kuona hakikisho hapa.</p>
                            <p className="text-[10px]">Wateja wataiona video hii kwenye ukurasa wa kwanza kulingana na muundo wake ({activeRatio}).</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Social Media Links Section */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-amber-500" />
                      <span>Mitandao ya Kijamii (Social Media Links)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Hariri links za kurasa zenu za mitandao ya kijamii zinazoonekana kwenye footer. Acha tupu ili kuficha mtandao husika.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingSocialLinks({
                        facebook: '',
                        instagram: '',
                        x: '',
                        linkedin: '',
                        youtube: '',
                        tiktok: '',
                        whatsapp: '',
                        telegram: '',
                        github: '',
                      })
                    }
                    className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20"
                  >
                    Futa Links Zote (Clear All)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {SOCIAL_PLATFORMS.map((platform) => (
                    <div
                      key={platform.id}
                      className="space-y-1 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <svg
                            className="w-3.5 h-3.5 shrink-0"
                            fill="currentColor"
                            viewBox={platform.viewBox || '0 0 24 24'}
                            style={{ color: platform.color }}
                          >
                            <path d={platform.path} />
                          </svg>
                          <span>{platform.name}</span>
                        </label>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            editingSocialLinks[platform.id]
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                          }`}
                        >
                          {editingSocialLinks[platform.id] ? 'Ipo Hewani' : 'Imefichwa'}
                        </span>
                      </div>
                      <input
                        type="url"
                        value={editingSocialLinks[platform.id] || ''}
                        onChange={(e) =>
                          setEditingSocialLinks((prev) => ({
                            ...prev,
                            [platform.id]: e.target.value,
                          }))
                        }
                        placeholder={`https://${platform.id}.com/...`}
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingCompanySettings}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition-all"
                >
                  {isSavingCompanySettings ? (
                    <span>Inahifadhi...</span>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4" />
                      <span>Hifadhi Taarifa na Links za Mitandao</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Branch Locations List Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" />
                <span>{t('branchLocationsTitle', 'Matawi ya YMA ENERGY GROUP')}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('branchLocationsSub', 'Ongeza au hariri maeneo halisi ya matawi ya kampuni, anwani, namba za simu, barua pepe, na mameneja.')}
              </p>
            </div>

            <button
              onClick={handleOpenNewBranchModal}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addBranchBtn', 'Ongeza Tawi Jipya')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-sm hover:border-amber-500/50 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wide">
                        {b.city}
                      </span>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                        {b.name}
                      </h3>
                    </div>
                    {b.isHeadquarters && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-sm shrink-0">
                        Makao Makuu (HQ)
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{b.address}</span>
                  </p>

                  <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-mono">
                    <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <a href={`tel:${b.phone}`} className="hover:underline font-bold">{b.phone}</a>
                    </p>
                    <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Mail className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <a href={`mailto:${b.email}`} className="hover:underline">{b.email}</a>
                    </p>
                    {b.workingHours && (
                      <p className="flex items-center gap-2 text-slate-500 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{b.workingHours}</span>
                      </p>
                    )}
                    {b.managerName && (
                      <p className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-[11px] font-sans font-bold pt-1">
                        <UserIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>Meneja: {b.managerName}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenEditBranchModal(b)}
                    className="flex-1 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                    <span>Hariri Taarifa</span>
                  </button>

                  <button
                    onClick={() => setBranchToDelete({ id: b.id, name: b.name })}
                    className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                    title="Futa Tawi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: PAYMENT GATEWAYS CONFIGURATION */}
      {activeAdminTab === 'gateways' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-500" />
                <span>{t('paymentGatewaysTitle', 'Njia za Malipo')}</span>
              </h2>
              <p className="text-xs text-slate-500">
                {t('paymentGatewaysSub', 'Weka au hariri Lipa Namba za M-Pesa, Tigo Pesa, Airtel Money, Akaunti za Benki au Kadi.')}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedGatewayToEdit(null);
                setIsGatewayModalOpen(true);
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Ongeza Gateway Mpya</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gateways.map((gw) => (
              <div
                key={gw.id}
                className={`p-4 rounded-2xl border bg-white dark:bg-slate-900 space-y-3 shadow-sm transition-all ${
                  gw.isActive
                    ? 'border-slate-200 dark:border-slate-800'
                    : 'border-slate-300 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {gw.nameSw || gw.name}
                      </h3>
                      {gw.badge && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500 text-white font-bold">
                          {gw.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => toggleGatewayStatus(gw.id)}
                    className="text-xs font-bold flex items-center gap-1 text-slate-600 dark:text-slate-300"
                    title={gw.isActive ? 'Zima Gateway' : 'Washa Gateway'}
                  >
                    {gw.isActive ? (
                      <ToggleRight className="w-7 h-7 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-400" />
                    )}
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Lipa Namba / Akaunti:</span>
                    <strong className="font-mono text-amber-600 dark:text-amber-400">{gw.accountNumber}</strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Akaunti Name:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{gw.accountName}</strong>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 italic line-clamp-2">
                  "{gw.instructionsSw || gw.instructions}"
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedGatewayToEdit(gw);
                      setIsGatewayModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-1 justify-center"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>Hariri Gateway</span>
                  </button>

                  <button
                    onClick={() =>
                      promptDelete(
                        'Thibitisha Kufuta Gateway',
                        `Je, una uhakika unataka kufuta njia ya malipo ya "${gw.name}"?`,
                        () => deleteGateway(gw.id)
                      )
                    }
                    className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB: STAFF & USER MANAGEMENT (ROLE CONTROL) */}
      {activeAdminTab === 'users' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-extrabold">Management & Staff Account Provisioning</h2>
              </div>
              <p className="text-xs text-slate-400">
                Akaunti za Manager na Admin hutengenezwa tu hapa. Umma unaruhusiwa kujisajili kama Customer tu.
              </p>
            </div>
            <button
              onClick={() => setIsStaffModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t('createStaffAccountBtn', 'Tengeneza Akaunti ya Staff')}</span>
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Registered System Accounts ({(users || []).length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(users || []).map((u) => (
                <div
                  key={u.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{u.name}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                      <p className="text-[11px] text-slate-400">{u.phone || 'Hakuna Namba'}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          u.role === 'ADMIN' || u.role === 'SUPER_ADMIN'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : u.role === 'MANAGER'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : u.role === 'TECHNICIAN'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : u.role === 'DRIVER'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Badilisha Role:</label>
                        <select
                          value={u.role}
                          onChange={(e) => {
                            const newRole = e.target.value as any;
                            updateUserRole(u.id, newRole);
                            showToast({
                              title: 'Role Imesasishwa! 🛡️',
                              message: `Akaunti ya ${u.name} sasa ni ${newRole}.`,
                              type: 'success',
                            });
                          }}
                          className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-slate-800 dark:text-slate-200"
                        >
                          <option value="CUSTOMER">CUSTOMER (Mteja)</option>
                          <option value="TECHNICIAN">TECHNICIAN (Fundi)</option>
                          <option value="DRIVER">DRIVER (Dereva/Msafirishaji)</option>
                          <option value="MANAGER">MANAGER (Meneja)</option>
                          {isSuperAdmin && (
                            <>
                              <option value="STAFF_ADMIN">STAFF_ADMIN</option>
                              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                            </>
                          )}
                        </select>
                      </div>

                      {/* Delete user button */}
                      {u.id !== currentUser?.id && (
                        <button
                          type="button"
                          onClick={() =>
                            promptDelete(
                              'Thibitisha Kufuta Akaunti',
                              `Je, una uhakika unataka kufuta akaunti ya "${u.name}" (${u.role})? Hatua hii itamwondoa kabisa kwenye database.`,
                              () => {
                                deleteUserAccount(u.id);
                                showToast({
                                  title: 'Akaunti Imefutwa 🗑️',
                                  message: `Akaunti ya ${u.name} imeondolewa kikamilifu.`,
                                  type: 'info',
                                });
                              }
                            )
                          }
                          className="p-2 mt-3 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                          title="Futa akaunti hii"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Status: <strong className="text-emerald-500 capitalize">{u.status || 'active'}</strong></span>
                      <span className="font-mono">ID: {u.id.substring(0, 8)}...</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal to Create Manager / Admin Account */}
          {isStaffModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
              <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Create Manager/Admin Account
                    </h3>
                  </div>
                  <button onClick={() => setIsStaffModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    ✕
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!staffName || !staffEmail) return;
                    const res = await createStaffUser(staffName, staffEmail, staffPhone, staffRole, staffPassword);
                    if (res.success) {
                      showToast({
                        title: 'Akaunti ya Staff Imetengenezwa! 🔑',
                        message: `Akaunti mpya ya ${res.user?.name} (${res.user?.role}) imehifadhiwa Firestore.`,
                        type: 'success',
                      });
                      setIsStaffModalOpen(false);
                      setStaffName('');
                      setStaffEmail('');
                      setStaffPhone('');
                    } else {
                      showToast({
                        title: 'Haikuweza Kutengeneza ⚠️',
                        message: res.message || 'Akaunti hii ipo tayari.',
                        type: 'error',
                      });
                    }
                  }}
                  className="space-y-3 text-xs"
                >
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Role Type *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setStaffRole('MANAGER')}
                        className={`p-2 rounded-xl font-bold border text-xs ${
                          staffRole === 'MANAGER'
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Manager (Mauzo & Service)
                      </button>

                      <button
                        type="button"
                        onClick={() => setStaffRole('TECHNICIAN')}
                        className={`p-2 rounded-xl font-bold border text-xs ${
                          staffRole === 'TECHNICIAN'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Technician (Fundi Uwandani)
                      </button>

                      <button
                        type="button"
                        onClick={() => setStaffRole('DRIVER')}
                        className={`p-2 rounded-xl font-bold border text-xs ${
                          staffRole === 'DRIVER'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Driver (Dereva / Msafirishaji)
                      </button>

                      {isSuperAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() => setStaffRole('STAFF_ADMIN')}
                            className={`p-2 rounded-xl font-bold border text-xs ${
                              staffRole === 'STAFF_ADMIN'
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            Staff Admin
                          </button>

                          <button
                            type="button"
                            onClick={() => setStaffRole('SUPER_ADMIN')}
                            className={`p-2 rounded-xl font-bold border text-xs ${
                              staffRole === 'SUPER_ADMIN' || staffRole === 'ADMIN'
                                ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900'
                                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            Super Admin (Full Access)
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Staff Full Name *</label>
                    <input
                      type="text"
                      required
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      placeholder="e.g. Bakari Ally (Manager)"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Official Email Address *</label>
                    <input
                      type="email"
                      required
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      placeholder="manager@ymaenergy.com"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={staffPhone}
                      onChange={(e) => setStaffPhone(e.target.value)}
                      placeholder="+255 754 000 000"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Initial Password *</label>
                    <input
                      type="password"
                      required
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md pt-2"
                  >
                    Save & Provision Staff Account
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 5: EMERGENCY REPAIRS */}
      {activeAdminTab === 'repairs' && (
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Emergency Repair Ticket Dispatches
          </h2>

          <div className="space-y-3">
            {repairRequests.map((rr) => (
              <div
                key={rr.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-sm text-xs"
              >
                <div className="flex justify-between items-center font-bold">
                  <span className="font-mono text-rose-600">#{rr.requestNumber} - {rr.equipmentType}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      (rr.status as string) === 'Resolved' || (rr.status as string) === 'Completed' || (rr.status as string) === 'Imerekebishwa'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {((rr.status as string) === 'Resolved' || (rr.status as string) === 'Completed' || (rr.status as string) === 'Imerekebishwa') ? '✅ ' : ''}{rr.status}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">{rr.priority}</span>
                  </div>
                </div>
                <p>Client: {rr.customerName} ({rr.phone})</p>
                <p className="italic text-slate-500">"{rr.description}"</p>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <select
                      onChange={(e) => {
                        const techId = e.target.value;
                        if (!techId) return;
                        const selectedTech = users.find((u) => u.id === techId);
                        if (selectedTech) {
                          dispatchTechnician(rr.id, selectedTech.name, selectedTech.phone, selectedTech.id, selectedTech.email);
                          showToast({
                            title: 'Fundi wa Dharura Amepangwa! 🚨',
                            message: `Tiketi imetumwa kwa fundi: ${selectedTech.name}.`,
                            type: 'success',
                          });
                        }
                      }}
                      defaultValue=""
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      <option value="" disabled>-- Panga Fundi wa Dharura --</option>
                      {users
                        .filter((u) => u.role === 'TECHNICIAN')
                        .map((tech) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.name} ({tech.phone || tech.email})
                          </option>
                        ))}
                      {users.filter((u) => u.role === 'TECHNICIAN').length === 0 && (
                        <option value="fallback" disabled>Hakuna Mafundi waliopo</option>
                      )}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    {rr.assignedTechnician && (
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                        Fundi: {rr.assignedTechnician} ({rr.techResponseStatus || 'PENDING'})
                      </span>
                    )}

                    <button
                      onClick={() => updateRepairStatus(rr.id, 'Resolved')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 6: WARRANTY CLAIMS */}
      {activeAdminTab === 'warranty' && (
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Hardware Replacement Warranty Claims
          </h2>

          <div className="space-y-3">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-sm text-xs"
              >
                <div className="flex justify-between font-bold">
                  <span className="font-mono text-amber-600">#{claim.claimNumber}</span>
                  <span className="text-purple-600">{claim.status}</span>
                </div>
                <p className="font-bold">{claim.productName}</p>
                <p className="text-slate-500">Defect: "{claim.issueDescription}"</p>
                {claim.status === 'Under Inspection' && (
                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => approveClaim(claim.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold"
                    >
                      Approve & Replace
                    </button>
                    <button
                      onClick={() => rejectClaim(claim.id, 'Physical damage not covered by standard warranty')}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold"
                    >
                      Reject Claim
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 7: REVIEWS */}
      {activeAdminTab === 'reviews' && (
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Customer Feedback & Moderation
          </h2>

          <div className="space-y-3">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-sm text-xs"
              >
                <div className="flex justify-between font-bold">
                  <span>{rev.customerName}</span>
                  <span className="text-amber-500">★ {rev.rating}/5</span>
                </div>
                <p className="italic">"{rev.comment}"</p>

                {rev.adminReply && (
                  <p className="text-amber-600 font-bold">Manager Reply: {rev.adminReply}</p>
                )}

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => togglePinReview(rev.id)}
                    className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    {rev.isPinned ? 'Unpin' : 'Pin to Homepage'}
                  </button>
                  <button
                    onClick={() => replyToReview(rev.id, 'Asante sana kwa ushirikiano na YMA ENERGY GROUP!')}
                    className="px-3 py-1 rounded-lg bg-amber-500 text-white font-bold"
                  >
                    Add Official Swahili Reply
                  </button>
                  <button
                    onClick={() =>
                      promptDelete(
                        'Thibitisha Kufuta Maoni',
                        'Je, una uhakika unataka kufuta maoni haya ya mteja?',
                        () => deleteReview(rev.id)
                      )
                    }
                    className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB: CUSTOMER INQUIRIES */}
      {activeAdminTab === 'inquiries' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                <span>Ujumbe wa Wateja kutoka Contact Us ({inquiriesList.length})</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ujumbe wote unaotumwa na wateja kupitia ukurasa wa 'Contact Us' huingia hapa moja kwa moja kwa muunganiko wa Firebase.
              </p>
            </div>
          </div>

          {inquiriesList.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800">
              <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Hakuna ujumbe mpya kwa sasa.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Ujumbe wowote utakaotumwa kwenye ukurasa wa Wasiliana Nasi utatokea hapa papo hapo.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inquiriesList.map((inq) => {
                const cleanPhone = (inq.phone || '').replace(/[^0-9]/g, '');
                return (
                  <div
                    key={inq._docId || inq.id}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-sm hover:shadow-md transition-shadow relative"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                            {inq.customerName || 'Mteja Anayeulizia'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                            #{inq.inquiryNumber || 'MSG'}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-amber-500" />
                          <span>{inq.phone}</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" />
                          <span>
                            {inq.createdAt ? new Date(inq.createdAt).toLocaleDateString() : 'Leo'}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      "{inq.message}"
                    </div>

                    <div className="pt-1 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {cleanPhone && (
                          <>
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Jibu WhatsApp</span>
                            </a>

                            <a
                              href={`tel:${inq.phone}`}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5 text-amber-400" />
                              <span>Piga Simu</span>
                            </a>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() =>
                          promptDelete(
                            'Thibitisha Kufuta Ujumbe',
                            `Je, una uhakika unataka kufuta ujumbe huu kutoka kwa ${inq.customerName}?`,
                            async () => {
                              try {
                                await deleteDoc(doc(db, 'inquiries', inq._docId || inq.id));
                                showToast({ title: 'Imefutwa', message: 'Ujumbe umefutwa kikamilifu!', type: 'success' });
                              } catch (err) {
                                console.error('Error deleting inquiry:', err);
                                showToast({ title: 'Hitilafu', message: 'Imeshindwa kufuta ujumbe.', type: 'error' });
                              }
                            }
                          )
                        }
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Futa Ujumbe"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB: EMAIL NOTIFICATIONS & REAL-TIME ALERTS */}
      {activeAdminTab === 'emails' && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950 border border-slate-800 text-white shadow-lg space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[10px] font-extrabold uppercase tracking-wider border border-amber-500/30">
                  ⚡ Real-time Email Trigger Engine
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-white mt-2 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-amber-400" />
                  <span>Admin Real-Time Email Notifications</span>
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Mfumo huu unatuma barua pepe za tahadhari kwa msimamizi (Admin Team) pindi tu Mteja anapoweka <b>Oda Mpya (New Order)</b> au kutuma <b>Ombi la Matengenezo (Repair Request)</b>.
                </p>
              </div>

              <button
                onClick={async () => {
                  const targetEmail = (companySettings?.companyEmail || '').trim();
                  if (!targetEmail) {
                    showToast({
                      title: 'Weka Barua Pepe Kwanza',
                      message: 'Tafadhali weka barua pepe ya kampuni kwenye fomu ya Mawasiliano hapo juu kabla ya kutuma jaribio.',
                      type: 'warning',
                    });
                    return;
                  }
                  setIsSendingTestEmail(true);
                  try {
                    const res = await fetch('/api/test-email', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ targetEmail }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      showToast({ title: 'Barua Pepe Imetumwa!', message: data.message || `Test alert sent to ${targetEmail}`, type: 'success' });
                    } else {
                      showToast({ title: 'Hitilafu', message: data.error || 'Failed to send test email', type: 'error' });
                    }
                  } catch (e: any) {
                    showToast({ title: 'Hitilafu ya Mtandao', message: e.message, type: 'error' });
                  } finally {
                    setIsSendingTestEmail(false);
                  }
                }}
                disabled={isSendingTestEmail}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition-all shrink-0 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>{isSendingTestEmail ? t('sendingTestEmail', 'Inatuma Jaribio...') : t('sendTestAlertBtn', 'Tuma Barua Pepe ya Jaribio')}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <p className="text-[10px] text-slate-400">Target Admin / Customer Support Email</p>
                <p className="font-bold text-amber-400 truncate">{companySettings?.companyEmail || 'Haijawekwa (Not Set)'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <p className="text-[10px] text-slate-400">Trigger Status</p>
                <p className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ACTIVE & SYNCED</span>
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <p className="text-[10px] text-slate-400">SMTP Integration</p>
                <p className="font-bold text-slate-200">Nodemailer + Fallback Log</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>{t('dispatchedEmailAlertsTitle', 'Kumbukumbu za Barua Pepe Zilizotumwa')}</span>
            </h3>

            {emailAlertsList.length === 0 ? (
              <div className="p-10 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <Mail className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Hakuna tahadhari za barua pepe zilizorekodiwa bado.
                </p>
                <p className="text-xs text-slate-400">
                  Ukiweka oda mpya au ombi la matengenezo, barua pepe itatumwa mara moja na kuonekana hapa.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {emailAlertsList.map((log) => (
                  <div
                    key={log._docId || log.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow space-y-2"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                          log.type === 'order' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                            : log.type === 'repair'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          {log.type === 'order' ? '🛒 Order Alert' : log.type === 'repair' ? '🔧 Repair Alert' : '📩 Inquiry Alert'}
                        </span>
                        <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                          {log.subject}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-slate-400">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Leo'}
                        </span>
                        <button
                          onClick={() => {
                            promptDelete(
                              'Futa Kumbukumbu ya Email',
                              'Je, una uhakika unataka kufuta kumbukumbu hii?',
                              async () => {
                                try {
                                  await deleteDoc(doc(db, 'email_notifications', log._docId || log.id));
                                  showToast({ title: 'Imefutwa', message: 'Kumbukumbu imefutwa!', type: 'success' });
                                } catch (err) {
                                  showToast({ title: 'Hitilafu', message: 'Imeshindwa kufuta.', type: 'error' });
                                }
                              }
                            );
                          }}
                          className="text-rose-500 hover:text-rose-600 p-1"
                          title="Futa Kumbukumbu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <span>Mpokeaji (Recipient): <b className="text-slate-700 dark:text-slate-300 font-mono">{log.recipient}</b></span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-extrabold">
                        {log.status || 'DISPATCHED'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB: LIVE CUSTOMER SMS NOTIFICATION LOGS & SENDER */}
      {activeAdminTab === 'sms' && (
        <div className="space-y-6">
          {/* Top Banner Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                    <span>Mfumo wa Ujumbe wa SMS kwa Wateja</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      LIVE GATEWAY
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Wateja wanapokea SMS kiotomatiki mara moja fundi anapopangiwa na kazi inapowekwa kuwa imekamilika.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
                  Sender ID: <strong className="text-amber-400">YMA_ENERGY</strong>
                </span>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Jumla ya SMS Zilizotumwa</p>
                <p className="text-xl font-black text-white mt-1">{smsLogsList.length}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                <p className="text-[11px] text-sky-400 font-bold uppercase tracking-wider">Fundi Apangiwa</p>
                <p className="text-xl font-black text-sky-300 mt-1">
                  {smsLogsList.filter((s) => s.type === 'technician_assigned' || s.type === 'repair_assigned').length}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">Kazi Imekamilika</p>
                <p className="text-xl font-black text-emerald-300 mt-1">
                  {smsLogsList.filter((s) => s.type === 'job_completed' || s.type === 'repair_completed').length}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">Hali ya Gateway</p>
                <p className="text-sm font-black text-amber-300 mt-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Inafanya Kazi
                </p>
              </div>
            </div>
          </div>

          {/* Test SMS Dispatch Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-sky-500" />
                  <span>Jaribu Kutuma SMS ya Majaribio (Test SMS)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ingiza namba yoyote ya simu (mfano 0712345678) ili kujiridhisha kuwa mteja anapokea ujumbe.
                </p>
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!testSmsPhone) {
                  showToast({ title: 'Weka Namba ya Simu', message: 'Tafadhali weka namba ya simu ya mpokeaji.', type: 'warning' });
                  return;
                }
                setIsSendingTestSms(true);
                try {
                  const res = await sendCustomerSms({
                    recipient: testSmsPhone,
                    message: testSmsMessage || 'Habari! Huu ni ujumbe wa majaribio kutoka YMA ENERGY GROUP. Mfumo wa SMS kwa wateja unafanya kazi kikamilifu!',
                    type: 'test',
                    customerName: 'Mteja wa Majaribio',
                  });
                  if (res.success) {
                    showToast({
                      title: 'SMS ya Majaribio Imetumwa! 📲',
                      message: res.message || `Ujumbe umetumwa kwa ${testSmsPhone}.`,
                      type: 'success',
                    });
                    setTestSmsPhone('');
                    setTestSmsMessage('');
                  } else {
                    showToast({ title: 'Hitilafu', message: res.message, type: 'error' });
                  }
                } catch (err: any) {
                  showToast({ title: 'Hitilafu', message: err.message, type: 'error' });
                } finally {
                  setIsSendingTestSms(false);
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Namba ya Simu ya Mteja
                </label>
                <input
                  type="text"
                  placeholder="07XXXXXXXX au 255XXXXXXXXX"
                  value={testSmsPhone}
                  onChange={(e) => setTestSmsPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ujumbe Maalum (Hiari)
                </label>
                <input
                  type="text"
                  placeholder="Acha wazi kutumia ujumbe wa kawaida..."
                  value={testSmsMessage}
                  onChange={(e) => setTestSmsMessage(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isSendingTestSms}
                  className="w-full p-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingTestSms ? 'Inatuma...' : 'Tuma SMS ya Jaribio'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* SMS History List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Kumbukumbu za Ujumbe wa SMS Zilizotumwa kwa Wateja ({smsLogsList.length})</span>
              </h3>
            </div>

            {smsLogsList.length === 0 ? (
              <div className="p-10 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <Smartphone className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Hakuna ujumbe wa SMS uliorekodiwa bado.
                </p>
                <p className="text-xs text-slate-400">
                  Pindi mhandisi atakapopangiwa huduma au kazi ikikamilika, ujumbe utatumwa kwa mteja na kuonekana hapa moja kwa moja.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {smsLogsList.map((log) => {
                  const isTechAssigned = log.type === 'technician_assigned' || log.type === 'repair_assigned';
                  const isCompleted = log.type === 'job_completed' || log.type === 'repair_completed';

                  return (
                    <div
                      key={log._docId || log.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow space-y-2.5"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                              isTechAssigned
                                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                                : isCompleted
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {isTechAssigned
                              ? '👷‍♂️ Fundi Apangiwa'
                              : isCompleted
                              ? '✅ Kazi Imekamilika'
                              : '📱 Taarifa ya SMS'}
                          </span>
                          <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                            Mteja: {log.customerName || 'Mteja'} ({log.recipient})
                          </span>
                          {log.requestNumber && (
                            <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                              #{log.requestNumber}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-slate-400">
                            {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Hivi Punde'}
                          </span>
                          <button
                            onClick={() => {
                              promptDelete(
                                'Futa Kumbukumbu ya SMS',
                                'Je, una uhakika unataka kufuta kumbukumbu hii ya SMS?',
                                async () => {
                                  try {
                                    await deleteDoc(doc(db, 'sms_notifications', log._docId || log.id));
                                    showToast({ title: 'Imefutwa', message: 'Kumbukumbu imefutwa!', type: 'success' });
                                  } catch (err) {
                                    showToast({ title: 'Hitilafu', message: 'Imeshindwa kufuta.', type: 'error' });
                                  }
                                }
                              );
                            }}
                            className="text-rose-500 hover:text-rose-600 p-1"
                            title="Futa Kumbukumbu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* SMS Text Content */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200">
                        {log.message}
                      </div>

                      {/* Footer Info & Quick Contact Options */}
                      <div className="flex items-center justify-between flex-wrap gap-2 text-xs pt-1">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-extrabold flex items-center gap-1">
                            <CheckCheck className="w-3 h-3" />
                            {log.status || 'SENT'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Provider: <strong className="text-slate-700 dark:text-slate-300">{log.provider || 'YMA SMS'}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Resend SMS Button */}
                          <button
                            onClick={() => {
                              sendCustomerSms({
                                recipient: log.recipient,
                                message: log.message,
                                type: log.type,
                                customerName: log.customerName,
                                requestNumber: log.requestNumber,
                              }).then((res) => {
                                showToast({
                                  title: res.success ? 'SMS Imetumwa Tena! 📲' : 'Hitilafu ❌',
                                  message: res.message,
                                  type: res.success ? 'success' : 'error',
                                });
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 text-[11px] font-bold border border-sky-200 dark:border-sky-800 hover:bg-sky-100"
                          >
                            Tuma Tena
                          </button>

                          {/* WhatsApp Link */}
                          <a
                            href={getWhatsAppLink(log.recipient, log.message)}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 flex items-center gap-1"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>

                          {/* Native SMS Link */}
                          <a
                            href={getNativeSmsLink(log.recipient, log.message)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-200 flex items-center gap-1"
                          >
                            <Smartphone className="w-3 h-3" />
                            <span>SMS ya Simu</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 8: FIREBASE DATA INSPECTOR */}
      {activeAdminTab === 'firebase' && <FirebaseDataInspector />}

      {/* Branch Management Modal */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {editingBranch ? t('editBranchTitle', 'Hariri Taarifa za Tawi') : t('addBranchTitle', 'Ongeza Tawi Jipya')}
                </h3>
              </div>
              <button
                onClick={() => setIsBranchModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('branchNameLabel', 'Jina la Tawi')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="mf. Mbeya Southern Highlands Hub"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('branchCityLabel', 'Mji / Mkoa')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={branchCity}
                    onChange={(e) => setBranchCity(e.target.value)}
                    placeholder="mf. Mbeya"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t('branchAddressLabel', 'Anwani Halisi ya Tawi')} *
                </label>
                <input
                  type="text"
                  required
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  placeholder="mf. Plot 44, Uhuru Road, Opposite CRDB Bank"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('branchPhoneLabel', 'Namba ya Simu ya Tawi')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={branchPhone}
                    onChange={(e) => setBranchPhone(e.target.value)}
                    placeholder="mf. +255 754 112 233"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('branchEmailLabel', 'Barua Pepe ya Tawi')} *
                  </label>
                  <input
                    type="email"
                    required
                    value={branchEmail}
                    onChange={(e) => setBranchEmail(e.target.value)}
                    placeholder="mf. mbeya@ymaenergy.com"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('workingHoursLabel', 'Saa za Kazi')}
                  </label>
                  <input
                    type="text"
                    value={branchHours}
                    onChange={(e) => setBranchHours(e.target.value)}
                    placeholder="mf. Jumatatu - Jumamosi: 08:00 - 18:00"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('branchManagerLabel', 'Meneja wa Tawi')}
                  </label>
                  <input
                    type="text"
                    value={branchManager}
                    onChange={(e) => setBranchManager(e.target.value)}
                    placeholder="mf. Eng. Joseph Kimaro"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    GPS Latitude (Lat)
                  </label>
                  <input
                    type="text"
                    value={branchLat}
                    onChange={(e) => setBranchLat(e.target.value)}
                    placeholder="-6.772"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    GPS Longitude (Lng)
                  </label>
                  <input
                    type="text"
                    value={branchLng}
                    onChange={(e) => setBranchLng(e.target.value)}
                    placeholder="39.231"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-1 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="branchIsHq"
                  checked={branchIsHq}
                  onChange={(e) => setBranchIsHq(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="branchIsHq" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  Tawi hili ni Makao Makuu (Headquarters)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md"
                >
                  {editingBranch ? 'Hifadhi Mabadiliko' : 'Ongeza Tawi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Gateway Modal */}
      <AdminPaymentGatewayModal
        isOpen={isGatewayModalOpen}
        onClose={() => setIsGatewayModalOpen(false)}
        gatewayToEdit={selectedGatewayToEdit}
      />

      {/* Reusable Confirm Delete / Logout Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type="delete"
      />

      {/* Branch Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!branchToDelete}
        onClose={() => setBranchToDelete(null)}
        onConfirm={handleConfirmDeleteBranch}
        title="Thibitisha Kufuta Tawi"
        message={`Je, unahakika unataka kufuta tawi la "${branchToDelete?.name}"? Hatua hii haitaweza kurudishwa.`}
        confirmText="Ndio, Futa Tawi"
        cancelText="Ghairi"
        type="delete"
        isLoading={isDeletingBranch}
      />
    </div>
  );
};

