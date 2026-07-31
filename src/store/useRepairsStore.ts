import { create } from 'zustand';
import { RepairRequest, RepairStatus } from '../types';
import { db } from '../lib/firebase';
import { sendAdminEmailTrigger } from '../services/emailService';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

interface RepairsState {
  repairRequests: RepairRequest[];
  isFirebaseSynced: boolean;

  initFirebaseSync: () => void;

  createRepairTicket: (req: Omit<RepairRequest, 'id' | 'requestNumber' | 'status' | 'createdAt'>) => Promise<RepairRequest>;
  dispatchTechnician: (ticketId: string, techName: string) => Promise<void>;
  updateRepairStatus: (ticketId: string, status: RepairStatus) => Promise<void>;
}

export const useRepairsStore = create<RepairsState>((set, get) => ({
  repairRequests: [],
  isFirebaseSynced: false,

  initFirebaseSync: () => {
    if (get().isFirebaseSynced) return;
    set({ isFirebaseSynced: true });

    const repairsRef = collection(db, 'repairs');
    onSnapshot(
      repairsRef,
      (snapshot) => {
        const remoteRepairs: RepairRequest[] = snapshot.docs.map((d) => d.data() as RepairRequest);
        set({ repairRequests: remoteRepairs });
      },
      (err) => console.error('Firestore repairs sync error:', err)
    );
  },

  createRepairTicket: async (ticketData) => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const id = `rep-${Date.now()}`;
    const newTicket: RepairRequest = {
      ...ticketData,
      id,
      requestNumber: `RPR-${randomNum}`,
      status: 'Received',
      createdAt: new Date().toLocaleString(),
    };

    set((state) => ({ repairRequests: [newTicket, ...state.repairRequests] }));

    try {
      await setDoc(doc(db, 'repairs', id), newTicket);
    } catch (err) {
      console.error('Error creating repair ticket in Firebase:', err);
    }

    // Trigger real-time admin email notification
    sendAdminEmailTrigger({
      type: 'repair',
      data: {
        requestNumber: newTicket.requestNumber,
        customerName: newTicket.customerName,
        phone: newTicket.phone,
        location: `${newTicket.streetAddress}, ${newTicket.region}`,
        equipmentType: newTicket.equipmentType,
        problemDescription: newTicket.description,
      },
    }).catch((e) => console.error('Error triggering repair email alert:', e));

    return newTicket;
  },

  dispatchTechnician: async (ticketId, techName) => {
    set((state) => ({
      repairRequests: state.repairRequests.map((r) =>
        r.id === ticketId ? { ...r, assignedTechnician: techName, status: 'Technician Dispatched' } : r
      ),
    }));

    try {
      await updateDoc(doc(db, 'repairs', ticketId), {
        assignedTechnician: techName,
        status: 'Technician Dispatched',
      });
    } catch (err) {
      console.error('Error dispatching technician in Firebase:', err);
    }
  },

  updateRepairStatus: async (ticketId, status) => {
    set((state) => ({
      repairRequests: state.repairRequests.map((r) =>
        r.id === ticketId ? { ...r, status } : r
      ),
    }));

    try {
      await updateDoc(doc(db, 'repairs', ticketId), { status });
    } catch (err) {
      console.error('Error updating repair status in Firebase:', err);
    }
  },
}));

// Initialize Firebase sync automatically
useRepairsStore.getState().initFirebaseSync();
