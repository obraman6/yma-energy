import { create } from 'zustand';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export interface CompanySettings {
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  emergencyPhone: string;
  workingHours: string;
  hqAddress: string;
}

export const defaultCompanySettings: CompanySettings = {
  companyName: 'YMA ENERGY GROUP',
  companyPhone: '+255 622 359 874',
  companyEmail: 'support@ymaenergy.co.tz',
  emergencyPhone: '+255 754 000 111',
  workingHours: '24/7 Customer Support | Mon - Sat: 08:00 - 18:00',
  hqAddress: 'Mikocheni B, Sayansi / Kijitonyama, Dar es Salaam',
};

interface CompanySettingsState {
  settings: CompanySettings;
  isSynced: boolean;
  isLoading: boolean;

  initFirebaseSync: () => void;
  updateSettings: (newSettings: Partial<CompanySettings>) => Promise<void>;
}

export const useCompanySettingsStore = create<CompanySettingsState>((set, get) => ({
  settings: defaultCompanySettings,
  isSynced: false,
  isLoading: true,

  initFirebaseSync: () => {
    if (get().isSynced) return;
    set({ isSynced: true });

    const settingsDocRef = doc(db, 'settings', 'company');
    onSnapshot(
      settingsDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as CompanySettings;
          set({ settings: { ...defaultCompanySettings, ...data }, isLoading: false });
        } else {
          // Initialize in firestore if not existing
          setDoc(settingsDocRef, defaultCompanySettings).catch((err) =>
            console.error('Error seeding company settings:', err)
          );
          set({ settings: defaultCompanySettings, isLoading: false });
        }
      },
      (err) => {
        console.error('Error listening to company settings:', err);
        set({ isLoading: false });
      }
    );
  },

  updateSettings: async (newSettings) => {
    const updated = { ...get().settings, ...newSettings };
    set({ settings: updated });

    try {
      const settingsDocRef = doc(db, 'settings', 'company');
      await setDoc(settingsDocRef, updated, { merge: true });
    } catch (err) {
      console.error('Error updating company settings in Firestore:', err);
    }
  },
}));
