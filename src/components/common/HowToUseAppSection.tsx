import React from 'react';
import { Play, Youtube, CheckCircle2, ShoppingBag, Wrench, ShieldCheck, Sparkles, ExternalLink, Settings } from 'lucide-react';
import { useCompanySettingsStore } from '../../store/useCompanySettingsStore';
import { useLanguage } from '../../context/LanguageContext';
import { useAuthStore } from '../../store/useAuthStore';

interface HowToUseAppSectionProps {
  onNavigateToTab?: (tab: string) => void;
}

/**
 * Extracts standard YouTube embed URL from various YouTube link formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Check if it's already an embed link
  if (trimmed.includes('youtube.com/embed/') || trimmed.includes('youtube-nocookie.com/embed/')) {
    return trimmed;
  }

  // Regex matching all common YouTube video patterns
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = trimmed.match(regExp);

  if (match && match[1] && match[1].length === 11) {
    return `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&modestbranding=1&playsinline=1`;
  }

  return null;
}

export type VideoAspectRatio = '16:9' | '9:16' | '1:1';

/**
 * Automatically detects or applies the intended aspect ratio for the video container:
 * - 9:16: YouTube Shorts, Instagram Reels, TikTok, portrait phone videos
 * - 1:1: Square Instagram post style
 * - 16:9: Standard widescreen landscape YouTube videos
 */
export function detectVideoAspectRatio(url?: string, manualSetting?: string): VideoAspectRatio {
  if (manualSetting === '9:16' || manualSetting === '16:9' || manualSetting === '1:1') {
    return manualSetting;
  }
  if (!url) return '16:9';
  const lower = url.toLowerCase();
  if (
    lower.includes('/shorts/') ||
    lower.includes('shorts/') ||
    lower.includes('tiktok.com') ||
    lower.includes('instagram.com/reel') ||
    lower.includes('instagram.com/reels')
  ) {
    return '9:16';
  }
  if (lower.includes('instagram.com/p/')) {
    return '1:1';
  }
  return '16:9';
}

