import React, { useState, useEffect, useCallback } from "react";
import { Toaster, toast } from "sonner";
import axios from "axios";
import {
  ServiceTicket,
  Product,
  Transaction,
  StoreSettings,
  DashboardStats,
  CartItem,
  User,
  Customer,
  Expense
} from "./types";
import {
  loadPersistentData,
  savePersistentTickets,
  savePersistentProducts,
  savePersistentTransactions,
  savePersistentCustomers,
  savePersistentExpenses,
  savePersistentSettings,
  savePersistentUsers,
  upsertCustomerSync,
  computeDashboardStats,
  importDatabaseBackup,
  DEFAULT_SETTINGS,
  DEFAULT_USERS,
  DEFAULT_PRODUCTS,
  DEFAULT_TICKETS,
  DEFAULT_TRANSACTIONS,
  DEFAULT_CUSTOMERS,
  DEFAULT_EXPENSES
} from "./lib/storage";
import { firestoreService, testFirestoreConnection } from "./lib/firebase";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { DashboardView } from "./components/DashboardView";
import { ServiceManagementView } from "./components/ServiceManagementView";
import { POSView } from "./components/POSView";
import { TransactionHistoryView } from "./components/TransactionHistoryView";
import { InventoryView } from "./components/InventoryView";
import { CustomersView } from "./components/CustomersView";
import { FinancialReportsView } from "./components/FinancialReportsView";
import { CustomerLandingPage } from "./components/CustomerLandingPage";
import { SettingsView } from "./components/SettingsView";
import { UsersView } from "./components/UsersView";
import { ReceiptModal, PrintFormat } from "./components/ReceiptModal";
import { QRScannerModal } from "./components/QRScannerModal";
import { LoginView } from "./components/LoginView";
import { SwitchUserModal } from "./components/SwitchUserModal";
import { isTabAllowedForRole, getDefaultTabForRole } from "./lib/permissions";
import { getUserRoleConfig } from "./lib/utils";
import { ShieldAlert } from "lucide-react";

