import { create } from 'zustand';
import { SolarService, ServiceRequest, ServiceStatus } from '../types';
import { initialServices } from '../data/mockData';
import { db } from '../lib/firebase';
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
  assignEngineer: (requestId: string, engineerName: string) => Promise<void>;
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
        if (snapshot.docs.length > 0) {
          const remoteReqs: ServiceRequest[] = snapshot.docs.map((d) => d.data() as ServiceRequest);
          set({ serviceRequests: remoteReqs });
        }
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

    set((state) => ({ serviceRequests: [newReq, ...state.serviceRequests] }));

    try {
      await setDoc(doc(db, 'serviceRequests', id), newReq);
    } catch (err) {
      console.error('Error creating service request in Firebase:', err);
    }

    return newReq;
  },

  assignEngineer: async (requestId, engineerName) => {
    set((state) => ({
      serviceRequests: state.serviceRequests.map((r) =>
        r.id === requestId ? { ...r, assignedTechnician: engineerName, status: 'Technician Dispatched' } : r
      ),
    }));

    try {
      await updateDoc(doc(db, 'serviceRequests', requestId), {
        assignedTechnician: engineerName,
        status: 'Technician Dispatched',
      });
    } catch (err) {
      console.error('Error assigning engineer in Firebase:', err);
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
