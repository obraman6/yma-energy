import React from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-[120] flex flex-col gap-2 max-w-sm w-[calc(100vw-24px)] pointer-events-none">
      {toasts.map((toast) => {
        const Icon =
          toast.type === 'error'
            ? XCircle
            : toast.type === 'warning'
            ? AlertCircle
            : toast.type === 'info'
            ? Info
            : CheckCircle2;

        const bgColors =
          toast.type === 'error'
            ? 'bg-rose-900 border-rose-700 text-white'
            : toast.type === 'warning'
            ? 'bg-amber-900 border-amber-700 text-white'
            : toast.type === 'info'
            ? 'bg-slate-900 border-slate-700 text-white'
            : 'bg-emerald-950/95 border-emerald-600 text-white';

        const iconColors =
          toast.type === 'error'
            ? 'text-rose-400'
            : toast.type === 'warning'
            ? 'text-amber-400'
            : toast.type === 'info'
            ? 'text-sky-400'
            : 'text-emerald-400';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md flex items-start gap-3 transition-all duration-300 transform translate-y-0 animate-slide-up ${bgColors}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColors}`} />

            <div className="flex-1 min-w-0 space-y-0.5">
              <h4 className="text-xs font-bold leading-tight">{toast.title}</h4>
              <p className="text-[11px] text-slate-200 leading-snug line-clamp-2">
                {toast.message}
              </p>

              {toast.actionLabel && toast.onAction && (
                <button
                  onClick={() => {
                    toast.onAction?.();
                    removeToast(toast.id);
                  }}
                  className="mt-1.5 px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-[10px] transition-colors"
                >
                  {toast.actionLabel}
                </button>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
