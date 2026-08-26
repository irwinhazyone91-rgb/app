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
  User
} from "./types";
import {
  loadPersistentData,
  savePersistentTickets,
  savePersistentProducts,
  savePersistentTransactions,
  savePersistentSettings,
  savePersistentUsers,
  computeDashboardStats,
  importDatabaseBackup,
  DEFAULT_SETTINGS,
  DEFAULT_USERS,
  DEFAULT_PRODUCTS,
  DEFAULT_TICKETS,
  DEFAULT_TRANSACTIONS
} from "./lib/storage";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { DashboardView } from "./components/DashboardView";
import { ServiceManagementView } from "./components/ServiceManagementView";
import { POSView } from "./components/POSView";
import { InventoryView } from "./components/InventoryView";
import { CustomerLandingPage } from "./components/CustomerLandingPage";
import { SettingsView } from "./components/SettingsView";
import { UsersView } from "./components/UsersView";
import { ReceiptModal, PrintFormat } from "./components/ReceiptModal";
import { QRScannerModal } from "./components/QRScannerModal";
import { LoginView } from "./components/LoginView";

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
  const [users, setUsers] = useState<User[]>(initialData.users);
  const [settings, setSettings] = useState<StoreSettings>(initialData.settings);

  const [stats, setStats] = useState<DashboardStats>(() =>
    computeDashboardStats(initialData.tickets, initialData.products, initialData.transactions)
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

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setIsCustomerTrackingDirect(false);
    localStorage.setItem("servisku_active_user", JSON.stringify(user));
    localStorage.setItem("servisku_is_authenticated", "true");
    toast.success(`Selamat datang, ${user.name}! Masuk sebagai ${user.role.toUpperCase()}`);
  };

  const handleLogout = () => {
    // Only clears login session, keeps all user records, tickets, POS transactions, & inventory 100% safe
    setIsAuthenticated(false);
    setIsCustomerTrackingDirect(false);
    localStorage.removeItem("servisku_is_authenticated");
    toast.info("Anda telah keluar dari sesi aplikasi. Data Anda tetap tersimpan dengan aman.");
  };

  const handleSetCurrentUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("servisku_active_user", JSON.stringify(user));
    toast.success(`Beralih ke akun: ${user.name} (${user.role.toUpperCase()})`);
  };

  // Recalculate stats whenever tickets, products, or transactions change
  const refreshStats = useCallback((
    currentTickets: ServiceTicket[],
    currentProducts: Product[],
    currentTransactions: Transaction[]
  ) => {
    const newStats = computeDashboardStats(currentTickets, currentProducts, currentTransactions);
    setStats(newStats);
  }, []);

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

  // Load Initial Data from API and sync with local storage if available
  const loadAllData = async () => {
    try {
      const [resStats, resTickets, resProducts, resTx, resSettings, resUsers] = await Promise.all([
        axios.get("/api/stats").catch(() => ({ data: null })),
        axios.get("/api/services").catch(() => ({ data: null })),
        axios.get("/api/products").catch(() => ({ data: null })),
        axios.get("/api/transactions").catch(() => ({ data: null })),
        axios.get("/api/settings").catch(() => ({ data: null })),
        axios.get("/api/users").catch(() => ({ data: null }))
      ]);

      if (resTickets?.data && Array.isArray(resTickets.data) && resTickets.data.length > 0) {
        setTickets(resTickets.data);
        savePersistentTickets(resTickets.data);
      }
      if (resProducts?.data && Array.isArray(resProducts.data) && resProducts.data.length > 0) {
        setProducts(resProducts.data);
        savePersistentProducts(resProducts.data);
      }
      if (resTx?.data && Array.isArray(resTx.data) && resTx.data.length > 0) {
        setTransactions(resTx.data);
        savePersistentTransactions(resTx.data);
      }
      if (resSettings?.data && resSettings.data.storeName) {
        setSettings(resSettings.data);
        savePersistentSettings(resSettings.data);
      }
      if (resUsers?.data && Array.isArray(resUsers.data) && resUsers.data.length > 0) {
        setUsers(resUsers.data);
        savePersistentUsers(resUsers.data);
      }
      if (resStats?.data) {
        setStats(resStats.data);
      }
    } catch (err) {
      // Fallback to local storage is already active
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // CRUD Users
  const handleCreateUser = async (userData: Partial<User>) => {
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: userData.name || "Staf Baru",
      username: userData.username || (userData.name || "user").toLowerCase().replace(/\s+/g, "_"),
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
      await axios.post("/api/users", userData);
    } catch (e) {
      // Offline fallback
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

    try {
      await axios.put(`/api/users/${id}`, userData);
    } catch (e) {
      // Offline fallback
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
      await axios.delete(`/api/users/${id}`);
    } catch (e) {
      // Offline fallback
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
    refreshStats(updated, products, transactions);

    toast.success(`Tiket servis ${newTicket.ticketNumber} berhasil didaftarkan! Data tersimpan.`);

    // Auto open print modal for intake continuous form (21cm x 15cm)
    setReceiptModal({
      isOpen: true,
      mode: "intake_service",
      ticket: newTicket,
      transaction: null,
      defaultFormat: "continuous"
    });

    try {
      await axios.post("/api/services", ticketData);
    } catch (e) {
      // Offline fallback
    }
  };

  const handleUpdateTicket = async (id: string, ticketData: Partial<ServiceTicket>) => {
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
        return mod;
      }
      return t;
    });

    setTickets(updated);
    savePersistentTickets(updated);
    refreshStats(updated, products, transactions);
    toast.success("Status tiket servis berhasil diperbarui!");

    try {
      await axios.put(`/api/services/${id}`, ticketData);
    } catch (e) {
      // Offline fallback
    }
  };

  const handleDeleteTicket = async (id: string) => {
    const updated = tickets.filter((t) => t.id !== id && t.ticketNumber !== id);
    setTickets(updated);
    savePersistentTickets(updated);
    refreshStats(updated, products, transactions);
    toast.success("Tiket servis berhasil dihapus.");

    try {
      await axios.delete(`/api/services/${id}`);
    } catch (e) {
      // Offline fallback
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
      stock: Number(productData.stock) || 0,
      minStock: Number(productData.minStock) || 2,
      unit: productData.unit || "Pcs",
      description: productData.description || ""
    };

    const updated = [newProduct, ...products];
    setProducts(updated);
    savePersistentProducts(updated);
    refreshStats(tickets, updated, transactions);
    toast.success(`Item "${newProduct.name}" berhasil ditambahkan ke inventaris.`);

    try {
      await axios.post("/api/products", productData);
    } catch (e) {
      // Offline fallback
    }
  };

  const handleUpdateProduct = async (id: string, productData: Partial<Product>) => {
    const updated = products.map((p) => (p.id === id ? { ...p, ...productData } : p));
    setProducts(updated);
    savePersistentProducts(updated);
    refreshStats(tickets, updated, transactions);
    toast.success("Data inventaris berhasil diupdate.");

    try {
      await axios.put(`/api/products/${id}`, productData);
    } catch (e) {
      // Offline fallback
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    savePersistentProducts(updated);
    refreshStats(tickets, updated, transactions);
    toast.success("Item berhasil dihapus dari inventaris.");

    try {
      await axios.delete(`/api/products/${id}`);
    } catch (e) {
      // Offline fallback
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
    for (const item of txData.items) {
      if (item.productId) {
        const pIndex = updatedProducts.findIndex((p) => p.id === item.productId);
        if (pIndex !== -1 && updatedProducts[pIndex].category !== "jasa") {
          updatedProducts[pIndex].stock = Math.max(0, updatedProducts[pIndex].stock - (item.qty || 1));
        }
      }
    }
    setProducts(updatedProducts);
    savePersistentProducts(updatedProducts);

    // If transaction settled a service ticket, mark ticket as completed
    let updatedTickets = [...tickets];
    for (const item of txData.items) {
      if (item.isService && item.serviceTicketId) {
        updatedTickets = updatedTickets.map((t) => {
          if (t.id === item.serviceTicketId || t.ticketNumber === item.serviceTicketId) {
            return {
              ...t,
              status: "completed" as const,
              completedAt: now.toISOString(),
              finalCost: item.subtotal
            };
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
    refreshStats(updatedTickets, updatedProducts, updatedTx);

    toast.success(`Transaksi ${newTx.invoiceNumber} berhasil disimpan!`);

    try {
      await axios.post("/api/transactions", {
        ...txData,
        cashierName: currentUser.name || "Kasir Toko"
      });
    } catch (e) {
      // Offline fallback
    }

    return newTx;
  };

  // Settings Save
  const handleSaveSettings = async (newSettings: StoreSettings) => {
    setSettings(newSettings);
    savePersistentSettings(newSettings);
    toast.success("Pengaturan toko berhasil disimpan ke database!");

    try {
      await axios.put("/api/settings", newSettings);
    } catch (e) {
      // Offline fallback
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
      setSettings(refreshed.settings);
      setUsers(refreshed.users);
      refreshStats(refreshed.tickets, refreshed.products, refreshed.transactions);

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
      savePersistentSettings(DEFAULT_SETTINGS);
      savePersistentUsers(DEFAULT_USERS);

      setTickets(DEFAULT_TICKETS);
      setProducts(DEFAULT_PRODUCTS);
      setTransactions(DEFAULT_TRANSACTIONS);
      setSettings(DEFAULT_SETTINGS);
      setUsers(DEFAULT_USERS);
      refreshStats(DEFAULT_TICKETS, DEFAULT_PRODUCTS, DEFAULT_TRANSACTIONS);
      toast.success("Data berhasil direset ke standar demo.");
    }
  };

  // Search Ticket (for Public Tracking)
  const handleSearchTicket = async (query: string): Promise<ServiceTicket | null> => {
    const q = query.trim().toLowerCase();
    const cleanPhone = q.replace(/[^0-9]/g, "");

    // Search in persistent local memory first
    const found = tickets.find((s) => {
      const matchTicket = s.ticketNumber.toLowerCase() === q;
      const matchPhone = cleanPhone && s.customerPhone.replace(/[^0-9]/g, "").includes(cleanPhone);
      const matchSerial = s.serialNumber && s.serialNumber.toLowerCase() === q;
      return matchTicket || matchPhone || matchSerial;
    });

    if (found) return found;

    // Fallback to server search
    try {
      const res = await axios.get(`/api/services/track/${encodeURIComponent(query)}`);
      return res.data;
    } catch (e) {
      throw new Error("Data tiket tidak ditemukan");
    }
  };

  // QR Code Scanner Action
  const handleQRScanSuccess = async (scannedCode: string) => {
    setIsQRScannerOpen(false);
    try {
      const ticket = await handleSearchTicket(scannedCode);
      if (ticket) {
        setPrefilledTicketForTracking(ticket);
        setCurrentTab("tracking");
        toast.success(`Tiket ${ticket.ticketNumber} berhasil dideteksi dari QR Code!`);
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

  // VIEW MODE 1: DEDICATED CUSTOMER LANDING PAGE FOR SERVICE & WARRANTY TRACKING (WITHOUT LOGIN)
  if (isCustomerTrackingDirect) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-blue-600 selection:text-white">
        <Toaster position="top-right" richColors />

        {/* Customer Dedicated Landing Page */}
        <CustomerLandingPage
          onSearchTicket={handleSearchTicket}
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
          settings={settings}
          prefilledTicket={prefilledTicketForTracking}
        />

        {/* QR Scanner for Customer */}
        <QRScannerModal
          isOpen={isQRScannerOpen}
          onClose={() => setIsQRScannerOpen(false)}
          onScanSuccess={handleQRScanSuccess}
        />

        {/* Printable Receipt Modal (21cm x 15cm & 58mm) */}
        {receiptModal.isOpen && (
          <ReceiptModal
            isOpen={receiptModal.isOpen}
            onClose={() => setReceiptModal((prev) => ({ ...prev, isOpen: false }))}
            mode={receiptModal.mode}
            ticket={receiptModal.ticket}
            transaction={receiptModal.transaction}
            settings={settings}
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
          setCurrentUser={handleSetCurrentUser}
          onLogout={handleLogout}
        />

        {/* View Routing */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {currentTab === "dashboard" && (
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

          {currentTab === "services" && (
            <ServiceManagementView
              tickets={tickets}
              products={products}
              users={users}
              onCreateTicket={handleCreateTicket}
              onUpdateTicket={handleUpdateTicket}
              onDeleteTicket={handleDeleteTicket}
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

          {currentTab === "pos" && (
            <POSView
              products={products}
              readyTickets={tickets.filter(
                (t) => t.status === "ready" || t.status === "completed" || t.status === "in_progress"
              )}
              onProcessTransaction={handlePOSCheckout}
              onPrintTransaction={(tx) => {
                setReceiptModal({
                  isOpen: true,
                  mode: "pos_transaction",
                  transaction: tx,
                  ticket: null,
                  defaultFormat: "thermal"
                });
              }}
              recentTransactions={transactions}
              preloadedTicket={preloadedTicketForPOS}
              onClearPreloadedTicket={() => setPreloadedTicketForPOS(null)}
            />
          )}

          {currentTab === "inventory" && (
            <InventoryView
              products={products}
              onCreateProduct={handleCreateProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {currentTab === "users" && (
            <UsersView
              users={users}
              currentUser={currentUser}
              setCurrentUser={handleSetCurrentUser}
              onCreateUser={handleCreateUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {currentTab === "tracking" && (
            <CustomerLandingPage
              onSearchTicket={handleSearchTicket}
              onOpenQRScanner={() => setIsQRScannerOpen(true)}
              onOpenLoginStaff={() => setCurrentTab("dashboard")}
              onPrintTicket={(ticket) => {
                setReceiptModal({
                  isOpen: true,
                  mode: ticket.status === "ready" || ticket.status === "completed" ? "invoice_service" : "intake_service",
                  ticket: ticket,
                  transaction: null,
                  defaultFormat: "continuous"
                });
              }}
              settings={settings}
              prefilledTicket={prefilledTicketForTracking}
            />
          )}

          {currentTab === "settings" && (
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
              <button
                onClick={() => setCurrentTab("users")}
                className="hover:text-blue-600 font-medium transition-colors cursor-pointer"
              >
                Pengguna & Tim
              </button>
              <span>•</span>
              <button
                onClick={() => setCurrentTab("tracking")}
                className="hover:text-blue-600 font-medium transition-colors cursor-pointer"
              >
                Portal Konsumen
              </button>
              <span>•</span>
              <button
                onClick={() => setCurrentTab("settings")}
                className="hover:text-blue-600 font-medium transition-colors cursor-pointer"
              >
                Pengaturan & Backup
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

      {/* Print / Receipt Modal */}
      {receiptModal.isOpen && (
        <ReceiptModal
          isOpen={receiptModal.isOpen}
          onClose={() => setReceiptModal((prev) => ({ ...prev, isOpen: false }))}
          mode={receiptModal.mode}
          ticket={receiptModal.ticket}
          transaction={receiptModal.transaction}
          settings={settings}
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
