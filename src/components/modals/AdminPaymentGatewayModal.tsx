import React, { useState, useEffect } from 'react';
import { X, CreditCard, Save, Loader2 } from 'lucide-react';
import { usePaymentGatewayStore, PaymentGateway } from '../../store/usePaymentGatewayStore';

interface AdminPaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  gatewayToEdit?: PaymentGateway | null;
}

export const AdminPaymentGatewayModal: React.FC<AdminPaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  gatewayToEdit,
}) => {
  const { addGateway, updateGateway } = usePaymentGatewayStore();

  const [name, setName] = useState('');
  const [nameSw, setNameSw] = useState('');
  const [type, setType] = useState<'mobile_money' | 'bank_transfer' | 'card' | 'cash_on_delivery'>('mobile_money');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [instructionsSw, setInstructionsSw] = useState('');
  const [badge, setBadge] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (gatewayToEdit) {
      setName(gatewayToEdit.name);
      setNameSw(gatewayToEdit.nameSw || gatewayToEdit.name);
      setType(gatewayToEdit.type);
      setAccountNumber(gatewayToEdit.accountNumber);
      setAccountName(gatewayToEdit.accountName);
      setInstructions(gatewayToEdit.instructions);
      setInstructionsSw(gatewayToEdit.instructionsSw || gatewayToEdit.instructions);
      setBadge(gatewayToEdit.badge || '');
    } else {
      setName('');
      setNameSw('');
      setType('mobile_money');
      setAccountNumber('');
      setAccountName('');
      setInstructions('');
      setInstructionsSw('');
      setBadge('');
    }
  }, [gatewayToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !accountNumber.trim()) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (gatewayToEdit) {
      updateGateway(gatewayToEdit.id, {
        name,
        nameSw,
        type,
        accountNumber,
        accountName,
        instructions,
        instructionsSw,
        badge,
      });
    } else {
      addGateway({
        name,
        nameSw,
        type,
        accountNumber,
        accountName,
        instructions,
        instructionsSw,
        isActive: true,
        badge,
      });
    }

    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold">
              {gatewayToEdit ? 'Hariri Njia ya Malipo (Payment Gateway)' : 'Ongeza Njia Mpya ya Malipo'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg bg-white/10 hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Jina la Gateway (English) *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. M-Pesa Merchant Lipa Namba"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Jina la Gateway (Kiswahili)
            </label>
            <input
              type="text"
              value={nameSw}
              onChange={(e) => setNameSw(e.target.value)}
              placeholder="mfano: M-Pesa (Lipa Namba)"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Aina ya Malipo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
              >
                <option value="mobile_money">Mobile Money (Simu)</option>
                <option value="bank_transfer">Bank Transfer (Benki)</option>
                <option value="card">Card (Visa/Mastercard)</option>
                <option value="cash_on_delivery">Cash on Delivery / Store</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Lipa Namba / Akaunti *
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="5522101 au Namba ya Akaunti"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Jina la Akaunti / Kampuni
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="YMA ENERGY GROUP"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Maelekezo ya Malipo (Kiswahili)
            </label>
            <textarea
              value={instructionsSw}
              onChange={(e) => setInstructionsSw(e.target.value)}
              placeholder="Piga *150*00# -> Lipa kwa M-Pesa -> Weka 5522101..."
              rows={2}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Kilebo (Badge / Special Tag)
            </label>
            <input
              type="text"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="mfano: Popular, Fast ⚡, Corporate"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Inahifadhi Njia ya Malipo...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{gatewayToEdit ? 'Hifadhi Mabadiliko' : 'Ongeza Gateway'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
