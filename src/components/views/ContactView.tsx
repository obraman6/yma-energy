import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Send, Building2, CheckCircle2, Loader2 } from 'lucide-react';
import { useBranchStore } from '../../store/useBranchStore';
import { useCompanySettingsStore } from '../../store/useCompanySettingsStore';
import { Branch } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToastStore } from '../../store/useToastStore';
import { sendAdminEmailTrigger } from '../../services/emailService';

interface ContactViewProps {
  openBranchMapModal: (branch: Branch) => void;
}

export const ContactView: React.FC<ContactViewProps> = ({ openBranchMapModal }) => {
  const { t } = useLanguage();
  const showToast = useToastStore((s) => s.showToast);
  const { branches, initFirebaseSync: initBranchSync } = useBranchStore();
  const { settings, initFirebaseSync: initSettingsSync } = useCompanySettingsStore();

  useEffect(() => {
    initBranchSync();
    initSettingsSync();
  }, [initBranchSync, initSettingsSync]);

  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) return;

    setIsSending(true);
    try {
      const inquiryId = 'inq_' + Date.now();
      const newInquiry = {
        id: inquiryId,
        inquiryNumber: Math.floor(100000 + Math.random() * 900000).toString(),
        customerName: name.trim(),
        phone: phone.trim(),
        message: message.trim(),
        createdAt: new Date().toISOString(),
        status: 'unread',
        source: 'Contact Page',
      };

      await setDoc(doc(db, 'inquiries', inquiryId), newInquiry);
      sendAdminEmailTrigger({
        type: 'inquiry',
        data: newInquiry,
      }).catch((e) => console.error('Error triggering inquiry email alert:', e));

      showToast({ title: 'Ujumbe Umetumwa', message: 'Ujumbe wako umetumwa kikamilifu na kuhifadhiwa!', type: 'success' });
      setSubmitted(true);
    } catch (error) {
      console.error('Error saving contact message:', error);
      showToast({ title: 'Shida ya Mtandao', message: 'Ujumbe umeingia lakini kushindwa kuhifadhi mtandaoni. Jaribu tena.', type: 'error' });
      setSubmitted(true);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Title */}
      <div className="space-y-1.5">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          {t('contactTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {t('contactSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Contact Form */}
        <div className="lg:col-span-2 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-amber-500" />
            <span>{t('sendMessage')}</span>
          </h2>

          {submitted ? (
            <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 space-y-1.5 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
              <h3 className="font-bold text-sm">Asante Sana, {name}!</h3>
              <p className="text-xs">
                Ujumbe wako umepokelewa na timu yetu ya kiufundi. Mhandisi wetu atakupigia simu kupitia <strong className="font-mono">{phone}</strong> hivi karibuni.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-3 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
              >
                {t('sendMessageBtn')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {t('fullName')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Hassan Mwinyi"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {t('phoneNumber')} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+255 7XX XXX XXX"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('message')} *
                </label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Eleza mahitaji yako ya umeme wa jua, au huduma unayohitaji..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Inatuma Ujumbe...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{t('sendMessageBtn')}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Quick Contact Sidebar */}
        <div className="space-y-3">
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white space-y-3 shadow-lg border border-slate-800">
            <h3 className="font-bold text-xs uppercase tracking-wider text-amber-400">
              {t('msaadaWateja')}
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400">{t('phoneLabel')}</p>
                  <p className="font-mono font-bold">{settings.companyPhone}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400">{t('emailLabel')}</p>
                  <p className="font-mono font-bold">{settings.companyEmail}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400">{t('workingHours')}</p>
                  <p className="text-[11px] font-medium text-slate-200">{settings.workingHours}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Branch Cards Grid */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-amber-500" />
          <span>{t('branchLocations')}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-sm hover:shadow-md transition-shadow h-auto flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1 text-amber-600 dark:text-amber-400 font-bold text-xs">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{branch.city}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold">
                    {branch.isHeadquarters ? 'Headquarters' : 'Regional Branch'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  {branch.name}
                </p>

                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {branch.address}
                </p>

                <div className="space-y-0.5 text-[11px] text-slate-600 dark:text-slate-300 pt-1">
                  <p className="flex items-center gap-1 font-mono">
                    <Phone className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>{branch.phone}</span>
                  </p>
                  <p className="flex items-center gap-1 font-mono">
                    <Mail className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>{branch.email}</span>
                  </p>
                  {branch.workingHours && (
                    <p className="flex items-center gap-1 text-slate-500 text-[10px]">
                      <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>{branch.workingHours}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <a
                  href={`tel:${branch.phone}`}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-1"
                >
                  <Phone className="w-3 h-3 text-amber-500" />
                  <span>{t('callBranch')}</span>
                </a>

                <button
                  onClick={() => openBranchMapModal(branch)}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors flex-1"
                >
                  <MapPin className="w-3 h-3" />
                  <span>{t('viewDirections')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
