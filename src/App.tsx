import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { Footer } from './components/layout/Footer';
import { ConcentricSpinner } from './components/common/ConcentricSpinner';

// Views
import { HomeView } from './components/views/HomeView';
import { ShopView } from './components/views/ShopView';
import { ServicesView } from './components/views/ServicesView';
import { RepairsView } from './components/views/RepairsView';
import { CartView } from './components/views/CartView';
import { AccountView } from './components/views/AccountView';
import { AdminDashboardView } from './components/views/AdminDashboardView';
import { TechnicianDashboardView } from './components/views/TechnicianDashboardView';
import { AccessDeniedView } from './components/views/AccessDeniedView';
import { AboutView } from './components/views/AboutView';
import { ContactView } from './components/views/ContactView';

// Modals
import { ProductDetailModal } from './components/modals/ProductDetailModal';
import { ServiceBookingModal } from './components/modals/ServiceBookingModal';

import { ElectronicInvoiceModal } from './components/modals/ElectronicInvoiceModal';
import { LiveDeliveryModal } from './components/modals/LiveDeliveryModal';
import { WarrantyClaimModal } from './components/modals/WarrantyClaimModal';
import { QrScannerModal } from './components/modals/QrScannerModal';
import { LiveChatModal } from './components/modals/LiveChatModal';
import { LiveTechnicianModal } from './components/modals/LiveTechnicianModal';
import { BranchMapModal } from './components/modals/BranchMapModal';
import { ReportExportModal } from './components/modals/ReportExportModal';
import { AdminProductModal } from './components/modals/AdminProductModal';
import { AdminServiceModal } from './components/modals/AdminServiceModal';
import { WishlistModal } from './components/modals/WishlistModal';
import { AuthModal } from './components/modals/AuthModal';
import { ToastContainer } from './components/layout/ToastContainer';

import { Product, SolarService, Order, Branch, Warranty, ServiceRequest, RepairRequest } from './types';
import { useOrdersStore } from './store/useOrdersStore';
import { useRepairsStore } from './store/useRepairsStore';
import { useAuthStore } from './store/useAuthStore';
import { useCompanySettingsStore } from './store/useCompanySettingsStore';

