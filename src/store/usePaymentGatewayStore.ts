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

export const usePaymentGatewayStore = create<PaymentGatewayState>((set, get) => ({
  gateways: initialGateways,
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
          set({ gateways: remoteGateways, isLoading: false });
        } else {
          // Seed initial gateways to Firestore
          initialGateways.forEach((gw) => {
            const cleanDoc = JSON.parse(JSON.stringify(gw));
            setDoc(doc(db, 'paymentGateways', gw.id), cleanDoc, { merge: true }).catch((e) =>
              console.error('Seeding payment gateway error:', e)
            );
          });
          set({ gateways: initialGateways, isLoading: false });
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
    const cleanDoc = JSON.parse(JSON.stringify(newGateway));

    set((state) => ({ gateways: [...state.gateways, newGateway] }));

    try {
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
    const cleanDoc = JSON.parse(JSON.stringify(merged));

    set((state) => ({
      gateways: state.gateways.map((g) => (g.id === id ? merged : g)),
    }));

    try {
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
    const cleanDoc = JSON.parse(JSON.stringify(merged));

    set((state) => ({
      gateways: state.gateways.map((g) => (g.id === id ? merged : g)),
    }));

    try {
      await setDoc(doc(db, 'paymentGateways', id), cleanDoc, { merge: true });
    } catch (err) {
      console.error('Error toggling payment gateway in Firebase:', err);
    }
  },

  deleteGateway: async (id) => {
    set((state) => ({
      gateways: state.gateways.filter((g) => g.id !== id),
    }));

    try {
      await deleteDoc(doc(db, 'paymentGateways', id));
    } catch (err) {
      console.error('Error deleting payment gateway from Firebase:', err);
    }
  },
}));
