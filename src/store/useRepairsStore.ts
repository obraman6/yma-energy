import { create } from 'zustand';
import { RepairRequest, RepairStatus } from '../types';
import { db } from '../lib/firebase';
import { sendAdminEmailTrigger } from '../services/emailService';
import { useNotificationStore } from './useNotificationStore';
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
  dispatchTechnician: (ticketId: string, techName: string, techPhone?: string, techId?: string, techEmail?: string) => Promise<void>;
  respondToRepairAssignment: (ticketId: string, action: 'ACCEPTED' | 'REJECTED', techNotes?: string, techPhone?: string) => Promise<void>;
  updateRepairTechProgress: (ticketId: string, status: RepairStatus, techNotes?: string) => Promise<void>;
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

    const cleanTicket = JSON.parse(JSON.stringify(newTicket));

    set((state) => ({ repairRequests: [newTicket, ...state.repairRequests] }));

    try {
      await setDoc(doc(db, 'repairs', id), cleanTicket);
    } catch (err) {
      console.error('Error creating repair ticket in Firebase:', err);
    }

    // Trigger notification
    useNotificationStore.getState().addNotification({
      title: `Tiketi Mpya ya Dharura: ${newTicket.requestNumber}`,
      titleSw: `Tiketi Mpya ya Dharura: ${newTicket.requestNumber}`,
      message: `Mteja ${newTicket.customerName} amefungua tiketi ya dharura (${newTicket.equipmentType}). Simu: ${newTicket.phone}.`,
      messageSw: `Mteja ${newTicket.customerName} amefungua tiketi ya dharura (${newTicket.equipmentType}). Simu: ${newTicket.phone}.`,
      type: 'maintenance',
      isPush: true,
    });

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

  dispatchTechnician: async (ticketId, techName, techPhone, techId, techEmail) => {
    const target = get().repairRequests.find((r) => r.id === ticketId);
    const assignedPhone = techPhone || target?.assignedTechnicianPhone || '0754 000 111';

    const patch = {
      assignedTechnician: techName,
      assignedTechnicianPhone: assignedPhone,
      assignedTechnicianId: techId || '',
      assignedTechnicianEmail: techEmail || '',
      techResponseStatus: 'PENDING' as const,
      status: 'Technician Dispatched' as RepairStatus,
    };

    set((state) => ({
      repairRequests: state.repairRequests.map((r) =>
        r.id === ticketId ? { ...r, ...patch } : r
      ),
    }));

    try {
      await updateDoc(doc(db, 'repairs', ticketId), patch);
    } catch (err) {
      console.error('Error dispatching technician in Firebase:', err);
    }

    if (target) {
      useNotificationStore.getState().addNotification({
        title: `Fundi Apangiwa: Tiketi #${target.requestNumber}`,
        titleSw: `Fundi Apangiwa: Tiketi #${target.requestNumber}`,
        message: `Fundi ${techName} (Simu: ${assignedPhone}) amepangiwa tiketi ya matengenezo #${target.requestNumber}.`,
        messageSw: `Fundi ${techName} (Simu: ${assignedPhone}) amepangiwa tiketi ya matengenezo #${target.requestNumber}.`,
        type: 'maintenance',
        isPush: true,
      });
    }
  },

  respondToRepairAssignment: async (ticketId, action, techNotes = '', techPhone = '') => {
    const target = get().repairRequests.find((r) => r.id === ticketId);
    const newStatus: RepairStatus = action === 'ACCEPTED' ? 'Accepted' : 'Rejected';
    const now = new Date().toLocaleString();
    const phoneToSave = techPhone || target?.assignedTechnicianPhone || '0754 000 111';

    const patch = {
      techResponseStatus: action,
      status: newStatus,
      techResponseDate: now,
      assignedTechnicianPhone: phoneToSave,
      ...(techNotes ? { techNotes } : {}),
    };

    set((state) => ({
      repairRequests: state.repairRequests.map((r) =>
        r.id === ticketId ? { ...r, ...patch } : r
      ),
    }));

    try {
      await updateDoc(doc(db, 'repairs', ticketId), patch);
    } catch (err) {
      console.error('Error updating repair response in Firebase:', err);
    }

    if (target) {
      const isAcc = action === 'ACCEPTED';
      useNotificationStore.getState().addNotification({
        title: isAcc ? `✅ Fundi Amekubali Tiketi #${target.requestNumber}` : `❌ Fundi Amekataa Tiketi #${target.requestNumber}`,
        titleSw: isAcc ? `✅ Fundi Amekubali Tiketi #${target.requestNumber}` : `❌ Fundi Amekataa Tiketi #${target.requestNumber}`,
        message: isAcc
          ? `Fundi ${target.assignedTechnician} (Simu: ${phoneToSave}) amekubali rasmi tiketi ya matengenezo. Hali: SAFARINI / ON-SITE.`
          : `Fundi ${target.assignedTechnician} amekataa tiketi #${target.requestNumber}. Admin anapanga fundi mwingine.`,
        messageSw: isAcc
          ? `Fundi ${target.assignedTechnician} (Simu: ${phoneToSave}) amekubali rasmi tiketi ya matengenezo. Hali: SAFARINI / ON-SITE.`
          : `Fundi ${target.assignedTechnician} amekataa tiketi #${target.requestNumber}. Admin anapanga fundi mwingine.`,
        type: 'maintenance',
        isPush: true,
      });
    }
  },

  updateRepairTechProgress: async (ticketId, status, techNotes) => {
    const target = get().repairRequests.find((r) => r.id === ticketId);
    const patch: any = { status };
    if (techNotes) patch.techNotes = techNotes;

    set((state) => ({
      repairRequests: state.repairRequests.map((r) =>
        r.id === ticketId ? { ...r, ...patch } : r
      ),
    }));

    try {
      await updateDoc(doc(db, 'repairs', ticketId), patch);
    } catch (err) {
      console.error('Error updating repair technician progress in Firebase:', err);
    }

    if (target) {
      const techPhone = target.assignedTechnicianPhone || '0754 000 111';
      useNotificationStore.getState().addNotification({
        title: `🔄 Maendeleo ya Matengenezo: Tiketi #${target.requestNumber}`,
        titleSw: `🔄 Maendeleo ya Matengenezo: Tiketi #${target.requestNumber}`,
        message: `Fundi ${target.assignedTechnician || 'Mhandisi'} (Simu: ${techPhone}) amesasisha hali: ${status}. Ripoti: ${techNotes || 'Kazi inaendelea vyema.'}`,
        messageSw: `Fundi ${target.assignedTechnician || 'Mhandisi'} (Simu: ${techPhone}) amesasisha hali: ${status}. Ripoti: ${techNotes || 'Kazi inaendelea vyema.'}`,
        type: 'maintenance',
        isPush: true,
      });
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
