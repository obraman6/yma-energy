import { create } from 'zustand';
import { db } from '../lib/firebase';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';

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
  isFirebaseSynced: boolean;
  isLoading: boolean;

  initFirebaseSync: () => void;
  addGateway: (gateway: Omit<PaymentGateway, 'id'>) => Promise<PaymentGateway>;
  updateGateway: (id: string, updated: Partial<PaymentGateway>) => Promise<void>;
  toggleGatewayStatus: (id: string) => Promise<void>;
  deleteGateway: (id: string) => Promise<void>;
}

const LOCAL_STORAGE_KEY = 'yma_payment_gateways_v2';

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

const loadGatewaysFromLocal = (): PaymentGateway[] => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading payment gateways from localStorage:', e);
  }
  return initialGateways;
};

const saveGatewaysToLocal = (gateways: PaymentGateway[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gateways));
  } catch (e) {
    console.error('Error saving payment gateways to localStorage:', e);
  }
};

export const usePaymentGatewayStore = create<PaymentGatewayState>((set, get) => ({
  gateways: loadGatewaysFromLocal(),
  isFirebaseSynced: false,
  isLoading: true,

  initFirebaseSync: () => {
    if (get().isFirebaseSynced) return;
    set({ isFirebaseSynced: true });

    const ref = collection(db, 'paymentGateways');
    onSnapshot(
      ref,
      (snapshot) => {
        if (snapshot.docs.length > 0) {
          const remoteGateways: PaymentGateway[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              ...data,
              id: data.id || d.id,
            } as PaymentGateway;
          });
          saveGatewaysToLocal(remoteGateways);
          set({ gateways: remoteGateways, isLoading: false });
        } else {
          // Seed local/initial gateways to Firestore
          const currentLocal = get().gateways;
          currentLocal.forEach((gw) => {
            const cleanDoc = JSON.parse(JSON.stringify(gw));
            setDoc(doc(db, 'paymentGateways', gw.id), cleanDoc, { merge: true }).catch((e) =>
              console.error('Seeding payment gateway error:', e)
            );
          });
          saveGatewaysToLocal(currentLocal);
          set({ isLoading: false });
        }
      },
      (err) => {
        console.error('Firestore paymentGateways sync error:', err);
        set({ isLoading: false });
      }
    );
  },

  addGateway: async (gatewayData) => {
    const newId = `gw-${Date.now()}`;
    const newGateway: PaymentGateway = {
      ...gatewayData,
      id: newId,
      isActive: gatewayData.isActive ?? true,
    };
    const updatedGateways = [...get().gateways, newGateway];
    saveGatewaysToLocal(updatedGateways);
    set({ gateways: updatedGateways });

    try {
      const cleanDoc = JSON.parse(JSON.stringify(newGateway));
      await setDoc(doc(db, 'paymentGateways', newId), cleanDoc, { merge: true });
    } catch (err) {
      console.error('Error adding payment gateway to Firebase:', err);
    }

    return newGateway;
  },

  updateGateway: async (id, updated) => {
    const currentGw = get().gateways.find((g) => g.id === id);
    const merged: PaymentGateway = {
      ...(currentGw || ({ id } as PaymentGateway)),
      ...updated,
      id,
    };

    const updatedGateways = get().gateways.map((g) => (g.id === id ? merged : g));
    saveGatewaysToLocal(updatedGateways);
    set({ gateways: updatedGateways });

    try {
      const cleanDoc = JSON.parse(JSON.stringify(merged));
      await setDoc(doc(db, 'paymentGateways', id), cleanDoc, { merge: true });
    } catch (err) {
      console.error('Error updating payment gateway in Firebase:', err);
    }
  },

  toggleGatewayStatus: async (id) => {
    const currentGw = get().gateways.find((g) => g.id === id);
    if (!currentGw) return;

    const newActive = !currentGw.isActive;
    const merged: PaymentGateway = {
      ...currentGw,
      isActive: newActive,
    };

    const updatedGateways = get().gateways.map((g) => (g.id === id ? merged : g));
    saveGatewaysToLocal(updatedGateways);
    set({ gateways: updatedGateways });

    try {
      const cleanDoc = JSON.parse(JSON.stringify(merged));
      await setDoc(doc(db, 'paymentGateways', id), cleanDoc, { merge: true });
    } catch (err) {
      console.error('Error toggling payment gateway in Firebase:', err);
    }
  },

  deleteGateway: async (id) => {
    const updatedGateways = get().gateways.filter((g) => g.id !== id);
    saveGatewaysToLocal(updatedGateways);
    set({ gateways: updatedGateways });

    try {
      await deleteDoc(doc(db, 'paymentGateways', id));
    } catch (err) {
      console.error('Error deleting payment gateway from Firebase:', err);
    }
  },
}));

// Auto-initialize Firebase sync
usePaymentGatewayStore.getState().initFirebaseSync();
