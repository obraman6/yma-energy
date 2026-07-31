import React from 'react';
import { ShieldCheck, Award, Zap, Users, CheckCircle2, Building2, Phone } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface AboutViewProps {
  setActiveTab: (tab: string) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ setActiveTab }) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 sm:p-12 border border-slate-800 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30">
            About YMA Energy Tanzania
          </span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Standardizing Clean Solar Energy Across East Africa
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            YMA Energy is a premier Tanzanian renewable energy engineering firm. We specialize in distributing Tier-1 monocrystalline panels, hybrid intelligent inverters, lithium iron phosphate (LiFePO4) storage, and offering certified turnkey installation for homes, commercial hubs, and agricultural irrigation.
          </p>

          <div className="pt-4 flex flex-wrap gap-4">
            <button
              onClick={() => setActiveTab('shop')}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20"
            >
              Explore Equipment Catalog
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20"
            >
              Visit Local Branch
            </button>
          </div>
        </div>
      </section>

      {/* Corporate Pillars Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Tier-1 Certified Hardware',
            description: 'We import directly from top-tier global solar manufacturers with full TBS & ISO certification.',
            icon: ShieldCheck,
            color: 'text-amber-500 bg-amber-500/10',
          },
          {
            title: '25-Year Performance Warranty',
            description: 'Our monocrystalline solar panels come with a 25-year manufacturer power output guarantee.',
            icon: Award,
            color: 'text-emerald-500 bg-emerald-500/10',
          },
          {
            title: 'Certified Field Engineers',
            description: 'In-house ERB-certified solar technicians for seamless site audits and load balancing.',
            icon: Users,
            color: 'text-sky-500 bg-sky-500/10',
          },
          {
            title: '24/7 Rapid Dispatch',
            description: 'Emergency repair response team equipped for immediate battery and inverter troubleshooting.',
            icon: Zap,
            color: 'text-purple-500 bg-purple-500/10',
          },
        ].map((pillar, idx) => {
          const Icon = pillar.icon;
          return (
            <div
              key={idx}
              className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${pillar.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {pillar.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {pillar.description}
              </p>
            </div>
          );
        })}
      </section>

      {/* Mission & Vision */}
      <section className="p-8 sm:p-10 rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            Our Mission
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            To eliminate power outages and provide clean, reliable, and affordable solar energy solutions for households, businesses, schools, and health facilities across Tanzania.
          </p>
          <ul className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300 pt-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>100% genuine guaranteed original products</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Transparent pricing in Tanzanian Shillings (TZS)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Electronic VAT Invoicing (TRA EFD compatible)</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            Our Vision
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            To be the leading solar technology partner in East Africa, setting the benchmark for engineering excellence, customer trust, and sustainable energy transition.
          </p>
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold">
            🌟 Over 5,000+ successful micro-grid installations completed across Dar es Salaam, Dodoma, Arusha, Mwanza, and Mbeya.
          </div>
        </div>
      </section>
    </div>
  );
};
