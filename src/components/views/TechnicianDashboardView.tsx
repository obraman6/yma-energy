import React, { useState, useMemo } from 'react';
import {
  Wrench,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  MessageCircle,
  MapPin,
  Navigation,
  FileText,
  User as UserIcon,
  Send,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  X,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useServicesStore } from '../../store/useServicesStore';
import { useRepairsStore } from '../../store/useRepairsStore';
import { useToastStore } from '../../store/useToastStore';
import { useLanguage } from '../../context/LanguageContext';
import { ServiceRequest, RepairRequest, ServiceStatus, RepairStatus } from '../../types';

interface TechnicianDashboardViewProps {
  onBackToCustomerView?: () => void;
}

export const TechnicianDashboardView: React.FC<TechnicianDashboardViewProps> = ({
  onBackToCustomerView,
}) => {
  const { user } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);
  const { t } = useLanguage();

  const { serviceRequests, respondToServiceAssignment, updateServiceTechProgress } = useServicesStore();
  const { repairRequests, respondToRepairAssignment, updateRepairTechProgress } = useRepairsStore();

  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'completed'>('pending');
  const [techNoteInputs, setTechNoteInputs] = useState<Record<string, string>>({});

  // Filter service requests and repair requests assigned to this technician
  // Or if none matches specifically, display all dispatched jobs for demonstration if user is testing
  const assignedServiceRequests = useMemo(() => {
    if (!user) return [];
    return serviceRequests.filter((s) => {
      if (!s.assignedTechnician) return false;
      const cleanAssigned = s.assignedTechnician.toLowerCase();
      const cleanUserName = user.name.toLowerCase();
      const cleanUserEmail = user.email.toLowerCase();
      return (
        s.assignedTechnicianId === user.id ||
        (s.assignedTechnicianEmail && s.assignedTechnicianEmail.toLowerCase() === cleanUserEmail) ||
        cleanAssigned.includes(cleanUserName) ||
        cleanUserName.includes(cleanAssigned) ||
        s.status === 'Technician Dispatched' ||
        s.status === 'Accepted' ||
        s.status === 'En-Route' ||
        s.status === 'On-Site'
      );
    });
  }, [serviceRequests, user]);

  const assignedRepairRequests = useMemo(() => {
    if (!user) return [];
    return repairRequests.filter((r) => {
      if (!r.assignedTechnician) return false;
      const cleanAssigned = r.assignedTechnician.toLowerCase();
      const cleanUserName = user.name.toLowerCase();
      const cleanUserEmail = user.email.toLowerCase();
      return (
        r.assignedTechnicianId === user.id ||
        (r.assignedTechnicianEmail && r.assignedTechnicianEmail.toLowerCase() === cleanUserEmail) ||
        cleanAssigned.includes(cleanUserName) ||
        cleanUserName.includes(cleanAssigned) ||
        r.status === 'Technician Dispatched' ||
        r.status === 'Accepted' ||
        r.status === 'En-Route' ||
        r.status === 'On-Site'
      );
    });
  }, [repairRequests, user]);

  // Combined assigned jobs
  const pendingJobs = useMemo(() => {
    const pendingServices = assignedServiceRequests.filter(
      (s) => s.status === 'Technician Dispatched' || s.techResponseStatus === 'PENDING'
    );
    const pendingRepairs = assignedRepairRequests.filter(
      (r) => r.status === 'Technician Dispatched' || r.techResponseStatus === 'PENDING'
    );
    return { services: pendingServices, repairs: pendingRepairs };
  }, [assignedServiceRequests, assignedRepairRequests]);

  const activeJobs = useMemo(() => {
    const activeServices = assignedServiceRequests.filter(
      (s) => s.status === 'Accepted' || s.status === 'En-Route' || s.status === 'On-Site'
    );
    const activeRepairs = assignedRepairRequests.filter(
      (r) => r.status === 'Accepted' || r.status === 'En-Route' || r.status === 'On-Site'
    );
    return { services: activeServices, repairs: activeRepairs };
  }, [assignedServiceRequests, assignedRepairRequests]);

  const completedJobs = useMemo(() => {
    const compServices = assignedServiceRequests.filter(
      (s) => s.status === 'Completed' || s.status === 'Rejected'
    );
    const compRepairs = assignedRepairRequests.filter(
      (r) => r.status === 'Resolved' || r.status === 'Rejected'
    );
    return { services: compServices, repairs: compRepairs };
  }, [assignedServiceRequests, assignedRepairRequests]);

  const handleNoteChange = (jobId: string, val: string) => {
    setTechNoteInputs((prev) => ({ ...prev, [jobId]: val }));
  };

  const handleRespondService = async (requestId: string, action: 'ACCEPTED' | 'REJECTED') => {
    const note = techNoteInputs[requestId] || '';
    const techPhone = user?.phone || '0754 000 111';
    await respondToServiceAssignment(requestId, action, note, techPhone);
    showToast({
      title: action === 'ACCEPTED' ? 'Kazi Imekubaliwa! 🛠️' : 'Kazi Imekataliwa ❌',
      message:
        action === 'ACCEPTED'
          ? 'Umefanikiwa kukubali kazi hii. Mteja na Admin wamepewa taarifa na namba yako ya simu inaonekana kwa mteja.'
          : 'Umekataa kazi hii. Mfumo umerejesha taarifa kwa Admin ili kupanga fundi mwingine.',
      type: action === 'ACCEPTED' ? 'success' : 'warning',
    });
  };

  const handleRespondRepair = async (ticketId: string, action: 'ACCEPTED' | 'REJECTED') => {
    const note = techNoteInputs[ticketId] || '';
    const techPhone = user?.phone || '0754 000 111';
    await respondToRepairAssignment(ticketId, action, note, techPhone);
    showToast({
      title: action === 'ACCEPTED' ? 'Kazi ya Dharura Imekubaliwa! 🚨' : 'Kazi Imekataliwa ❌',
      message:
        action === 'ACCEPTED'
          ? 'Umefanikiwa kukubali tiketi ya dharura. Namba yako ya simu inaonekana kwa mteja sasa.'
          : 'Umekataa tiketi ya dharura. Admin atamtafuta mhandisi mwingine.',
      type: action === 'ACCEPTED' ? 'success' : 'warning',
    });
  };

  const handleUpdateServiceStatus = async (requestId: string, status: ServiceStatus) => {
    const note = techNoteInputs[requestId] || '';
    await updateServiceTechProgress(requestId, status, note);
    showToast({
      title: 'Hali ya Kazi Imesasishwa! 🔄',
      message: `Hali mpya: ${status}. Mfumo umehifadhi taarifa zako za uwandani.`,
      type: 'success',
    });
  };

  const handleUpdateRepairStatus = async (ticketId: string, status: RepairStatus) => {
    const note = techNoteInputs[ticketId] || '';
    await updateRepairTechProgress(ticketId, status, note);
    showToast({
      title: 'Hali ya Matengenezo Imesasishwa! ⚡',
      message: `Hali mpya: ${status}. Mfumo umehifadhi taarifa zako.`,
      type: 'success',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Top Banner Header */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-black shadow-md shadow-amber-500/20">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black">{user?.name || 'Mhandisi wa YMA'}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white uppercase tracking-wider">
                TECHNICIAN PORTAL
              </span>
            </div>
            <p className="text-xs text-amber-400 font-mono">
              Field Engineer Dispatch & Repair Task Operations
            </p>
          </div>
        </div>

        {onBackToCustomerView && (
          <button
            onClick={onBackToCustomerView}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 border border-white/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Rudi Duka Kuu</span>
          </button>
        )}
      </div>

      {/* Analytics Counter Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-500/10 space-y-1">
          <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400 block">
            Pending Decisions
          </span>
          <p className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
            {pendingJobs.services.length + pendingJobs.repairs.length} Job(s)
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-sky-200 dark:border-sky-900/50 bg-sky-500/10 space-y-1">
          <span className="text-[10px] font-bold uppercase text-sky-700 dark:text-sky-400 block">
            Active On-Site
          </span>
          <p className="text-lg font-black text-sky-600 dark:text-sky-400 font-mono">
            {activeJobs.services.length + activeJobs.repairs.length} Job(s)
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-500/10 space-y-1">
          <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block">
            Completed / History
          </span>
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {completedJobs.services.length + completedJobs.repairs.length} Job(s)
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="grid grid-cols-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('pending')}
          className={`py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Inayosubiri Kupokelewa ({pendingJobs.services.length + pendingJobs.repairs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'active'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>Kazi Zinazoendelea ({activeJobs.services.length + activeJobs.repairs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'completed'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Kazi Zilizokamilika ({completedJobs.services.length + completedJobs.repairs.length})</span>
        </button>
      </div>

      {/* TAB CONTENT 1: PENDING DECISIONS */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <strong className="font-extrabold">🚨 Maelekezo kwa Fundi:</strong>
            <p>
              Hapa kuna kazi na tiketi za dharura zilizopangwa kwako na Utawala/Manager.
              Tafadhali kagua maelezo na uchague <strong>Kubali Kazi</strong> au <strong>Kataa Kazi</strong> papo hapo.
            </p>
          </div>

          {pendingJobs.services.length === 0 && pendingJobs.repairs.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Hakuna kazi mpya inayokusubiri kwa sasa.
              </p>
              <p className="text-[11px] text-slate-500">
                Admin au Manager akipanga kazi mpya itatokea hapa real-time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Emergency Repairs Pending */}
              {pendingJobs.repairs.map((r) => (
                <div
                  key={r.id}
                  className="p-5 rounded-2xl border-2 border-rose-500/40 bg-white dark:bg-slate-900 shadow-md space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-extrabold text-[10px] uppercase">
                        EMERGENCY REPAIR
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                        #{r.requestNumber}
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-rose-600 bg-rose-50 dark:bg-rose-950 px-2.5 py-0.5 rounded-full border border-rose-200">
                      Priority: {r.priority}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-500 font-medium">Vifaa / Equipment:</p>
                      <strong className="text-slate-900 dark:text-slate-100 font-bold">{r.equipmentType}</strong>
                      <p className="text-slate-500 font-medium mt-1">Tatizo / Fault Description:</p>
                      <p className="italic text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
                        "{r.description}"
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-slate-500 font-medium">Mteja & Eneo:</p>
                      <strong className="text-slate-900 dark:text-slate-100 block">{r.customerName}</strong>
                      <p className="text-slate-600 dark:text-slate-400 flex items-center gap-1 font-mono">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>{r.region}</span>
                      </p>
                      <div className="pt-1 flex gap-2">
                        <a
                          href={`tel:${r.phone}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-[11px] flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-amber-400" />
                          <span>Piga Simu</span>
                        </a>
                        <a
                          href={`https://wa.me/${r.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Note Input & Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <input
                      type="text"
                      placeholder="Weka maelezo ya hiari (Mfano: Nipo safarini naingia ndani ya dakika 20)..."
                      value={techNoteInputs[r.id] || ''}
                      onChange={(e) => handleNoteChange(r.id, e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRespondRepair(r.id, 'ACCEPTED')}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <Check className="w-4 h-4" />
                        <span>{t('acceptJobBtn', 'Kubali Kazi')}</span>
                      </button>

                      <button
                        onClick={() => handleRespondRepair(r.id, 'REJECTED')}
                        className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5"
                      >
                        <X className="w-4 h-4" />
                        <span>{t('rejectBtn', 'Kataa')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Service Installation Requests Pending */}
              {pendingJobs.services.map((s) => (
                <div
                  key={s.id}
                  className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-white dark:bg-slate-900 shadow-md space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-extrabold text-[10px] uppercase">
                        FIELD INSTALLATION & SURVEY
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                        #{s.requestNumber}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-amber-600">
                      Tarehe: {s.preferredDate} ({s.timeSlot})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-500 font-medium">Huduma / Service:</p>
                      <strong className="text-slate-900 dark:text-slate-100 font-bold block">{s.serviceName}</strong>
                      <p className="text-slate-500 font-medium mt-1">Aina ya Paa / Roof Type:</p>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[11px]">
                        {s.roofType}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-slate-500 font-medium">Mteja & Anwani:</p>
                      <strong className="text-slate-900 dark:text-slate-100 block">{s.customerName}</strong>
                      <p className="text-slate-600 dark:text-slate-400 flex items-center gap-1 font-mono">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{s.district}, {s.region}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <input
                      type="text"
                      placeholder="Weka maelezo ya hiari kabla ya kubali..."
                      value={techNoteInputs[s.id] || ''}
                      onChange={(e) => handleNoteChange(s.id, e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRespondService(s.id, 'ACCEPTED')}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <Check className="w-4 h-4" />
                        <span>{t('acceptJobBtn', 'Kubali Kazi')}</span>
                      </button>

                      <button
                        onClick={() => handleRespondService(s.id, 'REJECTED')}
                        className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5"
                      >
                        <X className="w-4 h-4" />
                        <span>{t('rejectBtn', 'Kataa')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: ACTIVE JOBS ON-SITE */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeJobs.services.length === 0 && activeJobs.repairs.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <Clock className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Hakuna kazi unayoifanya kwa sasa hapa uwanjani.
              </p>
              <p className="text-[11px] text-slate-500">
                Ukikubali kazi kwenye tab ya "Inayosubiri Kupokelewa" itahamia hapa ili uweze kusasisha hali ya safari na kazi.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active Repairs */}
              {activeJobs.repairs.map((r) => (
                <div
                  key={r.id}
                  className="p-5 rounded-2xl border border-sky-300 dark:border-sky-800 bg-white dark:bg-slate-900 shadow-md space-y-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-sky-600 text-white font-extrabold text-[10px] uppercase">
                        ACTIVE REPAIR ON-SITE
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                        #{r.requestNumber}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Hali: {r.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-2">
                    <p>Mteja: <strong className="text-slate-900 dark:text-slate-100">{r.customerName} ({r.phone})</strong></p>
                    <p className="flex items-center gap-1 font-mono text-slate-600 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-sky-500" />
                      <span>{r.region}</span>
                    </p>
                    <p className="italic text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl">
                      "{r.description}"
                    </p>
                  </div>

                  {/* Quick Progress Buttons for Active Repair */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-2">
                    <p className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase">
                      Sasisha Hali ya Safari & Kazi Real-Time:
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-xs font-extrabold">
                      <button
                        onClick={() => handleUpdateRepairStatus(r.id, 'En-Route')}
                        className={`p-2 rounded-xl border ${
                          r.status === 'En-Route'
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        🚗 {t('statusEnRoute', 'Safarini')}
                      </button>

                      <button
                        onClick={() => handleUpdateRepairStatus(r.id, 'On-Site')}
                        className={`p-2 rounded-xl border ${
                          r.status === 'On-Site'
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        📍 {t('statusOnSite', 'Eneo la Kazi')}
                      </button>

                      <button
                        onClick={() => handleUpdateRepairStatus(r.id, 'Resolved')}
                        className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        ✅ {t('statusResolved', 'Imerekebishwa')}
                      </button>
                    </div>

                    <div className="pt-2">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        {t('fieldNotesLabel', 'Ripoti ya Kazi / Field Notes')}:
                      </label>
                      <input
                        type="text"
                        placeholder="Mfano: Tumebadilisha Inverter fuse ya 100A na kukaza wiring. Mfumo upo sawa..."
                        value={techNoteInputs[r.id] || r.techNotes || ''}
                        onChange={(e) => handleNoteChange(r.id, e.target.value)}
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Active Services */}
              {activeJobs.services.map((s) => (
                <div
                  key={s.id}
                  className="p-5 rounded-2xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 shadow-md space-y-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-extrabold text-[10px] uppercase">
                        ACTIVE SERVICE INSTALLATION
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                        #{s.requestNumber}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-200">
                      Hali: {s.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <p>Mteja: <strong className="text-slate-900 dark:text-slate-100">{s.customerName} ({s.phone})</strong></p>
                    <p className="flex items-center gap-1 font-mono text-slate-600 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      <span>{s.region}</span>
                    </p>
                  </div>

                  {/* Progress Buttons */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-2">
                    <p className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase">
                      Sasisha Hali ya Ufungaji Real-Time:
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-xs font-extrabold">
                      <button
                        onClick={() => handleUpdateServiceStatus(s.id, 'En-Route')}
                        className={`p-2 rounded-xl border ${
                          s.status === 'En-Route'
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        🚚 {t('statusEnRoute', 'Safarini')}
                      </button>

                      <button
                        onClick={() => handleUpdateServiceStatus(s.id, 'On-Site')}
                        className={`p-2 rounded-xl border ${
                          s.status === 'On-Site'
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        🛠️ {t('statusOnSite', 'Eneo la Kazi')}
                      </button>

                      <button
                        onClick={() => handleUpdateServiceStatus(s.id, 'Completed')}
                        className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        ✅ {t('statusCompleted', 'Imekamilika')}
                      </button>
                    </div>

                    <div className="pt-2">
                      <input
                        type="text"
                        placeholder="Weka ripoti ya ufupi wa kazi za ufungaji..."
                        value={techNoteInputs[s.id] || s.techNotes || ''}
                        onChange={(e) => handleNoteChange(s.id, e.target.value)}
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: COMPLETED HISTORY */}
      {activeTab === 'completed' && (
        <div className="space-y-4">
          {completedJobs.services.length === 0 && completedJobs.repairs.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900">
              <p className="text-xs text-slate-500">Hakuna kumbukumbu za kazi zilizokamilika bado.</p>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {completedJobs.repairs.map((r) => (
                <div key={r.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="font-mono text-emerald-600">#{r.requestNumber} - {r.equipmentType}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold flex items-center gap-1">
                      ✅ {r.status}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">Mteja: {r.customerName} ({r.phone}) - {r.region}</p>
                  {r.techNotes && (
                    <p className="italic text-slate-500 pt-1">Ripoti ya Fundi: "{r.techNotes}"</p>
                  )}
                </div>
              ))}

              {completedJobs.services.map((s) => (
                <div key={s.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="font-mono text-emerald-600">#{s.requestNumber} - {s.serviceName}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold flex items-center gap-1">
                      ✅ {s.status}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">Mteja: {s.customerName} ({s.phone}) - {s.region}</p>
                  {s.techNotes && (
                    <p className="italic text-slate-500 pt-1">Ripoti ya Fundi: "{s.techNotes}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
