import React from 'react';
import { X, MapPin, Phone, Mail, Navigation, ExternalLink } from 'lucide-react';
import { Branch } from '../../types';

interface BranchMapModalProps {
  branch: Branch | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BranchMapModal: React.FC<BranchMapModalProps> = ({
  branch,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !branch) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">{branch.name}</h2>
              <p className="text-xs text-amber-100">{branch.city} Branch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="relative h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <div
              className="absolute inset-0 opacity-40 bg-cover bg-center"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800')`,
              }}
            />
            <div className="relative z-10 text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto shadow-lg">
                <Navigation className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {branch.address}
              </p>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Lat: {branch.latitude}° | Long: {branch.longitude}°
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Branch Phone</span>
              <a href={`tel:${branch.phone}`} className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                {branch.phone}
              </a>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Branch Email</span>
              <a href={`mailto:${branch.email}`} className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {branch.email}
              </a>
            </div>
          </div>

          <a
            href={`https://maps.google.com/?q=${branch.latitude},${branch.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open in Google Maps Directions</span>
          </a>
        </div>
      </div>
    </div>
  );
};
