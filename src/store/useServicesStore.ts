import { create } from 'zustand';
import { SolarService, ServiceRequest, ServiceStatus } from '../types';
import { initialServices } from '../data/mockData';
import { db } from '../lib/firebase';
import { useNotificationStore } from './useNotificationStore';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

interface ServicesState {
  services: SolarService[];
  serviceRequests: ServiceRequest[];
  isFirebaseSynced: boolean;
  isLoading: boolean;

  initFirebaseSync: () => void;

  addService: (service: Omit<SolarService, 'id'>) => Promise<SolarService>;
  editService: (id: string, updated: Partial<SolarService>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;

  createServiceRequest: (req: Omit<ServiceRequest, 'id' | 'requestNumber' | 'status' | 'createdAt'>) => Promise<ServiceRequest>;
  assignEngineer: (requestId: string, engineerName: string, engineerPhone?: string, engineerId?: string, engineerEmail?: string) => Promise<void>;
  respondToServiceAssignment: (requestId: string, action: 'ACCEPTED' | 'REJECTED', techNotes?: string, techPhone?: string) => Promise<void>;
  updateServiceTechProgress: (requestId: string, status: ServiceStatus, techNotes?: string) => Promise<void>;
  updateRequestStatus: (requestId: string, status: ServiceStatus) => Promise<void>;
  clearAllServicesAndRequests: () => Promise<void>;
}

export const useServicesStore = create<ServicesState>((set, get) => ({
  services: initialServices,
  serviceRequests: [],
  isFirebaseSynced: false,
  isLoading: true,

  initFirebaseSync: () => {
    if (get().isFirebaseSynced) return;
    set({ isFirebaseSynced: true });

    // Sync Services catalog
    const servicesRef = collection(db, 'services');
    onSnapshot(
      servicesRef,
      (snapshot) => {
        if (snapshot.docs.length > 0) {
          const remoteServices: SolarService[] = snapshot.docs.map((d) => d.data() as SolarService);
          set({ services: remoteServices, isLoading: false });
        } else {
          set({ services: initialServices, isLoading: false });
        }
      },
      (err) => {
        console.error('Firestore services sync error:', err);
        set({ isLoading: false });
      }
    );

    // Sync Service Requests
    const serviceRequestsRef = collection(db, 'serviceRequests');
    onSnapshot(
      serviceRequestsRef,
      (snapshot) => {
        const remoteReqs: ServiceRequest[] = snapshot.docs.map((d) => d.data() as ServiceRequest);
        set({ serviceRequests: remoteReqs });
      },
      (err) => console.error('Firestore serviceRequests sync error:', err)
    );
  },

  addService: async (serviceData) => {
    const id = `s-${Date.now()}`;
    const newService: SolarService = {
      ...serviceData,
      id,
    };

    set((state) => ({ services: [...state.services, newService] }));

    try {
      await setDoc(doc(db, 'services', id), newService);
    } catch (err) {
      console.error('Error saving service to Firebase:', err);
    }

    return newService;
  },

  editService: async (id, updated) => {
    set((state) => ({
      services: state.services.map((s) => (s.id === id ? { ...s, ...updated } : s)),
    }));

    try {
      await updateDoc(doc(db, 'services', id), updated);
    } catch (err) {
      console.error('Error updating service in Firebase:', err);
    }
  },

  deleteService: async (id) => {
    set((state) => ({
      services: state.services.filter((s) => s.id !== id),
    }));

    try {
      await deleteDoc(doc(db, 'services', id));
    } catch (err) {
      console.error('Error deleting service from Firebase:', err);
    }
  },

  createServiceRequest: async (reqData) => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const id = `sr-${Date.now()}`;
    const newReq: ServiceRequest = {
      ...reqData,
      id,
      requestNumber: `SRV-${randomNum}`,
      status: 'Queued',
      createdAt: new Date().toISOString().split('T')[0],
    };

    const cleanReq = JSON.parse(JSON.stringify(newReq));
    set((state) => ({ serviceRequests: [newReq, ...state.serviceRequests] }));

    try {
      await setDoc(doc(db, 'serviceRequests', id), cleanReq);
    } catch (err) {
      console.error('Error creating service request in Firebase:', err);
    }

    useNotificationStore.getState().addNotification({
      title: `Ombi Jipya la Huduma: #${newReq.requestNumber}`,
      titleSw: `Ombi Jipya la Huduma: #${newReq.requestNumber}`,
      message: `Mteja ${newReq.customerName} amefanya ombi la huduma (${newReq.serviceName}). Simu: ${newReq.phone}.`,
      messageSw: `Mteja ${newReq.customerName} amefanya ombi la huduma (${newReq.serviceName}). Simu: ${newReq.phone}.`,
      type: 'maintenance',
      isPush: true,
    });

    return newReq;
  },

  assignEngineer: async (requestId, engineerName, engineerPhone, engineerId, engineerEmail) => {
    const target = get().serviceRequests.find((r) => r.id === requestId);
    const assignedPhone = engineerPhone || target?.assignedTechnicianPhone || '0754 000 111';

    const patch = {
      assignedTechnician: engineerName,
      assignedTechnicianPhone: assignedPhone,
      assignedTechnicianId: engineerId || '',
      assignedTechnicianEmail: engineerEmail || '',
      techResponseStatus: 'PENDING' as const,
      status: 'Technician Dispatched' as ServiceStatus,
    };

    set((state) => ({
      serviceRequests: state.serviceRequests.map((r) =>
        r.id === requestId ? { ...r, ...patch } : r
      ),
    }));

    try {
      await updateDoc(doc(db, 'serviceRequests', requestId), patch);
    } catch (err) {
      console.error('Error assigning engineer in Firebase:', err);
    }

    if (target) {
      useNotificationStore.getState().addNotification({
        title: `Mhandisi Apangiwa: Huduma #${target.requestNumber}`,
        titleSw: `Mhandisi Apangiwa: Huduma #${target.requestNumber}`,
        message: `Mhandisi ${engineerName} (Simu: ${assignedPhone}) amepangiwa ombi la huduma #${target.requestNumber}.`,
        messageSw: `Mhandisi ${engineerName} (Simu: ${assignedPhone}) amepangiwa ombi la huduma #${target.requestNumber}.`,
        type: 'maintenance',
        isPush: true,
      });
    }
  },

  respondToServiceAssignment: async (requestId, action, techNotes = '', techPhone = '') => {
    const target = get().serviceRequests.find((r) => r.id === requestId);
    const newStatus: ServiceStatus = action === 'ACCEPTED' ? 'Accepted' : 'Rejected';
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
      serviceRequests: state.serviceRequests.map((r) =>
        r.id === requestId ? { ...r, ...patch } : r
      ),
    }));

