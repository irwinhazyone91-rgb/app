import { ServiceTicket, Product, Transaction, StoreSettings, User, DashboardStats } from "../types";

// Storage Keys
export const STORAGE_KEYS = {
  TICKETS: "servisku_db_tickets",
  PRODUCTS: "servisku_db_products",
  TRANSACTIONS: "servisku_db_transactions",
  SETTINGS: "servisku_db_settings",
  USERS: "servisku_db_users",
  ACTIVE_USER: "servisku_active_user",
  IS_AUTH: "servisku_is_authenticated",
  THEME: "servisku_theme"
};

// Initial Seed Data (Used on first launch if storage is empty)
export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "ServisKu Computer",
  tagline: "Pusat Service Komputer, Laptop & Penjualan Sparepart",
  address: "Jl. Pemuda No. 88, Kota Semarang, Jawa Tengah",
  phone: "024-87654321",
  whatsapp: "6281234567890",
  receiptFooter: "Terima kasih atas kepercayaan Anda. Harap simpan nota ini sebagai bukti garansi yang sah.",
  warrantyTerms: "Garansi servis berlaku sesuai catatan nota. Tidak berlaku untuk kerusakan fisik, terkena cairan, atau segel rusak."
};

export const DEFAULT_USERS: User[] = [
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
    specialization: "Owner & Manajemen Toko",
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
    notes: "Admin Toko - Penerimaan servis & stok sparepart"
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

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "prod-laptop-new-1",
    code: "NB-ASUS-VIVO14",
    name: "Laptop Asus Vivobook 14 A1404ZA FHD IPS",
    category: "laptop_baru",
    costPrice: 6200000,
    sellPrice: 7199000,
    resellerPrice: 6650000,
    warrantyDays: 730,
    stock: 5,
    minStock: 2,
    unit: "Unit",
    description: "Laptop bisnis & kuliah ringan dengan garansi resmi Asus Indonesia 2 Tahun",
    processor: "Intel Core i3-1215U (6 Cores, Up to 4.4GHz)",
    ram: "8GB DDR4 3200MHz (Upgradeable)",
    storage: "512GB M.2 NVMe PCIe 3.0 SSD",
    graphics: "Intel UHD Graphics",
    screenSize: '14.0" FHD IPS (1920x1080) Anti-Glare',
    conditionGrade: "Baru Segel BNIB 100%",
    batteryHealth: "Normal 100% (Baterai Baru 42Wh)",
    includes: "Unit Laptop + Charger Original + Tas Ransel Asus + Dus Box Segel + Garansi Resmi 2 Thn"
  },
  {
    id: "prod-laptop-used-1",
    code: "NB-THINK-T480",
    name: "Laptop Lenovo ThinkPad T480 Core i5 Gen 8 Business",
    category: "laptop_bekas",
    costPrice: 2800000,
    sellPrice: 3650000,
    resellerPrice: 3200000,
    warrantyDays: 90,
    stock: 4,
    minStock: 1,
    unit: "Unit",
    description: "Laptop kelas bisnis tangguh standar militer MIL-STD-810G, keyboard empuk ThinkPad",
    processor: "Intel Core i5-8350U Quad Core (Up to 3.6GHz)",
    ram: "16GB DDR4 Dual Channel",
    storage: "256GB SSD NVMe High Speed",
    graphics: "Intel UHD Graphics 620",
    screenSize: '14.0" IPS Anti-Glare (1920x1080)',
    conditionGrade: "Bekas Mulus Grade A 95%",
    batteryHealth: "Dual Battery Awet 3-5 Jam (Health 88%)",
    includes: "Unit Laptop ThinkPad + Charger Original Type-C 65W + Softcase Tas Laptop"
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
    resellerPrice: 660000,
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
    resellerPrice: 58000,
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
    resellerPrice: 115000,
    warrantyDays: 90,
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
    warrantyDays: 180,
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
    warrantyDays: 14,
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
    warrantyDays: 30,
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
    resellerPrice: 280000,
    warrantyDays: 60,
    stock: 999,
    minStock: 0,
    unit: "Jasa",
    description: "Pengerjaan tracing short, reballing/ganti IC charging/IO"
  }
];

