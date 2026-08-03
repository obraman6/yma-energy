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

const LOCAL_STORAGE_KEY = 'yma_company_settings_v2';

const loadCompanySettingsFromLocal = (): CompanySettings => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return { ...defaultCompanySettings, ...parsed };
      }
    }
  } catch (e) {
    console.error('Error loading company settings from localStorage:', e);
  }
  return defaultCompanySettings;
};

const saveCompanySettingsToLocal = (settings: CompanySettings) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving company settings to localStorage:', e);
  }
};

export const useCompanySettingsStore = create<CompanySettingsState>((set, get) => ({
  settings: loadCompanySettingsFromLocal(),
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
          const merged = { ...defaultCompanySettings, ...data };
          saveCompanySettingsToLocal(merged);
          set({ settings: merged, isLoading: false });
        } else {
          // Initialize in firestore with local settings
          const currentLocal = get().settings;
          setDoc(settingsDocRef, currentLocal).catch((err) =>
            console.error('Error seeding company settings:', err)
          );
          saveCompanySettingsToLocal(currentLocal);
          set({ isLoading: false });
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
    saveCompanySettingsToLocal(updated);
    set({ settings: updated });

    try {
      const settingsDocRef = doc(db, 'settings', 'company');
      await setDoc(settingsDocRef, updated, { merge: true });
    } catch (err) {
      console.error('Error updating company settings in Firestore:', err);
    }
  },
}));

// Auto-initialize Firebase sync
useCompanySettingsStore.getState().initFirebaseSync();
