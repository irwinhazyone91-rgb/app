export type UserRole = "owner" | "admin" | "technician" | "cashier";

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  pin?: string;
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

export type ProductCategory =
  | "laptop_baru"
  | "laptop_bekas"
  | "komponen_pc"
  | "part_laptop"
  | "aksesoris"
  | "jasa";

export interface Product {
  id: string;
  code: string;
  name: string;
  category: ProductCategory;
  costPrice: number;
  sellPrice: number; // Harga Konsumen Biasa / Retail
  resellerPrice?: number; // Harga Reseller / Grosir / Mitra Teknisi
  warrantyDays: number; // Masa Garansi dalam Hari (0 = Tanpa Garansi, 7, 30, 90, 365, dll)
  stock: number;
  minStock: number;
  unit: string;
  description?: string;

  // Spesifikasi Detail (Khusus Laptop Baru, Laptop Bekas & Komponen)
  processor?: string;
  ram?: string;
  storage?: string;
  graphics?: string;
  screenSize?: string;
  conditionGrade?: string; // misal: "Baru BNIB 100%", "Mulus Grade A 98%", "Grade B (Lecet Pemakaian)"
  batteryHealth?: string; // misal: "Normal 100% / Awet 4-6 Jam"
  includes?: string; // Kelengkapan: misal "Unit + Charger Original + Tas Laptop + Dus Box"
}

export interface CartItem {
  id: string;
  productId?: string;
  name: string;
  price: number;
  regularPrice?: number;
  resellerPrice?: number;
  priceType?: "regular" | "reseller";
  qty: number;
  subtotal: number;
  isService?: boolean;
  serviceTicketId?: string;
  warrantyDays?: number;
  specsSummary?: string;
  conditionGrade?: string;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerType?: "regular" | "reseller";
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

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  email?: string;
  type?: "regular" | "reseller";
  notes?: string;
  createdAt: string;
  updatedAt: string;
  totalServicesCount?: number;
  totalTransactionsCount?: number;
  totalSpent?: number;
}

export type ExpenseCategory =
  | "listrik_internet"
  | "sewa_tempat"
  | "gaji_karyawan"
  | "alat_servis"
  | "operasional"
  | "transport_logistik"
  | "konsumsi"
  | "lainnya";

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  recordedBy: string;
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
  defaultThermalSize?: "58mm" | "80mm";
}

export interface DashboardStats {
  totalRevenue: number;
  activeServices: number;
  readyServices: number;
  completedServices: number;
  lowStockCount: number;
  totalProducts: number;
  totalCustomers: number;
  revenueChart: { name: string; pos: number; service: number; total: number }[];
  deviceCounts: { laptop: number; pc: number; printer: number; other: number };
}

export type PrintFormat = "continuous" | "sticker_58mm" | "thermal_58mm" | "thermal_80mm" | "thermal";
