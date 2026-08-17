import React from 'react';
import {
  X,
  Wrench,
  User,
  Phone,
  Clock,
  CheckCircle2,
  MapPin,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  Navigation,
  Headphones,
  Check,
} from 'lucide-react';
import { ServiceRequest, RepairRequest } from '../../types';
import { useCompanySettingsStore } from '../../store/useCompanySettingsStore';

interface LiveTechnicianModalProps {
  item: ServiceRequest | RepairRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenLiveChat?: () => void;
}

export const LiveTechnicianModal: React.FC<LiveTechnicianModalProps> = ({
  item,
  isOpen,
  onClose,
  onOpenLiveChat,
}) => {
  const settings = useCompanySettingsStore((s) => s.settings);

  if (!isOpen || !item) return null;

  const isService = 'serviceName' in item;
  const title = isService ? (item as ServiceRequest).serviceName : (item as RepairRequest).equipmentType;
  const reqNumber = item.requestNumber;
  const currentStatus = item.status;

  // Real-time steps calculation
  const isCancelledOrRejected = currentStatus === 'Cancelled' || currentStatus === 'Rejected';

  // Order of progression for Service Request & Repair Ticket
  // 1: Received, 2: Dispatched, 3: Accepted/En Route, 4: In Progress, 5: Completed
  const getStepLevel = () => {
    if (
      currentStatus === 'Completed' ||
      currentStatus === 'Resolved' ||
      currentStatus === 'Imekamilika' ||
      currentStatus === 'Imerekebishwa'
    )
      return 5;
    if (currentStatus === 'In Progress' || currentStatus === 'In Repair' || currentStatus === 'Testing') return 4;
    if (currentStatus === 'Accepted' || item.techResponseStatus === 'ACCEPTED') return 3;
    if (currentStatus === 'Technician Dispatched' || item.assignedTechnician) return 2;
    return 1;
  };

  const stepLevel = getStepLevel();

  const steps = [
    { id: 1, labelSw: 'Ombi Limepokelewa', labelEn: 'Request Registered' },
    { id: 2, labelSw: 'Fundi Apangiwa', labelEn: 'Tech Dispatched' },
    { id: 3, labelSw: 'Fundi Yupo Njiani', labelEn: 'Tech En Route' },
    { id: 4, labelSw: 'Kazi Inaendelea', labelEn: 'In Progress' },
    { id: 5, labelSw: 'Kazi Imekamilika', labelEn: 'Completed' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase bg-black/20 px-2 py-0.5 rounded font-extrabold tracking-wider text-amber-200">
                  {reqNumber}
                </span>
                <span className="text-xs bg-emerald-500/20 border border-emerald-300/30 px-2 py-0.5 rounded-full font-bold text-emerald-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold mt-0.5 line-clamp-1">
                {title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Funga"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[78vh] overflow-y-auto">

          {/* Alert banner if cancelled/rejected */}
          {isCancelledOrRejected ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
                  Status: {currentStatus}
                </p>
                <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">
                  Ombi hili limehairishwa au kukataliwa. Ikiwa unahitaji msaada, tafadhali wasiliana na huduma kwa wateja.
                </p>
              </div>
            </div>
          ) : (
            /* Timeline Stepper */
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Hatua za Kazi ya Mhandisi (Live Timeline)</span>
                </span>
                <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                  Hatua ya {stepLevel} kati ya 5
                </span>
              </div>

              <div className="relative pt-2 pb-1">
                <div className="absolute top-5 left-3 right-3 h-1 bg-slate-200 dark:bg-slate-700 z-0" />
                <div
                  className="absolute top-5 left-3 h-1 bg-amber-500 transition-all duration-500 z-0"
                  style={{ width: `${Math.max(0, ((stepLevel - 1) / 4) * 100)}%` }}
                />

                <div className="relative z-10 flex items-center justify-between">
                  {steps.map((step) => {
                    const isPassed = step.id < stepLevel;
                    const isCurrent = step.id === stepLevel;
                    const isFullyCompletedStep = step.id === 5 && stepLevel === 5;

                    return (
                      <div key={step.id} className="flex flex-col items-center text-center">
                        <div
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                            isPassed || isFullyCompletedStep
                              ? 'bg-emerald-500 text-white ring-2 ring-emerald-500/30'
                              : isCurrent
                              ? 'bg-amber-500 text-white ring-4 ring-amber-500/25 animate-bounce'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                          }`}
                        >
                          {isPassed || isFullyCompletedStep ? <Check className="w-4 h-4" /> : step.id}
                        </div>
                        <span
                          className={`text-[9px] sm:text-[10px] font-bold mt-2 max-w-[65px] sm:max-w-[80px] leading-tight ${
                            isCurrent
                              ? 'text-amber-600 dark:text-amber-400 font-black'
                              : isPassed
                              ? 'text-slate-800 dark:text-slate-200'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.labelSw}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Assigned Technician Profile Card */}
          {item.assignedTechnician ? (
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Taarifa za Fundi Aliyepangiwa (Assigned Technician)</span>
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    item.techResponseStatus === 'ACCEPTED'
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : item.techResponseStatus === 'REJECTED'
                      ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  }`}
                >
                  {item.techResponseStatus === 'ACCEPTED'
                    ? '✅ Fundi Amekubali Kazi'
                    : item.techResponseStatus === 'REJECTED'
                    ? '⚠️ Fundi Amekataa'
                    : '⏳ Inasubiri Uthibitisho'}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg shrink-0">
                    <User className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {item.assignedTechnician}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Mhandisi wa Mfumo wa Solar (YMA Certified Engineer)
                    </p>
                    {item.assignedTechnicianPhone && (
                      <p className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                        {item.assignedTechnicianPhone}
                      </p>
                    )}
                  </div>
                </div>

                {item.assignedTechnicianPhone && (
                  <a
                    href={`tel:${item.assignedTechnicianPhone}`}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Piga Simu kwa Fundi</span>
                  </a>
                )}
              </div>

              {/* Real-time Technician Notes */}
              {item.techNotes && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1 mt-2">
                  <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-amber-500" />
                    <span>Maelezo kutoka kwa Fundi (Technician Field Update):</span>
                  </p>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 italic">
                    "{item.techNotes}"
                  </p>
                  {item.techResponseDate && (
                    <p className="text-[10px] font-mono text-slate-400 text-right">
                      {item.techResponseDate}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 rounded-2xl border border-dashed border-amber-300 dark:border-amber-800 bg-amber-500/5 text-center space-y-2">
              <Clock className="w-8 h-8 text-amber-500 mx-auto animate-spin" />
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                Mfumo Unakadiria Mhandisi Bora (Assigning Technician...)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Msimamizi wa tawi anapitia ombi lako. Utapata taarifa hapa mara tu fundi atakapopangiwa na kuanza safari.
              </p>
            </div>
          )}

          {/* Live Dispatch Simulation Map */}
          <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 opacity-40 bg-cover bg-center"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800')`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

            <div className="relative z-10 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30 animate-pulse">
                <Navigation className="w-5 h-5" />
              </div>

              <div>
                <p className="text-xs font-extrabold text-white flex items-center justify-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {item.region || 'Tanzania'}
                  </span>
                </p>
                <p className="text-[11px] font-bold text-amber-400 mt-0.5">
                  {item.assignedTechnician
                    ? `Mhandisi Yupo Njiani kuelekea eneo lako`
                    : `Inasubiri upangaji wa fundi kutoka makao makuu`}
                </p>
              </div>
            </div>
          </div>

          {/* Location & Ticket Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Tarehe Iliyowekwa</p>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {'preferredDate' in item && item.preferredDate ? item.preferredDate : item.createdAt}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Namba ya Simu ya Ombi</p>
              <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {item.phone || 'N/A'}
              </p>
            </div>
          </div>

          {/* Need Urgent Support Button */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold flex items-center gap-1.5">
                <Headphones className="w-4 h-4 text-amber-400" />
                <span>Unahitaji Msaada wa Haraka?</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Wasiliana na Huduma kwa Wateja 24/7 au fanya Live Chat
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${settings.companyPhone}`}
                className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{settings.companyPhone}</span>
              </a>

              {onOpenLiveChat && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenLiveChat();
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs flex items-center gap-1.5 border border-slate-700"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                  <span>Live Chat</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
