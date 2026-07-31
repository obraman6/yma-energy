import React from 'react';
import { Home, ShoppingBag, Wrench, ShieldAlert, User, Cpu } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuthStore } from '../../store/useAuthStore';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { t } = useLanguage();
  const { user } = useAuthStore();

  const tabs = [
    { id: 'home', label: t('navHome'), icon: Home },
    { id: 'shop', label: t('navShop'), icon: ShoppingBag },
    { id: 'services', label: t('navServices'), icon: Wrench },
    { id: 'repairs', label: t('navRepairs'), icon: ShieldAlert },
    {
      id: 'account',
      label: user?.role === 'ADMIN' ? t('adminPanel') : t('navAccount'),
      icon: user?.role === 'ADMIN' ? Cpu : User,
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 transition-colors shadow-lg">
      <div className="max-w-md mx-auto px-1 flex items-center justify-around h-[60px]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all relative ${
                isActive
                  ? 'text-amber-600 dark:text-amber-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              id={`tab-${tab.id}`}
            >
              <div className={`p-1 rounded-lg transition-colors ${
                isActive ? 'bg-amber-100 dark:bg-amber-950/80' : ''
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] tracking-tight line-clamp-1 mt-0.5 font-medium">
                {tab.label}
              </span>

              {isActive && (
                <span className="absolute bottom-0 w-6 h-0.5 bg-amber-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