export const HowToUseAppSection: React.FC<HowToUseAppSectionProps> = ({ onNavigateToTab }) => {
  const { t, language } = useLanguage();
  const { settings } = useCompanySettingsStore();
  const { user } = useAuthStore();

  const isStaffOrAdmin =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'ADMIN' ||
    user?.role === 'STAFF_ADMIN' ||
    user?.role === 'MANAGER';

  const rawVideoUrl = settings.tutorialVideoUrl?.trim() || '';
  const embedUrl = getYouTubeEmbedUrl(rawVideoUrl);

  const videoTitle =
    settings.tutorialVideoTitle?.trim() ||
    (language === 'sw'
      ? 'Jinsi ya Kutumia App ya YMA ENERGY GROUP'
      : 'How to Use YMA ENERGY GROUP App');

  const videoDesc =
    settings.tutorialVideoDesc?.trim() ||
    (language === 'sw'
      ? 'Tazama video fupi ya hatua kwa hatua kujifunza jinsi ya kuagiza bidhaa za sola, kuomba fundi wa ufungaji, na kufuatilia oda yako.'
      : 'Watch this quick step-by-step tutorial to learn how to purchase solar hardware, request certified installation, and track deliveries.');

  const steps = [
    {
      step: '01',
      icon: ShoppingBag,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      titleSw: 'Chagua Vifaa vya Sola',
      titleEn: 'Browse & Select Gear',
      descSw: 'Chagua panels, inverters, betri za lithium au tumia Solar Calculator kupata mahitaji yako.',
      descEn: 'Pick panels, inverters, lithium storage, or use Solar Calculator to size your loads.',
      actionTab: 'shop',
    },
    {
      step: '02',
      icon: Wrench,
      color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
      titleSw: 'Agiza Ufungaji / Fundi',
      titleEn: 'Book Installation / Repair',
      descSw: 'Weka miadi ya fundi wa ERB kufanya ukaguzi wa eneo au ripoti hitilafu kwa fundi wa dharura.',
      descEn: 'Book certified technicians for site surveys or dispatch emergency fault repair team.',
      actionTab: 'services',
    },
    {
      step: '03',
      icon: ShieldCheck,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      titleSw: 'Fuatilia Oda & Live Driver',
      titleEn: 'Live Delivery Tracking',
      descSw: 'Fuatilia gari au mjumbe aliyepangiwa oda yako kwa wakati halisi moja kwa moja mlangoni.',
      descEn: 'Track your assigned courier and live vehicle updates straight to your doorstep.',
      actionTab: 'account',
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm overflow-hidden p-4 sm:p-5 lg:p-6 space-y-4">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3.5">
        <div className="space-y-1 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-extrabold border border-rose-500/20">
            <Youtube className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>{language === 'sw' ? 'Video ya Mwongozo (App Tutorial)' : 'App Video Guide'}</span>
          </div>

          <h2 className="text-sm sm:text-base lg:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{videoTitle}</span>
          </h2>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {videoDesc}
          </p>
        </div>

        {/* Admin Quick Action to update YouTube Link */}
        {isStaffOrAdmin && (
          <button
            type="button"
            onClick={() => onNavigateToTab && onNavigateToTab('admin')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
            title="Hariri video hii kwenye Admin Dashboard"
          >
            <Settings className="w-3.5 h-3.5 text-amber-500 group-hover:text-white" />
            <span>{language === 'sw' ? 'Badilisha Video (Admin)' : 'Edit Video Link (Admin)'}</span>
          </button>
        )}
      </div>

      {/* Video Display Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Embedded YouTube Video or Placeholder */}
        <div className="lg:col-span-7 space-y-2">
          {embedUrl ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-md">
              <iframe
                src={embedUrl}
                title={videoTitle}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-850 to-amber-950 border border-slate-800 flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-rose-600/90 text-white flex items-center justify-center shadow-lg ring-4 ring-rose-500/20 animate-pulse">
                <Youtube className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-xs sm:text-sm font-extrabold text-white">
                  {language === 'sw' ? 'Video ya YouTube Itaonekana Hapa' : 'YouTube Tutorial Appears Here'}
                </h4>
                <p className="text-[11px] text-slate-300">
                  {isStaffOrAdmin
                    ? (language === 'sw'
                        ? 'Admin: Weka link ya video ya YouTube kwenye Admin Dashboard > Matawi & Mawasiliano ili ionekane kwa wateja wote hapa.'
                        : 'Admin: Add your YouTube video link in Admin Dashboard > Branches & Contacts to display it here.')
                    : (language === 'sw'
                        ? 'Tazama hatua za haraka hapo kulia kuanza kutumia mfumo.'
                        : 'Review the quick steps on the right to start exploring.')}
                </p>
              </div>

              {isStaffOrAdmin && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab && onNavigateToTab('admin')}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>{language === 'sw' ? 'Weka Link ya Video Sasa' : 'Add YouTube Video Link'}</span>
                </button>
              )}
            </div>
          )}

          {rawVideoUrl && (
            <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>{language === 'sw' ? 'Mwongozo Rasmi wa YMA Energy' : 'Official YMA Energy Guide'}</span>
              </span>
              <a
                href={rawVideoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:underline font-bold"
              >
                <span>{language === 'sw' ? 'Fungua YouTube' : 'Open in YouTube'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Right Column: 3-Step Interactive Process */}
        <div className="lg:col-span-5 space-y-2.5 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{language === 'sw' ? 'Hatua 3 Rahisi za Kuanza' : '3 Easy Steps to Get Started'}</span>
            </h3>

            <div className="space-y-2">
              {steps.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => onNavigateToTab && onNavigateToTab(item.actionTab)}
                    className="p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all cursor-pointer group flex items-start gap-3"
                  >
                    <div className={`p-2 rounded-xl border shrink-0 font-mono font-black text-xs ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {language === 'sw' ? item.titleSw : item.titleEn}
                        </h4>
                        <span className="text-[10px] font-black font-mono text-slate-400">
                          {item.step}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {language === 'sw' ? item.descSw : item.descEn}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-900 dark:text-amber-300">
            <span className="text-[11px] font-semibold">
              {language === 'sw' ? 'Je, unahitaji ushauri wa kitaalamu?' : 'Need engineering consultation?'}
            </span>
            <button
              type="button"
              onClick={() => onNavigateToTab && onNavigateToTab('contact')}
              className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 hover:underline shrink-0"
            >
              {language === 'sw' ? 'Wasiliana Nasi' : 'Contact Us'} &rarr;
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
