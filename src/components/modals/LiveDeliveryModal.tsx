import React from 'react';
import {
  X,
  Truck,
  Phone,
  CheckCircle2,
  Clock,
  Package,
  MapPin,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Order } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface LiveDeliveryModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LiveDeliveryModal: React.FC<LiveDeliveryModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();

  if (!isOpen || !order || typeof order !== 'object' || !('id' in order)) return null;

  const steps = [
    { label: 'Order Placed', status: 'Payment Confirmed' },
    { label: 'Packed at Branch', status: 'Packed at Branch' },
    { label: 'Out for Delivery', status: 'Out for Delivery' },
    { label: 'Delivered', status: 'Delivered' },
  ];

  const getStepStatus = (stepIndex: number) => {
    const statusMap: Record<string, number> = {
      'Pending Payment': 0,
      'Payment Confirmed': 1,
      'Packed at Branch': 2,
      'Out for Delivery': 3,
      Delivered: 4,
    };
    const currentLevel = statusMap[order.status] || 1;
    if (currentLevel > stepIndex) return 'completed';
    if (currentLevel === stepIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Live Delivery Tracker</h2>
              <p className="text-xs text-amber-100 font-mono">Order {order.orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Timeline Stepper */}
          <div className="py-2">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 z-0" />

              {steps.map((step, idx) => {
                const state = getStepStatus(idx + 1);
                return (
                  <div key={idx} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                        state === 'completed'
                          ? 'bg-emerald-500 text-white'
                          : state === 'current'
                          ? 'bg-amber-500 text-white ring-4 ring-amber-500/20'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                      }`}
                    >
                      {state === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs font-bold mt-2 text-center max-w-[70px] ${
                        state !== 'upcoming'
                          ? 'text-slate-900 dark:text-slate-100'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Map Simulation */}
          <div className="relative h-44 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 opacity-30 bg-cover bg-center"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800')`,
              }}
            />
            <div className="relative z-10 text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto shadow-lg animate-pulse">
                <Truck className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Live Courier En Route to {order.region}
              </p>
              <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                ETA: 25 Minutes (Kilimani Road - Mikocheni B)
              </p>
            </div>
          </div>

          {/* Assigned Driver Card */}
          {order.driverName ? (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-lg">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {order.driverName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Vehicle: {order.driverVehicle || 'MC 441 DXX (TVS Tricycle)'}
                  </p>
                </div>
              </div>

              <a
                href={`tel:${order.driverPhone}`}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Driver</span>
              </a>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic text-center">
              Driver will be dispatched once packed at the local branch.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
