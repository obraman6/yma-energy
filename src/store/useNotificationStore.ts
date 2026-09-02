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
  targetRole?: 'ALL' | 'ADMIN' | 'STAFF_ADMIN' | 'SUPER_ADMIN' | 'MANAGER' | 'TECHNICIAN' | 'CUSTOMER';
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

        let isInitial = true;
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

            // If new notifications arrive in real-time from other devices/customers
            if (!isInitial) {
              snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                  const newDoc = change.doc.data() as AppNotification;
                  if (newDoc && !cleared.includes(newDoc.id)) {
                    // Check if recently added (last 30s)
                    const notifAgeMs = newDoc.createdAt ? Date.now() - new Date(newDoc.createdAt).getTime() : 0;
                    if (notifAgeMs < 30000) {
                      try {
                        // Dynamically check current auth role & identity
                        const authStorage = localStorage.getItem('yma-auth-storage');
                        let currentRole = '';
                        let currentUserId = '';
                        let currentUserEmail = '';
                        let currentUserPhone = '';
                        if (authStorage) {
                          const parsed = JSON.parse(authStorage);
                          currentRole = (parsed?.state?.user?.role || '').toUpperCase();
                          currentUserId = parsed?.state?.user?.id || parsed?.state?.user?.uid || '';
                          currentUserEmail = (parsed?.state?.user?.email || '').toLowerCase().trim();
                          currentUserPhone = (parsed?.state?.user?.phone || '').trim();
                        }

                        const isElevatedAdmin =
                          currentRole === 'SUPER_ADMIN' ||
                          currentRole === 'ADMIN' ||
                          currentRole === 'STAFF_ADMIN' ||
                          currentRole === 'MANAGER';

                        let shouldAlert = false;

                        // 1. If notification is specifically for CUSTOMER
                        if (newDoc.targetRole === 'CUSTOMER') {
                          // ONLY alert if this notification belongs to THIS user
                          if (
                            (currentUserId && (newDoc.userId === currentUserId || (currentUserPhone && newDoc.userId === currentUserPhone))) ||
                            (currentUserEmail && newDoc.userEmail && newDoc.userEmail.toLowerCase() === currentUserEmail)
                          ) {
                            shouldAlert = true;
                          }
                          // Elevated admin must NOT get customer confirmation alerts
                        } else if (
                          newDoc.targetRole === 'ADMIN' ||
                          newDoc.targetRole === 'STAFF_ADMIN' ||
                          newDoc.targetRole === 'SUPER_ADMIN' ||
                          newDoc.targetRole === 'MANAGER'
                        ) {
                          // ONLY alert if the logged-in user is an elevated admin
                          if (isElevatedAdmin) {
                            shouldAlert = true;
                          }
                        } else if (newDoc.targetRole === 'TECHNICIAN') {
                          if (currentRole === 'TECHNICIAN') {
                            shouldAlert = true;
                          }
                        } else if (newDoc.isGlobal) {
                          shouldAlert = true;
                        } else if (
                          (currentUserId && (newDoc.userId === currentUserId || (currentUserPhone && newDoc.userId === currentUserPhone))) ||
                          (currentUserEmail && newDoc.userEmail && newDoc.userEmail.toLowerCase() === currentUserEmail)
                        ) {
                          shouldAlert = true;
                        }

                        if (shouldAlert) {
                          if (get().isSoundEnabled) {
                            playChimeSound();
                          }
                          if (newDoc.isPush) {
                            get().sendSystemPush(newDoc.title, newDoc.message, newDoc.url || '/');
                          }
                        }
                      } catch (e) {
                        // ignore real-time alert error
                      }
                    }
                  }
                }
              });
            }
            isInitial = false;

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
        const userPhone = (currentUser.phone || '').trim();

        // All administrative and staff tiers: SUPER_ADMIN, STAFF_ADMIN, ADMIN, MANAGER
        const isElevatedAdmin =
          userRole === 'SUPER_ADMIN' ||
          userRole === 'ADMIN' ||
          userRole === 'STAFF_ADMIN' ||
          userRole === 'MANAGER';

        if (isElevatedAdmin) {
          // Admins (SUPER_ADMIN, STAFF_ADMIN, ADMIN, MANAGER) see:
          // 1. Admin broadcasts & alerts (targetRole: ADMIN, STAFF_ADMIN, SUPER_ADMIN, MANAGER, ALL)
          // 2. Notifications targeted personally to this admin
          // 3. Global announcements not restricted to customers
          // CRITICAL: Must NEVER show customer confirmation messages (targetRole: CUSTOMER) unless the admin personally placed it
          return all.filter((n) => {
            // If target is CUSTOMER:
            if (n.targetRole === 'CUSTOMER') {
              const isMyPersonal =
                (n.userId && (n.userId === userId || n.userId === currentUser.uid || (userPhone && n.userId === userPhone))) ||
                (n.userEmail && userEmail && n.userEmail.toLowerCase() === userEmail);
              return Boolean(isMyPersonal);
            }

            // If target is ADMIN roles
            if (
              n.targetRole === 'ADMIN' ||
              n.targetRole === 'STAFF_ADMIN' ||
              n.targetRole === 'SUPER_ADMIN' ||
              n.targetRole === 'MANAGER' ||
              n.targetRole === 'ALL'
            ) {
              return true;
            }

            // Explicit personal notification to this user
            if (n.userId && (n.userId === userId || n.userId === currentUser.uid || (userPhone && n.userId === userPhone))) {
              return true;
            }
            if (n.userEmail && userEmail && n.userEmail.toLowerCase() === userEmail) {
              return true;
            }

            // Global announcements (must not be restricted to customers)
            if (n.isGlobal) {
              return true;
            }

            // System alerts (e.g. low stock, server notices) that do not belong to a specific customer
            if (n.type === 'system' && !n.userId) {
              return true;
            }

            return false;
          });
        }

        if (userRole === 'TECHNICIAN') {
          // Technicians see jobs, assignments, technician alerts, and their own
          return all.filter((n) => {
            if (n.targetRole === 'CUSTOMER') {
              const isMyPersonal =
                (n.userId && (n.userId === userId || n.userId === currentUser.uid || (userPhone && n.userId === userPhone))) ||
                (n.userEmail && userEmail && n.userEmail.toLowerCase() === userEmail);
              return Boolean(isMyPersonal);
            }
            if (n.targetRole === 'TECHNICIAN' || n.targetRole === 'ALL') return true;
            if (n.userId && (n.userId === userId || n.userId === currentUser.uid || (userPhone && n.userId === userPhone))) return true;
            if (n.userEmail && userEmail && n.userEmail.toLowerCase() === userEmail) return true;
            if (n.isGlobal && (n.targetRole as string) !== 'ADMIN' && (n.targetRole as string) !== 'STAFF_ADMIN') return true;
            return false;
          });
        }

        // Standard CUSTOMER: ONLY show items explicitly for this user or global announcements
        return all.filter((n) => {
          // Prevent customers from seeing admin-targeted notifications
          const role = (n.targetRole || '') as string;
          if (
            role === 'ADMIN' ||
            role === 'STAFF_ADMIN' ||
            role === 'SUPER_ADMIN' ||
            role === 'MANAGER' ||
            role === 'TECHNICIAN'
          ) {
            return false;
          }

          // Explicit user match
          if (n.userId && (n.userId === userId || n.userId === currentUser.uid || (userPhone && n.userId === userPhone))) return true;
          if (n.userEmail && userEmail && n.userEmail.toLowerCase() === userEmail) return true;
          // Global announcements (must not be targeted to staff)
          if (n.isGlobal && (!n.targetRole || n.targetRole === 'ALL' || n.targetRole === 'CUSTOMER')) return true;
          if (n.targetRole === 'CUSTOMER' && !n.userId && !n.userEmail) return true;
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


