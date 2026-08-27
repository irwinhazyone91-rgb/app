import express, { Request, Response } from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));

// Persistent File Storage Location (Local or Serverless fallback)
const DATA_DIR = process.env.NODE_ENV === "production" && process.env.VERCEL 
  ? "/tmp/servisku_data" 
  : path.join(process.cwd(), "data");

const DB_FILE = path.join(DATA_DIR, "db.json");

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    // Silent fallback
  }
}

// In-Memory Data Models
export interface ServicePart {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export type ServiceStatus = 
  | "received"
  | "diagnosing"
  | "waiting_approval"
  | "in_progress"
  | "ready"
  | "completed"
  | "cancelled";

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
  accessories: string; // e.g. "Charger Original, Tas Laptop"
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
  sellPrice: number;
  resellerPrice?: number;
  warrantyDays: number;
  stock: number;
  minStock: number;
  unit: string;
  description?: string;
  processor?: string;
  ram?: string;
  storage?: string;
  graphics?: string;
  screenSize?: string;
  conditionGrade?: string;
  batteryHealth?: string;
  includes?: string;
}

export interface TransactionItem {
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
  items: TransactionItem[];
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

// Initial Seed Data
let users: User[] = [
  {
    id: "usr-1",
    name: "H. Suwandi",
    username: "owner",
    password: "password123",
    pin: "123456",
    role: "owner",
    phone: "081234567890",
    email: "suwandi@servisku.com",
    status: "active",
    specialization: "Owner & Manajemen Utama",
    notes: "Pemilik Toko - Akses penuh seluruh modul & laporan keuangan"
  },
  {
    id: "usr-2",
    name: "Bambang Kurniawan",
    username: "admin",
    password: "password123",
    pin: "123456",
    role: "admin",
    phone: "085611223344",
    email: "bambang@servisku.com",
    status: "active",
    specialization: "Operasional & Stok",
    notes: "Admin Toko - Penerimaan servis, stok sparepart & operasional harian"
  },
  {
    id: "usr-3",
    name: "Rian Prasetyo",
    username: "rian_tech",
    password: "password123",
    pin: "123456",
    role: "technician",
    phone: "087799887766",
    email: "rian@servisku.com",
    status: "active",
    specialization: "Motherboard, IC Power & Chipset",
    notes: "Senior Hardware Specialist"
  },
  {
    id: "usr-4",
    name: "Agus Pratama",
    username: "agus_tech",
    password: "password123",
    pin: "123456",
    role: "technician",
    phone: "089655443322",
    email: "agus@servisku.com",
    status: "active",
    specialization: "Laptop Screen, Keyboard & PC Build",
    notes: "Teknisi Perakitan & Instalasi Sistem"
  },
  {
    id: "usr-5",
    name: "Maya Anggraini",
    username: "maya_kasir",
    password: "password123",
    pin: "123456",
    role: "cashier",
    phone: "081322334455",
    email: "maya@servisku.com",
    status: "active",
    specialization: "Front Office & Transaksi POS",
    notes: "Kasir & Pelayanan Pelanggan"
  }
];

let storeSettings: StoreSettings = {
  storeName: "ServisKu Computer",
  tagline: "Pusat Service Komputer, Laptop & Penjualan Sparepart",
  address: "Jl. Pemuda No. 88, Kota Semarang, Jawa Tengah",
  phone: "024-87654321",
  whatsapp: "6281234567890",
  receiptFooter: "Terima kasih atas kepercayaan Anda. Harap simpan nota ini sebagai bukti garansi yang sah.",
  warrantyTerms: "Garansi servis berlaku sesuai catatan nota. Tidak berlaku untuk kerusakan fisik, terkena cairan, atau segel rusak."
};

let products: Product[] = [
  {
    id: "prod-lp-1",
    code: "LPT-BARU-ASUS-O14",
    name: "Laptop ASUS Vivobook 14 A1404ZA Core i3-1215U (Baru)",
    category: "laptop_baru",
    costPrice: 5850000,
    sellPrice: 6500000,
    resellerPrice: 6150000,
    warrantyDays: 730,
    stock: 4,
    minStock: 1,
    unit: "Unit",
    description: "Laptop Baru Garansi Resmi ASUS Indonesia 2 Tahun. Layar NanoEdge FHD IPS Anti-Glare.",
    processor: "Intel Core i3-1215U (6 Core 8 Thread up to 4.4GHz)",
    ram: "8GB DDR4 3200MHz (Upgradable)",
    storage: "512GB M.2 NVMe PCIe 3.0 SSD",
    graphics: "Intel UHD Graphics",
    screenSize: "14.0\" FHD (1920x1080) IPS-Level 250nits",
    conditionGrade: "Baru Segel BNIB 100%",
    batteryHealth: "Baterai Baru 42WHrs (Awet 6-8 Jam)",
    includes: "Unit Laptop, Charger Original 45W, Tas Backpack ASUS, Dus Box & Kartu Garansi"
  },
  {
    id: "prod-lp-2",
    code: "LPT-BARU-LENOVO-IP3",
    name: "Laptop Lenovo IdeaPad Slim 3 Ryzen 5 7520U 16GB (Baru)",
    category: "laptop_baru",
    costPrice: 7100000,
    sellPrice: 7950000,
    resellerPrice: 7500000,
    warrantyDays: 730,
    stock: 3,
    minStock: 1,
    unit: "Unit",
    description: "Laptop Baru Performa Tinggi untuk Kerja & Mahasiswa. Garansi Resmi Lenovo 2 Tahun + ADP.",
    processor: "AMD Ryzen 5 7520U (4 Core 8 Thread up to 4.3GHz)",
    ram: "16GB LPDDR5 5500MHz Dual Channel",
    storage: "512GB SSD NVMe PCIe 4.0",
    graphics: "AMD Radeon 610M Graphics",
    screenSize: "14.0\" FHD (1920x1080) IPS 300nits Anti-glare",
    conditionGrade: "Baru Segel BNIB 100%",
    batteryHealth: "Baterai Baru 47WHrs Rapid Charge",
    includes: "Unit Laptop, Charger Lenovo Type-C, Tas Lenovo Original, Dus Box & Buku Panduan"
  },
  {
    id: "prod-lp-3",
    code: "LPT-BKS-THINKPAD-T480",
    name: "Laptop Lenovo ThinkPad T480 Core i5-8350U RAM 16GB (Bekas Mulus)",
    category: "laptop_bekas",
    costPrice: 2800000,
    sellPrice: 3500000,
    resellerPrice: 3100000,
    warrantyDays: 30,
    stock: 5,
    minStock: 1,
    unit: "Unit",
    description: "Laptop Bisnis Militer Super Tangguh & Awet. Body Kokoh Mulus Grade A 95%. Garansi Toko 1 Bulan.",
    processor: "Intel Core i5-8350U vPro (4 Core 8 Thread up to 3.6GHz)",
    ram: "16GB DDR4 Dual Channel",
    storage: "256GB SSD NVMe High Speed",
    graphics: "Intel UHD Graphics 620",
    screenSize: "14.0\" Full HD IPS (1920x1080) Anti-Glare",
    conditionGrade: "Bekas Mulus Grade A (Kondisi Fisik 95%)",
    batteryHealth: "Dual Baterai Sehat 88% (Awet 3-4 Jam)",
    includes: "Unit ThinkPad, Charger Original Type-C, Kabel Power, Bonus Tas Softcase"
  },
  {
    id: "prod-lp-4",
    code: "LPT-BKS-DELL-LAT7490",
    name: "Laptop Dell Latitude 7490 Core i7-8650U SSD 512GB (Bekas)",
    category: "laptop_bekas",
    costPrice: 3200000,
    sellPrice: 4100000,
    resellerPrice: 3600000,
    warrantyDays: 30,
    stock: 2,
    minStock: 1,
    unit: "Unit",
    description: "Laptop Flagship Tipis Ringan Carbon Fiber Keyboard Backlight. Kondisi Istimewa Siap Pakai.",
    processor: "Intel Core i7-8650U (4 Core 8 Thread up to 4.2GHz)",
    ram: "16GB DDR4 2400MHz",
    storage: "512GB SSD NVMe PCIe",
    graphics: "Intel UHD Graphics 620",
    screenSize: "14.0\" FHD (1920x1080) Anti-Glare WVA",
    conditionGrade: "Bekas Mulus Grade A- 93%",
    batteryHealth: "Normal 85% (Awet 3-4 Jam)",
    includes: "Unit Dell, Charger Original Dell, Tas Jinjing"
  },
  {
    id: "prod-1",
    code: "SSD-NVME-512",
    name: "SSD NVMe M.2 512GB Kingston NV2 Gen4",
    category: "komponen_pc",
    costPrice: 420000,
    sellPrice: 550000,
    resellerPrice: 480000,
    warrantyDays: 1095,
    stock: 12,
    minStock: 3,
    unit: "Unit",
    description: "Read speed up to 3500MB/s, garansi resmi 3 tahun"
  },
  {
    id: "prod-2",
    code: "RAM-DDR4-8GB-NB",
    name: "RAM Sodimm DDR4 8GB 3200MHz Kingston / Samsung",
    category: "part_laptop",
    costPrice: 210000,
    sellPrice: 300000,
    resellerPrice: 250000,
    warrantyDays: 365,
    stock: 15,
    minStock: 4,
    unit: "Keping",
    description: "Untuk upgrade laptop DDR4 standard 1.2V"
  },
  {
    id: "prod-3",
    code: "LCD-14-SLIM-30",
    name: "LED Laptop 14.0 Slim 30 Pin FHD IPS",
    category: "part_laptop",
    costPrice: 580000,
    sellPrice: 750000,
    resellerPrice: 650000,
    warrantyDays: 90,
    stock: 4,
    minStock: 2,
    unit: "Pcs",
    description: "Resolusi 1920x1080 FHD, connector 30 pin tanpa kuping"
  },
  {
    id: "prod-4",
    code: "THM-TF7",
    name: "Thermal Paste Thermalright TF7 2g",
    category: "komponen_pc",
    costPrice: 45000,
    sellPrice: 75000,
    resellerPrice: 55000,
    warrantyDays: 0,
    stock: 20,
    minStock: 5,
    unit: "Tube",
    description: "Thermal conductivity 12.8 W/m.k"
  },
  {
    id: "prod-5",
    code: "KB-ASUS-X441",
    name: "Keyboard Laptop Asus X441 X441U X441N",
    category: "part_laptop",
    costPrice: 85000,
    sellPrice: 150000,
    resellerPrice: 110000,
    warrantyDays: 30,
    stock: 6,
    minStock: 2,
    unit: "Pcs",
    description: "Layout US standard black"
  },
  {
    id: "prod-6",
    code: "CHG-TYPEC-65W",
    name: "Charger Adaptor Laptop Universal Type-C 65W GaN",
    category: "aksesoris",
    costPrice: 130000,
    sellPrice: 220000,
    resellerPrice: 175000,
    warrantyDays: 90,
    stock: 8,
    minStock: 2,
    unit: "Pcs",
    description: "Support Power Delivery 3.0 Lenovo/HP/Asus/MacBook"
  },
  {
    id: "prod-7",
    code: "SRV-INST-WIN",
    name: "Jasa Install Ulang Windows 10/11 + Full App Office & Utility",
    category: "jasa",
    costPrice: 0,
    sellPrice: 75000,
    resellerPrice: 50000,
    warrantyDays: 7,
    stock: 999,
    minStock: 0,
    unit: "Jasa",
    description: "Termasuk driver terbaru, aktivasi & backup data sistem"
  },
  {
    id: "prod-8",
    code: "SRV-CLN-REP",
    name: "Jasa Deep Cleaning Fan Heatsink + Repaste Thermal Pasta Laptop/PC",
    category: "jasa",
    costPrice: 10000,
    sellPrice: 100000,
    resellerPrice: 70000,
    warrantyDays: 14,
    stock: 999,
    minStock: 0,
    unit: "Jasa",
    description: "Mengatasi panas berlebih/overheating & kipas berisik"
  },
  {
    id: "prod-9",
    code: "SRV-MB-REP",
    name: "Jasa Servis Motherboard / IC Power / Mati Total",
    category: "jasa",
    costPrice: 50000,
    sellPrice: 350000,
    resellerPrice: 250000,
    warrantyDays: 30,
    stock: 999,
    minStock: 0,
    unit: "Jasa",
    description: "Pengerjaan tracing short, reballing/ganti IC charging/IO"
  }
];

let serviceTickets: ServiceTicket[] = [
  {
    id: "srv-001",
    ticketNumber: "SRV-202508-001",
    customerName: "Budi Santoso",
    customerPhone: "081234567890",
    customerAddress: "Jl. Gajahmungkur Barat No. 12",
    deviceType: "laptop",
    deviceBrandModel: "Asus Vivobook 14 A412DA",
    serialNumber: "SN-AS412-99812",
    complaints: "Layar blank hitam saat dinyalakan, lampu indikator power nyala. Kipas berputar kencang.",
    accessories: "Unit Laptop, Adaptor Original 45W, Softcase",
    technicianNotes: "Sudah dicek RAM kotor, setelah dibersihkan dan re-flash BIOS unit kembali normal nyala normal. Perlu repaste.",
    status: "ready",
    technicianName: "Rian (Senior Tech)",
    estimatedCost: 200000,
    finalCost: 175000,
    downPayment: 50000,
    partsUsed: [
      { id: "part-1", name: "Jasa Flash BIOS & Maintenance Internal", price: 100000, qty: 1 },
      { id: "part-2", name: "Thermal Paste Thermalright TF7", price: 75000, qty: 1 }
    ],
    warrantyDays: 30,
    warrantyUntil: "2026-09-24",
    createdAt: "2026-08-20T10:30:00.000Z",
    updatedAt: "2026-08-24T14:15:00.000Z"
  },
  {
    id: "srv-002",
    ticketNumber: "SRV-202508-002",
    customerName: "Dewi Anggraini",
    customerPhone: "085698712345",
    customerAddress: "Perumahan Banyumanik Indah B-4",
    deviceType: "laptop",
    deviceBrandModel: "Lenovo Ideapad Slim 3 14ALC6",
    serialNumber: "SN-LN882190",
    complaints: "Keyboard beberapa tombol huruf (A, S, D, Space) macet tidak berfungsi setelah ketumpahan air sedikit.",
    accessories: "Unit Laptop, Charger Lenovo 65W",
    technicianNotes: "Jalur keyboard korosi. Rekomendasi ganti 1 set keyboard internal.",
    status: "in_progress",
    technicianName: "Agus Pratama",
    estimatedCost: 350000,
    finalCost: 350000,
    downPayment: 100000,
    partsUsed: [
      { id: "part-3", name: "Keyboard Lenovo Slim 3 Original", price: 250000, qty: 1 },
      { id: "part-4", name: "Jasa Pasang & Pembersihan Jalur Korosi", price: 100000, qty: 1 }
    ],
    warrantyDays: 60,
    createdAt: "2026-08-22T09:10:00.000Z",
    updatedAt: "2026-08-25T11:00:00.000Z"
  },
  {
    id: "srv-003",
    ticketNumber: "SRV-202508-003",
    customerName: "Ahmad Rizky",
    customerPhone: "087812903456",
    customerAddress: "Jl. Pandanaran No. 45 Semarang",
    deviceType: "pc",
    deviceBrandModel: "PC Gaming Core i5 12400F + RTX 3060",
    serialNumber: "CUSTOM-DESKTOP",
    complaints: "Sering restart sendiri saat main game berat (Cyberpunk / Valorant). Suhu prosesor tembus 95 derajat.",
    accessories: "Hanya CPU Tower (tanpa kabel)",
    technicianNotes: "Sedang proses stress test dan pembersihan AIO Liquid Cooler.",
    status: "diagnosing",
    technicianName: "Rian (Senior Tech)",
    estimatedCost: 150000,
    finalCost: 0,
    downPayment: 0,
    partsUsed: [],
    warrantyDays: 30,
    createdAt: "2026-08-25T08:20:00.000Z",
    updatedAt: "2026-08-25T13:45:00.000Z"
  },
  {
    id: "srv-004",
    ticketNumber: "SRV-202508-004",
    customerName: "Siti Rahmawati",
    customerPhone: "081399887766",
    customerAddress: "Jl. MT Haryono No. 102",
    deviceType: "laptop",
    deviceBrandModel: "Acer Aspire 3 A314",
    serialNumber: "SN-ACER-10294",
    complaints: "Upgrade dari HDD lambat ke SSD NVMe 512GB + Install Windows 11 Full.",
    accessories: "Unit Laptop + Charger Acer",
    technicianNotes: "Sudah selesai dipasang Kingston NV2 512GB, install Windows 11 aktif, boot dalam 7 detik. Sudah diambil pelanggan.",
    status: "completed",
    technicianName: "Agus Pratama",
    estimatedCost: 625000,
    finalCost: 625000,
    downPayment: 200000,
    partsUsed: [
      { id: "part-5", name: "SSD NVMe M.2 512GB Kingston NV2", price: 550000, qty: 1 },
      { id: "part-6", name: "Jasa Install Windows & Migrasi Data", price: 75000, qty: 1 }
    ],
    warrantyDays: 90,
    warrantyUntil: "2026-11-20",
    createdAt: "2026-08-18T11:00:00.000Z",
    updatedAt: "2026-08-19T16:30:00.000Z",
    completedAt: "2026-08-19T16:30:00.000Z",
    pickupDate: "2026-08-20T10:00:00.000Z"
  }
];

let transactions: Transaction[] = [
  {
    id: "tx-001",
    invoiceNumber: "INV-202608-001",
    date: "2026-08-24T15:20:00.000Z",
    customerName: "Hendro Wibowo",
    customerPhone: "081299988877",
    items: [
      {
        id: "item-1",
        productId: "prod-6",
        name: "Charger Adaptor Laptop Universal Type-C 65W GaN",
        price: 220000,
        qty: 1,
        subtotal: 220000
      },
      {
        id: "item-2",
        productId: "prod-4",
        name: "Thermal Paste Thermalright TF7 2g",
        price: 75000,
        qty: 1,
        subtotal: 75000
      }
    ],
    subtotal: 295000,
    discount: 15000,
    tax: 0,
    total: 280000,
    paymentMethod: "qris",
    amountPaid: 280000,
    change: 0,
    cashierName: "Admin Kasir",
    notes: "Pembelian langsung aksesoris"
  },
  {
    id: "tx-002",
    invoiceNumber: "INV-202608-002",
    date: "2026-08-20T10:00:00.000Z",
    customerName: "Siti Rahmawati",
    customerPhone: "081399887766",
    items: [
      {
        id: "item-3",
        serviceTicketId: "srv-004",
        name: "Pelunasan Servis SRV-202508-004 (Upgrade SSD + Install OS Acer Aspire 3)",
        price: 425000,
        qty: 1,
        subtotal: 425000,
        isService: true
      }
    ],
    subtotal: 425000,
    discount: 0,
    tax: 0,
    total: 425000,
    paymentMethod: "cash",
    amountPaid: 450000,
    change: 25000,
    cashierName: "Admin Kasir",
    notes: "Pelunasan sisa biaya servis setelah DP Rp 200.000"
  }
];

// Initial Load from Disk if exists
function loadFromDisk() {
  try {
    ensureDataDir();
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.users && Array.isArray(parsed.users)) users = parsed.users;
      if (parsed.storeSettings && typeof parsed.storeSettings === "object") storeSettings = parsed.storeSettings;
      if (parsed.products && Array.isArray(parsed.products)) products = parsed.products;
      if (parsed.serviceTickets && Array.isArray(parsed.serviceTickets)) serviceTickets = parsed.serviceTickets;
      if (parsed.transactions && Array.isArray(parsed.transactions)) transactions = parsed.transactions;
      console.log("ServisKu Database loaded successfully from disk:", DB_FILE);
    } else {
      saveToDisk();
    }
  } catch (e) {
    console.warn("Could not read persistent DB file, using default state:", e);
  }
}

