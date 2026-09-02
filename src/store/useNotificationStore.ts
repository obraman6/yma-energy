import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { User } from '../types';

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
  userId?: string; // Target specific user (e.g. customer)
  userEmail?: string; // Target specific user email
  targetRole?: 'ALL' | 'ADMIN' | 'MANAGER' | 'TECHNICIAN' | 'CUSTOMER';
  isGlobal?: boolean; // Broadcast to everyone
  url?: string; // Deep-link to open when clicked
  createdAt?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  clearedIds: string[];
  pushPermission: NotificationPermission | 'default';
  isSoundEnabled: boolean;
  unreadCount: number;
  isFirebaseSynced: boolean;

  // Actions
  initFirebaseSync: () => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'time' | 'isRead'>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (currentUser?: User | null) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: (currentUser?: User | null) => Promise<void>;
  getUserNotifications: (currentUser: User | null) => AppNotification[];
  getUserUnreadCount: (currentUser: User | null) => number;
  requestPushPermission: () => Promise<boolean>;
  toggleSound: () => void;
  playAlertSound: () => void;
  sendSystemPush: (title: string, body: string, url?: string) => void;
  handleUserLogout: () => void;
}

// Utility to generate a pleasant solar alert chime using Web Audio API
const playChimeSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;

    // First tone (E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.18, now);
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
    gain2.gain.setValueAtTime(0.25, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.65);
  } catch (e) {
    console.log('Audio chime error or blocked by autoplay policy:', e);
  }
};

