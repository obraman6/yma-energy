import { create } from 'zustand';

export interface PaymentGateway {
  id: string;
  name: string;
  nameSw?: string;
  type: 'mobile_money' | 'bank_transfer' | 'card' | 'cash_on_delivery';
  accountNumber: string;
  accountName: string;
  instructions: string;
  instructionsSw?: string;
  isActive: boolean;
  badge?: string;
}

interface PaymentGatewayState {
  gateways: PaymentGateway[];
  addGateway: (gateway: Omit<PaymentGateway, 'id'>) => PaymentGateway;
  updateGateway: (id: string, updated: Partial<PaymentGateway>) => void;
  toggleGatewayStatus: (id: string) => void;
  deleteGateway: (id: string) => void;
}

const initialGateways: PaymentGateway[] = [
  {
    id: 'gw-mpesa',
    name: 'Vodacom M-Pesa Lipa Namba',
    nameSw: 'Vodacom M-Pesa (Lipa Namba)',
    type: 'mobile_money',
    accountNumber: '5522101',
    accountName: 'YMA ENERGY GROUP',
    instructions: 'Dial *150*00# -> Pay Merchant -> Enter Lipa Namba 5522101',
    instructionsSw: 'Piga *150*00# -> Lipa kwa M-Pesa -> Weka Lipa Namba 5522101',
    isActive: true,
    badge: 'Fastest ⚡',
  },
  {
    id: 'gw-tigopesa',
    name: 'Tigo Pesa Mix / Yas',
    nameSw: 'Tigo Pesa (Lipa Namba)',
    type: 'mobile_money',
    accountNumber: '8899120',
    accountName: 'YMA ENERGY GROUP',
    instructions: 'Dial *150*01# -> Pay Merchant -> Enter 8899120',
    instructionsSw: 'Piga *150*01# -> Lipa Biashara -> Weka Namba 8899120',
    isActive: true,
  },
  {
    id: 'gw-airtel',
    name: 'Airtel Money Merchant',
    nameSw: 'Airtel Money (Lipa Namba)',
    type: 'mobile_money',
    accountNumber: '1100445',
    accountName: 'YMA ENERGY GROUP',
    instructions: 'Dial *150*60# -> Pay Merchant -> Enter 1100445',
    instructionsSw: 'Piga *150*60# -> Lipa Biashara -> Weka Namba 1100445',
    isActive: true,
  },
  {
    id: 'gw-crdb',
    name: 'CRDB Bank Direct Deposit',
    nameSw: 'CRDB Bank (Akaunti ya Benki)',
    type: 'bank_transfer',
    accountNumber: '0150992384100',
    accountName: 'YMA ENERGY GROUP',
    instructions: 'Deposit or transfer to CRDB Bank Acc: 0150992384100',
    instructionsSw: 'Weka au tuma fedha kwenda Benki ya CRDB Akaunti: 0150992384100',
    isActive: true,
    badge: 'Corporate',
  },
  {
    id: 'gw-card',
    name: 'Visa / Mastercard Credit & Debit Card',
    nameSw: 'Kadi ya Benki (Visa / Mastercard)',
    type: 'card',
    accountNumber: 'SECURE-GATEWAY-VISA',
    accountName: 'YMA Energy Online Gateway',
    instructions: 'Instant secure payment via Visa/Mastercard credit or debit card.',
    instructionsSw: 'Malipo ya haraka na salama kupitia kadi yako ya Visa au Mastercard.',
    isActive: true,
  },
  {
    id: 'gw-cod',
    name: 'Pay On Delivery / Branch Pickup',
    nameSw: 'Lipa Unapopokea / Dokana na Matawi',
    type: 'cash_on_delivery',
    accountNumber: 'BRANCH-CASH',
    accountName: 'YMA Energy Store Agent',
    instructions: 'Pay cash or mobile money directly to the delivery rider or store branch.',
    instructionsSw: 'Lipa taslimu au kwa simu pindi unapokabidhiwa mzigo na dereva au tawi.',
    isActive: true,
  },
];

export const usePaymentGatewayStore = create<PaymentGatewayState>((set) => ({
  gateways: initialGateways,

  addGateway: (gatewayData) => {
    const newGateway: PaymentGateway = {
      ...gatewayData,
      id: `gw-${Date.now()}`,
    };
    set((state) => ({ gateways: [...state.gateways, newGateway] }));
    return newGateway;
  },

  updateGateway: (id, updated) => {
    set((state) => ({
      gateways: state.gateways.map((g) => (g.id === id ? { ...g, ...updated } : g)),
    }));
  },

  toggleGatewayStatus: (id) => {
    set((state) => ({
      gateways: state.gateways.map((g) =>
        g.id === id ? { ...g, isActive: !g.isActive } : g
      ),
    }));
  },

  deleteGateway: (id) => {
    set((state) => ({
      gateways: state.gateways.filter((g) => g.id !== id),
    }));
  },
}));
