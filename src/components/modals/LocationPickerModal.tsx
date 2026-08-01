import React, { useState } from 'react';
import { X, MapPin, Search, Check, Navigation } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCartStore } from '../../store/useCartStore';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress?: (region: string, district: string, address: string) => void;
}

const tanzaniaRegions = [
  'Dar es Salaam',
  'Arusha',
  'Mwanza',
  'Dodoma',
  'Zanzibar',
  'Kilimanjaro (Moshi)',
  'Mbeya',
  'Tanga',
  'Morogoro',
  'Iringa',
  'Tabora',
  'Mtwara',
  'Kagera (Bukoba)',
  'Shinyanga',
  'Kigoma',
  'Ruvuma (Songea)',
  'Mara (Musoma)',
  'Lindi',
  'Singida',
  'Manyara (Babati)',
  'Geita',
  'Katavi (Mpanda)',
  'Njombe',
  'Songwe',
  'Simiyu',
];

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectAddress,
}) => {
  const { t } = useLanguage();
  const setShippingInfo = useCartStore((s) => s.setShippingInfo);

  const [searchRegion, setSearchRegion] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [landmark, setLandmark] = useState('');
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  const filteredRegions = tanzaniaRegions.filter((r) =>
    r.toLowerCase().includes(searchRegion.toLowerCase())
  );

  const handleConfirm = () => {
    if (!selectedRegion) {
      setValidationError('Tafadhali chagua Mkoa (Select Region).');
      return;
    }
    if (!district.trim()) {
      setValidationError('Tafadhali jaza Wilaya / District.');
      return;
    }
    if (!landmark.trim()) {
      setValidationError('Tafadhali jaza Mtaa / Barabara / Landmark.');
      return;
    }

    setValidationError('');
    const fullAddress = `${landmark.trim()}, ${district.trim()}, ${selectedRegion}`;
    setShippingInfo({
      selectedRegion,
      selectedDistrict: district.trim(),
      shippingAddress: fullAddress,
    });

    if (onSelectAddress) {
      onSelectAddress(selectedRegion, district.trim(), fullAddress);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 rounded-xl text-white">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Location Pin & Address Picker</h2>
              <p className="text-xs text-slate-300">Tanzania Regional Map Coverage</p>
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
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Simulated Map Visual */}
          <div className="relative h-40 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-center p-4">
            <div
              className="absolute inset-0 opacity-20 bg-cover bg-center"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800')`,
              }}
            />
            <div className="relative z-10 space-y-1">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto shadow-lg animate-bounce">
                <Navigation className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Pinned GPS Location: {selectedRegion}
              </p>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Lat: -6.7621° S | Long: 39.2431° E
              </p>
            </div>
          </div>

          {/* Region Search */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Search Region / City
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchRegion}
                onChange={(e) => setSearchRegion(e.target.value)}
                placeholder="Type region (e.g. Dar es Salaam, Arusha, Mwanza...)"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>
          </div>

          {/* Region Chip Options */}
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800 rounded-xl">
            {filteredRegions.map((reg) => (
              <button
                key={reg}
                type="button"
                onClick={() => setSelectedRegion(reg)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedRegion === reg
                    ? 'bg-amber-500 text-white shadow-sm font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {reg}
              </button>
            ))}
          </div>

          {/* District & Landmark Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                District / Wilaya
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="E.g., Kinondoni, Njiro, Nyamagana"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Landmark / Street Address
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="E.g., Plot 12, Mikocheni B"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                required
              />
            </div>
          </div>

          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold">
              ⚠️ {validationError}
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleConfirm}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Confirm Location Pin Address</span>
          </button>
        </div>
      </div>
    </div>
  );
};
