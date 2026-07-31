import React from 'react';
import { X, FileText, Download, CheckCircle2, ShieldCheck, Sun } from 'lucide-react';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    totalRepairs: number;
  };
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  metrics,
}) => {
  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    alert('Business Analytics PDF Report downloaded successfully!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 rounded-xl text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Business Analytics Report Export</h2>
              <p className="text-xs text-amber-400">YMA Energy Tanzania Executive Summary</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Report Content Preview */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Reporting Period
              </span>
              <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold">
                Q3 2026 (Year to Date)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Total Revenue</span>
                <span className="font-black text-amber-600 dark:text-amber-400">
                  TZS {metrics.totalRevenue.toLocaleString()}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Fulfilled Orders</span>
                <span className="font-black text-slate-900 dark:text-slate-100">
                  {metrics.totalOrders} Orders
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Emergency Repairs</span>
                <span className="font-black text-rose-600 dark:text-rose-400">
                  {metrics.totalRepairs} Dispatches
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Audit Compliance</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  100% TRA EFD
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadPdf}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Full PDF Report (YMA-Analytics-2026.pdf)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
