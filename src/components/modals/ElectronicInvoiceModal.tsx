import React from 'react';
import { X, CheckCircle, Printer, Download, ShieldCheck, Sun } from 'lucide-react';
import { Order } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface ElectronicInvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ElectronicInvoiceModal: React.FC<ElectronicInvoiceModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();

  if (!isOpen || !order || typeof order !== 'object' || !('id' in order)) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Official E-Tax Invoice & Receipt</h2>
              <p className="text-xs text-amber-400 font-mono">TRA EFD Approved • {order.invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Container */}
        <div id="printable-invoice" className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* TRA Compliance Badge Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs font-bold">
                Tanzania Revenue Authority (TRA) Electronic Fiscal Device (EFD) Receipt Verified
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-200 dark:bg-emerald-900 px-2 py-0.5 rounded text-emerald-900 dark:text-emerald-100">
              VRN: 40012988
            </span>
          </div>

          {/* Business & Customer Info Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            {/* Vendor */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
              <p className="font-bold text-slate-900 dark:text-slate-100">YMA ENERGY TANZANIA LTD</p>
              <p className="text-slate-500 dark:text-slate-400">TIN: 142-998-102</p>
              <p className="text-slate-500 dark:text-slate-400">Plot 44, Mikocheni B, Dar es Salaam</p>
              <p className="text-slate-500 dark:text-slate-400">Helpline: +255 622 359 874</p>
            </div>

            {/* Customer */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
              <p className="font-bold text-slate-900 dark:text-slate-100">{order.customerName}</p>
              <p className="text-slate-500 dark:text-slate-400">Phone: {order.customerPhone}</p>
              <p className="text-slate-500 dark:text-slate-400">Address: {order.shippingAddress}</p>
              <p className="text-slate-500 dark:text-slate-400">Order Date: {order.createdAt}</p>
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-3 gap-3 text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded-xl">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Order Number</span>
              <span className="font-bold font-mono text-slate-900 dark:text-slate-100">{order.orderNumber}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Payment Gateway</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{order.paymentMethod}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Payment Reference</span>
              <span className="font-bold font-mono text-amber-600 dark:text-amber-400">{order.paymentRef}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="p-3">Item Description</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Total (TZS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {(order.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-3 font-medium text-slate-900 dark:text-slate-100">
                      {item.product.name}
                    </td>
                    <td className="p-3 text-center text-slate-600 dark:text-slate-300">
                      {item.quantity}
                    </td>
                    <td className="p-3 text-right text-slate-600 dark:text-slate-300 font-mono">
                      {item.product.priceTzs.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {(item.product.priceTzs * item.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Totals */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Subtotal Amount:</span>
              <span className="font-mono font-bold">TZS {order.subtotalTzs.toLocaleString()}</span>
            </div>
            {order.discountTzs > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Coupon Discount (10% SOLAR2026):</span>
                <span className="font-mono font-bold">- TZS {order.discountTzs.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-300">
              <span>VAT (18% Included):</span>
              <span className="font-mono">TZS {Math.round(order.totalAmountTzs * 0.18).toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-slate-700 flex justify-between text-sm sm:text-base font-extrabold text-amber-400">
              <span>Total Paid Amount:</span>
              <span className="font-mono">TZS {order.totalAmountTzs.toLocaleString()}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print E-Receipt</span>
            </button>

            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs"
            >
              Done & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
