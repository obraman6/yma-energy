import { create } from 'zustand';
import { Order, OrderStatus } from '../types';
import { initialOrders } from '../data/mockData';
import { db } from '../lib/firebase';
import { sendAdminEmailTrigger } from '../services/emailService';
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

  initFirebaseSync: () => void;

  placeOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'invoiceNumber' | 'createdAt' | 'status'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  assignDriver: (orderId: string, driverName: string, driverPhone: string, driverVehicle: string) => Promise<void>;
  completeDelivery: (orderId: string, proofUrl?: string) => Promise<void>;
  clearAllOrders: () => Promise<void>;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  isFirebaseSynced: false,

  initFirebaseSync: () => {
    if (get().isFirebaseSynced) return;
    set({ isFirebaseSynced: true });

    const ordersRef = collection(db, 'orders');
    onSnapshot(
      ordersRef,
      (snapshot) => {
        const remoteOrders: Order[] = snapshot.docs.map((d) => d.data() as Order);
        set({ orders: remoteOrders });
      },
      (err) => console.error('Firestore orders sync error:', err)
    );
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

    set((state) => ({ orders: [newOrder, ...(state.orders || []).filter((o) => o.id !== id)] }));

    try {
      await setDoc(doc(db, 'orders', id), newOrder);
    } catch (err) {
      console.error('Error saving order to Firebase:', err);
    }

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
    set((state) => ({
      orders: state.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
    }));

    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (err) {
      console.error('Error updating order status in Firebase:', err);
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