function saveToDisk() {
  try {
    ensureDataDir();
    const data = {
      users,
      storeSettings,
      products,
      serviceTickets,
      transactions,
      lastSaved: new Date().toISOString()
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    // Silently fallback if disk is read-only
  }
}

// Initialize on startup
loadFromDisk();

// --- ROUTES ---

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), dbReady: true });
});

// Full DB Backup Export
app.get("/api/backup/export", (req: Request, res: Response) => {
  res.json({
    appName: "ServisKu Computer",
    version: "1.0",
    exportDate: new Date().toISOString(),
    users,
    storeSettings,
    products,
    serviceTickets,
    transactions
  });
});

// Full DB Restore Import
app.post("/api/backup/import", (req: Request, res: Response) => {
  try {
    const { users: newUsers, storeSettings: newSettings, products: newProducts, serviceTickets: newTickets, transactions: newTx } = req.body;
    if (Array.isArray(newUsers)) users = newUsers;
    if (newSettings && typeof newSettings === "object") storeSettings = newSettings;
    if (Array.isArray(newProducts)) products = newProducts;
    if (Array.isArray(newTickets)) serviceTickets = newTickets;
    if (Array.isArray(newTx)) transactions = newTx;

    saveToDisk();
    res.json({ success: true, message: "Database berhasil dipulihkan!" });
  } catch (e: any) {
    res.status(400).json({ error: "Format data backup tidak valid", details: e.message });
  }
});

