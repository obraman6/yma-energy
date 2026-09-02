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

const GATEWAYS_CACHE_KEY = 'yma_cached_gateways_v1';

const loadCachedGateways = (): PaymentGateway[] => {
  try {
    const raw = localStorage.getItem(GATEWAYS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error reading cached payment gateways:', e);
  }
  return [];
};

const initialGateways = loadCachedGateways();

export const usePaymentGatewayStore = create<PaymentGatewayState>((set, get) => ({
  gateways: initialGateways,
  isFirebaseSynced: false,
  isLoading: initialGateways.length === 0,

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
              id: d.id,
            } as PaymentGateway;
          });
          try {
            localStorage.setItem(GATEWAYS_CACHE_KEY, JSON.stringify(remoteGateways));
          } catch (e) {}
          set({ gateways: remoteGateways, isLoading: false });
        } else {
          set({ gateways: [], isLoading: false });
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