function MainAppContent() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
  const [isStandaloneApp, setIsStandaloneApp] = useState<boolean>(false);
  const { language } = useLanguage();
  const { settings } = useCompanySettingsStore();
  const enableShopModule = settings.enableShopModule !== false;

  // Auto redirect if shop is disabled and user is on shop or cart tab
  useEffect(() => {
    if (!enableShopModule && (activeTab === 'shop' || activeTab === 'cart')) {
      setActiveTab('services');
    }
  }, [enableShopModule, activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandaloneApp(isStandalone);
    };
    checkStandalone();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => setIsStandaloneApp(e.matches);
    try {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } catch {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // Modal visibility states
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<SolarService | null>(null);
  const [selectedTechnicianItem, setSelectedTechnicianItem] = useState<ServiceRequest | RepairRequest | null>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<Order | null>(null);
  const [selectedWarrantyForClaim, setSelectedWarrantyForClaim] = useState<Warranty | null>(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);
  const [selectedBranchForMap, setSelectedBranchForMap] = useState<Branch | null>(null);
  const [isReportExportOpen, setIsReportExportOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Admin Modals
  const [isAdminProductModalOpen, setIsAdminProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isAdminServiceModalOpen, setIsAdminServiceModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<SolarService | null>(null);

  const orders = useOrdersStore((s) => s.orders) || [];
  const repairRequests = useRepairsStore((s) => s.repairRequests) || [];
  const user = useAuthStore((s) => s.user);

  // Computed metrics for PDF report modal
  const totalRevenue = orders.reduce((sum, o) => sum + (o?.totalAmountTzs || 0), 0);

  const handleOrderPlaced = (order: Order) => {
    setSelectedOrderForInvoice(order);
  };

  const handleQrScanResult = (code: string) => {
    alert(`QR Code Scanned Successfully! Serial Code: ${code}`);
  };

  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 space-y-6">
        {/* Logo & Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3 animate-fade-in">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <img
              src="/logo.svg"
              alt="YMA Energy Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <h1 className="font-extrabold text-2xl sm:text-3xl tracking-tight text-slate-100 flex items-center justify-center gap-1.5">
              YMA <span className="text-amber-500">ENERGY</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                GROUP
              </span>
            </h1>
            <p className="text-xs text-amber-400/90 font-medium tracking-wide mt-0.5">
              Electrical &amp; Solar Power Systems
            </p>
          </div>
        </div>

        {/* Concentric Double Spinner with center logo */}
        <ConcentricSpinner
          size="lg"
          logoSrc="/logo.svg"
          text={language === 'sw' ? 'Inafunguka Mfumo wa YMA...' : 'Opening YMA System...'}
          subtext={
            language === 'sw'
              ? 'Inapakia kwa haraka na usalama ⚡'
              : 'Fast & secure system loading ⚡'
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-white transition-colors duration-300">
          {/* Header */}
          <Header
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            openProductModal={(prod) => setSelectedProductForModal(prod)}
            openWishlistModal={() => setIsWishlistOpen(true)}
            openAuthModal={() => setIsAuthOpen(true)}
          />

          {/* Toast Container */}
          <ToastContainer />

          {/* Main Body View Container */}
          <main className="flex-1 max-w-[1440px] w-full mx-auto px-2.5 sm:px-4 lg:px-6 py-2.5 sm:py-3.5 lg:py-4">
            {activeTab === 'home' && (
              <HomeView
                setActiveTab={setActiveTab}
                openProductModal={(prod) => setSelectedProductForModal(prod)}
                openBranchMapModal={(branch) => setSelectedBranchForMap(branch)}
                openAuthModal={() => setIsAuthOpen(true)}
              />
            )}

            {activeTab === 'shop' && (
              <ShopView
                openProductModal={(prod) => setSelectedProductForModal(prod)}
                openAuthModal={() => setIsAuthOpen(true)}
              />
            )}

            {activeTab === 'services' && (
              <ServicesView
                onSelectService={(service) => setSelectedServiceForModal(service)}
                openAuthModal={() => setIsAuthOpen(true)}
              />
            )}

            {activeTab === 'repairs' && (
              <RepairsView
                openAuthModal={() => setIsAuthOpen(true)}
                onOpenTechnicianStatusModal={(item) => setSelectedTechnicianItem(item)}
              />
            )}

            {activeTab === 'about' && <AboutView setActiveTab={setActiveTab} />}

            {activeTab === 'contact' && (
              <ContactView
                openBranchMapModal={(branch) => setSelectedBranchForMap(branch)}
              />
            )}

            {activeTab === 'cart' && (
              <CartView
                setActiveTab={setActiveTab}
                onOrderPlaced={handleOrderPlaced}
                openAuthModal={() => setIsAuthOpen(true)}
              />
            )}

            {activeTab === 'account' && (
              <AccountView
                onOpenAdminConsole={() => setActiveTab('admin')}
                onOpenTechnicianPortal={() => setActiveTab('technician')}
                onOpenInvoiceModal={(ord) => setSelectedOrderForInvoice(ord)}
                onOpenDeliveryModal={(ord) => setSelectedOrderForDelivery(ord)}
                onOpenClaimModal={(warr) => setSelectedWarrantyForClaim(warr)}
                onOpenQrScanner={() => setIsQrScannerOpen(true)}
                onOpenLiveChat={() => setIsLiveChatOpen(true)}
                onOpenWishlistModal={() => setIsWishlistOpen(true)}
                onOpenTechnicianStatusModal={(item) => setSelectedTechnicianItem(item)}
              />
            )}

            {activeTab === 'technician' &&
              (!user || user.role !== 'TECHNICIAN' ? (
                <AccessDeniedView
                  onGoHome={() => setActiveTab('home')}
                  onOpenAuth={() => setIsAuthOpen(true)}
                />
              ) : (
                <TechnicianDashboardView onBackToAccount={() => setActiveTab('account')} />
              ))}

            {activeTab === 'admin' &&
              (!user ||
              (user.role !== 'SUPER_ADMIN' &&
                user.role !== 'STAFF_ADMIN' &&
                user.role !== 'ADMIN' &&
                user.role !== 'MANAGER') ? (
                <AccessDeniedView
                  onGoHome={() => setActiveTab('home')}
                  onOpenAuth={() => setIsAuthOpen(true)}
                />
              ) : (
                <AdminDashboardView
                  onBackToCustomerView={() => setActiveTab('home')}
                  onOpenReportModal={() => setIsReportExportOpen(true)}
                  onOpenAddProductModal={() => {
                    setProductToEdit(null);
                    setIsAdminProductModalOpen(true);
                  }}
                  onOpenEditProductModal={(prod) => {
                    setProductToEdit(prod);
                    setIsAdminProductModalOpen(true);
                  }}
                  onOpenAddServiceModal={() => {
                    setServiceToEdit(null);
                    setIsAdminServiceModalOpen(true);
                  }}
                  onOpenEditServiceModal={(srv) => {
                    setServiceToEdit(srv);
                    setIsAdminServiceModalOpen(true);
                  }}
                />
              ))}
          </main>

          {/* Full-width Responsive Footer: Visible across all customer views */}
          {activeTab !== 'admin' && activeTab !== 'technician' && (
            <Footer setActiveTab={setActiveTab} />
          )}

          {/* Bottom Navigation for Mobile & Tablet */}
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* All Interactive Application Modals */}
          <ProductDetailModal
            product={selectedProductForModal}
            isOpen={!!selectedProductForModal}
            onClose={() => setSelectedProductForModal(null)}
            onGoToCart={() => setActiveTab('cart')}
            onRequireAuth={() => setIsAuthOpen(true)}
          />

          <ServiceBookingModal
            service={selectedServiceForModal}
            isOpen={!!selectedServiceForModal}
            onClose={() => setSelectedServiceForModal(null)}
            onRequireAuth={() => setIsAuthOpen(true)}
            onOpenTechnicianStatusModal={(item) => setSelectedTechnicianItem(item)}
          />

          <LiveTechnicianModal
            item={selectedTechnicianItem}
            isOpen={!!selectedTechnicianItem}
            onClose={() => setSelectedTechnicianItem(null)}
            onOpenLiveChat={() => setIsLiveChatOpen(true)}
          />

          <ElectronicInvoiceModal
            order={selectedOrderForInvoice}
            isOpen={!!selectedOrderForInvoice}
            onClose={() => setSelectedOrderForInvoice(null)}
          />

          <LiveDeliveryModal
            order={selectedOrderForDelivery}
            isOpen={!!selectedOrderForDelivery}
            onClose={() => setSelectedOrderForDelivery(null)}
          />

          <WarrantyClaimModal
            warranty={selectedWarrantyForClaim}
            isOpen={!!selectedWarrantyForClaim}
            onClose={() => setSelectedWarrantyForClaim(null)}
            onOpenQrScanner={() => setIsQrScannerOpen(true)}
          />

          <QrScannerModal
            isOpen={isQrScannerOpen}
            onClose={() => setIsQrScannerOpen(false)}
            onScanResult={handleQrScanResult}
          />

          <LiveChatModal
            isOpen={isLiveChatOpen}
            onClose={() => setIsLiveChatOpen(false)}
          />

          <BranchMapModal
            branch={selectedBranchForMap}
            isOpen={!!selectedBranchForMap}
            onClose={() => setSelectedBranchForMap(null)}
          />

          <ReportExportModal
            isOpen={isReportExportOpen}
            onClose={() => setIsReportExportOpen(false)}
            metrics={{
              totalRevenue,
              totalOrders: orders.length,
              totalRepairs: repairRequests.length,
            }}
          />

          <AdminProductModal
            productToEdit={productToEdit}
            isOpen={isAdminProductModalOpen}
            onClose={() => setIsAdminProductModalOpen(false)}
          />

          <AdminServiceModal
            isOpen={isAdminServiceModalOpen}
            onClose={() => setIsAdminServiceModalOpen(false)}
            serviceToEdit={serviceToEdit}
          />

          <WishlistModal
            isOpen={isWishlistOpen}
            onClose={() => setIsWishlistOpen(false)}
            onOpenProduct={(prod) => setSelectedProductForModal(prod)}
          />

          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
            onLoginSuccess={(role) => {
              if (role === 'TECHNICIAN') {
                setActiveTab('technician');
              } else if (
                role === 'SUPER_ADMIN' ||
                role === 'STAFF_ADMIN' ||
                role === 'ADMIN' ||
                role === 'MANAGER'
              ) {
                setActiveTab('admin');
              } else {
                setActiveTab('account');
              }
            }}
          />
        </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <MainAppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}
