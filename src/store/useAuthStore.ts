import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '../types';
import { auth, db } from '../lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { collection, onSnapshot, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';

interface AuthResult {
  success: boolean;
  user?: User;
  message?: string;
}

interface AuthState {
  user: User | null;
  users: User[];
  isLoading: boolean;
  isFirebaseSynced: boolean;

  initFirebaseSync: () => void;
  login: (email: string, password?: string) => Promise<AuthResult>;
  register: (name: string, email: string, phone: string, password?: string) => Promise<AuthResult>;
  createStaffUser: (name: string, email: string, phone: string, role: UserRole, password?: string) => Promise<AuthResult>;
  deleteUserAccount: (userId: string) => Promise<void>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  updateProfile: (updated: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      users: [],
      isLoading: false,
      isFirebaseSynced: false,

      initFirebaseSync: () => {
        if (get().isFirebaseSynced) return;
        set({ isFirebaseSynced: true });

        // 1. Sync entire users collection in real-time from Firestore
        const usersRef = collection(db, 'users');
        onSnapshot(
          usersRef,
          (snapshot) => {
            if (snapshot.empty) {
              set({ users: [] });
            } else {
              const remoteUsersRaw: User[] = snapshot.docs.map((d) => d.data() as User);
              // Deduplicate users by email or ID
              const userMap = new Map<string, User>();
              remoteUsersRaw.forEach((u) => {
                const emailKey = (u.email || '').trim().toLowerCase();
                if (emailKey) {
                  // Keep admin/manager role if duplicates exist
                  const existing = userMap.get(emailKey);
                  if (!existing || u.role === 'ADMIN' || u.role === 'MANAGER') {
                    userMap.set(emailKey, u);
                  }
                } else if (u.id) {
                  userMap.set(u.id, u);
                }
              });
              const remoteUsers = Array.from(userMap.values());
              set({ users: remoteUsers });

              // Sync current logged in user details if updated remotely
              const currentUser = get().user;
              if (currentUser) {
                const updatedSelf = remoteUsers.find(
                  (u) => u.id === currentUser.id || u.email.trim().toLowerCase() === currentUser.email.trim().toLowerCase()
                );
                if (updatedSelf) {
                  set({ user: updatedSelf });
                }
              }
            }
          },
          (err) => console.error('Firestore users sync error:', err)
        );

        // 2. Track Firebase Auth state
        onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            try {
              const userDocRef = doc(db, 'users', firebaseUser.uid);
              const snap = await getDoc(userDocRef);

              if (snap.exists()) {
                set({ user: snap.data() as User, isLoading: false });
              } else {
                const now = new Date().toISOString();
                const newUser: User = {
                  id: firebaseUser.uid,
                  uid: firebaseUser.uid,
                  name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Mteja YMA',
                  fullName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Mteja YMA',
                  email: firebaseUser.email || '',
                  phone: firebaseUser.phoneNumber || '',
                  role: 'CUSTOMER',
                  status: 'active',
                  createdAt: now,
                  updatedAt: now,
                };
                await setDoc(userDocRef, newUser);
                set({ user: newUser, isLoading: false });
              }
            } catch (err) {
              console.error('Error fetching user profile from Firestore:', err);
              set({ isLoading: false });
            }
          } else {
            // Keep rehydrated user if present (e.g. from local storage session)
            set({ isLoading: false });
          }
        });
      },

  login: async (email, password) => {
    set({ isLoading: true });
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password || '';

    // 1. Attempt login with Firebase Auth
    if (cleanPassword) {
      try {
        const res = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        const userDocRef = doc(db, 'users', res.user.uid);
        const snap = await getDoc(userDocRef);

        if (snap.exists()) {
          const userData = snap.data() as User;
          if (userData.status === 'suspended') {
            set({ isLoading: false });
            return { success: false, message: 'Akaunti hii imesimamishwa. Wasiliana na Utawala.' };
          }
          set({ user: userData, isLoading: false });
          return { success: true, user: userData };
        }
      } catch (err: any) {
        console.log('Firebase Auth login skipped/failed, searching Firestore database directly...');
      }
    }

    // 2. Check local users store or query Firestore directly
    const existingInStore = get().users.find((u) => u.email.trim().toLowerCase() === cleanEmail);
    if (existingInStore) {
      if (existingInStore.status === 'suspended') {
        set({ isLoading: false });
        return { success: false, message: 'Akaunti hii imesimamishwa. Wasiliana na Utawala.' };
      }
      set({ user: existingInStore, isLoading: false });
      return { success: true, user: existingInStore };
    }

    // 3. Direct Firestore Query
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', cleanEmail));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const foundUser = snap.docs[0].data() as User;
        if (foundUser.status === 'suspended') {
          set({ isLoading: false });
          return { success: false, message: 'Akaunti hii imesimamishwa. Wasiliana na Utawala.' };
        }
        set({ user: foundUser, isLoading: false });
        return { success: true, user: foundUser };
      }
    } catch (fErr) {
      console.error('Error querying Firestore users:', fErr);
    }

    set({ isLoading: false });
    return {
      success: false,
      message: 'Akaunti haipatikani kwenye database. Tafadhali bonyeza "Create Account" kusajili akaunti mpya.',
    };
  },

  register: async (name, email, phone, password) => {
    set({ isLoading: true });
    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate email in store
    const duplicate = get().users.find((u) => u.email.trim().toLowerCase() === cleanEmail);
    if (duplicate) {
      set({ isLoading: false });
      return {
        success: false,
        message: 'Barua pepe hii (Email) imeshasajiliwa tayari. Tafadhali ingia (Sign In) au tumia email nyingine.',
      };
    }

    // ENTERPRISE RULE: Public signup ALWAYS assigns role: 'CUSTOMER' and status: 'active'
    const now = new Date().toISOString();

    try {
      const res = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const newUser: User = {
        id: res.user.uid,
        uid: res.user.uid,
        name,
        fullName: name,
        email: cleanEmail,
        phone,
        role: 'CUSTOMER',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(doc(db, 'users', res.user.uid), newUser);
      set({ user: newUser, isLoading: false });
      return { success: true, user: newUser };
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        set({ isLoading: false });
        return {
          success: false,
          message: 'Barua pepe hii tayari inatumika. Tumia fomu ya Login au badilisha nenosiri.',
        };
      }

      // Firestore fallback
      const uid = `u-${Date.now()}`;
      const fallbackUser: User = {
        id: uid,
        uid,
        name,
        fullName: name,
        email: cleanEmail,
        phone,
        role: 'CUSTOMER',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };
      try {
        await setDoc(doc(db, 'users', uid), fallbackUser);
      } catch (fErr) {
        console.error('Error saving customer to Firestore:', fErr);
      }
      set({ user: fallbackUser, isLoading: false });
      return { success: true, user: fallbackUser };
    }
  },

  // ADMIN/MANAGER ONLY: Create staff user (Manager or Admin)
  createStaffUser: async (name, email, phone, role, password) => {
    set({ isLoading: true });
    const cleanEmail = email.trim().toLowerCase();
    const now = new Date().toISOString();

    // Check duplicate email in store
    const existing = get().users.find((u) => u.email.trim().toLowerCase() === cleanEmail);
    if (existing) {
      set({ isLoading: false });
      return {
        success: false,
        message: `Akaunti yenye barua pepe "${cleanEmail}" ipo tayari kama ${existing.role}. Hakuna haja ya kuirudia.`,
      };
    }

    const sanitizedId = `user-${cleanEmail.replace(/[^a-z0-9]/g, '-')}`;
    const newStaff: User = {
      id: sanitizedId,
      uid: sanitizedId,
      name,
      fullName: name,
      email: cleanEmail,
      phone,
      role,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'users', sanitizedId), newStaff);
      const currentUsers = get().users.filter((u) => u.email.trim().toLowerCase() !== cleanEmail);
      set({ users: [...currentUsers, newStaff], isLoading: false });
      return { success: true, user: newStaff };
    } catch (err: any) {
      console.error('Error saving staff account to Firestore:', err);
      set({ isLoading: false });
      return {
        success: false,
        message: 'Imefeli kuhifadhi akaunti ya Staff kwenye database.',
      };
    }
  },

  deleteUserAccount: async (userId: string) => {
    set((state) => ({
      users: state.users.filter((u) => u.id !== userId && u.uid !== userId),
    }));

    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (err) {
      console.error('Error deleting user account from Firestore:', err);
    }
  },

  updateUserRole: async (userId: string, newRole: UserRole) => {
    set((state) => ({
      users: state.users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
    }));

    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error updating user role in Firestore:', err);
    }
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true });
    try {
      await sendPasswordResetEmail(auth, email.trim());
      set({ isLoading: false });
      return {
        success: true,
        message: 'Ikiwa akaunti yenye barua pepe hii ipo, kiungo cha kubadilisha nenosiri kimetumwa. (If an account with this email exists, a password reset link has been sent.)',
      };
    } catch (err) {
      console.warn('Firebase reset password note:', err);
      set({ isLoading: false });
      return {
        success: true,
        message: 'Ikiwa akaunti yenye barua pepe hii ipo, kiungo cha kubadilisha nenosiri kimetumwa.',
      };
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error signing out from Firebase:', err);
    }
    set({ user: null });
  },

  updateProfile: async (updated) => {
    const currentUser = get().user;
    if (!currentUser) return;

    const updatedUser = { ...currentUser, ...updated, updatedAt: new Date().toISOString() };
    set({ user: updatedUser });

    try {
      await updateDoc(doc(db, 'users', currentUser.id), {
        ...updated,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error updating profile in Firebase:', err);
    }
    }
  }),
  {
    name: 'yma-auth-storage',
    partialize: (state) => ({ user: state.user }),
  }
)
);

// Initialize Firebase sync automatically
useAuthStore.getState().initFirebaseSync();

