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
} from 'lucide-react';
import { SolarService } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useServicesStore } from '../../store/useServicesStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';

interface ServiceBookingModalProps {
  service: SolarService | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenMapPicker: () => void;
  onRequireAuth?: () => void;
}

export const ServiceBookingModal: React.FC<ServiceBookingModalProps> = ({
  service,
  isOpen,
  onClose,
  onOpenMapPicker,
  onRequireAuth,
}) => {
  const { t, language } = useLanguage();
  const { createServiceRequest } = useServicesStore();
  const { user } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);

  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [region, setRegion] = useState('Dar es Salaam');
  const [district, setDistrict] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [timeSlot, setTimeSlot] = useState<'Morning' | 'Afternoon' | 'Evening'>('Morning');
  const [roofType, setRoofType] = useState<'Iron Sheet' | 'Tiles' | 'Concrete Slab' | 'Ground Mount'>('Iron Sheet');
  const [priority, setPriority] = useState<'Normal' | 'Urgent'>('Normal');
  const [notes, setNotes] = useState('');

  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  if (!isOpen || !service) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast({
        title: 'Ingia kwenye Akaunti (Login Required) 🔒',
        message: 'Tafadhali ingia au jisajili kwanza ili uweze kuweka miadi ya huduma.',
        type: 'warning',
      });
      onRequireAuth?.();
      return;
    }

    const req = await createServiceRequest({
      serviceId: service.id,
      serviceName: service.name,
      customerName: fullName || user.name,
      phone: phone || user.phone || '',
      email: email || user.email,
      region,
      district,
      streetAddress,
      preferredDate,
      timeSlot,
      roofType,
      priority,
      notes,
    });

    setSubmittedRef(req.requestNumber);
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
              setSubmittedRef(null);
              onClose();
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {submittedRef ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {t('bookingSuccess')}
                </h3>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-500 mt-2 font-mono">
                  {submittedRef}
                </p>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Our solar engineering dispatch team will contact you on{' '}
                <strong className="text-slate-900 dark:text-slate-100">{phone}</strong> within 1 hour to confirm site access.
              </p>

              <button
                onClick={() => {
                  setSubmittedRef(null);
                  onClose();
                }}
                className="mt-4 px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs"
              >
                Done
              </button>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {t('streetAddress')} *
                  </label>
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                    required
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenMapPicker}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-amber-500/60 bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-amber-100/50 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                <span>{t('selectLocationMap')}</span>
              </button>

              {/* Date & Time Slot */}
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

              {/* Roof Type & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {t('roofType')}
                  </label>
                  <select
                    value={roofType}
                    onChange={(e) => setRoofType(e.target.value as any)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                  >
                    <option value="Iron Sheet">{t('ironSheet')}</option>
                    <option value="Tiles">{t('tiles')}</option>
                    <option value="Concrete Slab">{t('concreteSlab')}</option>
                    <option value="Ground Mount">{t('groundMount')}</option>
                  </select>
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
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>{t('submitBooking')}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
