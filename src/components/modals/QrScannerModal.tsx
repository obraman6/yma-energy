import React, { useState } from 'react';
import { X, QrCode, CheckCircle, Camera } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (code: string) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanResult,
}) => {
  const { t } = useLanguage();
  const [manualCode, setManualCode] = useState('');
  const [scannedCode, setScannedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulateScan = () => {
    const codes = [
      'SN-SLR-99210-550W',
      'SN-INV-55kW-2026-041',
      'SN-BAT-10kWh-WALL-8812',
      'SN-PUMP-3HP-SOLAR-0992',
    ];
    const picked = codes[Math.floor(Math.random() * codes.length)];
    setScannedCode(picked);
  };

  const handleConfirmScan = () => {
    const codeToUse = scannedCode || manualCode;
    if (codeToUse) {
      onScanResult(codeToUse);
      setScannedCode(null);
      setManualCode('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 rounded-xl text-white">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Packaging Barcode / QR Scanner</h2>
              <p className="text-xs text-slate-300">Scan Product Serial Code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewfinder View */}
        <div className="p-6 space-y-4">
          <div className="relative h-56 rounded-2xl overflow-hidden bg-slate-950 flex flex-col items-center justify-center border-2 border-dashed border-amber-500/60 p-4 text-center">
            <div className="absolute inset-8 border-2 border-amber-500 rounded-xl animate-pulse pointer-events-none" />

            <Camera className="w-10 h-10 text-amber-500 mb-2" />
            <p className="text-xs font-bold text-white">Align Barcode / QR Code in Frame</p>
            <p className="text-[10px] text-slate-400">YMA Hardware Packaging Verification</p>

            {scannedCode && (
              <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-4 space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
                <p className="text-xs font-bold text-white">Scanned Serial Number:</p>
                <p className="text-sm font-black font-mono text-amber-400">{scannedCode}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleSimulateScan}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            <span>Simulate QR Camera Scan</span>
          </button>

          <div className="relative my-2 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 bg-white dark:bg-slate-900 px-2 relative z-10">
              OR Manual Serial Entry
            </span>
            <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-200 dark:bg-slate-800 -translate-y-1/2" />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="e.g. SN-SLR-99210-550W"
              className="flex-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
            />
            <button
              onClick={handleConfirmScan}
              disabled={!scannedCode && !manualCode.trim()}
              className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs disabled:opacity-50"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
