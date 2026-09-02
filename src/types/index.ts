export type Language = 'en' | 'sw';
export type ThemeMode = 'light' | 'dark';
export type UserRole = 'SUPER_ADMIN' | 'STAFF_ADMIN' | 'ADMIN' | 'MANAGER' | 'TECHNICIAN' | 'DRIVER' | 'CUSTOMER';

export interface User {
  id: string;
  uid?: string;
  fullName?: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status?: 'active' | 'suspended';
  createdAt?: string;
  updatedAt?: string;
  avatarUrl?: string;
}

export type ProductCategory =
  | 'Solar Panels'
  | 'Hybrid Inverters'
  | 'Lithium Batteries'
  | 'Gel Batteries'
  | 'Solar Water Heaters'
  | 'Solar Pumps'
  | 'Accessories';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  priceTzs: number;
  stock: number;
  lowStockThreshold?: number;
  specifications: string;
  description: string;
  imageUrl: string;
  additionalImages?: string[];
  warrantyPeriod: string;
  rating: number;
}

export interface CustomerReview {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  rating: number;
  comment: string;
  adminReply?: string;
  isPinned: boolean;
  createdAt: string;
}

export interface SolarService {
  id: string;
  name: string;
  nameSw: string;
  category: string;
  description: string;
  descriptionSw: string;
  features: string[];
  durationHours: string;
  basePriceTzs: number;
  imageUrl: string;
}

export type ServiceStatus = 'Pending' | 'Queued' | 'Technician Dispatched' | 'Accepted' | 'En-Route' | 'On-Site' | 'Completed' | 'Rejected' | 'Cancelled';

export interface ServiceRequest {
  id: string;
  requestNumber: string;
  userId?: string;
  serviceId: string;
  serviceName: string;
  customerName: string;
  phone: string;
  email: string;
  region: string;
  district: string;
  preferredDate: string;
  timeSlot: 'Morning' | 'Afternoon' | 'Evening';
  roofType: 'Iron Sheet' | 'Tiles' | 'Concrete Slab' | 'Ground Mount';
  priority: 'Normal' | 'Urgent';
  notes?: string;
  assignedTechnician?: string;
  assignedTechnicianId?: string;
  assignedTechnicianPhone?: string;
  assignedTechnicianEmail?: string;
  techResponseStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  techNotes?: string;
  techResponseDate?: string;
  status: ServiceStatus;
  createdAt: string;
}

export type RepairPriority = 'Normal' | 'Urgent';
export type RepairStatus = 'Received' | 'Queued' | 'Technician Dispatched' | 'Accepted' | 'En-Route' | 'On-Site' | 'Resolved' | 'Rejected';

export interface RepairRequest {
  id: string;
  requestNumber: string;
  userId?: string;
  customerName: string;
  phone: string;
  region: string;
  equipmentType: string;
  description: string;
  priority: RepairPriority;
  hasPhoto: boolean;
  photoUrl?: string;
  assignedTechnician?: string;
  assignedTechnicianId?: string;
  assignedTechnicianPhone?: string;
  assignedTechnicianEmail?: string;
  techResponseStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  techNotes?: string;
  techResponseDate?: string;
  status: RepairStatus;
  createdAt: string;
}

export type PaymentMethod =
  | 'M-Pesa'
  | 'Airtel Money'
  | 'Tigo Pesa'
  | 'HaloPesa'
  | 'Bank Transfer (CRDB / NMB)'
  | 'Pay on Delivery';

export type OrderStatus =
  | 'Pending Payment'
  | 'Payment Confirmed'
  | 'Packed at Branch'
  | 'Out for Delivery'
  | 'In Transit'
  | 'Delivered'
  | 'Cancelled';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItemSummary {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceTzs: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  invoiceNumber: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  region: string;
  district?: string;
  paymentMethod: PaymentMethod;
  paymentRef?: string;
  paymentPhone?: string;
  transactionRef?: string;
  items: CartItem[];
  subtotalTzs?: number;
  discountTzs?: number;
  totalAmountTzs?: number;
  subtotal?: number;
  deliveryFee?: number;
  discountAmount?: number;
  totalAmount?: number;
  status: OrderStatus;
  driverName?: string;
  driverPhone?: string;
  driverVehicle?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  assignedVehicle?: string;
  deliveryProofUrl?: string;
  createdAt: string;
}

export interface Warranty {
  id: string;
  userId?: string;
  serialNumber: string;
  productName: string;
  customerName?: string;
  customerPhone?: string;
  purchaseDate: string;
  expiryDate: string;
  warrantyPeriod?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CLAIM_PENDING' | 'REPLACED' | 'Active' | 'Claim Filed' | 'Replaced / Repaired';
}

export interface WarrantyClaim {
  id: string;
  claimNumber: string;
  warrantyId: string;
  userId?: string;
  productName: string;
  customerName: string;
  customerPhone: string;
  issueDescription: string;
  status: 'Under Inspection' | 'APPROVED' | 'REJECTED' | 'Approved' | 'Rejected';
  adminNotes?: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  workingHours?: string;
  managerName?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  isHeadquarters?: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  titleSw: string;
  message: string;
  messageSw: string;
  type: 'order' | 'service' | 'repair' | 'promo' | 'system';
  isRead: boolean;
  createdAt: string;
}

export interface ApplianceLoad {
  id: string;
  name: string;
  nameSw?: string;
  defaultWatts: number;
  quantity?: number;
  hoursPerDay?: number;
  category?: string;
}