// Settings
app.get("/api/settings", (req: Request, res: Response) => {
  res.json(storeSettings);
});

app.put("/api/settings", (req: Request, res: Response) => {
  storeSettings = { ...storeSettings, ...req.body };
  saveToDisk();
  res.json({ success: true, settings: storeSettings });
});

// Users / Staff Management
app.get("/api/users", (req: Request, res: Response) => {
  const { role, status, search } = req.query;
  let result = [...users];

  if (role && role !== "all") {
    result = result.filter((u) => u.role === role);
  }

  if (status && status !== "all") {
    result = result.filter((u) => u.status === status);
  }

  if (search && typeof search === "string") {
    const q = search.toLowerCase();
    result = result.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (u.specialization && u.specialization.toLowerCase().includes(q))
    );
  }

  res.json(result);
});

app.post("/api/users", (req: Request, res: Response) => {
  const newUser: User = {
    id: `usr-${Date.now()}`,
    name: req.body.name,
    username: req.body.username || req.body.name.toLowerCase().replace(/\s+/g, "_"),
    password: req.body.password || req.body.pin || "123456",
    pin: req.body.pin || req.body.password || "123456",
    role: req.body.role || "technician",
    phone: req.body.phone || "-",
    email: req.body.email || "",
    status: req.body.status || "active",
    specialization: req.body.specialization || "",
    notes: req.body.notes || ""
  };

  users.push(newUser);
  saveToDisk();
  res.status(201).json(newUser);
});