export const DEFAULT_TICKETS: ServiceTicket[] = [
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

export const DEFAULT_TRANSACTIONS: Transaction[] = [
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

// Helper functions for LocalStorage Persistence
export const loadPersistentData = () => {
  try {
    const savedTickets = localStorage.getItem(STORAGE_KEYS.TICKETS);
    const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    const savedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);

    return {
      tickets: savedTickets ? (JSON.parse(savedTickets) as ServiceTicket[]) : DEFAULT_TICKETS,
      products: savedProducts ? (JSON.parse(savedProducts) as Product[]) : DEFAULT_PRODUCTS,
      transactions: savedTransactions ? (JSON.parse(savedTransactions) as Transaction[]) : DEFAULT_TRANSACTIONS,
      settings: savedSettings ? (JSON.parse(savedSettings) as StoreSettings) : DEFAULT_SETTINGS,
      users: savedUsers ? (JSON.parse(savedUsers) as User[]) : DEFAULT_USERS,
    };
  } catch (error) {
    console.error("Error reading localStorage:", error);
    return {
      tickets: DEFAULT_TICKETS,
      products: DEFAULT_PRODUCTS,
      transactions: DEFAULT_TRANSACTIONS,
      settings: DEFAULT_SETTINGS,
      users: DEFAULT_USERS,
    };
  }
};

export const savePersistentTickets = (tickets: ServiceTicket[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  } catch (e) {
    console.error("Failed to save tickets to localStorage", e);
  }
};

export const savePersistentProducts = (products: Product[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (e) {
    console.error("Failed to save products to localStorage", e);
  }
};

export const savePersistentTransactions = (transactions: Transaction[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (e) {
    console.error("Failed to save transactions to localStorage", e);
  }
};

export const savePersistentSettings = (settings: StoreSettings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings to localStorage", e);
  }
};

export const savePersistentUsers = (users: User[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (e) {
    console.error("Failed to save users to localStorage", e);
  }
};

// Export Full Backup JSON
export const exportDatabaseBackup = () => {
  const data = loadPersistentData();
  const backupObject = {
    appName: "ServisKu Computer",
    version: "1.0",
    exportDate: new Date().toISOString(),
    ...data
  };

  const blob = new Blob([JSON.stringify(backupObject, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const nowStr = new Date().toISOString().split("T")[0];
  a.href = url;
  a.download = `backup_servisku_${nowStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Import Full Backup JSON
export const importDatabaseBackup = (jsonString: string): boolean => {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.tickets && Array.isArray(parsed.tickets)) {
      savePersistentTickets(parsed.tickets);
    }
    if (parsed.products && Array.isArray(parsed.products)) {
      savePersistentProducts(parsed.products);
    }
    if (parsed.transactions && Array.isArray(parsed.transactions)) {
      savePersistentTransactions(parsed.transactions);
    }
    if (parsed.settings && typeof parsed.settings === "object") {
      savePersistentSettings(parsed.settings);
    }
    if (parsed.users && Array.isArray(parsed.users)) {
      savePersistentUsers(parsed.users);
    }
    return true;
  } catch (err) {
    console.error("Failed to import database backup:", err);
    return false;
  }
};

// Compute dynamic dashboard statistics
export const computeDashboardStats = (
  tickets: ServiceTicket[],
  products: Product[],
  transactions: Transaction[]
): DashboardStats => {
  const totalRevenue = transactions.reduce((acc, t) => acc + (t.total || 0), 0);
  const activeServices = tickets.filter(
    (s) => s.status !== "completed" && s.status !== "cancelled"
  ).length;
  const readyServices = tickets.filter((s) => s.status === "ready").length;
  const completedServices = tickets.filter((s) => s.status === "completed").length;
  const lowStockCount = products.filter(
    (p) => p.category !== "jasa" && (p.stock || 0) <= (p.minStock || 0)
  ).length;

  const revenueChart = [
    { name: "Sen", pos: 450000, service: 750000, total: 1200000 },
    { name: "Sel", pos: 620000, service: 900000, total: 1520000 },
    { name: "Rab", pos: 380000, service: 550000, total: 930000 },
    { name: "Kam", pos: 890000, service: 1200000, total: 2090000 },
    { name: "Jum", pos: 510000, service: 800000, total: 1310000 },
    { name: "Sab", pos: 1200000, service: 1850000, total: 3050000 },
    { name: "Min", pos: 750000, service: 1100000, total: 1850000 }
  ];

  const deviceCounts = {
    laptop: tickets.filter((s) => s.deviceType === "laptop").length,
    pc: tickets.filter((s) => s.deviceType === "pc").length,
    printer: tickets.filter((s) => s.deviceType === "printer").length,
    other: tickets.filter((s) => s.deviceType === "monitor" || s.deviceType === "other").length
  };

  return {
    totalRevenue,
    activeServices,
    readyServices,
    completedServices,
    lowStockCount,
    totalProducts: products.length,
    revenueChart,
    deviceCounts
  };
};
