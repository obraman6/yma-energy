import React, { useState } from 'react';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Tag,
  MapPin,
  CreditCard,
  Phone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Zap,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCartStore } from '../../store/useCartStore';
import { useOrdersStore } from '../../store/useOrdersStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { usePaymentGatewayStore } from '../../store/usePaymentGatewayStore';
import { PaymentMethod, Order } from '../../types';

interface CartViewProps {
  setActiveTab: (tab: string) => void;
  openLocationPicker: () => void;
  onOrderPlaced: (order: Order) => void;
  openAuthModal?: () => void;
}

export const CartView: React.FC<CartViewProps> = ({
  setActiveTab,
  openLocationPicker,
  onOrderPlaced,
  openAuthModal,
}) => {
  const { t } = useLanguage();
  const {
    items,
    removeFromCart,
    updateQuantity,
    clearCart,
    couponCode,
    isCouponApplied,
    applyCoupon,
    removeCoupon,
    customerName,
    customerPhone,
    shippingAddress,
    selectedRegion,
    paymentMethod,
    paymentPhone,
    transactionRef,
    setShippingInfo,
    setPaymentInfo,
    autoGenerateRef,
  } = useCartStore();

  const { placeOrder } = useOrdersStore();
  const { user } = useAuthStore();
  const { language } = useLanguage();
  const { gateways } = usePaymentGatewayStore();

  // ONLY active payment gateways configured by admin
  const activeGateways = gateways.filter((gw) => gw.isActive);

  // Current active gateway object matching selected paymentMethod
  const currentGateway = activeGateways.find(
    (gw) =>
      gw.name === paymentMethod ||
      gw.nameSw === paymentMethod ||
      (language === 'sw' ? gw.nameSw : gw.name) === paymentMethod
  ) || activeGateways[0];

  // Auto-select valid active gateway if current paymentMethod is disabled or not set
  React.useEffect(() => {
    if (activeGateways.length > 0) {
      const exists = activeGateways.some(
        (gw) =>
          gw.name === paymentMethod ||
          gw.nameSw === paymentMethod ||
          (language === 'sw' ? gw.nameSw : gw.name) === paymentMethod
      );
      if (!exists) {
        const first = activeGateways[0];
        const defaultName = language === 'sw' ? (first.nameSw || first.name) : first.name;
        setPaymentInfo({ paymentMethod: defaultName as PaymentMethod });
      }
    }
  }, [activeGateways, paymentMethod, language, setPaymentInfo]);

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.priceTzs * item.quantity,
    0
  );

  const discountAmount = isCouponApplied ? Math.round((subtotal * 10) / 100) : 0;
  const deliveryFee = 0; // FREE across Tanzania
  const totalPayable = subtotal - discountAmount + deliveryFee;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const success = applyCoupon(inputCoupon);
    if (success) {
      setCouponFeedback(t('couponSuccess'));
    } else {
      setCouponFeedback(t('couponInvalid'));
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0 || isSubmitting) return;

    if (!user) {
      useToastStore.getState().showToast({
        title: 'Ingia kwenye Akaunti (Login Required) 🔒',
        message: 'Tafadhali ingia kwenye akaunti yako kwanza ili kukamilisha oda yako kwa usalama.',
        type: 'warning',
      });
      openAuthModal?.();
      return;
    }

    const finalName = (customerName || user.name || '').trim();
    const finalPhone = (customerPhone || user.phone || '').trim();
    const finalAddress = (shippingAddress || '').trim();
    const finalRegion = (selectedRegion || '').trim();

    if (!finalName || !finalPhone || !finalAddress || !finalRegion) {
      useToastStore.getState().showToast({
        title: 'Taarifa za Anwani Zinatakiwa 📍',
        message: 'Tafadhali jaza Jina, Namba ya Simu, Mkoa na Anwani kamili ya Mtaa/Eneo la kufikishiwa mzigo.',
        type: 'warning',
      });
      return;
    }

    if (!paymentPhone.trim() && !paymentMethod.includes('Bank') && !paymentMethod.includes('Delivery')) {
      useToastStore.getState().showToast({
        title: 'Namba ya Simu ya Malipo Inatakiwa 📱',
        message: 'Tafadhali jaza namba ya simu iliyofanya au inayofanya malipo.',
        type: 'warning',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const newOrder = await placeOrder({
        userId: user.id,
        customerName: finalName,
        customerPhone: finalPhone,
        shippingAddress: finalAddress,
        region: finalRegion,
        paymentMethod,
        paymentRef: transactionRef.trim(),
        paymentPhone: paymentPhone.trim() || finalPhone,
        items,
        subtotalTzs: subtotal,
        discountTzs: discountAmount,
        totalAmountTzs: totalPayable,
      });

      clearCart();
      onOrderPlaced(newOrder);
    } catch (err) {
      console.error('Error placing order:', err);
      useToastStore.getState().showToast({
        title: 'Hitilafu ya Oda',
        message: 'Kuna tatizo wakati wa kutuma oda. Tafadhali jaribu tena.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
          <ShoppingCart className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
          {t('emptyCart')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Browse our high-efficiency solar panels, hybrid inverters, and lithium storage solutions.
        </p>
        <button
          onClick={() => setActiveTab('shop')}
          className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20"
        >
          {t('continueShopping')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
        {t('cartTitle')}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Selected Solar Equipment ({items.length} Items)
              </span>
              <button
                onClick={clearCart}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
              >
                Clear Cart
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item) => (
                <div key={item.product.id} className="py-4 flex items-center gap-4">
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-800 shrink-0"
                  />

                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {item.product.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {item.product.category}
                    </p>
                    <p className="text-xs font-extrabold text-amber-600 dark:text-amber-500 font-mono">
                      TZS {item.product.priceTzs.toLocaleString()}
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 rounded text-slate-600 dark:text-slate-300"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-slate-900 dark:text-slate-100">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 rounded text-slate-600 dark:text-slate-300"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coupon Code Card */}
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-500" />
              <span>{t('promoCoupon')}</span>
            </h3>

            {isCouponApplied ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                <span>Code SOLAR2026 Applied (10% Off)</span>
                <button
                  onClick={removeCoupon}
                  className="text-xs text-rose-600 underline font-semibold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={inputCoupon}
                  onChange={(e) => setInputCoupon(e.target.value)}
                  placeholder="Try SOLAR2026"
                  className="flex-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono uppercase"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs"
                >
                  {t('applyCoupon')}
                </button>
              </form>
            )}

            {couponFeedback && (
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {couponFeedback}
              </p>
            )}
          </div>

          {/* Shipping & Location Section */}
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500" />
              <span>{t('shippingInfo')}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setShippingInfo({ customerName: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setShippingInfo({ customerPhone: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Delivery Street Address & Region
              </label>
              <input
                type="text"
                value={shippingAddress}
                onChange={(e) => setShippingInfo({ shippingAddress: e.target.value })}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>

            <button
              type="button"
              onClick={openLocationPicker}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-amber-500/60 bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-amber-100/50 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              <span>{t('selectLocationMap')} ({selectedRegion})</span>
            </button>
          </div>

          {/* Payment Options */}
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-500" />
              <span>{t('paymentMethod')}</span>
            </h3>

            {/* Radio Options for Active Payment Gateways */}
            {activeGateways.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                <p className="font-extrabold flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Hakuna Njia ya Malipo Iliyowezeshwa Kwa Sasa</span>
                </p>
                <p className="text-[11px] opacity-90">
                  Msimamizi wa mfumo amezima njia zote za malipo kwa muda. Tafadhali wasiliana nasi kwa usaidizi zaidi.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {activeGateways.map((gw) => {
                  const name = language === 'sw' ? (gw.nameSw || gw.name) : gw.name;
                  const isSelected =
                    paymentMethod === name ||
                    paymentMethod === gw.name ||
                    paymentMethod === gw.nameSw;

                  return (
                    <button
                      key={gw.id}
                      type="button"
                      onClick={() => setPaymentInfo({ paymentMethod: name as PaymentMethod })}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-500/50'
                      }`}
                    >
                      <span className="leading-tight">{name}</span>
                      {gw.badge && (
                        <span className={`text-[9px] mt-1 px-1.5 py-0.5 rounded font-extrabold w-fit ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}>
                          {gw.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Merchant Payment Instructions Card */}
            {currentGateway && activeGateways.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 text-xs border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-extrabold text-amber-400">
                    {language === 'sw' ? (currentGateway.nameSw || currentGateway.name) : currentGateway.name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                    {currentGateway.accountNumber}
                  </span>
                </div>

                <div className="space-y-1 text-slate-300 pt-1">
                  <p className="text-[11px]">
                    <strong className="text-slate-200">Jina la Akaunti / Kampuni:</strong> {currentGateway.accountName}
                  </p>
                  <p className="text-[11px]">
                    <strong className="text-slate-200">Namba ya Malipo:</strong> <span className="font-mono text-amber-300 font-bold">{currentGateway.accountNumber}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 italic">
                    {language === 'sw' ? (currentGateway.instructionsSw || currentGateway.instructions) : currentGateway.instructions}
                  </p>
                </div>
              </div>
            )}

            {/* Payment Phone & Transaction Reference Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('paymentPhone')}
                </label>
                <input
                  type="text"
                  value={paymentPhone}
                  onChange={(e) => setPaymentInfo({ paymentPhone: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {t('transactionRef')}
                  </label>
                  <button
                    type="button"
                    onClick={autoGenerateRef}
                    className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Auto Ref</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setPaymentInfo({ transactionRef: e.target.value })}
                  placeholder="e.g. QX981023.11"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono uppercase"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary & Pay Button */}
        <div className="space-y-4">
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4 sticky top-24">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3">
              Order Summary
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>{t('subtotal')}</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  TZS {subtotal.toLocaleString()}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>{t('discount')} (SOLAR2026)</span>
                  <span className="font-mono">- TZS {discountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>{t('deliveryFee')}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {t('freeDelivery')}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between text-base font-black text-slate-900 dark:text-white">
                <span>{t('totalPayable')}</span>
                <span className="font-mono text-amber-600 dark:text-amber-500">
                  TZS {totalPayable.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className={`w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] ${
                isSubmitting ? 'opacity-70 cursor-not-allowed hover:scale-100' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Inatuma Oda...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>{t('payAndPlaceOrder')} (TZS {totalPayable.toLocaleString()})</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-semibold text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>TRA Approved EFD Electronic Fiscal Tax Invoice Included</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
