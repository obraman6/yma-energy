import React, { useState, useEffect } from 'react';
import { X, Upload, Link as LinkIcon, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { Product, ProductCategory } from '../../types';
import { useProductStore } from '../../store/useProductStore';
import { useToastStore } from '../../store/useToastStore';

interface AdminProductModalProps {
  productToEdit: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AdminProductModal: React.FC<AdminProductModalProps> = ({
  productToEdit,
  isOpen,
  onClose,
}) => {
  const { addProduct, editProduct } = useProductStore();
  const showToast = useToastStore((s) => s.showToast);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Solar Panels');
  const [priceTzs, setPriceTzs] = useState(350000);
  const [stock, setStock] = useState(25);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [specifications, setSpecifications] = useState('');
  const [description, setDescription] = useState('');
  const [warrantyPeriod, setWarrantyPeriod] = useState('25 Years Performance Warranty');
  
  // Image state
  const [imageUrl, setImageUrl] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setPriceTzs(productToEdit.priceTzs);
      setStock(productToEdit.stock);
      setLowStockThreshold(productToEdit.lowStockThreshold ?? 5);
      setSpecifications(productToEdit.specifications);
      setDescription(productToEdit.description || '');
      setWarrantyPeriod(productToEdit.warrantyPeriod || '25 Years Performance Warranty');
      setImageUrl(productToEdit.imageUrl);
      setImageFileName('');
    } else {
      setName('');
      setCategory('Solar Panels');
      setPriceTzs(450000);
      setStock(20);
      setLowStockThreshold(5);
      setSpecifications('Monocrystalline Grade-A Cell, 25-Year Performance Guarantee');
      setDescription('High efficiency Tier-1 certified solar component manufactured for Tropical East African climate resilience.');
      setWarrantyPeriod('25 Years Performance Warranty');
      setImageUrl('https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&q=80&w=800');
      setImageFileName('');
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        showToast({
          title: 'Ukubwa wa Picha Umezidi (File too large)',
          message: 'Tafadhali chagua picha iliyo chini ya 8MB.',
          type: 'warning',
        });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalImage =
      imageUrl ||
      'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&q=80&w=800';

    if (productToEdit) {
      editProduct(productToEdit.id, {
        name,
        category,
        priceTzs: Number(priceTzs),
        stock: Number(stock),
        lowStockThreshold: Number(lowStockThreshold),
        specifications,
        description,
        warrantyPeriod,
        imageUrl: finalImage,
      });

      showToast({
        title: 'Bidhaa Imesasishwa! ✏️',
        message: `Mabadiliko ya "${name}" yamehifadhiwa kikamilifu.`,
        type: 'success',
      });
    } else {
      addProduct({
        name,
        category,
        priceTzs: Number(priceTzs),
        stock: Number(stock),
        lowStockThreshold: Number(lowStockThreshold),
        specifications,
        description,
        warrantyPeriod,
        imageUrl: finalImage,
      });

      showToast({
        title: 'Bidhaa Mpya Imeongezwa! 🎉',
        message: `Bidhaa "${name}" imeongezwa kwenye duka la YMA Energy.`,
        type: 'success',
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {productToEdit ? 'Badili Bidhaa (Edit Product)' : 'Ongeza Bidhaa Mpya (Add Product)'}
              </h2>
              <p className="text-[11px] text-amber-200/80">
                {productToEdit ? `ID: ${productToEdit.id}` : 'Weka taarifa za bidhaa na picha kutoka kwenye kifaa chako'}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Product Name (Jina la Bidhaa) *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g., Jinko Solar 550W Mono Panel"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Category (Aina ya Bidhaa)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
              >
                <option value="Solar Panels">Solar Panels</option>
                <option value="Hybrid Inverters">Hybrid Inverters</option>
                <option value="Lithium Batteries">Lithium Batteries</option>
                <option value="Gel Batteries">Gel Batteries</option>
                <option value="Solar Water Heaters">Solar Water Heaters</option>
                <option value="Solar Pumps">Solar Pumps</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Price TZS (Bei kwa Shilingi) *
              </label>
              <input
                type="number"
                value={priceTzs}
                onChange={(e) => setPriceTzs(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Stock (Idadi) *
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="font-bold text-amber-600 dark:text-amber-400 block mb-1">
                Low Stock Threshold *
              </label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                placeholder="5"
                className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 text-slate-900 dark:text-slate-100 font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Warranty Period
              </label>
              <input
                type="text"
                value={warrantyPeriod}
                onChange={(e) => setWarrantyPeriod(e.target.value)}
                placeholder="E.g. 25 Years"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Product Image Selection - Device Upload & URL */}
          <div className="space-y-2.5 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                Picha ya Bidhaa (Product Image)
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
                  <span>Kutoka Device</span>
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
                  alt="Product preview"
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                  onError={(e) => {
                    // Fallback preview
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&q=80&w=800';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">
                    {imageFileName || 'Picha ya Bidhaa Imewekwa'}
                  </p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Preview ipo tayari</span>
                  </p>
                </div>
              </div>
            )}

            {imageInputMode === 'upload' ? (
              <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors group text-center">
                <div className="p-2 rounded-full bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform mb-1.5">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  Pakia picha ya bidhaa kutoka kwenye kompyuta au simu yako
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Inasaidia PNG, JPG au WEBP (Max 8MB)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImageFileName('');
                  }}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
                />
              </div>
            )}
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Specifications (Vipimo na Sifa za Kina)
            </label>
            <textarea
              value={specifications}
              onChange={(e) => setSpecifications(e.target.value)}
              rows={2}
              placeholder="E.g., Monocrystalline Grade-A Cell, 25-Year Performance Guarantee"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Description (Maelezo ya Bidhaa)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="E.g., High efficiency solar panel suited for residential or commercial installation..."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{productToEdit ? 'Hifadhi Mabadiliko (Save Changes)' : 'Ongeza Bidhaa (Create Product)'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
