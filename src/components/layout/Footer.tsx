import React from 'react';
import {
  Sun,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  CreditCard,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  const { t } = useLanguage();

  return (
    <footer className="w-full bg-slate-900 text-slate-300 border-t border-slate-800 pt-6 pb-16 lg:pb-8 mt-8 transition-colors">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-6 space-y-6">
        {/* Clean 3-Column Footer Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-8">
          {/* Column 1: Brand & Identity */}
          <div className="space-y-2.5">
            <div
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center text-white shadow-sm shadow-amber-500/20 border border-amber-500/30 shrink-0">
                <img
                  src="/logo.svg"
                  alt="YMA Energy Logo"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-base tracking-tight text-white">
                  YMA <span className="text-amber-500">ENERGY</span>
                </span>
                <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-amber-950/80 text-amber-300 border border-amber-500/30">
                  TZ
                </span>
              </div>
            </div>
          </div>

          {/* Column 3: Branch Network */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-1">
              {t('branchLocations')}
            </h3>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-200">Dar es Salaam Main Hub</p>
                  <p className="text-[10px] text-slate-400">Mikocheni B, Sayansi / Kijitonyama</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-200">Arusha Northern Zone</p>
                  <p className="text-[10px] text-slate-400">Njiro Complex, Block C</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-200">Mwanza Lake Zone Hub</p>
                  <p className="text-[10px] text-slate-400">Capri Point Road, Tilapia Area</p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 4: Customer Care & Emergency Support */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-1">
              {t('msaadaWateja')}
            </h3>
            <div className="space-y-1.5 text-[11px]">
              <a
                href="tel:+255622359874"
                className="p-2 rounded-xl bg-slate-800 border border-slate-700 flex items-center gap-2 hover:border-amber-500 transition-all block"
              >
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{t('phoneLabel')}</p>
                  <p className="font-mono font-bold text-white text-xs">+255 622 359 874</p>
                </div>
              </a>

              <a
                href="mailto:support@ymaenergy.co.tz"
                className="p-2 rounded-xl bg-slate-800 border border-slate-700 flex items-center gap-2 hover:border-amber-500 transition-all block"
              >
                <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{t('emailLabel')}</p>
                  <p className="font-mono font-bold text-white text-[11px]">support@ymaenergy.co.tz</p>
                </div>
              </a>

              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium pt-0.5">
                <Clock className="w-3 h-3" />
                <span>{t('workingHours')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar Copyright */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} YMA Energy Tanzania Ltd. All Rights Reserved.</p>
          <div className="flex items-center gap-3 text-slate-400">
            <button onClick={() => setActiveTab('about')} className="hover:underline">
              {t('navAbout')}
            </button>
            <button onClick={() => setActiveTab('contact')} className="hover:underline">
              {t('navContact')}
            </button>
            <button onClick={() => setActiveTab('services')} className="hover:underline">
              {t('navServices')}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
