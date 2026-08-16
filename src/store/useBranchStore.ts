import { create } from 'zustand';
import { Branch } from '../types';
import { initialBranches } from '../data/mockData';
import { db } from '../lib/firebase';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';

interface BranchState {
  branches: Branch[];
  isFirebaseSynced: boolean;
  isLoading: boolean;

  initFirebaseSync: () => void;
  addBranch: (branchData: Omit<Branch, 'id'>) => Promise<Branch>;
  updateBranch: (id: string, updated: Partial<Branch>) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;
}

export const useBranchStore = create<BranchState>((set, get) => ({
  branches: [],
  isFirebaseSynced: false,
  isLoading: true,

  initFirebaseSync: () => {
    if (get().isFirebaseSynced) return;
    set({ isFirebaseSynced: true });

    const branchesRef = collection(db, 'branches');
    onSnapshot(
      branchesRef,
      (snapshot) => {
        if (snapshot.docs.length > 0) {
          const remoteBranches: Branch[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              ...data,
              id: d.id, // ALWAYS use d.id as the authoritative document ID
            } as Branch;
          });
          set({ branches: remoteBranches, isLoading: false });
        } else {
          set({ branches: [], isLoading: false });
        }
      },
      (err) => {
        console.error('Firestore branches sync error:', err);
        set({ isLoading: false });
      }
    );
  },

  addBranch: async (branchData) => {
    const newId = `br-${Date.now()}`;
    const newBranch: Branch = {
      ...branchData,
      id: newId,
      lat: branchData.lat ?? branchData.latitude ?? -6.772,
      lng: branchData.lng ?? branchData.longitude ?? 39.231,
      latitude: branchData.latitude ?? branchData.lat ?? -6.772,
      longitude: branchData.longitude ?? branchData.lng ?? 39.231,
      isHeadquarters: branchData.isHeadquarters || false,
    };

    const updated = [...get().branches, newBranch];
    set({ branches: updated });

    try {
      const cleanDoc = JSON.parse(JSON.stringify(newBranch));
      await setDoc(doc(db, 'branches', newId), cleanDoc, { merge: true });
    } catch (err) {
      console.error('Error adding branch to Firebase:', err);
    }

    return newBranch;
  },

  updateBranch: async (id, updatedData) => {
    const currentBranch = get().branches.find((b) => b.id === id);
    const fullMerged: Branch = {
      ...(currentBranch || ({ id } as Branch)),
      ...updatedData,
      id,
    };

    const updatedBranches = get().branches.map((b) => (b.id === id ? fullMerged : b));
    set({ branches: updatedBranches });

    try {
      const cleanDoc = JSON.parse(JSON.stringify(fullMerged));
      await setDoc(doc(db, 'branches', id), cleanDoc, { merge: true });
    } catch (err) {
      console.error('Error updating branch in Firebase:', err);
    }
  },

  deleteBranch: async (id) => {
    const updatedBranches = get().branches.filter((b) => b.id !== id);
    set({ branches: updatedBranches });

    try {
      await deleteDoc(doc(db, 'branches', id));
    } catch (err) {
      console.error('Error deleting branch from Firebase:', err);
    }
  },
}));

// Auto-initialize Firebase sync
useBranchStore.getState().initFirebaseSync();

