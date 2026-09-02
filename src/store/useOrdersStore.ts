import { create } from 'zustand';
import { Order, OrderStatus } from '../types';
import { db } from '../lib/firebase';
import { sendAdminEmailTrigger } from '../services/emailService';
import { useProductStore } from './useProductStore';
import { useNotificationStore } from './useNotificationStore';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

interface OrdersState {
  orders: Order[];
  isFirebaseSynced: boolean;
  isLoading: boolean;

  initFirebaseSync: () => void;
  forceRefresh: () => Promise<void>;

  placeOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'invoiceNumber' | 'createdAt' | 'status'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  assignDriver: (orderId: string, driverName: string, driverPhone: string, driverVehicle: string) => Promise<void>;
  completeDelivery: (orderId: string, proofUrl?: string) => Promise<void>;
  clearAllOrders: () => Promise<void>;
}

const ORDERS_CACHE_KEY = 'yma_cached_orders_v1';

const loadCachedOrders = (): Order[] => {
  try {
    const raw = localStorage.getItem(ORDERS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error reading cached orders:', e);
  }
  return [];
};

const initialOrders = loadCachedOrders();

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: initialOrders,
  isFirebaseSynced: false,
  isLoading: initialOrders.length === 0,

  initFirebaseSync: () => {
    if (get().isFirebaseSynced) return;
    set({ isFirebaseSynced: true });

    const ordersRef = collection(db, 'orders');
    onSnapshot(
      ordersRef,
      (snapshot) => {
        const remoteOrders: Order[] = snapshot.docs.map((d) => d.data() as Order);
        try {
          localStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(remoteOrders));
        } catch (e) {}
        set({ orders: remoteOrders, isLoading: false });
      },
      (err) => {
        console.error('Firestore orders sync error:', err);
        set({ isLoading: false });
      }
    );
  },

  forceRefresh: async () => {
    set({ orders: [], isLoading: true, isFirebaseSynced: false });
    get().initFirebaseSync();
  },

  placeOrder: async (orderData) => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `ORD-${randomNum}`;
    const invoiceNumber = `INV-${randomNum}`;
    const id = `ord-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      ...orderData,
      id,
      orderNumber,
      invoiceNumber,
      status: 'Payment Confirmed',
      createdAt: new Date().toLocaleString(),
    };

    const cleanOrder = JSON.parse(JSON.stringify(newOrder));
    set((state) => ({ orders: [newOrder, ...(state.orders || []).filter((o) => o.id !== id)] }));

    try {
      await setDoc(doc(db, 'orders', id), cleanOrder);
    } catch (err) {
      console.error('Error saving order to Firebase:', err);
    }

    // Deduct stock for ordered items
    orderData.items.forEach((item) => {
      useProductStore.getState().adjustStock(item.product.id, -item.quantity);
    });

    // Trigger notifications
    useNotificationStore.getState().addNotification({
      title: `Oda Yako Imethibitishwa: #${newOrder.orderNumber}`,
      titleSw: `Oda Yako Imethibitishwa: #${newOrder.orderNumber}`,
      message: `Asante ${newOrder.customerName}! Oda yako ya TZS ${(newOrder.totalAmountTzs || 0).toLocaleString()} imepokelewa na inashughulikiwa.`,
      messageSw: `Asante ${newOrder.customerName}! Oda yako ya TZS ${(newOrder.totalAmountTzs || 0).toLocaleString()} imepokelewa na inashughulikiwa.`,
      type: 'order',
      isPush: true,
      userId: newOrder.userId || newOrder.customerPhone,
      userEmail: newOrder.customerEmail,
      targetRole: 'CUSTOMER',
      url: '/account',
    });

    useNotificationStore.getState().addNotification({
      title: `🛒 Oda Mpya: #${newOrder.orderNumber}`,
      titleSw: `🛒 Oda Mpya: #${newOrder.orderNumber}`,
      message: `Mteja ${newOrder.customerName} (${newOrder.customerPhone}) ameweka oda ya TZS ${(newOrder.totalAmountTzs || 0).toLocaleString()}.`,
      messageSw: `Mteja ${newOrder.customerName} (${newOrder.customerPhone}) ameweka oda ya TZS ${(newOrder.totalAmountTzs || 0).toLocaleString()}.`,
      type: 'order',
      isPush: true,
      targetRole: 'ADMIN',
      url: '/admin',
    });

    // Trigger real-time admin email notification
    sendAdminEmailTrigger({
      type: 'order',
      data: {
        orderNumber: newOrder.orderNumber,
        customerName: newOrder.customerName,
        phone: newOrder.customerPhone,
        address: `${newOrder.shippingAddress}, ${newOrder.region}`,
        totalAmount: newOrder.totalAmountTzs,
        paymentMethod: newOrder.paymentMethod,
        items: newOrder.items.map((i) => ({
          name: i.product.name,
          price: i.product.priceTzs,
          quantity: i.quantity,
        })),
      },
    }).catch((e) => console.error('Error triggering order email alert:', e));

    return newOrder;
  },

  updateOrderStatus: async (orderId, status) => {
    const target = get().orders.find((o) => o.id === orderId);
    set((state) => ({
      orders: state.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
    }));

    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (err) {
      console.error('Error updating order status in Firebase:', err);
    }

    if (target) {
      useNotificationStore.getState().addNotification({
        title: `📦 Mabadiliko ya Oda: #${target.orderNumber}`,
        titleSw: `📦 Mabadiliko ya Oda: #${target.orderNumber}`,
        message: `Hali ya oda yako imesasishwa kuwa: ${status}.`,
        messageSw: `Hali ya oda yako imesasishwa kuwa: ${status}.`,
        type: 'order',
        isPush: true,
        userId: target.userId || target.customerPhone,
        targetRole: 'CUSTOMER',
        url: '/account',
      });
    }
  },

  assignDriver: async (orderId, driverName, driverPhone, driverVehicle) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              driverName,
              driverPhone,
              driverVehicle,
              status: 'Out for Delivery',
            }
          : o
      ),
    }));

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        driverName,
        driverPhone,
        driverVehicle,
        status: 'Out for Delivery',
      });
    } catch (err) {
      console.error('Error assigning driver in Firebase:', err);
    }
  },

  completeDelivery: async (orderId, proofUrl) => {
    const defaultProof = 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&q=80&w=400';
    const finalProof = proofUrl || defaultProof;

    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'Delivered',
              deliveryProofUrl: finalProof,
            }
          : o
      ),
    }));

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'Delivered',
        deliveryProofUrl: finalProof,
      });
    } catch (err) {
      console.error('Error completing delivery in Firebase:', err);
    }
  },

  clearAllOrders: async () => {
    const currentOrders = get().orders;
    set({ orders: [] });

    for (const o of currentOrders) {
      deleteDoc(doc(db, 'orders', o.id)).catch(() => {});
    }
  },
}));

// Initialize Firebase sync automatically
useOrdersStore.getState().initFirebaseSync();
