import React, { useState, useEffect } from 'react';
import { X, Loader2, Save, Wrench, Upload, Link as LinkIcon, Image as ImageIcon, Trash2, CheckCircle2 } from 'lucide-react';
import { useServicesStore } from '../../store/useServicesStore';
import { SolarService } from '../../types';

interface AdminServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceToEdit?: SolarService | null;
}

const DEFAULT_SERVICE_IMAGE = '';

export const AdminServiceModal: React.FC<AdminServiceModalProps> = ({
  isOpen,
  onClose,
  serviceToEdit,
}) => {
  const { addService, editService } = useServicesStore();

  const [name, setName] = useState('');
  const [nameSw, setNameSw] = useState('');
  const [category, setCategory] = useState<string>('');
  const [basePriceTzs, setBasePriceTzs] = useState(0);
  const [durationHours, setDurationHours] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionSw, setDescriptionSw] = useState('');
  const [features, setFeatures] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>(DEFAULT_SERVICE_IMAGE);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (serviceToEdit) {
      setName(serviceToEdit.name || '');
      setNameSw(serviceToEdit.nameSw || serviceToEdit.name || '');
      setCategory(serviceToEdit.category || 'Installation');
      setBasePriceTzs(serviceToEdit.basePriceTzs || 250000);
      setDurationHours(serviceToEdit.durationHours || '4 - 6 Hours');
      setDescription(serviceToEdit.description || '');
      setDescriptionSw(serviceToEdit.descriptionSw || serviceToEdit.description || '');
      setFeatures(serviceToEdit.features ? serviceToEdit.features.join(', ') : '');
      setImageUrl(serviceToEdit.imageUrl || DEFAULT_SERVICE_IMAGE);
      setImageFileName('');
      setUploadError(null);
    } else {
      setName('');
      setNameSw('');
      setCategory('Installation');
      setBasePriceTzs(0);
      setDurationHours('');
      setDescription('');
      setDescriptionSw('');
      setFeatures('');
      setImageUrl(DEFAULT_SERVICE_IMAGE);
      setImageFileName('');
      setUploadError(null);
    }
  }, [serviceToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setUploadError('Picha hii ni kubwa mno (zaidi ya 8MB). Tafadhali chagua picha ndogo.');
        return;
      }
      setImageFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);

    // Simulate network delay for real loading experience
    await new Promise((resolve) => setTimeout(resolve, 500));

    const featureList = features
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const finalImage = imageUrl.trim() || '';

    if (serviceToEdit) {
      await editService(serviceToEdit.id, {
        name,
        nameSw: nameSw || name,
        category,
        basePriceTzs: Number(basePriceTzs),
        durationHours,
        description,
        descriptionSw: descriptionSw || description,
        features: featureList.length > 0 ? featureList : serviceToEdit.features,
        imageUrl: finalImage,
      });
    } else {
      await addService({
        name,
        nameSw: nameSw || name,
        category,
        basePriceTzs: Number(basePriceTzs),
        durationHours,
        description,
        descriptionSw: descriptionSw || description,
        features: featureList.length > 0 ? featureList : ['Technical Site Audit', 'BOQ Report'],
        imageUrl: finalImage,
      });
    }

    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg max-h-[95vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 sm:p-5 shrink-0 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {serviceToEdit ? 'Hariri Huduma ya Umeme wa Jua' : 'Ongeza Huduma Mpya ya Umeme wa Jua'}
              </h2>
              <p className="text-[11px] text-amber-200/80">
                Weka maelezo ya huduma na picha kutoka kwenye kifaa chako (simu/PC)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto">
          {/* Service Name English */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Jina la Huduma (English) *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Commercial Solar Microgrid Installation"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
              required
            />
          </div>

          {/* Service Name Swahili */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Jina la Huduma (Kiswahili)
            </label>
            <input
              type="text"
              value={nameSw}
              onChange={(e) => setNameSw(e.target.value)}
              placeholder="mfano: Ufungaji wa Mfumo wa Solar za Biashara"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Aina / Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="mfano: Installation, Audit, Maintenance..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Bei ya Kuanzia (TZS) *</label>
              <input
                type="number"
                value={basePriceTzs}
                onChange={(e) => setBasePriceTzs(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Muda wa Kazi (Estimated Duration)
            </label>
            <input
              type="text"
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              placeholder="e.g. 4 - 6 Hours / Masaa 24"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Service Image Selector - Device Upload & URL */}
          <div className="space-y-2.5 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-500" />
                <span>Picha ya Huduma (Service Photo)</span>
              </label>

              <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-[10px]">
                <button
                  type="button"
                  onClick={() => setImageInputMode('upload')}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors ${
                    imageInputMode === 'upload'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  <span>Kutoka Kifaa (Simu/PC)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImageInputMode('url')}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors ${
                    imageInputMode === 'url'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>Image URL</span>
                </button>
              </div>
            </div>

            {/* Live Image Preview Card */}
            {imageUrl && (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <img
                  src={imageUrl}
                  alt="Service preview"
                  className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_SERVICE_IMAGE;
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">
                    {imageFileName || 'Picha ya Huduma Imewekwa'}
                  </p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Imepakiwa & tayari kuonyeshwa</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl(DEFAULT_SERVICE_IMAGE);
                    setImageFileName('');
                  }}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0"
                  title="Ondoa / Weka ya zamani"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Upload File Input */}
            {imageInputMode === 'upload' ? (
              <div className="space-y-1.5">
                <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700/60 bg-white dark:bg-slate-900 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 cursor-pointer transition-colors text-center group">
                  <Upload className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform mb-1" />
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    Bonyeza hapa kuchagua picha kutoka Simu au PC
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Inasapoti PNG, JPG, WEBP au GIF (Max: 8MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {uploadError && (
                  <p className="text-[11px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-900">
                    {uploadError}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/images/solar-service.jpg"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-xs"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Weka link ya mtandaoni moja kwa moja
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Vipengele vya Huduma (Features - Tenganisha kwa mkato ',')
            </label>
            <input
              type="text"
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder="Technical Site Audit, BOQ Report, Warranty"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Maelezo (English)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Maelezo (Kiswahili)</label>
            <textarea
              value={descriptionSw}
              onChange={(e) => setDescriptionSw(e.target.value)}
              rows={2}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="shrink-0 pt-2 pb-2 mt-2 sticky bottom-0 bg-white dark:bg-slate-900">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Inahifadhi Huduma...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{serviceToEdit ? 'Hifadhi Mabadiliko ya Huduma' : 'Ongeza Huduma Upya'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