app.put("/api/users/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Pengguna tidak ditemukan" });
  }

  users[index] = {
    ...users[index],
    ...req.body
  };

  saveToDisk();
  res.json(users[index]);
});

app.delete("/api/users/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  // Prevent deleting the owner
  const targetUser = users.find((u) => u.id === id);
  if (targetUser && targetUser.role === "owner" && users.filter((u) => u.role === "owner").length <= 1) {
    return res.status(400).json({ error: "Akun Pemilik Toko utama tidak dapat dihapus!" });
  }

  users = users.filter((u) => u.id !== id);
  saveToDisk();
  res.json({ success: true, message: "Pengguna berhasil dihapus" });
});

// Products & Inventory
app.get("/api/products", (req: Request, res: Response) => {
  const { category, search } = req.query;
  let result = [...products];

  if (category && category !== "all") {
    result = result.filter((p) => p.category === category);
  }

  if (search && typeof search === "string") {
    const q = search.toLowerCase();
    result = result.filter(
      (p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
    );
  }

  res.json(result);
});

app.post("/api/products", (req: Request, res: Response) => {
  const newProduct: Product = {
    id: req.body.id || `prod-${Date.now()}`,
    code: req.body.code || `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
    name: req.body.name,
    category: req.body.category || "komponen_pc",
    costPrice: Number(req.body.costPrice) || 0,
    sellPrice: Number(req.body.sellPrice) || 0,
    resellerPrice: req.body.resellerPrice !== undefined ? Number(req.body.resellerPrice) : undefined,
    warrantyDays: Number(req.body.warrantyDays) || 0,
    stock: Number(req.body.stock) || 0,
    minStock: Number(req.body.minStock) || 2,
    unit: req.body.unit || "Pcs",
    description: req.body.description || "",
    processor: req.body.processor || "",
    ram: req.body.ram || "",
    storage: req.body.storage || "",
    graphics: req.body.graphics || "",
    screenSize: req.body.screenSize || "",
    conditionGrade: req.body.conditionGrade || "",
    batteryHealth: req.body.batteryHealth || "",
    includes: req.body.includes || ""
  };

  products.unshift(newProduct);
  saveToDisk();
  res.status(201).json(newProduct);
});

app.put("/api/products/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Produk tidak ditemukan" });
  }

  products[index] = {
    ...products[index],
    ...req.body,
    costPrice: Number(req.body.costPrice ?? products[index].costPrice),
    sellPrice: Number(req.body.sellPrice ?? products[index].sellPrice),
    resellerPrice: req.body.resellerPrice !== undefined ? Number(req.body.resellerPrice) : products[index].resellerPrice,
    warrantyDays: Number(req.body.warrantyDays ?? products[index].warrantyDays ?? 0),
    stock: Number(req.body.stock ?? products[index].stock),
    minStock: Number(req.body.minStock ?? products[index].minStock)
  };

  saveToDisk();
  res.json(products[index]);
});

app.delete("/api/products/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  products = products.filter((p) => p.id !== id);
  saveToDisk();
  res.json({ success: true, message: "Produk berhasil dihapus" });
});

// Services / Service Tickets
app.get("/api/services", (req: Request, res: Response) => {
  const { status, search } = req.query;
  let result = [...serviceTickets];

  if (status && status !== "all") {
    result = result.filter((s) => s.status === status);
  }

  if (search && typeof search === "string") {
    const q = search.toLowerCase();
    result = result.filter(
      (s) =>
        s.ticketNumber.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.customerPhone.includes(q) ||
        s.deviceBrandModel.toLowerCase().includes(q) ||
        (s.serialNumber && s.serialNumber.toLowerCase().includes(q))
    );
  }

  res.json(result);
});

// Public Tracking by Ticket Number or Phone
app.get("/api/services/track/:query", (req: Request, res: Response) => {
  const q = req.params.query.trim().toLowerCase();
  const cleanPhone = q.replace(/[^0-9]/g, "");

  const match = serviceTickets.find((s) => {
    const matchTicket = s.ticketNumber.toLowerCase() === q;
    const matchPhone = cleanPhone && s.customerPhone.replace(/[^0-9]/g, "").includes(cleanPhone);
    const matchSerial = s.serialNumber && s.serialNumber.toLowerCase() === q;
    return matchTicket || matchPhone || matchSerial;
  });

  if (!match) {
    return res.status(404).json({ error: "Data servis tidak ditemukan. Mohon periksa kembali Nomor Tiket atau No. WhatsApp Anda." });
  }

  res.json(match);
});

app.get("/api/services/:id", (req: Request, res: Response) => {
  const ticket = serviceTickets.find((s) => s.id === req.params.id || s.ticketNumber === req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: "Tiket servis tidak ditemukan" });
  }
  res.json(ticket);
});

app.post("/api/services", (req: Request, res: Response) => {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const count = serviceTickets.length + 1;
  const ticketNumber = req.body.ticketNumber || `SRV-${yearMonth}-${String(count).padStart(3, "0")}`;

  const newTicket: ServiceTicket = {
    id: req.body.id || `srv-${Date.now()}`,
    ticketNumber,
    customerName: req.body.customerName,
    customerPhone: req.body.customerPhone,
    customerAddress: req.body.customerAddress || "",
    deviceType: req.body.deviceType || "laptop",
    deviceBrandModel: req.body.deviceBrandModel,
    serialNumber: req.body.serialNumber || "",
    complaints: req.body.complaints,
    accessories: req.body.accessories || "Unit Saja",
    technicianNotes: req.body.technicianNotes || "",
    status: req.body.status || "received",
    technicianName: req.body.technicianName || "Teknisi Utama",
    estimatedCost: Number(req.body.estimatedCost) || 0,
    finalCost: Number(req.body.finalCost) || 0,
    downPayment: Number(req.body.downPayment) || 0,
    partsUsed: req.body.partsUsed || [],
    warrantyDays: Number(req.body.warrantyDays) || 30,
    createdAt: req.body.createdAt || now.toISOString(),
    updatedAt: req.body.updatedAt || now.toISOString()
  };

  serviceTickets.unshift(newTicket);
  saveToDisk();
  res.status(201).json(newTicket);
});

app.put("/api/services/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const index = serviceTickets.findIndex((s) => s.id === id || s.ticketNumber === id);
  if (index === -1) {
    return res.status(404).json({ error: "Tiket servis tidak ditemukan" });
  }

  const updated = {
    ...serviceTickets[index],
    ...req.body,
    estimatedCost: Number(req.body.estimatedCost ?? serviceTickets[index].estimatedCost),
    finalCost: Number(req.body.finalCost ?? serviceTickets[index].finalCost),
    downPayment: Number(req.body.downPayment ?? serviceTickets[index].downPayment),
    warrantyDays: Number(req.body.warrantyDays ?? serviceTickets[index].warrantyDays),
    updatedAt: new Date().toISOString()
  };

  if (req.body.status === "completed" && !updated.completedAt) {
    updated.completedAt = new Date().toISOString();
    if (updated.warrantyDays > 0) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + updated.warrantyDays);
      updated.warrantyUntil = expDate.toISOString().split("T")[0];
    }
  }

  serviceTickets[index] = updated;
  saveToDisk();
  res.json(updated);
});

app.delete("/api/services/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  serviceTickets = serviceTickets.filter((s) => s.id !== id && s.ticketNumber !== id);
  saveToDisk();
  res.json({ success: true, message: "Tiket servis berhasil dihapus" });
});

// Transactions / POS
app.get("/api/transactions", (req: Request, res: Response) => {
  res.json(transactions);
});

app.post("/api/transactions", (req: Request, res: Response) => {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const count = transactions.length + 1;
  const invoiceNumber = req.body.invoiceNumber || `INV-${yearMonth}-${String(count).padStart(3, "0")}`;

  const items: TransactionItem[] = req.body.items || [];
  
  // Deduct inventory stock for product items and complete service tickets if applicable
  for (const item of items) {
    if (item.productId) {
      const pIndex = products.findIndex((p) => p.id === item.productId);
      if (pIndex !== -1 && products[pIndex].category !== "jasa") {
        products[pIndex].stock = Math.max(0, products[pIndex].stock - (item.qty || 1));
      }
    }
    if (item.isService && item.serviceTicketId) {
      const sIndex = serviceTickets.findIndex((s) => s.id === item.serviceTicketId || s.ticketNumber === item.serviceTicketId);
      if (sIndex !== -1) {
        serviceTickets[sIndex].status = "completed";
        serviceTickets[sIndex].completedAt = now.toISOString();
        serviceTickets[sIndex].finalCost = item.subtotal;
        if (serviceTickets[sIndex].warrantyDays > 0) {
          const expDate = new Date();
          expDate.setDate(expDate.getDate() + serviceTickets[sIndex].warrantyDays);
          serviceTickets[sIndex].warrantyUntil = expDate.toISOString().split("T")[0];
        }
      }
    }
  }

  const newTx: Transaction = {
    id: req.body.id || `tx-${Date.now()}`,
    invoiceNumber,
    date: req.body.date || now.toISOString(),
    customerName: req.body.customerName || "Pelanggan Umum",
    customerPhone: req.body.customerPhone || "-",
    items,
    subtotal: Number(req.body.subtotal) || 0,
    discount: Number(req.body.discount) || 0,
    tax: Number(req.body.tax) || 0,
    total: Number(req.body.total) || 0,
    paymentMethod: req.body.paymentMethod || "cash",
    amountPaid: Number(req.body.amountPaid) || 0,
    change: Number(req.body.change) || 0,
    cashierName: req.body.cashierName || "Kasir",
    notes: req.body.notes || ""
  };

  transactions.unshift(newTx);
  saveToDisk();
  res.status(201).json(newTx);
});

app.delete("/api/transactions/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const { restoreStock, restoreTicket } = req.query;
  const tx = transactions.find((t) => t.id === id || t.invoiceNumber === id);
  if (!tx) {
    return res.status(404).json({ error: "Transaksi tidak ditemukan" });
  }

  // Restore inventory stock
  if (restoreStock !== "false") {
    for (const item of tx.items) {
      if (item.productId) {
        const pIndex = products.findIndex((p) => p.id === item.productId);
        if (pIndex !== -1 && products[pIndex].category !== "jasa") {
          products[pIndex].stock += (item.qty || 1);
        }
      }
      if (restoreTicket !== "false" && item.isService && item.serviceTicketId) {
        const sIndex = serviceTickets.findIndex((s) => s.id === item.serviceTicketId || s.ticketNumber === item.serviceTicketId);
        if (sIndex !== -1 && serviceTickets[sIndex].status === "completed") {
          serviceTickets[sIndex].status = "ready";
        }
      }
    }
  }

  transactions = transactions.filter((t) => t.id !== id && t.invoiceNumber !== id);
  saveToDisk();
  res.json({ success: true, message: "Transaksi berhasil dihapus" });
});

// Analytics & Dashboard Stats
app.get("/api/stats", (req: Request, res: Response) => {
  const totalRevenue = transactions.reduce((acc, t) => acc + t.total, 0);
  const activeServices = serviceTickets.filter(
    (s) => s.status !== "completed" && s.status !== "cancelled"
  ).length;
  const readyServices = serviceTickets.filter((s) => s.status === "ready").length;
  const completedServices = serviceTickets.filter((s) => s.status === "completed").length;
  const lowStockCount = products.filter((p) => p.category !== "jasa" && p.stock <= p.minStock).length;

  // Revenue breakdown by days
  const recentDays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const revenueChart = [
    { name: "Sen", pos: 450000, service: 750000, total: 1200000 },
    { name: "Sel", pos: 620000, service: 900000, total: 1520000 },
    { name: "Rab", pos: 380000, service: 550000, total: 930000 },
    { name: "Kam", pos: 890000, service: 1200000, total: 2090000 },
    { name: "Jum", pos: 510000, service: 800000, total: 1310000 },
    { name: "Sab", pos: 1200000, service: 1850000, total: 3050000 },
    { name: "Min", pos: 750000, service: 1100000, total: 1850000 },
  ];

  // Device types distribution
  const deviceCounts = {
    laptop: serviceTickets.filter((s) => s.deviceType === "laptop").length,
    pc: serviceTickets.filter((s) => s.deviceType === "pc").length,
    printer: serviceTickets.filter((s) => s.deviceType === "printer").length,
    other: serviceTickets.filter((s) => s.deviceType === "monitor" || s.deviceType === "other").length,
  };

  res.json({
    totalRevenue,
    activeServices,
    readyServices,
    completedServices,
    lowStockCount,
    totalProducts: products.length,
    revenueChart,
    deviceCounts
  });
});

export default app;
export { app };
