export type UserRole = "owner" | "admin" | "technician" | "cashier";

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  phone: string;
  email?: string;
  status: "active" | "inactive";
  avatar?: string;
  specialization?: string;
  notes?: string;
}

export type ServiceStatus =
  | "received"
  | "diagnosing"
  | "waiting_approval"
  | "in_progress"
  | "ready"
  | "completed"
  | "cancelled";

export interface ServicePart {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export interface ServiceTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deviceType: "laptop" | "pc" | "printer" | "monitor" | "other";
  deviceBrandModel: string;
  serialNumber?: string;
  complaints: string;
  accessories: string;
  technicianNotes?: string;
  status: ServiceStatus;
  technicianName: string;
  estimatedCost: number;
  finalCost: number;
  downPayment: number;
  partsUsed: ServicePart[];
  warrantyDays: number;
  warrantyUntil?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  pickupDate?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: "komponen_pc" | "part_laptop" | "aksesoris" | "jasa";
  costPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  description?: string;
}

export interface CartItem {
  id: string;
  productId?: string;
  name: string;
  price: number;
  qty: number;
  subtotal: number;
  isService?: boolean;
  serviceTicketId?: string;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "qris" | "transfer";
  amountPaid: number;
  change: number;
  cashierName: string;
  notes?: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  whatsapp: string;
  receiptFooter: string;
  warrantyTerms: string;
}

export interface DashboardStats {
  totalRevenue: number;
  activeServices: number;
  readyServices: number;
  completedServices: number;
  lowStockCount: number;
  totalProducts: number;
  revenueChart: { name: string; pos: number; service: number; total: number }[];
  deviceCounts: { laptop: number; pc: number; printer: number; other: number };
}
