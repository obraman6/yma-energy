import React from 'react';
import { AlertTriangle, LogOut, Trash2, X, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'delete' | 'logout' | 'warning';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Ndio, Tekeleza',
  cancelText = 'Ghairi',
  type = 'warning',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const Icon = type === 'logout' ? LogOut : type === 'delete' ? Trash2 : AlertTriangle;
  const iconBg =
    type === 'delete'
      ? 'bg-rose-100 dark:bg-rose-950 text-rose-600'
      : type === 'logout'
      ? 'bg-amber-100 dark:bg-amber-950 text-amber-600'
      : 'bg-amber-100 dark:bg-amber-950 text-amber-600';

  const confirmBtnBg =
    type === 'delete'
      ? 'bg-rose-600 hover:bg-rose-700 text-white'
      : 'bg-amber-500 hover:bg-amber-600 text-white';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${iconBg}`}>
          <Icon className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {title}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md ${confirmBtnBg}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Inatekeleza...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
