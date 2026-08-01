import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Warranty, WarrantyClaim } from '../types';
import { initialWarranties } from '../data/mockData';

interface WarrantyState {
  warranties: Warranty[];
  claims: WarrantyClaim[];

  registerWarranty: (warranty: Omit<Warranty, 'id' | 'status'>) => Warranty;
  fileClaim: (claim: Omit<WarrantyClaim, 'id' | 'claimNumber' | 'status' | 'createdAt'>) => WarrantyClaim;
  approveClaim: (claimId: string) => void;
  rejectClaim: (claimId: string, notes: string) => void;
}

export const useWarrantyStore = create<WarrantyState>()(
  persist(
    (set) => ({
      warranties: initialWarranties,
      claims: [],

      registerWarranty: (warrantyData) => {
        const newWarranty: Warranty = {
          ...warrantyData,
          id: `w-${Date.now()}`,
          status: 'Active',
        };
        set((state) => ({ warranties: [newWarranty, ...state.warranties] }));
        return newWarranty;
      },

      fileClaim: (claimData) => {
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        const newClaim: WarrantyClaim = {
          ...claimData,
          id: `wcl-${Date.now()}`,
          claimNumber: `WCL-${randomNum}`,
          status: 'Under Inspection',
          createdAt: new Date().toISOString().split('T')[0],
        };
        set((state) => ({
          claims: [newClaim, ...state.claims],
          warranties: state.warranties.map((w) =>
            w.id === claimData.warrantyId ? { ...w, status: 'Claim Filed' } : w
          ),
        }));
        return newClaim;
      },

      approveClaim: (claimId) => {
        set((state) => {
          const targetClaim = state.claims.find((c) => c.id === claimId);
          return {
            claims: state.claims.map((c) => (c.id === claimId ? { ...c, status: 'Approved' } : c)),
            warranties: state.warranties.map((w) =>
              targetClaim && w.id === targetClaim.warrantyId ? { ...w, status: 'Replaced / Repaired' } : w
            ),
          };
        });
      },

      rejectClaim: (claimId, notes) => {
        set((state) => ({
          claims: state.claims.map((c) =>
            c.id === claimId ? { ...c, status: 'Rejected', adminNotes: notes } : c
          ),
        }));
      },
    }),
    {
      name: 'yma_warranty_storage',
    }
  )
);
