import React, { useState } from 'react';
import { X, Shield, Send, CheckCircle2, AlertTriangle, QrCode } from 'lucide-react';
import { Warranty } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useWarrantyStore } from '../../store/useWarrantyStore';
import { useAuthStore } from '../../store/useAuthStore';

interface WarrantyClaimModalProps {
  warranty: Warranty | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenQrScanner: () => void;
}

export const WarrantyClaimModal: React.FC<WarrantyClaimModalProps> = ({
  warranty,
  isOpen,
  onClose,
  onOpenQrScanner,
}) => {
  const { t } = useLanguage();
  const { fileClaim } = useWarrantyStore();
  const { user } = useAuthStore();

  const [issueDescription, setIssueDescription] = useState('');
  const [claimSubmittedRef, setClaimSubmittedRef] = useState<string | null>(null);

  if (!isOpen || !warranty) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!issueDescription.trim()) return;

    const claim = fileClaim({
      warrantyId: warranty.id,
      userId: user.id,
      productName: warranty.productName,
      customerName: user.name,
      customerPhone: user.phone || '',
      issueDescription,
    });

    setClaimSubmittedRef(claim.claimNumber);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">{t('fileClaim')}</h2>
              <p className="text-xs text-amber-100 font-mono">{warranty.serialNumber}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setClaimSubmittedRef(null);
              onClose();
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {claimSubmittedRef ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Warranty Claim Filed Successfully
                </h3>
                <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-500 mt-1">
                  Ticket #{claimSubmittedRef}
                </p>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Our technical inspection engineers will review your defect claim within 24 hours.
              </p>

              <button
                onClick={() => {
                  setClaimSubmittedRef(null);
                  onClose();
                }}
                className="mt-2 px-6 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                <p className="font-bold text-slate-900 dark:text-slate-100">
                  {warranty.productName}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Coverage: {warranty.warrantyPeriod}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Purchased: {warranty.purchaseDate} (Expires: {warranty.expiryDate})
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onOpenQrScanner}
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 hover:underline"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Scan QR Code on Packaging</span>
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('issueDescription')} *
                </label>
                <textarea
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe hardware defect or fault (e.g., Inverter LCD display flickering, panel glass defect...)"
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{t('submitClaim')}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