    try {
      await updateDoc(doc(db, 'serviceRequests', requestId), patch);
    } catch (err) {
      console.error('Error recording technician response in Firebase:', err);
    }

    if (target) {
      const isAcc = action === 'ACCEPTED';
      useNotificationStore.getState().addNotification({
        title: isAcc ? `✅ Fundi Amekubali Huduma #${target.requestNumber}` : `❌ Fundi Amekataa Huduma #${target.requestNumber}`,
        titleSw: isAcc ? `✅ Fundi Amekubali Huduma #${target.requestNumber}` : `❌ Fundi Amekataa Huduma #${target.requestNumber}`,
        message: isAcc
          ? `Mhandisi ${target.assignedTechnician} (Simu: ${phoneToSave}) amekubali ombi la ufungaji #${target.requestNumber}.`
          : `Mhandisi ${target.assignedTechnician} amekataa ombi la ufungaji #${target.requestNumber}.`,
        messageSw: isAcc
          ? `Mhandisi ${target.assignedTechnician} (Simu: ${phoneToSave}) amekubali ombi la ufungaji #${target.requestNumber}.`
          : `Mhandisi ${target.assignedTechnician} amekataa ombi la ufungaji #${target.requestNumber}.`,
        type: 'maintenance',
        isPush: true,
      });
    }
  },

  updateServiceTechProgress: async (requestId, status, techNotes) => {
    const target = get().serviceRequests.find((r) => r.id === requestId);
    const patch: any = { status };
    if (techNotes) patch.techNotes = techNotes;

    set((state) => ({
      serviceRequests: state.serviceRequests.map((r) =>
        r.id === requestId ? { ...r, ...patch } : r
      ),
    }));

    try {
      await updateDoc(doc(db, 'serviceRequests', requestId), patch);
    } catch (err) {
      console.error('Error updating technician service progress in Firebase:', err);
    }

    if (target) {
      const techPhone = target.assignedTechnicianPhone || '0754 000 111';
      const isCompleted = (status as string) === 'Completed' || (status as string) === 'Imekamilika';
      const notifTitle = isCompleted
        ? `✅ KAZI IMEKAMILIKA! Huduma #${target.requestNumber}`
        : `🔄 Maendeleo ya Ufungaji: Huduma #${target.requestNumber}`;
      const notifMsg = isCompleted
        ? `TAARIFA KWA ADMIN & CLIENT: Fundi ${target.assignedTechnician || 'Mhandisi'} (Simu: ${techPhone}) ameweka kazi ya ufungaji #${target.requestNumber} kuwa IMEKAMILIKA! Mteja: ${target.customerName}. Field Notes: ${techNotes || 'Kazi imekamilika kikamilifu.'}`
        : `Fundi ${target.assignedTechnician || 'Mhandisi'} (Simu: ${techPhone}) amesasisha hali: ${status}. Ripoti: ${techNotes || 'Kazi inaendelea vyema.'}`;

      useNotificationStore.getState().addNotification({
        title: notifTitle,
        titleSw: notifTitle,
        message: notifMsg,
        messageSw: notifMsg,
        type: 'maintenance',
        isPush: true,
      });
    }
  },

  updateRequestStatus: async (requestId, status) => {
    set((state) => ({
      serviceRequests: state.serviceRequests.map((r) =>
        r.id === requestId ? { ...r, status } : r
      ),
    }));

    try {
      await updateDoc(doc(db, 'serviceRequests', requestId), { status });
    } catch (err) {
      console.error('Error updating request status in Firebase:', err);
    }
  },

  clearAllServicesAndRequests: async () => {
    const currentServices = get().services;
    const currentRequests = get().serviceRequests;

    set({ services: [], serviceRequests: [] });

    for (const s of currentServices) {
      deleteDoc(doc(db, 'services', s.id)).catch(() => {});
    }
    for (const req of currentRequests) {
      deleteDoc(doc(db, 'serviceRequests', req.id)).catch(() => {});
    }
  },
}));

// Initialize Firebase sync automatically
useServicesStore.getState().initFirebaseSync();
