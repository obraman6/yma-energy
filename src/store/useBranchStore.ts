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
  branches: initialBranches,
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
              id: data.id || d.id,
            } as Branch;
          });
          set({ branches: remoteBranches, isLoading: false });
        } else {
          // Seed initial branches to Firestore so they have document IDs and can be deleted/updated
          initialBranches.forEach((b) => {
            const cleanDoc = JSON.parse(JSON.stringify(b));
            setDoc(doc(db, 'branches', b.id), cleanDoc, { merge: true }).catch((e) =>
              console.error('Seeding branch error:', e)
            );
          });
          set({ branches: initialBranches, isLoading: false });
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
    const cleanDoc = JSON.parse(JSON.stringify(newBranch));

    set((state) => ({ branches: [...state.branches, newBranch] }));

    try {
      await setDoc(doc(db, 'branches', newId), cleanDoc, { merge: true });
    } catch (err) {
      console.error('Error adding branch to Firebase:', err);
    }

    return newBranch;
  },

  updateBranch: async (id, updated) => {
    const currentBranch = get().branches.find((b) => b.id === id);
    const fullMerged: Branch = {
      ...(currentBranch || ({ id } as Branch)),
      ...updated,
      id,
    };
    const cleanDoc = JSON.parse(JSON.stringify(fullMerged));

    set((state) => ({
      branches: state.branches.map((b) => (b.id === id ? fullMerged : b)),
    }));

    try {
      await setDoc(doc(db, 'branches', id), cleanDoc, { merge: true });
    } catch (err) {
      console.error('Error updating branch in Firebase:', err);
    }
  },

  deleteBranch: async (id) => {
    set((state) => ({
      branches: state.branches.filter((b) => b.id !== id),
    }));

    try {
      await deleteDoc(doc(db, 'branches', id));
    } catch (err) {
      console.error('Error deleting branch from Firebase:', err);
    }
  },
}));

