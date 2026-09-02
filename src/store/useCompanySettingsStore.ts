import { create } from 'zustand';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { SOCIAL_MEDIA_CONFIG } from '../config/socialLinks';

export interface CompanySettings {
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  emergencyPhone: string;
  workingHours: string;
  hqAddress: string;
  socialLinks?: Record<string, string>;
  tutorialVideoUrl?: string;
  tutorialVideoTitle?: string;
  tutorialVideoDesc?: string;
  tutorialVideoAspectRatio?: 'auto' | '16:9' | '9:16' | '1:1';
  enableShopModule?: boolean;
}

export const defaultCompanySettings: CompanySettings = {
  companyName: 'YMA ENERGY GROUP',
  companyPhone: '',
  companyEmail: '',
  emergencyPhone: '',
  workingHours: '',
  hqAddress: '',
  socialLinks: {
    facebook: '',
    instagram: '',
    x: '',
    linkedin: '',
    youtube: '',
    tiktok: '',
    whatsapp: '',
    telegram: '',
    github: '',
  },
  tutorialVideoUrl: '',
  tutorialVideoTitle: 'Jinsi ya Kutumia App ya YMA ENERGY GROUP',
  tutorialVideoDesc: 'Tazama video fupi kujifunza jinsi ya kununua bidhaa za sola, kuagiza huduma za ufungaji, kuomba fundi wa dharura, na kufuatilia oda yako moja kwa moja.',
  tutorialVideoAspectRatio: 'auto',
  enableShopModule: true,
};

interface CompanySettingsState {
  settings: CompanySettings;
  isSynced: boolean;
  isLoading: boolean;

  initFirebaseSync: () => void;
  updateSettings: (newSettings: Partial<CompanySettings>) => Promise<void>;
}

const LOCAL_STORAGE_KEY = 'yma_company_settings_v4';

const loadCompanySettingsFromLocal = (): CompanySettings => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return {
          ...defaultCompanySettings,
          ...parsed,
          socialLinks: parsed.socialLinks || defaultCompanySettings.socialLinks,
        };
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
          const remoteData = snapshot.data() as Partial<CompanySettings>;
          const merged: CompanySettings = {
            companyName: remoteData.companyName !== undefined ? remoteData.companyName : defaultCompanySettings.companyName,
            companyPhone: remoteData.companyPhone !== undefined ? remoteData.companyPhone : '',
            companyEmail: remoteData.companyEmail !== undefined ? remoteData.companyEmail : '',
            emergencyPhone: remoteData.emergencyPhone !== undefined ? remoteData.emergencyPhone : '',
            workingHours: remoteData.workingHours !== undefined ? remoteData.workingHours : '',
            hqAddress: remoteData.hqAddress !== undefined ? remoteData.hqAddress : '',
            socialLinks: remoteData.socialLinks !== undefined ? remoteData.socialLinks : defaultCompanySettings.socialLinks,
            tutorialVideoUrl: remoteData.tutorialVideoUrl !== undefined ? remoteData.tutorialVideoUrl : '',
            tutorialVideoTitle: remoteData.tutorialVideoTitle !== undefined ? remoteData.tutorialVideoTitle : defaultCompanySettings.tutorialVideoTitle,
            tutorialVideoDesc: remoteData.tutorialVideoDesc !== undefined ? remoteData.tutorialVideoDesc : defaultCompanySettings.tutorialVideoDesc,
            tutorialVideoAspectRatio: remoteData.tutorialVideoAspectRatio !== undefined ? remoteData.tutorialVideoAspectRatio : defaultCompanySettings.tutorialVideoAspectRatio,
            enableShopModule: remoteData.enableShopModule !== undefined ? remoteData.enableShopModule : defaultCompanySettings.enableShopModule,
          };
          saveCompanySettingsToLocal(merged);
          set({ settings: merged, isLoading: false });
        } else {
          // If document does not exist in Firestore, keep current memory/default without force overwriting
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
    const current = get().settings;
    const updated: CompanySettings = {
      ...current,
      ...newSettings,
      socialLinks: newSettings.socialLinks !== undefined ? newSettings.socialLinks : (current.socialLinks || {}),
    };
    saveCompanySettingsToLocal(updated);
    set({ settings: updated });

    try {
      const settingsDocRef = doc(db, 'settings', 'company');
      const cleanDoc = JSON.parse(JSON.stringify(updated));
      await setDoc(settingsDocRef, cleanDoc);
    } catch (err) {
      console.error('Error updating company settings in Firestore:', err);
      throw err;
    }
  },
}));

// Auto-initialize Firebase sync
useCompanySettingsStore.getState().initFirebaseSync();
