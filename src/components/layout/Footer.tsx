import React, { useEffect } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useBranchStore } from '../../store/useBranchStore';
import { useCompanySettingsStore } from '../../store/useCompanySettingsStore';
import { getActiveSocialPlatforms } from '../../config/socialLinks';

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  const { t, language } = useLanguage();
  const { initFirebaseSync: initBranchSync } = useBranchStore();
  const { settings, initFirebaseSync: initSettingsSync } = useCompanySettingsStore();

  useEffect(() => {
    initBranchSync();
    initSettingsSync();
  }, [initBranchSync, initSettingsSync]);

  const activeSocials = getActiveSocialPlatforms(settings.socialLinks);

  return (
    <footer className="w-full bg-slate-900 text-slate-300 border-t border-slate-800 pt-6 pb-16 lg:pb-6 mt-8 transition-colors text-xs">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        {/* Main Footer Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
          
          {/* Column 1: Brand & Social Media Links */}
          <div className="space-y-3">
            <div
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2 cursor-pointer group w-fit"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 border border-amber-400/30 shrink-0 group-hover:scale-105 transition-transform">
                <img
                  src="/logo.svg"
                  alt="YMA Energy Logo"
                  className="w-full h-full object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white group-hover:text-amber-400 transition-colors">
                  YMA <span className="text-amber-500">ENERGY</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-amber-950/80 text-amber-300 border border-amber-500/30">
                  GROUP
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-snug max-w-xs">
              {language === 'sw'
                ? 'Mifumo ya umeme wa jua (Solar), betri, inverters na huduma za ufungaji na kurekebisha kote Tanzania.'
                : 'Solar energy systems, backup batteries, power inverters, and certified technician installation services.'}
            </p>

            {/* Social Media Links Section */}
            {activeSocials.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {language === 'sw' ? 'Tufuate (Follow Us)' : 'Follow Us'}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {activeSocials.map((platform) => (
                    <a
                      key={platform.id}
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Follow us on ${platform.name}`}
                      title={platform.name}
                      className="group relative w-8 h-8 rounded-lg bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm overflow-hidden"
                    >
                      {/* Background brand color on hover */}
                      <span
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        style={{ backgroundColor: platform.color }}
                      />

                      {/* Icon */}
                      <svg
                        className="w-4 h-4 relative z-10 transition-transform duration-200 group-hover:scale-110"
                        fill="currentColor"
                        viewBox={platform.viewBox || '0 0 24 24'}
                      >
                        <path d={platform.path} />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Quick Links & Badges */}
          <div className="space-y-2.5">
            <h3 className="text-[11px] font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-1">
              {language === 'sw' ? 'Miongozo ya Haraka' : 'Quick Links'}
            </h3>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {[
                { id: 'home', label: t('navHome', 'Nyumbani') },
                { id: 'shop', label: t('navShop', 'Duka la Solar') },
                { id: 'services', label: t('navServices', 'Huduma za Ufungaji') },
                { id: 'repairs', label: t('navRepairs', 'Matengenezo') },
                { id: 'about', label: t('navAbout', 'Kuhusu Sisi') },
                { id: 'contact', label: t('navContact', 'Mawasiliano') },
              ].map((link) => (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className="text-left text-slate-400 hover:text-amber-400 transition-colors py-0.5 truncate font-medium"
                >
                  • {link.label}
                </button>
              ))}
            </div>

            <div className="pt-1 flex flex-wrap gap-2 text-[10px]">
              <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                <ShieldCheck className="w-3 h-3" />
                {language === 'sw' ? 'Udhamini Mwaka 1+' : '1+ Year Warranty'}
              </span>
              <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                <Zap className="w-3 h-3" />
                {language === 'sw' ? 'Ufungaji Haraka' : 'Fast Setup'}
              </span>
            </div>
          </div>

          {/* Column 3: Contact & Hours */}
          <div className="space-y-2 text-[11px]">
            <h3 className="text-[11px] font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-1">
              {t('msaadaWateja', 'Mawasiliano')}
            </h3>
            
            <div className="space-y-1.5 text-slate-300">
              {settings.companyPhone && (
                <a
                  href={`tel:${settings.companyPhone.replace(/\s+/g, '')}`}
                  className="flex items-center gap-2 hover:text-amber-400 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="font-mono font-bold text-white">{settings.companyPhone}</span>
                </a>
              )}

              {settings.companyEmail && (
                <a
                  href={`mailto:${settings.companyEmail}`}
                  className="flex items-center gap-2 hover:text-amber-400 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="font-mono text-slate-300 truncate">{settings.companyEmail}</span>
                </a>
              )}

              {settings.hqAddress && (
                <div className="flex items-start gap-2 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{settings.hqAddress}</span>
                </div>
              )}

              {settings.workingHours && (
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium pt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>{settings.workingHours}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500">
          <p>© {new Date().getFullYear()} YMA ENERGY GROUP. All Rights Reserved.</p>
          <div className="flex items-center gap-3 text-slate-400 font-medium">
            <button onClick={() => setActiveTab('about')} className="hover:text-amber-400 transition-colors">
              {t('navAbout', 'Kuhusu Sisi')}
            </button>
            <span>•</span>
            <button onClick={() => setActiveTab('services')} className="hover:text-amber-400 transition-colors">
              {t('navServices', 'Huduma')}
            </button>
            <span>•</span>
            <button onClick={() => setActiveTab('contact')} className="hover:text-amber-400 transition-colors">
              {t('navContact', 'Mawasiliano')}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};


