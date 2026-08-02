import React from 'react';
import {
  Wrench,
  CheckCircle2,
  Clock,
  Calendar,
  ShieldCheck,
  ChevronRight,
  Send,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useServicesStore } from '../../store/useServicesStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { SolarService } from '../../types';
import { ConcentricSpinner } from '../common/ConcentricSpinner';

interface ServicesViewProps {
  onSelectService: (service: SolarService) => void;
  openAuthModal?: () => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({ onSelectService, openAuthModal }) => {
  const { t, language } = useLanguage();
  const { services, isLoading } = useServicesStore();
  const { user } = useAuthStore();

  const handleSelectService = (service: SolarService) => {
    if (!user) {
      useToastStore.getState().showToast({
        title: 'Ingia kwenye Akaunti (Login Required) 🔒',
        message: 'Tafadhali ingia kwanza ili uweze kuomba huduma ya kisayansi na kiufundi.',
        type: 'warning',
      });
      openAuthModal?.();
      return;
    }
    onSelectService(service);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header Banner */}
      <div className="p-5 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-800 shadow-lg space-y-2.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold border border-sky-500/30">
          <Wrench className="w-3.5 h-3.5 text-sky-400" />
          <span>Certified Solar Engineering Field Logistics</span>
        </div>

        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black">{t('servicesTitle')}</h1>

        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          {t('servicesSubtitle')}
        </p>
      </div>

      {/* Services List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {isLoading ? (
          <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <ConcentricSpinner
              size="lg"
              text={language === 'sw' ? 'Inapakia orodha ya huduma za mfumo...' : 'Loading services list...'}
              subtext={language === 'sw' ? 'Tafadhali subiri kidogo ⏳' : 'Please wait a moment ⏳'}
            />
          </div>
        ) : services.length === 0 ? (
          <div className="col-span-full p-8 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            {t('noServicesAvailable', 'No services available at this time.')}
          </div>
        ) : (
          services.map((service) => (
          <div
            key={service.id}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-sm hover:shadow-md transition-all flex gap-2 h-auto"
          >
            {/* Image (96px x 96px) */}
            <div className="w-[96px] h-[96px] relative overflow-hidden bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
              <img
                src={service.imageUrl}
                alt={service.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-500 text-white">
                {service.category}
              </span>
            </div>

            {/* Service Info */}
            <div className="flex-1 flex flex-col justify-between min-w-0">
              <div>
                <h3 className="text-[14px] font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight">
                  {language === 'sw' ? service.nameSw : service.name}
                </h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                  {language === 'sw' ? service.descriptionSw : service.description}
                </p>
              </div>

              {/* Price & Booking Button */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div>
                  <span className="text-[14px] font-black text-[#F59E0B] font-mono tracking-tight block">
                    TZS {service.basePriceTzs.toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() => handleSelectService(service)}
                  className="h-[30px] px-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-[11px] shadow-sm flex items-center justify-center gap-1 transition-transform"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{t('bookService')}</span>
                </button>
              </div>
            </div>
          </div>
        )))}
      </div>
    </div>
  );
};
