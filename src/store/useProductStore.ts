import { create } from 'zustand';
import { Product, ProductCategory, CustomerReview } from '../types';
import { initialProducts, initialReviews } from '../data/mockData';
import { db } from '../lib/firebase';
import { useNotificationStore } from './useNotificationStore';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';

interface ProductState {
  products: Product[];
  reviews: CustomerReview[];
  selectedCategory: ProductCategory | 'All';
  searchQuery: string;
  sortBy: 'price-asc' | 'price-desc' | 'rating' | 'stock';
  isFirebaseSynced: boolean;

  initFirebaseSync: () => void;

  setCategory: (category: ProductCategory | 'All') => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: 'price-asc' | 'price-desc' | 'rating' | 'stock') => void;

  addProduct: (product: Omit<Product, 'id' | 'rating'>) => Promise<Product>;
  editProduct: (id: string, updated: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  adjustStock: (id: string, delta: number) => Promise<void>;

  addReview: (review: Omit<CustomerReview, 'id' | 'createdAt' | 'isPinned'>) => Promise<CustomerReview>;
  replyToReview: (id: string, reply: string) => Promise<void>;
  togglePinReview: (id: string) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
  clearAllProductsAndReviews: () => Promise<void>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  reviews: [],
  selectedCategory: 'All',
  searchQuery: '',
  sortBy: 'rating',
  isFirebaseSynced: false,

  initFirebaseSync: () => {
    if (get().isFirebaseSynced) return;
    set({ isFirebaseSynced: true });

    // Sync Products from Firestore
    const productsRef = collection(db, 'products');
    onSnapshot(
      productsRef,
      (snapshot) => {
        const remoteProducts: Product[] = snapshot.docs.map((d) => d.data() as Product);
        set({ products: remoteProducts });
      },
      (err) => console.error('Firestore products sync error:', err)
    );

    // Sync Reviews from Firestore
    const reviewsRef = collection(db, 'reviews');
    onSnapshot(
      reviewsRef,
      (snapshot) => {
        const remoteReviews: CustomerReview[] = snapshot.docs.map((d) => d.data() as CustomerReview);
        set({ reviews: remoteReviews });
      },
      (err) => console.error('Firestore reviews sync error:', err)
    );
  },

  setCategory: (category) => set({ selectedCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortBy: (sort) => set({ sortBy: sort }),

  addProduct: async (newProdData) => {
    const id = `p-${Date.now()}`;
    const newProduct: Product = {
      ...newProdData,
      id,
      rating: 5.0,
    };

    // Optimistic UI update
    set((state) => ({ products: [newProduct, ...state.products] }));

    try {
      await setDoc(doc(db, 'products', id), newProduct);

      // Trigger system notification to all users via Firestore notification channel
      useNotificationStore.getState().addNotification({
        title: `Bidhaa Mpya: ${newProduct.name}`,
        titleSw: `Bidhaa Mpya: ${newProduct.name}`,
        message: `Bidhaa mpya ya ${newProduct.category} ("${newProduct.name}") kwa TZS ${newProduct.priceTzs.toLocaleString()} imeongezwa kwenye duka!`,
        messageSw: `Bidhaa mpya ya ${newProduct.category} ("${newProduct.name}") kwa TZS ${newProduct.priceTzs.toLocaleString()} imeongezwa kwenye duka!`,
        type: 'promo',
        isPush: true,
      });
    } catch (err) {
      console.error('Error saving product to Firebase:', err);
    }

    return newProduct;
  },

  editProduct: async (id, updated) => {
    // Optimistic local state update
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...updated } : p)),
    }));

    try {
      await updateDoc(doc(db, 'products', id), updated);
    } catch (err) {
      console.error('Error updating product in Firebase:', err);
    }
  },

  deleteProduct: async (id) => {
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    }));

    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      console.error('Error deleting product from Firebase:', err);
    }
  },

  adjustStock: async (id, delta) => {
    const product = get().products.find((p) => p.id === id);
    if (!product) return;

    const newStock = Math.max(0, product.stock + delta);
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, stock: newStock } : p)),
    }));

    try {
      await updateDoc(doc(db, 'products', id), { stock: newStock });
    } catch (err) {
      console.error('Error adjusting stock in Firebase:', err);
    }
  },

  addReview: async (reviewData) => {
    const id = `r-${Date.now()}`;
    const newReview: CustomerReview = {
      ...reviewData,
      id,
      isPinned: false,
      createdAt: new Date().toISOString().split('T')[0],
    };

    set((state) => ({ reviews: [newReview, ...state.reviews] }));

    try {
      await setDoc(doc(db, 'reviews', id), newReview);
    } catch (err) {
      console.error('Error saving review to Firebase:', err);
    }

    return newReview;
  },

  replyToReview: async (id, reply) => {
    set((state) => ({
      reviews: state.reviews.map((r) => (r.id === id ? { ...r, adminReply: reply } : r)),
    }));

    try {
      await updateDoc(doc(db, 'reviews', id), { adminReply: reply });
    } catch (err) {
      console.error('Error saving review reply to Firebase:', err);
    }
  },

  togglePinReview: async (id) => {
    const review = get().reviews.find((r) => r.id === id);
    if (!review) return;

    const newPin = !review.isPinned;
    set((state) => ({
      reviews: state.reviews.map((r) => (r.id === id ? { ...r, isPinned: newPin } : r)),
    }));

    try {
      await updateDoc(doc(db, 'reviews', id), { isPinned: newPin });
    } catch (err) {
      console.error('Error updating review pin in Firebase:', err);
    }
  },

  deleteReview: async (id) => {
    set((state) => ({
      reviews: state.reviews.filter((r) => r.id !== id),
    }));

    try {
      await deleteDoc(doc(db, 'reviews', id));
    } catch (err) {
      console.error('Error deleting review from Firebase:', err);
    }
  },

  clearAllProductsAndReviews: async () => {
    const currentProducts = get().products;
    const currentReviews = get().reviews;

    set({ products: [], reviews: [] });

    for (const p of currentProducts) {
      deleteDoc(doc(db, 'products', p.id)).catch(() => {});
    }
    for (const r of currentReviews) {
      deleteDoc(doc(db, 'reviews', r.id)).catch(() => {});
    }
  },
}));

// Initialize Firebase sync automatically
useProductStore.getState().initFirebaseSync();
