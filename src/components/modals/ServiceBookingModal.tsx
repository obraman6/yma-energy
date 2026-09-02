import React, { useState } from 'react';
import {
  X,
  Wrench,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle2,
  Send,
  Loader2,
} from 'lucide-react';
import { SolarService, ServiceRequest } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useServicesStore } from '../../store/useServicesStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';

interface ServiceBookingModalProps {
  service: SolarService | null;
  isOpen: boolean;
  onClose: () => void;
  onRequireAuth?: () => void;
  onOpenTechnicianStatusModal?: (item: ServiceRequest) => void;
}

export const ServiceBookingModal: React.FC<ServiceBookingModalProps> = ({
  service,
  isOpen,
  onClose,
  onRequireAuth,
  onOpenTechnicianStatusModal,
}) => {
  const { t, language } = useLanguage();
  const { createServiceRequest } = useServicesStore();
  const { user } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);

  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [timeSlot, setTimeSlot] = useState<'Morning' | 'Afternoon' | 'Evening'>('Morning');
  const [roofType, setRoofType] = useState('Bungalow');
  const [priority, setPriority] = useState<'Normal' | 'Urgent'>('Normal');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submittedReq, setSubmittedReq] = useState<ServiceRequest | null>(null);

  if (!isOpen || !service) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!user) {
      showToast({
        title: 'Ingia kwenye Akaunti (Login Required) 🔒',
        message: 'Tafadhali ingia au jisajili kwanza ili uweze kuweka miadi ya huduma.',
        type: 'warning',
      });
      onRequireAuth?.();
      return;
    }

    if (!region.trim() || !district.trim() || !preferredDate) {
      showToast({
        title: 'Taarifa Hazijakamilika 📍',
        message: 'Tafadhali chagua Mkoa, ujaze Wilaya na Tarehe unayohitaji huduma.',
        type: 'warning',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const req = await createServiceRequest({
        serviceId: service.id,
        serviceName: service.name,
        userId: user.id,
        customerName: fullName || user.name,
        phone: phone || user.phone || '',
        email: email || user.email,
        region,
        district,
        preferredDate,
        timeSlot,
        roofType,
        priority,
        notes,
      });

      setSubmittedReq(req);
    } catch (err) {
      console.error('Error in service booking submission:', err);
      showToast({
        title: 'Hitilafu ya Kutuma Ombi',
        message: 'Kuna tatizo limetokea wakati wa kutuma ombi. Tafadhali jaribu tena.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {t('serviceBookingTitle')}
              </h2>
              <p className="text-xs text-amber-100 font-medium">
                {language === 'sw' ? service.nameSw : service.name}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSubmittedReq(null);
              onClose();
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {submittedReq ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {t('bookingSuccess')}
                </h3>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-500 mt-2 font-mono">
                  {submittedReq.requestNumber}
                </p>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Timu yetu ya wahandisi wa solar inakagua ombi lako. Unaweza kufuatilia status ya fundi wako muda wowote kwa wakati halisi.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                {onOpenTechnicianStatusModal && (
                  <button
                    onClick={() => {
                      const req = submittedReq;
                      setSubmittedReq(null);
                      onClose();
                      onOpenTechnicianStatusModal(req);
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>Fuatilia Status ya Fundi Mara Moja (Live Tracking)</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setSubmittedReq(null);
                    onClose();
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs"
                >
                  Funga (Done)
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Customer Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {t('fullName')} *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {t('phoneNumber')} *
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Email & Location Pin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {t('region')} *
                  </label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {t('district')} *
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {t('preferredDate')} *
                  </label>
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {t('preferredTime')} *
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value as any)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                  >
                    <option value="Morning">{t('morning')}</option>
                    <option value="Afternoon">{t('afternoon')}</option>
                    <option value="Evening">{t('evening')}</option>
                  </select>
                </div>
              </div>

              {/* House Type & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'sw' ? 'Aina ya Nyumba (House Type) *' : 'House Type *'}
                  </label>
                  <input
                    type="text"
                    value={roofType}
                    onChange={(e) => setRoofType(e.target.value)}
                    placeholder={language === 'sw' ? 'Andika au chagua (mf. Bungalow, Ghorofa, Villa, Ofisi...)' : 'Type house type (e.g. Bungalow, Storey Building, Office, Villa...)'}
                    list="house-type-suggestions"
                    required
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <datalist id="house-type-suggestions">
                    <option value="Bungalow (Nyumba ya Chini)" />
                    <option value="Ghorofa (Storey Building)" />
                    <option value="Apartment / Makazi" />
                    <option value="Villa / Mjengo wa Kisasa" />
                    <option value="Ofisi / Jengo la Biashara (Commercial)" />
                    <option value="Kiwanda / Ghala (Warehouse)" />
                    <option value="Kibanda / Nyumba Ndogo" />
                  </datalist>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {['Bungalow', 'Ghorofa', 'Villa', 'Ofisi / Biashara', 'Kiwanda'].map((suggested) => (
                      <button
                        key={suggested}
                        type="button"
                        onClick={() => setRoofType(suggested)}
                        className={`px-2 py-0.5 text-[10px] rounded-md border transition-all ${
                          roofType.toLowerCase().includes(suggested.toLowerCase())
                            ? 'bg-amber-500 text-white border-amber-500 font-bold'
                            : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        + {suggested}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {t('priorityLevel')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPriority('Normal')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-colors ${
                        priority === 'Normal'
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {t('normalPriority')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriority('Urgent')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-colors ${
                        priority === 'Urgent'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      🚨 Urgent
                    </button>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('additionalNotes')}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="E.g., High roof height (2-story building), needs extra 30m cabling..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Estimated Price Footer */}
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">
                    {t('basePrice')}
                  </span>
                  <span className="text-base font-extrabold text-amber-600 dark:text-amber-500">
                    TZS {service.basePriceTzs.toLocaleString()}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                    isSubmitting
                      ? 'bg-amber-400/80 text-white cursor-not-allowed opacity-80'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-500/20 active:scale-95'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{language === 'sw' ? 'Inatuma Ombi...' : 'Submitting Request...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{t('submitBooking')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
