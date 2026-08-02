import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';

export interface AppNotification {
  id: string;
  title: string;
  titleSw?: string;
  message: string;
  messageSw?: string;
  time: string;
  type: 'system' | 'order' | 'promo' | 'maintenance';
  isRead: boolean;
  isPush: boolean;
}

interface NotificationState {
  notifications: AppNotification[];
  pushPermission: NotificationPermission | 'default';
  isSoundEnabled: boolean;
  unreadCount: number;
  isFirebaseSynced: boolean;
  
  // Actions
  initFirebaseSync: () => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'time' | 'isRead'>) => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  requestPushPermission: () => Promise<boolean>;
  toggleSound: () => void;
  playAlertSound: () => void;
  sendSystemPush: (title: string, body: string) => void;
}

// Utility to generate a pleasant solar alert chime using Web Audio API
const playChimeSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Create two soft warm sine tones (Solar notification ding)
    const now = ctx.currentTime;
    
    // First tone (E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Second higher tone (B5 chime)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.12);
    gain2.gain.setValueAtTime(0.2, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);
  } catch (e) {
    console.log('Audio chime error or blocked by autoplay policy:', e);
  }
};

const initialNotifications: AppNotification[] = [];

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: initialNotifications,
      pushPermission: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default',
      isSoundEnabled: true,
      unreadCount: initialNotifications.filter((n) => !n.isRead).length,

      isFirebaseSynced: false,

      initFirebaseSync: () => {
        if (get().isFirebaseSynced) return;
        set({ isFirebaseSynced: true });

        const notifsRef = collection(db, 'notifications');
        onSnapshot(
          notifsRef,
          (snapshot) => {
            const remoteNotifs: AppNotification[] = snapshot.docs.map((d) => d.data() as AppNotification);
            remoteNotifs.sort((a, b) => (b.id > a.id ? 1 : -1));
            set({
              notifications: remoteNotifs,
              unreadCount: remoteNotifs.filter((n) => !n.isRead).length,
            });
          },
          (err) => console.error('Firestore notifications sync error:', err)
        );
      },

      addNotification: async (notifData) => {
        const id = `notif-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const newNotif: AppNotification = {
          ...notifData,
          id,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: false,
        };

        set((state) => {
          const updated = [newNotif, ...(state.notifications || []).filter((n) => n.id !== id)];
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.isRead).length,
          };
        });

        try {
          await setDoc(doc(db, 'notifications', id), JSON.parse(JSON.stringify(newNotif)));
        } catch (err) {
          console.error('Error saving notification to Firebase:', err);
        }

        // Play chime sound if enabled
        if (get().isSoundEnabled) {
          playChimeSound();
        }

        // Trigger system push if requested & allowed
        if (notifData.isPush) {
          get().sendSystemPush(notifData.title, notifData.message);
        }
      },

      markAsRead: (id) => {
        set((state) => {
          const updated = state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          );
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.isRead).length,
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        }));
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      toggleSound: () => {
        set((state) => ({ isSoundEnabled: !state.isSoundEnabled }));
      },

      playAlertSound: () => {
        playChimeSound();
      },

      requestPushPermission: async () => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
          alert('Vinjari (browser) yako haiauni Mfumo wa Push Notifications.');
          return false;
        }

        try {
          const perm = await Notification.requestPermission();
          set({ pushPermission: perm });

          if (perm === 'granted') {
            playChimeSound();
            new Notification('YMA ENERGY GROUP ☀️', {
              body: 'Arifa za Kwenye Simu (Push Notifications) zimewezeshwa kikamilifu!',
              icon: '/favicon.ico',
            });
            return true;
          } else {
            return false;
          }
        } catch (error) {
          console.error('Error requesting notification permission:', error);
          return false;
        }
      },

      sendSystemPush: (title, body) => {
        if (
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          try {
            new Notification(`☀️ YMA Energy: ${title}`, {
              body,
              icon: '/favicon.ico',
            });
          } catch (err) {
            console.log('System push error:', err);
          }
        }
      },
    }),
    {
      name: 'yma-notifications-storage',
    }
  )
);

useNotificationStore.getState().initFirebaseSync();