export function App() {
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("servisku_theme") === "dark";
  });

  // Authentication State (Session only - data is never lost on logout)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("servisku_is_authenticated") === "true";
  });
  const [isCustomerTrackingDirect, setIsCustomerTrackingDirect] = useState<boolean>(false);

  // Load Initial Persistent Data synchronously (Zero data loss guarantee)
  const initialData = loadPersistentData();
  const [tickets, setTickets] = useState<ServiceTicket[]>(initialData.tickets);
  const [products, setProducts] = useState<Product[]>(initialData.products);
  const [transactions, setTransactions] = useState<Transaction[]>(initialData.transactions);
  const [customers, setCustomers] = useState<Customer[]>(initialData.customers || DEFAULT_CUSTOMERS);
  const [expenses, setExpenses] = useState<Expense[]>(initialData.expenses || DEFAULT_EXPENSES);
  const [users, setUsers] = useState<User[]>(initialData.users);
  const [settings, setSettings] = useState<StoreSettings>(initialData.settings);

  const [stats, setStats] = useState<DashboardStats>(() =>
    computeDashboardStats(initialData.tickets, initialData.products, initialData.transactions, (initialData.customers || DEFAULT_CUSTOMERS).length)
  );

  // Current Active User
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem("servisku_active_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return initialData.users[0] || DEFAULT_USERS[0];
  });

  // Switch User Modal State
  const [switchUserModal, setSwitchUserModal] = useState<{
    isOpen: boolean;
    targetUser?: User | null;
  }>({
    isOpen: false,
    targetUser: null
  });

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setIsCustomerTrackingDirect(false);
    localStorage.setItem("servisku_active_user", JSON.stringify(user));
    localStorage.setItem("servisku_is_authenticated", "true");
    
    // Automatically navigate to role's primary landing tab
    const targetTab = getDefaultTabForRole(user.role);
    setCurrentTab(targetTab);

    toast.success(`Selamat datang, ${user.name}! Masuk sebagai ${getUserRoleConfig(user.role).label}`);
    // Sync latest database records immediately on login
    loadAllData();
  };

  const handleLogout = () => {
    // Only clears login session, keeps all user records, tickets, POS transactions, & inventory 100% safe
    setIsAuthenticated(false);
    setIsCustomerTrackingDirect(false);
    localStorage.removeItem("servisku_is_authenticated");
    toast.info("Anda telah keluar dari sesi aplikasi. Data Anda tetap tersimpan dengan aman.");
  };

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("servisku_active_user", JSON.stringify(user));
    toast.success(`Beralih ke akun: ${user.name} (${getUserRoleConfig(user.role).label})`);
    
    // If the new user role cannot access the currently opened tab, redirect to their default tab
    if (!isTabAllowedForRole(currentTab, user.role)) {
      setCurrentTab(getDefaultTabForRole(user.role));
    }
  };

  const openSwitchUserModal = (targetUser?: User) => {
    setSwitchUserModal({
      isOpen: true,
      targetUser: targetUser || null
    });
  };

  // Recalculate stats whenever tickets, products, or transactions change
  const refreshStats = useCallback((
    currentTickets: ServiceTicket[],
    currentProducts: Product[],
    currentTransactions: Transaction[],
    customersCount: number = customers.length
  ) => {
    const newStats = computeDashboardStats(currentTickets, currentProducts, currentTransactions, customersCount);
    setStats(newStats);
  }, [customers.length]);

  // Modal / Transition states
  const [receiptModal, setReceiptModal] = useState<{
    isOpen: boolean;
    mode: "intake_service" | "invoice_service" | "pos_transaction";
    ticket?: ServiceTicket | null;
    transaction?: Transaction | null;
    defaultFormat?: PrintFormat;
  }>({
    isOpen: false,
    mode: "intake_service",
    ticket: null,
    transaction: null,
    defaultFormat: "continuous"
  });

  const [isQRScannerOpen, setIsQRScannerOpen] = useState<boolean>(false);
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [selectedTicketForDetail, setSelectedTicketForDetail] = useState<ServiceTicket | null>(null);
  const [preloadedTicketForPOS, setPreloadedTicketForPOS] = useState<ServiceTicket | null>(null);
  const [prefilledTicketForTracking, setPrefilledTicketForTracking] = useState<ServiceTicket | null>(null);
  const [prefilledTransactionForTracking, setPrefilledTransactionForTracking] = useState<Transaction | null>(null);

  // Sync Dark Mode Class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("servisku_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("servisku_theme", "light");
    }
  }, [darkMode]);

  // Load Data prioritizing Firestore Cloud and local persistence
  const loadAllData = async () => {
    try {
      // 1. Try to fetch from Firestore Cloud directly
      const cloudData = await firestoreService.fetchAllCloudData();
      if (cloudData) {
        let hasAnyCloudData = false;
        if (cloudData.tickets && cloudData.tickets.length > 0) {
          setTickets(cloudData.tickets);
          savePersistentTickets(cloudData.tickets);
          hasAnyCloudData = true;
        }
        if (cloudData.products && cloudData.products.length > 0) {
          setProducts(cloudData.products);
          savePersistentProducts(cloudData.products);
          hasAnyCloudData = true;
        }
        if (cloudData.transactions && cloudData.transactions.length > 0) {
          setTransactions(cloudData.transactions);
          savePersistentTransactions(cloudData.transactions);
          hasAnyCloudData = true;
        }
        if (cloudData.customers && cloudData.customers.length > 0) {
          setCustomers(cloudData.customers);
          savePersistentCustomers(cloudData.customers);
          hasAnyCloudData = true;
        }
        if (cloudData.expenses && cloudData.expenses.length > 0) {
          setExpenses(cloudData.expenses);
          savePersistentExpenses(cloudData.expenses);
          hasAnyCloudData = true;
        }
        if (cloudData.settings && cloudData.settings.storeName) {
          setSettings(cloudData.settings);
          savePersistentSettings(cloudData.settings);
          hasAnyCloudData = true;
        }
        if (cloudData.users && cloudData.users.length > 0) {
          setUsers(cloudData.users);
          savePersistentUsers(cloudData.users);
          hasAnyCloudData = true;
        }

        if (hasAnyCloudData) {
          refreshStats(
            cloudData.tickets || tickets,
            cloudData.products || products,
            cloudData.transactions || transactions,
            (cloudData.customers || customers).length
          );
          return;
        }
      }

      // 2. Fallback to API if Firestore was empty on first setup
      const [resTickets, resProducts, resTx, resSettings, resUsers, resCust, resExp] = await Promise.all([
        axios.get("/api/services").catch(() => ({ data: null })),
        axios.get("/api/products").catch(() => ({ data: null })),
        axios.get("/api/transactions").catch(() => ({ data: null })),
        axios.get("/api/settings").catch(() => ({ data: null })),
        axios.get("/api/users").catch(() => ({ data: null })),
        axios.get("/api/customers").catch(() => ({ data: null })),
        axios.get("/api/expenses").catch(() => ({ data: null }))
      ]);

      const persistent = loadPersistentData();
      const currentT = (resTickets?.data && Array.isArray(resTickets.data)) ? resTickets.data : persistent.tickets;
      const currentP = (resProducts?.data && Array.isArray(resProducts.data)) ? resProducts.data : persistent.products;
      const currentTx = (resTx?.data && Array.isArray(resTx.data)) ? resTx.data : persistent.transactions;
      const currentCust = (resCust?.data && Array.isArray(resCust.data)) ? resCust.data : persistent.customers;
      const currentExp = (resExp?.data && Array.isArray(resExp.data)) ? resExp.data : persistent.expenses;
      const currentSettings = (resSettings?.data && resSettings.data.storeName) ? resSettings.data : persistent.settings;
      const currentUsers = (resUsers?.data && Array.isArray(resUsers.data)) ? resUsers.data : persistent.users;

      setTickets(currentT);
      setProducts(currentP);
      setTransactions(currentTx);
      setCustomers(currentCust);
      setExpenses(currentExp);
      setSettings(currentSettings);
      setUsers(currentUsers);
      refreshStats(currentT, currentP, currentTx, currentCust.length);
    } catch (err) {
      // Fallback to local storage
      const local = loadPersistentData();
      setTickets(local.tickets);
      setProducts(local.products);
      setTransactions(local.transactions);
      setCustomers(local.customers);
      setExpenses(local.expenses);
      setSettings(local.settings);
      setUsers(local.users);
      refreshStats(local.tickets, local.products, local.transactions, local.customers.length);
    }
  };

  useEffect(() => {
    // Initial fetch on app start
    loadAllData();

    // Verify Firestore connection & seed if needed
    testFirestoreConnection().then(() => {
      const local = loadPersistentData();
      firestoreService.seedInitialDataIfEmpty(
        local.tickets,
        local.products,
        local.transactions,
        local.customers,
        local.expenses,
        local.settings,
        local.users
      );
    });

    // Realtime subscriptions to Firestore collections
    const unsubTickets = firestoreService.subscribeToTickets((cloudTickets) => {
      if (cloudTickets && cloudTickets.length > 0) {
        setTickets(cloudTickets);
        savePersistentTickets(cloudTickets);
      }
    });

    const unsubProducts = firestoreService.subscribeToProducts((cloudProducts) => {
      if (cloudProducts && cloudProducts.length > 0) {
        setProducts(cloudProducts);
        savePersistentProducts(cloudProducts);
      }
    });

    const unsubTx = firestoreService.subscribeToTransactions((cloudTx) => {
      if (cloudTx && cloudTx.length > 0) {
        setTransactions(cloudTx);
        savePersistentTransactions(cloudTx);
      }
    });

    const unsubCust = firestoreService.subscribeToCustomers((cloudCust) => {
      if (cloudCust && cloudCust.length > 0) {
        setCustomers(cloudCust);
        savePersistentCustomers(cloudCust);
      }
    });

    const unsubExp = firestoreService.subscribeToExpenses((cloudExp) => {
      if (cloudExp && cloudExp.length > 0) {
        setExpenses(cloudExp);
        savePersistentExpenses(cloudExp);
      }
    });

    const unsubSettings = firestoreService.subscribeToSettings((cloudSettings) => {
      if (cloudSettings && cloudSettings.storeName) {
        setSettings(cloudSettings);
        savePersistentSettings(cloudSettings);
      }
    });

    const unsubUsers = firestoreService.subscribeToUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        setUsers(cloudUsers);
        savePersistentUsers(cloudUsers);
      }
    });

    // Auto-sync whenever user switches back to this tab or window
    const handleSyncEvent = () => {
      loadAllData();
    };

    window.addEventListener("focus", handleSyncEvent);
    window.addEventListener("online", handleSyncEvent);
    document.addEventListener("visibilitychange", handleSyncEvent);

    return () => {
      unsubTickets();
      unsubProducts();
      unsubTx();
      unsubCust();
      unsubExp();
      unsubSettings();
      unsubUsers();
      window.removeEventListener("focus", handleSyncEvent);
      window.removeEventListener("online", handleSyncEvent);
      document.removeEventListener("visibilitychange", handleSyncEvent);
    };
  }, []);

  // Listen for direct URL Tracking / Warranty link (from scanned QR Code with smartphone camera)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, ""));
      const trackCode =
        urlParams.get("track") ||
        urlParams.get("invoice") ||
        urlParams.get("inv") ||
        urlParams.get("ticket") ||
        urlParams.get("garansi") ||
        hashParams.get("track") ||
        hashParams.get("invoice") ||
        hashParams.get("ticket");

      if (trackCode && trackCode.trim()) {
        const cleanCode = trackCode.trim();
        setIsCustomerTrackingDirect(true);

        const q = cleanCode.toLowerCase();
        const cleanPhone = cleanCode.replace(/[^0-9]/g, "");

        // Find immediately from current tickets
        const matchTicket = tickets.find((t) => {
          return (
            t.ticketNumber.toLowerCase() === q ||
            t.id === cleanCode ||
            (cleanPhone.length >= 7 && t.customerPhone && t.customerPhone.replace(/[^0-9]/g, "").includes(cleanPhone)) ||
            (t.serialNumber && t.serialNumber.toLowerCase() === q)
          );
        });

        // Find immediately from current transactions
        const matchTx = transactions.find((t) => {
          return (
            t.invoiceNumber.toLowerCase() === q ||
            t.id === cleanCode ||
            (cleanPhone.length >= 7 && t.customerPhone && t.customerPhone.replace(/[^0-9]/g, "").includes(cleanPhone))
          );
        });

        if (matchTicket) {
          setPrefilledTicketForTracking(matchTicket);
        }
        if (matchTx) {
          setPrefilledTransactionForTracking(matchTx);
        }

        if (!matchTicket && !matchTx) {
          // If not yet loaded in local state, fetch from server / cloud
          handleSearchTracking(cleanCode)
            .then((res) => {
              if (res) {
                if (res.ticket) setPrefilledTicketForTracking(res.ticket);
                if (res.transaction) setPrefilledTransactionForTracking(res.transaction);
              }
            })
            .catch(() => {});
        }
      }
    } catch (e) {
      console.warn("Error parsing URL tracking parameter:", e);
    }
  }, [tickets.length, transactions.length]);

  // CRUD Users
  const handleCreateUser = async (userData: Partial<User>) => {
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: userData.name || "Staf Baru",
      username: userData.username || (userData.name || "user").toLowerCase().replace(/\s+/g, "_"),
      password: userData.password || userData.pin || "123456",
      pin: userData.pin || userData.password || "123456",
      role: userData.role || "technician",
      phone: userData.phone || "-",
      email: userData.email || "",
      status: userData.status || "active",
      specialization: userData.specialization || "",
      notes: userData.notes || ""
    };

    const updated = [...users, newUser];
    setUsers(updated);
    savePersistentUsers(updated);
    toast.success(`Pengguna "${newUser.name}" berhasil didaftarkan!`);

    try {
      await Promise.all([
        axios.post("/api/users", newUser).catch(() => null),
        firestoreService.saveUser(newUser).catch(() => null)
      ]);
    } catch (e) {
      // Fallback
    }
  };

  const handleUpdateUser = async (id: string, userData: Partial<User>) => {
    const updated = users.map((u) => (u.id === id ? { ...u, ...userData } : u));
    setUsers(updated);
    savePersistentUsers(updated);

    const currentUserUpdated = updated.find((u) => u.id === id);
    if (currentUser.id === id && currentUserUpdated) {
      setCurrentUser(currentUserUpdated);
      localStorage.setItem("servisku_active_user", JSON.stringify(currentUserUpdated));
    }
    toast.success(`Profil "${userData.name || 'Pengguna'}" berhasil diperbarui!`);

    const userToSave = updated.find((u) => u.id === id);
    if (userToSave) {
      try {
        await Promise.all([
          axios.put(`/api/users/${id}`, userData).catch(() => null),
          firestoreService.saveUser(userToSave).catch(() => null)
        ]);
      } catch (e) {
        // Fallback
      }
    }
  };

  const handleDeleteUser = async (id: string) => {
    const targetUser = users.find((u) => u.id === id);
    if (targetUser && targetUser.role === "owner" && users.filter((u) => u.role === "owner").length <= 1) {
      toast.error("Akun Pemilik Toko utama tidak dapat dihapus!");
      return;
    }

    const updated = users.filter((u) => u.id !== id);
    setUsers(updated);
    savePersistentUsers(updated);
    toast.success("Pengguna berhasil dihapus.");

    try {
      await Promise.all([
        axios.delete(`/api/users/${id}`).catch(() => null),
        firestoreService.deleteUser(id).catch(() => null)
      ]);
    } catch (e) {
      // Fallback
    }
  };

  // CRUD Service Tickets
  const handleCreateTicket = async (ticketData: Partial<ServiceTicket>) => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const count = tickets.length + 1;
    const ticketNumber = `SRV-${yearMonth}-${String(count).padStart(3, "0")}`;

    const newTicket: ServiceTicket = {
      id: `srv-${Date.now()}`,
      ticketNumber,
      customerName: ticketData.customerName || "Pelanggan",
      customerPhone: ticketData.customerPhone || "-",
      customerAddress: ticketData.customerAddress || "",
      deviceType: ticketData.deviceType || "laptop",
      deviceBrandModel: ticketData.deviceBrandModel || "Laptop / PC",
      serialNumber: ticketData.serialNumber || "",
      complaints: ticketData.complaints || "Pemeriksaan unit",
      accessories: ticketData.accessories || "Unit Saja",
      technicianNotes: ticketData.technicianNotes || "",
      status: ticketData.status || "received",
      technicianName: ticketData.technicianName || currentUser.name || "Teknisi Utama",
      estimatedCost: Number(ticketData.estimatedCost) || 0,
      finalCost: Number(ticketData.finalCost) || 0,
      downPayment: Number(ticketData.downPayment) || 0,
      partsUsed: ticketData.partsUsed || [],
      warrantyDays: Number(ticketData.warrantyDays) || 30,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    const updated = [newTicket, ...tickets];
    setTickets(updated);
    savePersistentTickets(updated);

    // Otomatis sinkronkan & daftarkan pelanggan baru ke database Pelanggan CRM
    let updatedCustomerList = customers;
    if (newTicket.customerName && newTicket.customerName.trim() !== "") {
      const { updatedCustomers, targetCustomer } = upsertCustomerSync(
        {
          name: newTicket.customerName,
          phone: newTicket.customerPhone,
          address: newTicket.customerAddress,
          isService: true,
          spentDelta: newTicket.downPayment || 0
        },
        customers
      );
      updatedCustomerList = updatedCustomers;
      setCustomers(updatedCustomers);
      savePersistentCustomers(updatedCustomers);
      firestoreService.saveCustomer(targetCustomer).catch(() => null);
    }

    refreshStats(updated, products, transactions, updatedCustomerList.length);

    toast.success(`Tiket servis ${newTicket.ticketNumber} berhasil didaftarkan! Pelanggan tersimpan.`);

    // Auto open print modal for intake continuous form (21cm x 15cm)
    setReceiptModal({
      isOpen: true,
      mode: "intake_service",
      ticket: newTicket,
      transaction: null,
      defaultFormat: "continuous"
    });

    try {
      await Promise.all([
        axios.post("/api/services", newTicket).catch(() => null),
        firestoreService.saveTicket(newTicket).catch(() => null)
      ]);
    } catch (e) {
      // Fallback
    }
  };

  const handleUpdateTicket = async (id: string, ticketData: Partial<ServiceTicket>) => {
    let savedTicket: ServiceTicket | null = null;
    const updated = tickets.map((t) => {
      if (t.id === id || t.ticketNumber === id) {
        const mod = {
          ...t,
          ...ticketData,
          updatedAt: new Date().toISOString()
        };
        if (ticketData.status === "completed" && !mod.completedAt) {
          mod.completedAt = new Date().toISOString();
          if (mod.warrantyDays > 0) {
            const expDate = new Date();
            expDate.setDate(expDate.getDate() + mod.warrantyDays);
            mod.warrantyUntil = expDate.toISOString().split("T")[0];
          }
        }
        savedTicket = mod;
        return mod;
      }
      return t;
    });

    setTickets(updated);
    savePersistentTickets(updated);
    refreshStats(updated, products, transactions);
    toast.success("Status tiket servis berhasil diperbarui!");

    if (savedTicket) {
      try {
        await Promise.all([
          axios.put(`/api/services/${id}`, ticketData).catch(() => null),
          firestoreService.saveTicket(savedTicket).catch(() => null)
        ]);
      } catch (e) {
        // Fallback
      }
    }
  };

  const handleDeleteTicket = async (id: string) => {
    const updated = tickets.filter((t) => t.id !== id && t.ticketNumber !== id);
    setTickets(updated);
    savePersistentTickets(updated);
    refreshStats(updated, products, transactions);
    toast.success("Tiket servis berhasil dihapus.");

    try {
      await Promise.all([
        axios.delete(`/api/services/${id}`).catch(() => null),
        firestoreService.deleteTicket(id).catch(() => null)
      ]);
    } catch (e) {
      // Fallback
    }
  };

  // CRUD Products / Inventory
  const handleCreateProduct = async (productData: Partial<Product>) => {
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      code: productData.code || `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
      name: productData.name || "Item Baru",
      category: productData.category || "komponen_pc",
      costPrice: Number(productData.costPrice) || 0,
      sellPrice: Number(productData.sellPrice) || 0,
      resellerPrice: productData.resellerPrice !== undefined ? Number(productData.resellerPrice) : undefined,
      warrantyDays: productData.warrantyDays !== undefined ? Number(productData.warrantyDays) : 30,
      stock: Number(productData.stock) || 0,
      minStock: Number(productData.minStock) || 2,
      unit: productData.unit || "Pcs",
      description: productData.description || "",
      processor: productData.processor,
      ram: productData.ram,
      storage: productData.storage,
      graphics: productData.graphics,
      screenSize: productData.screenSize,
      conditionGrade: productData.conditionGrade,
      batteryHealth: productData.batteryHealth,
      includes: productData.includes
    };

    const updated = [newProduct, ...products];
    setProducts(updated);
    savePersistentProducts(updated);
    refreshStats(tickets, updated, transactions);
    toast.success(`Item "${newProduct.name}" berhasil ditambahkan ke inventaris.`);

    try {
      await Promise.all([
        axios.post("/api/products", newProduct).catch(() => null),
        firestoreService.saveProduct(newProduct).catch(() => null)
      ]);
    } catch (e) {
      // Fallback
    }
  };

  const handleUpdateProduct = async (id: string, productData: Partial<Product>) => {
    let savedProduct: Product | null = null;
    const updated = products.map((p) => {
      if (p.id === id) {
        const mod = { ...p, ...productData };
        savedProduct = mod;
        return mod;
      }
      return p;
    });

    setProducts(updated);
    savePersistentProducts(updated);
    refreshStats(tickets, updated, transactions);
    toast.success("Data inventaris berhasil diupdate.");

    if (savedProduct) {
      try {
        await Promise.all([
          axios.put(`/api/products/${id}`, productData).catch(() => null),
          firestoreService.saveProduct(savedProduct).catch(() => null)
        ]);
      } catch (e) {
        // Fallback
      }
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    savePersistentProducts(updated);
    refreshStats(tickets, updated, transactions);
    toast.success("Item berhasil dihapus dari inventaris.");

    try {
      await Promise.all([
        axios.delete(`/api/products/${id}`).catch(() => null),
        firestoreService.deleteProduct(id).catch(() => null)
      ]);
    } catch (e) {
      // Fallback
    }
  };

  // POS Checkout
  const handlePOSCheckout = async (txData: {
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
    notes?: string;
  }) => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const count = transactions.length + 1;
    const invoiceNumber = `INV-${yearMonth}-${String(count).padStart(3, "0")}`;

    // Deduct inventory stock
    const updatedProducts = [...products];
    const modifiedProducts: Product[] = [];
    for (const item of txData.items) {
      if (item.productId) {
        const pIndex = updatedProducts.findIndex((p) => p.id === item.productId);
        if (pIndex !== -1 && updatedProducts[pIndex].category !== "jasa") {
          updatedProducts[pIndex].stock = Math.max(0, updatedProducts[pIndex].stock - (item.qty || 1));
          modifiedProducts.push(updatedProducts[pIndex]);
        }
      }
    }
    setProducts(updatedProducts);
    savePersistentProducts(updatedProducts);

    // If transaction settled a service ticket, mark ticket as completed (Finish)
    let updatedTickets = [...tickets];
    const completedTicketObjs: ServiceTicket[] = [];
    for (const item of txData.items) {
      if (item.isService && item.serviceTicketId) {
        updatedTickets = updatedTickets.map((t) => {
          if (t.id === item.serviceTicketId || t.ticketNumber === item.serviceTicketId) {
            const warrantyDays = item.warrantyDays || t.warrantyDays || 14;
            const warrantyUntil = new Date(
              now.getTime() + warrantyDays * 24 * 60 * 60 * 1000
            ).toISOString();
            const completed: ServiceTicket = {
              ...t,
              status: "completed" as const,
              completedAt: now.toISOString(),
              pickupDate: now.toISOString().split("T")[0],
              finalCost: item.subtotal,
              warrantyDays: warrantyDays,
              warrantyUntil: warrantyUntil
            };
            completedTicketObjs.push(completed);
            return completed;
          }
          return t;
        });
      }
    }
    setTickets(updatedTickets);
    savePersistentTickets(updatedTickets);

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      invoiceNumber,
      date: now.toISOString(),
      customerName: txData.customerName || "Pelanggan Umum",
      customerPhone: txData.customerPhone || "-",
      items: txData.items,
      subtotal: txData.subtotal,
      discount: txData.discount,
      tax: txData.tax,
      total: txData.total,
      paymentMethod: txData.paymentMethod,
      amountPaid: txData.amountPaid,
      change: txData.change,
      cashierName: currentUser.name || "Kasir Toko",
      notes: txData.notes || ""
    };

    const updatedTx = [newTx, ...transactions];
    setTransactions(updatedTx);
    savePersistentTransactions(updatedTx);

    // Auto sync customer spent & transaction count to Customer Database
    let updatedCustomerList = customers;
    if (newTx.customerName && newTx.customerName !== "Pelanggan Umum") {
      const { updatedCustomers, targetCustomer } = upsertCustomerSync(
        {
          name: newTx.customerName,
          phone: newTx.customerPhone,
          isTransaction: true,
          spentDelta: newTx.total
        },
        customers
      );
      updatedCustomerList = updatedCustomers;
      setCustomers(updatedCustomers);
      savePersistentCustomers(updatedCustomers);
      firestoreService.saveCustomer(targetCustomer).catch(() => null);
    }

    refreshStats(updatedTickets, updatedProducts, updatedTx, updatedCustomerList.length);

    toast.success(`Transaksi ${newTx.invoiceNumber} berhasil disimpan!`);

    try {
      await Promise.all([
        axios.post("/api/transactions", newTx).catch(() => null),
        firestoreService.saveTransaction(newTx).catch(() => null),
        ...modifiedProducts.map(p => firestoreService.saveProduct(p).catch(() => null)),
        ...completedTicketObjs.map(t => firestoreService.saveTicket(t).catch(() => null))
      ]);
    } catch (e) {
      // Fallback
    }

    return newTx;
  };

  // CRUD Customers
  const handleSaveCustomer = async (custData: Customer) => {
    let savedCust: Customer | null = null;
    const existingIndex = customers.findIndex(c => c.id === custData.id);
    let updated: Customer[];
    if (existingIndex >= 0) {
      updated = customers.map(c => c.id === custData.id ? { ...c, ...custData, updatedAt: new Date().toISOString() } : c);
      savedCust = updated[existingIndex];
      toast.success(`Data pelanggan "${custData.name}" berhasil diperbarui.`);
    } else {
      const newCust: Customer = {
        ...custData,
        id: custData.id || `cust-${Date.now()}`,
        createdAt: custData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      savedCust = newCust;
      updated = [newCust, ...customers];
      toast.success(`Pelanggan baru "${newCust.name}" berhasil didaftarkan!`);
    }
    setCustomers(updated);
    savePersistentCustomers(updated);
    refreshStats(tickets, products, transactions, updated.length);

    if (savedCust) {
      try {
        await Promise.all([
          axios.post("/api/customers", savedCust).catch(() => null),
          firestoreService.saveCustomer(savedCust).catch(() => null)
        ]);
      } catch (e) {}
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    const updated = customers.filter(c => c.id !== customerId);
    setCustomers(updated);
    savePersistentCustomers(updated);
    refreshStats(tickets, products, transactions, updated.length);
    toast.success("Data pelanggan berhasil dihapus.");

    try {
      await Promise.all([
        axios.delete(`/api/customers/${customerId}`).catch(() => null),
        firestoreService.deleteCustomer(customerId).catch(() => null)
      ]);
    } catch (e) {}
  };

  // CRUD Expenses
  const handleSaveExpense = async (expenseData: Expense) => {
    let savedExp: Expense | null = null;
    const existingIndex = expenses.findIndex(e => e.id === expenseData.id);
    let updated: Expense[];
    if (existingIndex >= 0) {
      updated = expenses.map(e => e.id === expenseData.id ? { ...e, ...expenseData } : e);
      savedExp = updated[existingIndex];
      toast.success("Catatan pengeluaran operasional berhasil diperbarui.");
    } else {
      const newExp: Expense = {
        ...expenseData,
        id: expenseData.id || `exp-${Date.now()}`,
        date: expenseData.date || new Date().toISOString(),
        recordedBy: expenseData.recordedBy || currentUser.name || "Admin"
      };
      savedExp = newExp;
      updated = [newExp, ...expenses];
      toast.success("Pengeluaran operasional berhasil dicatat!");
    }
    setExpenses(updated);
    savePersistentExpenses(updated);

    if (savedExp) {
      try {
        await Promise.all([
          axios.post("/api/expenses", savedExp).catch(() => null),
          firestoreService.saveExpense(savedExp).catch(() => null)
        ]);
      } catch (e) {}
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const updated = expenses.filter(e => e.id !== expenseId);
    setExpenses(updated);
    savePersistentExpenses(updated);
    toast.success("Catatan pengeluaran berhasil dihapus.");

    try {
      await Promise.all([
        axios.delete(`/api/expenses/${expenseId}`).catch(() => null),
        firestoreService.deleteExpense(expenseId).catch(() => null)
      ]);
    } catch (e) {}
  };

  // Delete / Void Transaction (Owner & Admin only with inventory & ticket restoration)
  const handleDeleteTransaction = async (
    txId: string,
    options?: { restoreStock?: boolean; restoreServiceTicket?: boolean }
  ) => {
    const { restoreStock = true, restoreServiceTicket = true } = options || {};
    const txToDelete = transactions.find((t) => t.id === txId || t.invoiceNumber === txId);
    if (!txToDelete) return;

    const modifiedProducts: Product[] = [];
    let updatedProducts = [...products];

    // If restoreStock is true, add back the quantities for product items
    if (restoreStock) {
      for (const item of txToDelete.items) {
        if (item.productId) {
          const pIndex = updatedProducts.findIndex((p) => p.id === item.productId);
          if (pIndex !== -1 && updatedProducts[pIndex].category !== "jasa") {
            updatedProducts[pIndex] = {
              ...updatedProducts[pIndex],
              stock: updatedProducts[pIndex].stock + (item.qty || 1),
            };
            modifiedProducts.push(updatedProducts[pIndex]);
          }
        }
      }
    }

    // If restoreServiceTicket is true, revert completed service tickets back to "ready"
    const restoredTickets: ServiceTicket[] = [];
    let updatedTickets = [...tickets];
    if (restoreServiceTicket) {
      for (const item of txToDelete.items) {
        if (item.isService && item.serviceTicketId) {
          updatedTickets = updatedTickets.map((t) => {
            if ((t.id === item.serviceTicketId || t.ticketNumber === item.serviceTicketId) && t.status === "completed") {
              const reverted: ServiceTicket = {
                ...t,
                status: "ready" as const,
                completedAt: undefined,
                warrantyUntil: undefined,
                updatedAt: new Date().toISOString(),
              };
              restoredTickets.push(reverted);
              return reverted;
            }
            return t;
          });
        }
      }
    }

    const updatedTx = transactions.filter((t) => t.id !== txId && t.invoiceNumber !== txId);
    setTransactions(updatedTx);
    savePersistentTransactions(updatedTx);

    if (restoreStock && modifiedProducts.length > 0) {
      setProducts(updatedProducts);
      savePersistentProducts(updatedProducts);
    }

    if (restoreServiceTicket && restoredTickets.length > 0) {
      setTickets(updatedTickets);
      savePersistentTickets(updatedTickets);
    }

    refreshStats(updatedTickets, updatedProducts, updatedTx);
    toast.success(`Transaksi ${txToDelete.invoiceNumber} berhasil dihapus/dibatalkan.`);

    try {
      await Promise.all([
        axios.delete(`/api/transactions/${txId}?restoreStock=${restoreStock}&restoreTicket=${restoreServiceTicket}`).catch(() => null),
        firestoreService.deleteTransaction(txToDelete.id).catch(() => null),
        ...modifiedProducts.map((p) => firestoreService.saveProduct(p).catch(() => null)),
        ...restoredTickets.map((t) => firestoreService.saveTicket(t).catch(() => null)),
      ]);
    } catch (e) {
      // Fallback
    }
  };

  // Settings Save
  const handleSaveSettings = async (newSettings: StoreSettings) => {
    setSettings(newSettings);
    savePersistentSettings(newSettings);
    toast.success("Pengaturan toko berhasil disimpan ke database!");

    try {
      await Promise.all([
        axios.put("/api/settings", newSettings).catch(() => null),
        firestoreService.saveSettings(newSettings).catch(() => null)
      ]);
    } catch (e) {
      // Fallback
    }
  };

  // Restore Database from JSON
  const handleRestoreBackup = (jsonString: string): boolean => {
    const ok = importDatabaseBackup(jsonString);
    if (ok) {
      const refreshed = loadPersistentData();
      setTickets(refreshed.tickets);
      setProducts(refreshed.products);
      setTransactions(refreshed.transactions);
      setCustomers(refreshed.customers);
      setExpenses(refreshed.expenses);
      setSettings(refreshed.settings);
      setUsers(refreshed.users);
      refreshStats(refreshed.tickets, refreshed.products, refreshed.transactions, refreshed.customers.length);

      try {
        axios.post("/api/backup/import", refreshed).catch(() => {});
      } catch (e) {}
      return true;
    }
    return false;
  };

  // Reset to Demo Data
  const handleResetDefaultData = () => {
    if (window.confirm("Apakah Anda yakin ingin mengatur ulang data ke demo bawaan?")) {
      savePersistentTickets(DEFAULT_TICKETS);
      savePersistentProducts(DEFAULT_PRODUCTS);
      savePersistentTransactions(DEFAULT_TRANSACTIONS);
      savePersistentCustomers(DEFAULT_CUSTOMERS);
      savePersistentExpenses(DEFAULT_EXPENSES);
      savePersistentSettings(DEFAULT_SETTINGS);
      savePersistentUsers(DEFAULT_USERS);

      setTickets(DEFAULT_TICKETS);
      setProducts(DEFAULT_PRODUCTS);
      setTransactions(DEFAULT_TRANSACTIONS);
      setCustomers(DEFAULT_CUSTOMERS);
      setExpenses(DEFAULT_EXPENSES);
      setSettings(DEFAULT_SETTINGS);
      setUsers(DEFAULT_USERS);
      refreshStats(DEFAULT_TICKETS, DEFAULT_PRODUCTS, DEFAULT_TRANSACTIONS, DEFAULT_CUSTOMERS.length);
      toast.success("Data berhasil direset ke standar demo.");
    }
  };

  // Unified Search for Tracking & Warranty (Tickets SRV-... and Invoices INV-...)
  const handleSearchTracking = async (
    query: string
  ): Promise<{ ticket?: ServiceTicket | null; transaction?: Transaction | null } | null> => {
    const q = query.trim().toLowerCase();
    const cleanPhone = q.replace(/[^0-9]/g, "");

    // 1. Check in-memory state first
    const matchTicket = tickets.find((s) => {
      const matchT = s.ticketNumber.toLowerCase() === q || s.id.toLowerCase() === q;
      const matchP = cleanPhone.length >= 7 && s.customerPhone && s.customerPhone.replace(/[^0-9]/g, "").includes(cleanPhone);
      const matchS = s.serialNumber && s.serialNumber.toLowerCase() === q;
      return matchT || matchP || matchS;
    });

    const matchTx = transactions.find((t) => {
      const matchI = t.invoiceNumber.toLowerCase() === q || t.id.toLowerCase() === q;
      const matchP = cleanPhone.length >= 7 && t.customerPhone && t.customerPhone.replace(/[^0-9]/g, "").includes(cleanPhone);
      return matchI || matchP;
    });

    if (matchTicket || matchTx) {
      return { ticket: matchTicket || null, transaction: matchTx || null };
    }

    // 2. Query server
    try {
      const res = await axios.get(`/api/track/${encodeURIComponent(query)}`);
      if (res.data) {
        return res.data;
      }
    } catch (e) {
      try {
        const res = await axios.get(`/api/services/track/${encodeURIComponent(query)}`);
        if (res.data) {
          if (res.data.invoiceNumber) {
            return { transaction: res.data };
          }
          return { ticket: res.data };
        }
      } catch (err) {}
    }

    return null;
  };

  // Search Ticket (for Public Tracking)
  const handleSearchTicket = async (query: string): Promise<ServiceTicket | null> => {
    const res = await handleSearchTracking(query);
    if (res && res.ticket) return res.ticket;
    return null;
  };

  // QR Code Scanner Action
  const handleQRScanSuccess = async (scannedCode: string) => {
    setIsQRScannerOpen(false);
    try {
      const result = await handleSearchTracking(scannedCode);
      if (result && (result.ticket || result.transaction)) {
        setPrefilledTicketForTracking(result.ticket || null);
        setPrefilledTransactionForTracking(result.transaction || null);
        setCurrentTab("tracking");
        if (result.transaction) {
          toast.success(`Faktur ${result.transaction.invoiceNumber} berhasil dideteksi dari QR Code!`);
        } else if (result.ticket) {
          toast.success(`Tiket ${result.ticket.ticketNumber} berhasil dideteksi dari QR Code!`);
        }
      } else {
        toast.error(`QR Code terdeteksi: "${scannedCode}". Data tidak ditemukan.`);
      }
    } catch (err: any) {
      toast.error(`QR Code terdeteksi: "${scannedCode}". Data tidak ditemukan di sistem.`);
    }
  };

  // Handlers for cross-view navigation
  const handleOpenTicketDetailFromExternal = (ticket: ServiceTicket) => {
    setSelectedTicketForDetail(ticket);
    setCurrentTab("services");
  };

  const handleSettleServiceInPOS = (ticket: ServiceTicket) => {
    setPreloadedTicketForPOS(ticket);
    setCurrentTab("pos");
  };

  const activeTicketsCount = tickets.filter((t) => t.status !== "completed" && t.status !== "cancelled").length;
  const readyTicketsCount = tickets.filter((t) => t.status === "ready").length;

  // Helper to determine print format automatically for transactions:
  // - Laptop Baru, Laptop Bekas, & Servis -> continuous (Form Continuous 1 Rangkap)
  // - Sparepart & Aksesoris -> thermal (Struk Kasir POS 58mm / 80mm)
  const getFormatForTransaction = (tx: Transaction): PrintFormat => {
    const hasLaptopOrService = tx.items.some((item) => {
      if (item.isService || item.serviceTicketId || item.conditionGrade) return true;
      const p = products.find((prod) => prod.id === item.productId);
      if (p && (p.category === "laptop_baru" || p.category === "laptop_bekas" || p.category === "jasa")) return true;
      const nameLower = (item.name || "").toLowerCase();
      if (
        nameLower.includes("laptop") ||
        nameLower.includes("notebook") ||
        nameLower.includes("macbook") ||
        nameLower.includes("servis") ||
        nameLower.includes("service")
      ) {
        return true;
      }
      return false;
    });
    return hasLaptopOrService ? "continuous" : "thermal";
  };

  // VIEW MODE 1: DEDICATED CUSTOMER LANDING PAGE FOR SERVICE & WARRANTY TRACKING (WITHOUT LOGIN)
  if (isCustomerTrackingDirect) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-blue-600 selection:text-white">
        <Toaster position="top-right" richColors />

        {/* Customer Dedicated Landing Page */}
        <CustomerLandingPage
          onSearchTicket={handleSearchTicket}
          onSearchTracking={handleSearchTracking}
          onOpenQRScanner={() => setIsQRScannerOpen(true)}
          onOpenLoginStaff={() => setIsCustomerTrackingDirect(false)}
          onPrintTicket={(ticket) => {
            setReceiptModal({
              isOpen: true,
              mode: ticket.status === "ready" || ticket.status === "completed" ? "invoice_service" : "intake_service",
              ticket: ticket,
              transaction: null,
              defaultFormat: "continuous"
            });
          }}
          onPrintTransaction={(tx) => {
            const autoFormat = getFormatForTransaction(tx);
            setReceiptModal({
              isOpen: true,
              mode: "pos_transaction",
              transaction: tx,
              ticket: null,
              defaultFormat: autoFormat
            });
          }}
          settings={settings}
          prefilledTicket={prefilledTicketForTracking}
          prefilledTransaction={prefilledTransactionForTracking}
        />

        {/* QR Scanner for Customer */}
        <QRScannerModal
          isOpen={isQRScannerOpen}
          onClose={() => setIsQRScannerOpen(false)}
          onScanSuccess={handleQRScanSuccess}
        />

        {/* Printable Receipt Modal (1 Rangkap & Stiker Tempel) */}
        {receiptModal.isOpen && (
          <ReceiptModal
            isOpen={receiptModal.isOpen}
            onClose={() => setReceiptModal((prev) => ({ ...prev, isOpen: false }))}
            mode={receiptModal.mode}
            ticket={receiptModal.ticket}
            transaction={receiptModal.transaction}
            settings={settings}
            currentUser={currentUser}
            users={users}
            products={products}
            defaultFormat={receiptModal.defaultFormat}
          />
        )}
      </div>
    );
  }

  // VIEW MODE 2: LOGIN VIEW (IF NOT AUTHENTICATED)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-blue-600 selection:text-white">
        <Toaster position="top-right" richColors />
        
        <LoginView
          users={users}
          settings={settings}
          onLogin={handleLogin}
          onOpenCustomerTracking={() => setIsCustomerTrackingDirect(true)}
        />

        {/* QR Scanner */}
        <QRScannerModal
          isOpen={isQRScannerOpen}
          onClose={() => setIsQRScannerOpen(false)}
          onScanSuccess={handleQRScanSuccess}
        />
      </div>
    );
  }

  // VIEW MODE 3: AUTHENTICATED STAFF APP DASHBOARD & SYSTEM
  return (
    <div className="min-h-screen bg-background text-foreground flex selection:bg-blue-600 selection:text-white font-sans antialiased">
      <Toaster position="top-right" richColors />

      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        settings={settings}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        activeTicketsCount={activeTicketsCount}
        readyTicketsCount={readyTicketsCount}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        currentUser={currentUser}
        onOpenSwitchUserModal={openSwitchUserModal}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <TopBar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onOpenMobileMenu={() => setIsOpenMobile(true)}
          onOpenQRScanner={() => setIsQRScannerOpen(true)}
          settings={settings}
          activeTicketsCount={activeTicketsCount}
          currentUser={currentUser}
          users={users}
          onOpenSwitchUserModal={openSwitchUserModal}
          onLogout={handleLogout}
        />

        {/* View Routing with Role Guard */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {/* If the current user's role cannot access the active tab, display access restricted notice */}
          {!isTabAllowedForRole(currentTab, currentUser.role) && (
            <div className="p-8 max-w-lg mx-auto my-12 bg-card border border-amber-200 dark:border-amber-900/60 rounded-3xl text-center space-y-4 shadow-lg animate-in fade-in">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-600 flex items-center justify-center">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-foreground">Menu Akses Terbatas</h2>
                <p className="text-xs text-muted-foreground">
                  Akun Anda (<strong>{currentUser.name}</strong> - {getUserRoleConfig(currentUser.role).label}) tidak memiliki hak akses untuk membuka menu ini.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentTab(getDefaultTabForRole(currentUser.role))}
                  className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Buka Menu Utama ({getUserRoleConfig(currentUser.role).label})
                </button>
                <button
                  onClick={() => openSwitchUserModal()}
                  className="w-full sm:w-auto px-4 py-2.5 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Ganti Akun Lain
                </button>
              </div>
            </div>
          )}

          {isTabAllowedForRole(currentTab, currentUser.role) && currentTab === "dashboard" && (
            <DashboardView
              stats={stats}
              tickets={tickets}
              onOpenNewTicket={() => {
                setCurrentTab("services");
                setSelectedTicketForDetail(null);
              }}
              onNavigate={setCurrentTab}
              onSelectTicket={handleOpenTicketDetailFromExternal}
            />
          )}

          {isTabAllowedForRole(currentTab, currentUser.role) && currentTab === "services" && (
            <ServiceManagementView
              tickets={tickets}
              products={products}
              customers={customers}
              users={users}
              currentUser={currentUser}
              onCreateTicket={handleCreateTicket}
              onUpdateTicket={handleUpdateTicket}
              onDeleteTicket={handleDeleteTicket}
              onSaveCustomer={handleSaveCustomer}
              onPrintTicket={(ticket, mode, format) => {
                setReceiptModal({
                  isOpen: true,
                  mode: mode === "invoice" ? "invoice_service" : "intake_service",
                  ticket,
                  transaction: null,
                  defaultFormat: format || "continuous"
                });
              }}
              onPayInPOS={handleSettleServiceInPOS}
              selectedTicketForDetail={selectedTicketForDetail}
              onCloseDetail={() => setSelectedTicketForDetail(null)}
            />
          )}

          {isTabAllowedForRole(currentTab, currentUser.role) && currentTab === "pos" && (
            <POSView
              products={products}
              readyTickets={tickets.filter((t) => t.status === "ready")}
              onProcessTransaction={handlePOSCheckout}
              onPrintTransaction={(tx) => {
                const autoFormat = getFormatForTransaction(tx);
                setReceiptModal({
                  isOpen: true,
                  mode: "pos_transaction",
                  transaction: tx,
                  ticket: null,
                  defaultFormat: autoFormat
                });
              }}
              recentTransactions={transactions}
              preloadedTicket={preloadedTicketForPOS}
              onClearPreloadedTicket={() => setPreloadedTicketForPOS(null)}
              onNavigateToHistory={() => setCurrentTab("transactions")}
            />
          )}

          {isTabAllowedForRole(currentTab, currentUser.role) && currentTab === "transactions" && (
            <TransactionHistoryView
              transactions={transactions}
              tickets={tickets}
              products={products}
              currentUser={currentUser}
              settings={settings}
              onDeleteTransaction={handleDeleteTransaction}
              onPrintTransaction={(tx) => {
                const autoFormat = getFormatForTransaction(tx);
                setReceiptModal({
                  isOpen: true,
                  mode: "pos_transaction",
                  transaction: tx,
                  ticket: null,
                  defaultFormat: autoFormat
                });
              }}
              onNavigateToPOS={() => setCurrentTab("pos")}
            />
          )}

          {isTabAllowedForRole(currentTab, currentUser.role) && currentTab === "inventory" && (
            <InventoryView
              products={products}
              onCreateProduct={handleCreateProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {isTabAllowedForRole(currentTab, currentUser.role) && currentTab === "customers" && (
            <CustomersView
              customers={customers}
              tickets={tickets}
              transactions={transactions}
              currentUser={currentUser}
              onSaveCustomer={handleSaveCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onSelectCustomerForService={(cust) => {
                setCurrentTab("services");
              }}
              onSelectCustomerForPOS={(cust) => {
                setCurrentTab("pos");
              }}
            />
          )}

          {isTabAllowedForRole(currentTab, currentUser.role) && (currentTab === "reports" || currentTab === "financial") && (
            <FinancialReportsView
              tickets={tickets}
              products={products}
              transactions={transactions}
              expenses={expenses}
              settings={settings}
              users={users}
              currentUser={currentUser}
              onSaveExpense={handleSaveExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {isTabAllowedForRole(currentTab, currentUser.role) && currentTab === "users" && (
            <UsersView
              users={users}
              currentUser={currentUser}
              onOpenSwitchUserModal={openSwitchUserModal}
              onLogout={handleLogout}
              setCurrentUser={handleSwitchUser}
              onCreateUser={handleCreateUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {isTabAllowedForRole(currentTab, currentUser.role) && currentTab === "tracking" && (
            <CustomerLandingPage
              onSearchTicket={handleSearchTicket}
              onSearchTracking={handleSearchTracking}
              onOpenQRScanner={() => setIsQRScannerOpen(true)}
              onOpenLoginStaff={() => setCurrentTab(getDefaultTabForRole(currentUser.role))}
              onPrintTicket={(ticket) => {
                setReceiptModal({
                  isOpen: true,
                  mode: ticket.status === "ready" || ticket.status === "completed" ? "invoice_service" : "intake_service",
                  ticket: ticket,
                  transaction: null,
                  defaultFormat: "continuous"
                });
              }}
              onPrintTransaction={(tx) => {
                const autoFormat = getFormatForTransaction(tx);
                setReceiptModal({
                  isOpen: true,
                  mode: "pos_transaction",
                  transaction: tx,
                  ticket: null,
                  defaultFormat: autoFormat
                });
              }}
              settings={settings}
              prefilledTicket={prefilledTicketForTracking}
              prefilledTransaction={prefilledTransactionForTracking}
            />
          )}

          {isTabAllowedForRole(currentTab, currentUser.role) && currentTab === "settings" && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onRestoreBackup={handleRestoreBackup}
              onResetDefaultData={handleResetDefaultData}
              counts={{
                tickets: tickets.length,
                products: products.length,
                transactions: transactions.length,
                users: users.length
              }}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="no-print border-t border-border bg-card/60 py-4 px-4 sm:px-6 text-xs text-muted-foreground mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              © {new Date().getFullYear()} {settings.storeName} — POS & Service Management System (Siap Online Vercel)
            </span>
            <div className="flex items-center space-x-4 text-[11px]">
              {isTabAllowedForRole("users", currentUser.role) && (
                <>
                  <button
                    onClick={() => setCurrentTab("users")}
                    className="hover:text-blue-600 font-medium transition-colors cursor-pointer"
                  >
                    Pengguna & Tim
                  </button>
                  <span>•</span>
                </>
              )}
              <button
                onClick={() => setCurrentTab("tracking")}
                className="hover:text-blue-600 font-medium transition-colors cursor-pointer"
              >
                Portal Konsumen
              </button>
              {isTabAllowedForRole("settings", currentUser.role) && (
                <>
                  <span>•</span>
                  <button
                    onClick={() => setCurrentTab("settings")}
                    className="hover:text-blue-600 font-medium transition-colors cursor-pointer"
                  >
                    Pengaturan & Backup
                  </button>
                </>
              )}
              <span>•</span>
              <button
                onClick={() => openSwitchUserModal()}
                className="hover:text-blue-600 font-medium transition-colors cursor-pointer"
              >
                Ganti Akun
              </button>
              <span>•</span>
              <button
                onClick={handleLogout}
                className="hover:text-red-500 font-medium transition-colors cursor-pointer"
              >
                Keluar
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Switch User Modal with Password / PIN Verification */}
      {switchUserModal.isOpen && (
        <SwitchUserModal
          isOpen={switchUserModal.isOpen}
          onClose={() => setSwitchUserModal({ isOpen: false, targetUser: null })}
          users={users}
          currentUser={currentUser}
          targetUserInitial={switchUserModal.targetUser}
          onSwitchUser={handleSwitchUser}
          onLogout={handleLogout}
        />
      )}

      {/* Print / Receipt Modal */}
      {receiptModal.isOpen && (
        <ReceiptModal
          isOpen={receiptModal.isOpen}
          onClose={() => setReceiptModal((prev) => ({ ...prev, isOpen: false }))}
          mode={receiptModal.mode}
          ticket={receiptModal.ticket}
          transaction={receiptModal.transaction}
          settings={settings}
          currentUser={currentUser}
          users={users}
          products={products}
          defaultFormat={receiptModal.defaultFormat}
        />
      )}

      {/* QR Code Scanner Camera Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={handleQRScanSuccess}
      />
    </div>
  );
}

export default App;