const initialNotifications: AppNotification[] = [];

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: initialNotifications,
      clearedIds: [],
      pushPermission:
        typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default',
      isSoundEnabled: true,
      unreadCount: 0,
      isFirebaseSynced: false,

      initFirebaseSync: () => {
        if (get().isFirebaseSynced) return;
        set({ isFirebaseSynced: true });

        const notifsRef = collection(db, 'notifications');
        onSnapshot(
          notifsRef,
          (snapshot) => {
            const cleared = get().clearedIds || [];
            const remoteNotifs: AppNotification[] = snapshot.docs
              .map((d) => d.data() as AppNotification)
              .filter((n) => n && n.id && !cleared.includes(n.id));

            remoteNotifs.sort((a, b) => {
              const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              if (timeA && timeB) return timeB - timeA;
              return b.id > a.id ? 1 : -1;
            });

            set({
              notifications: remoteNotifs,
              unreadCount: remoteNotifs.filter((n) => !n.isRead).length,
            });
          },
          (err) => console.error('Firestore notifications sync error:', err)
        );
      },

      getUserNotifications: (currentUser: User | null) => {
        const cleared = get().clearedIds || [];
        const all = (get().notifications || []).filter((n) => n && n.id && !cleared.includes(n.id));
        if (!currentUser) {
          // Guest / anonymous: only show global promo broadcasts
          return all.filter((n) => n.isGlobal === true || (!n.userId && !n.targetRole && n.type === 'promo'));
        }

        const userRole = (currentUser.role || '').toUpperCase();
        const userEmail = (currentUser.email || '').trim().toLowerCase();
        const userId = currentUser.id || currentUser.uid || '';

        if (userRole === 'ADMIN' || userRole === 'MANAGER') {
          // Admins & Managers see system alerts, stock alerts, orders, repair updates, and their own
          return all.filter((n) => {
            if (n.targetRole === 'ADMIN' || n.targetRole === 'MANAGER' || n.targetRole === 'ALL') return true;
            if (n.isGlobal) return true;
            if (n.userId === userId) return true;
            if (n.userEmail && n.userEmail.toLowerCase() === userEmail) return true;
            // Also show system & maintenance notifications
            if (n.type === 'system' || n.type === 'maintenance') return true;
            return false;
          });
        }

        if (userRole === 'TECHNICIAN') {
          // Technicians see jobs, assignments, technician alerts, and their own
          return all.filter((n) => {
            if (n.targetRole === 'TECHNICIAN' || n.targetRole === 'ALL') return true;
            if (n.isGlobal) return true;
            if (n.userId === userId) return true;
            if (n.userEmail && n.userEmail.toLowerCase() === userEmail) return true;
            if (n.type === 'maintenance' && !n.userId) return true;
            return false;
          });
        }

        // Standard CUSTOMER: ONLY show items explicitly for this user or global announcements
        return all.filter((n) => {
          // Explicit user match
          if (n.userId && (n.userId === userId || n.userId === currentUser.uid)) return true;
          if (n.userEmail && n.userEmail.toLowerCase() === userEmail) return true;
          // Global announcements (must not be targeted to staff)
          if (n.isGlobal && (!n.targetRole || n.targetRole === 'ALL' || n.targetRole === 'CUSTOMER')) return true;
          if (n.targetRole === 'CUSTOMER' && !n.userId) return true;
          return false;
        });
      },

      getUserUnreadCount: (currentUser: User | null) => {
        const userNotifs = get().getUserNotifications(currentUser);
        return userNotifs.filter((n) => !n.isRead).length;
      },

      addNotification: async (notifData) => {
        const id = `notif-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const newNotif: AppNotification = {
          ...notifData,
          id,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: false,
          createdAt: new Date().toISOString(),
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
          get().sendSystemPush(notifData.title, notifData.message, notifData.url || '/');
        }
      },

      markAsRead: async (id) => {
        set((state) => {
          const updated = state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          );
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.isRead).length,
          };
        });

        try {
          await updateDoc(doc(db, 'notifications', id), { isRead: true });
        } catch (err) {
          // If update doc fails (e.g. offline), local state is already updated
        }
      },

      markAllAsRead: async (currentUser) => {
        const currentList = currentUser ? get().getUserNotifications(currentUser) : get().notifications;
        const unreadItems = currentList.filter((n) => !n.isRead);

        set((state) => {
          const readIds = new Set(unreadItems.map((n) => n.id));
          const updated = state.notifications.map((n) =>
            readIds.has(n.id) ? { ...n, isRead: true } : n
          );
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.isRead).length,
          };
        });

        // Sync read status to Firestore
        unreadItems.forEach((n) => {
          updateDoc(doc(db, 'notifications', n.id), { isRead: true }).catch(() => {});
        });
      },

      deleteNotification: async (id) => {
        set((state) => {
          const newCleared = Array.from(new Set([...(state.clearedIds || []), id]));
          const updated = state.notifications.filter((n) => n.id !== id);
          return {
            clearedIds: newCleared,
            notifications: updated,
            unreadCount: updated.filter((n) => !n.isRead).length,
          };
        });

        try {
          await deleteDoc(doc(db, 'notifications', id));
        } catch (err) {
          console.log('Firebase delete notification err:', err);
        }
      },

      clearAll: async (currentUser) => {
        const targetList = currentUser ? get().getUserNotifications(currentUser) : get().notifications;
        const targetIds = targetList.map((n) => n.id);

        set((state) => {
          const newCleared = Array.from(new Set([...(state.clearedIds || []), ...targetIds]));
          const remaining = state.notifications.filter((n) => !targetIds.includes(n.id));
          return {
            clearedIds: newCleared,
            notifications: remaining,
            unreadCount: remaining.filter((n) => !n.isRead).length,
          };
        });

        // Delete from Firestore for permanent removal
        targetIds.forEach((id) => {
          deleteDoc(doc(db, 'notifications', id)).catch(() => {});
        });
      },

      handleUserLogout: () => {
        // Reset notifications on logout so next visitor doesn't see previous user's private alerts
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
            get().sendSystemPush(
              'Arifa Zimefunguliwa! ☀️',
              'Sasa utapokea taarifa za oda, huduma za sola, na matengenezo moja kwa moja kwenye simu yako hata ikiwa imefungwa.',
              '/'
            );
            return true;
          } else {
            return false;
          }
        } catch (error) {
          console.error('Error requesting notification permission:', error);
          return false;
        }
      },

      sendSystemPush: (title, body, url = '/') => {
        if (
          typeof window === 'undefined' ||
          !('Notification' in window) ||
          Notification.permission !== 'granted'
        ) {
          return;
        }

        const options: NotificationOptions = {
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          vibrate: [200, 100, 200, 100, 200],
          tag: `yma-${Date.now()}`,
          requireInteraction: false,
          data: {
            url,
            timestamp: Date.now(),
          },
        } as any;

        // Use ServiceWorker Registration for native Android/PWA notifications
        if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
          navigator.serviceWorker.ready
            .then((registration) => {
              registration.showNotification(`☀️ YMA Energy: ${title}`, options);
            })
            .catch(() => {
              try {
                new Notification(`☀️ YMA Energy: ${title}`, options);
              } catch (e) {
                console.log('System push notification error:', e);
              }
            });
        } else {
          try {
            new Notification(`☀️ YMA Energy: ${title}`, options);
          } catch (err) {
            console.log('System push notification fallback error:', err);
          }
        }
      },
    }),
    {
      name: 'yma-notifications-storage',
      partialize: (state) => ({
        notifications: state.notifications,
        clearedIds: state.clearedIds,
        isSoundEnabled: state.isSoundEnabled,
      }),
    }
  )
);

useNotificationStore.getState().initFirebaseSync();


