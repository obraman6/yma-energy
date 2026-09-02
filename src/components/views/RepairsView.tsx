import React, { useState } from 'react';
import {
  ShieldAlert,
  Phone,
  Send,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Camera,
  FileText,
  User,
  Wrench,
  ChevronRight,
  Upload,
  X,
  ImageIcon,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useRepairsStore } from '../../store/useRepairsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useCompanySettingsStore } from '../../store/useCompanySettingsStore';
import { useToastStore } from '../../store/useToastStore';



import { RepairRequest } from '../../types';

interface RepairsViewProps {
  openAuthModal?: () => void;
  onOpenTechnicianStatusModal?: (item: RepairRequest) => void;
}

export const RepairsView: React.FC<RepairsViewProps> = ({ openAuthModal, onOpenTechnicianStatusModal }) => {
  const { t, language } = useLanguage();
  const { repairRequests, createRepairTicket } = useRepairsStore();
  const { user } = useAuthStore();
  const { settings, initFirebaseSync: initSettingsSync } = useCompanySettingsStore();
  const showToast = useToastStore((s) => s.showToast);

  React.useEffect(() => {
    initSettingsSync();
  }, [initSettingsSync]);

  const activeHotlinePhone = (settings.emergencyPhone || settings.companyPhone || '').trim();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [region, setRegion] = useState('');

  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Normal' | 'Urgent'>('Urgent');

  // Device Photo Upload state
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string>('');

  const [submittedTicketRef, setSubmittedTicketRef] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        showToast({
          title: 'Ukubwa wa Picha Umezidi (File too large)',
          message: 'Tafadhali chagua picha iliyo chini ya 8MB.',
          type: 'warning',
        });
        return;
      }
      setPhotoFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoUrl(null);
    setPhotoFileName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!user) {
      showToast({
        title: 'Ingia kwenye Akaunti (Login Required) 🔒',
        message: 'Tafadhali ingia au jisajili kwanza ili kuwasilisha ombi la matengenezo.',
        type: 'warning',
      });
      openAuthModal?.();
      return;
    }

    if (!customerName.trim() || !phone.trim() || !region.trim() || !description.trim()) {
      showToast({
        title: 'Taarifa Hazijakamilika 📍',
        message: 'Tafadhali jaza Jina, Simu, Mkoa na Maelezo ya Hitilafu kabla ya kutuma.',
        type: 'warning',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const ticket = await createRepairTicket({
        userId: user.id,
        customerName: customerName || user.name,
        phone: phone || user.phone || '',
        region,
        equipmentType: 'General Repair / N/A',
        description,
        priority,
        hasPhoto: !!photoUrl,
        photoUrl: photoUrl || '',
      });

      setSubmittedTicketRef(ticket.requestNumber);
      setDescription('');
      setPhotoUrl(null);
      setPhotoFileName('');

      showToast({
        title: 'Tiketi ya Matengenezo Imesajiliwa! 🛠️',
        message: `Tiketi #${ticket.requestNumber} imetumwa kikamilifu. Wataalamu wetu watakutafuta hivi punde.`,
        type: 'success',
      });
    } catch (err) {
      console.error('Error creating repair ticket:', err);
      showToast({
        title: 'Hitilafu ya Tiketi',
        message: 'Kuna tatizo limetokea wakati wa kutuma tiketi. Tafadhali jaribu tena.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Hotline Banner */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 text-white flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 shadow-lg">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-md">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
            <span>24/7 Rapid Emergency Dispatch Team</span>
          </div>
          <h1 className="text-base sm:text-lg font-black">{t('repairsTitle')}</h1>
          <p className="text-xs text-rose-100">{t('repairsSubtitle')}</p>
        </div>

        {activeHotlinePhone ? (
          <a
            href={`tel:${activeHotlinePhone.replace(/\s+/g, '')}`}
            className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-white text-rose-700 hover:bg-rose-50 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md shrink-0 transition-transform active:scale-95"
          >
            <Phone className="w-3.5 h-3.5 text-rose-600" />
            <span>
              {t('emergencyHotline', 'Hotline ya Dharura')}: {activeHotlinePhone}
            </span>
          </a>
        ) : (
          <div className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-white/20 text-white font-bold text-xs flex items-center gap-2 shrink-0">
            <Phone className="w-3.5 h-3.5 text-amber-300" />
            <span>{t('emergencyHotline', 'Hotline ya Dharura')} (24/7)</span>
          </div>
        )}
      </div>

      {/* Main Repair Logging Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
            {submittedTicketRef && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs space-y-1">
                <p className="font-bold">
                  ✓ Ticket Logger Created! Reference: #{submittedTicketRef}
                </p>
                <p className="text-[11px]">
                  Emergency dispatch ETA: {priority === 'Urgent' ? '2 - 4 Hours' : '24 Hours'}.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Priority Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Dispatch Priority Level *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPriority('Normal')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-colors ${
                      priority === 'Normal'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {t('normalPriority')} (24 Hours)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPriority('Urgent')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-colors ${
                      priority === 'Urgent'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/20'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    🚨 Urgent Emergency (2-4h Response)
                  </button>
                </div>
              </div>

              {/* Contact Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {t('fullName')} *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
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

              {/* Location */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
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
              </div>

              {/* Problem Description */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('problemDescription')} *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2.5}
                  placeholder="E.g., Inverter showing Error Code E04, screen flickering, smells burnt..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              {/* Real Device Photo Upload */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-amber-500" />
                    <span>Weka Picha ya Vifaa Vilivyoharibika (Upload Equipment Photo)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                </label>

                {photoUrl ? (
                  <div className="relative p-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex items-center gap-3">
                    <img
                      src={photoUrl}
                      alt="Equipment fault preview"
                      className="w-16 h-16 rounded-xl object-cover border border-amber-500/40 shadow-sm shrink-0"
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                        {photoFileName || 'Equipment Photo'}
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Picha Imeingizwa Kikamilifu</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="p-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-600 dark:bg-rose-950 dark:hover:bg-rose-900 transition-colors shrink-0"
                      title="Ondoa Picha"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 cursor-pointer transition-colors group">
                    <div className="p-2.5 rounded-full bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Bonyeza hapa kupakia picha kutoka kwenye simu/kifaa chako
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Inasaidia picha za PNG, JPG au WEBP (Max 8MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                  isSubmitting
                    ? 'bg-rose-400/80 text-white cursor-not-allowed opacity-80'
                    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 active:scale-95'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{language === 'sw' ? 'Inatuma Tiketi ya Matengenezo...' : 'Submitting Repair Ticket...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{t('submitRepairTicket')}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Live Repair Status Tracker Side Panel */}
        <div className="space-y-3">
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>{t('repairStatusTracker')}</span>
          </h2>

          <div className="space-y-3">
            {repairRequests.map((req) => (
              <div
                key={req.id}
                className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black font-mono text-amber-600 dark:text-amber-400">
                    #{req.requestNumber}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      req.priority === 'Urgent'
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {req.priority}
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {req.equipmentType}
                </p>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  "{req.description}"
                </p>

                {req.photoUrl && (
                  <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                    <img
                      src={req.photoUrl}
                      alt="Fault photo"
                      className="w-10 h-10 rounded-lg object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                    />
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                      Picha ya Hitilafu Imeambatanishwa
                    </span>
                  </div>
                )}

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold space-y-1.5 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-300">
                      Hali ya Ombi: <strong className="text-amber-600 dark:text-amber-400">{req.status}</strong>
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      {req.techResponseStatus === 'ACCEPTED' ? '✅ Dispatched & Confirmed' : '⏳ Pending Technician'}
                    </span>
                  </div>

                  {req.assignedTechnician && (
                    <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700/60 space-y-1">
                      <p className="text-slate-700 dark:text-slate-200">
                        Fundi Aliyepangiwa: <strong className="text-slate-900 dark:text-white">{req.assignedTechnician}</strong>
                      </p>
                      {req.assignedTechnicianPhone && (
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="text-amber-600 dark:text-amber-400 font-mono font-bold flex items-center gap-1">
                            <Phone className="w-3 h-3 text-amber-500" />
                            <span>{req.assignedTechnicianPhone}</span>
                          </span>
                          <a
                            href={`tel:${req.assignedTechnicianPhone}`}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] flex items-center gap-1 shadow-sm"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Piga Simu</span>
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {onOpenTechnicianStatusModal && (
                  <button
                    type="button"
                    onClick={() => onOpenTechnicianStatusModal(req)}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Fuatilia Status ya Fundi (Live Tracker)</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
