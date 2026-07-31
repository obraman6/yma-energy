import React from 'react';
import { ShieldAlert, ArrowLeft, LogIn, Lock } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface AccessDeniedViewProps {
  onGoHome: () => void;
  onOpenAuth: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({ onGoHome, onOpenAuth }) => {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="max-w-xl mx-auto my-12 p-8 rounded-3xl border border-rose-200 dark:border-rose-950 bg-white dark:bg-slate-900 shadow-xl text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto ring-8 ring-rose-500/5">
        <ShieldAlert className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
          Access Denied (Hukuruhusiwi)
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          Eneo Hili Ni Kwa Ajili Ya Utawala Tu!
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          {user
            ? `Umeingia kama Mteja (${user.email}). Akaunti za wateja haziruhusiwi kufungua Mfumo wa Utawala (Manager Console).`
            : 'Unatakiwa kuingia kama Administrator au Manager wa YMA Energy ili kupata fursa ya kuona ukurasa huu.'}
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-500 space-y-1">
        <div className="flex items-center justify-center gap-1 font-bold text-slate-700 dark:text-slate-300">
          <Lock className="w-3.5 h-3.5 text-amber-500" />
          <span>Usalama wa Mfumo (Enterprise Security Rules)</span>
        </div>
        <p>Akaunti za Manager/Admin haziwezi kutengenezwa kupitia fomu za umma na zinalindwa moja kwa moja na database ya Firebase Firestore.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={onGoHome}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Rudi Duka la Wateja (Home)</span>
        </button>

        <button
          onClick={onOpenAuth}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
        >
          <LogIn className="w-4 h-4" />
          <span>Ingia Kama Admin Manager</span>
        </button>
      </div>
    </div>
  );
};
