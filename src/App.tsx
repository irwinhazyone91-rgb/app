import React, { useState, useEffect } from "react";
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
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { DashboardView } from "./components/DashboardView";
import { ServiceManagementView } from "./components/ServiceManagementView";
import { POSView } from "./components/POSView";
import { InventoryView } from "./components/InventoryView";
import { PublicTrackingView } from "./components/PublicTrackingView";
import { CustomerLandingPage } from "./components/CustomerLandingPage";
import { SettingsView } from "./components/SettingsView";
import { UsersView } from "./components/UsersView";
import { ReceiptModal, PrintFormat } from "./components/ReceiptModal";
import { QRScannerModal } from "./components/QRScannerModal";
import { LoginView } from "./components/LoginView";
import { ArrowLeft, Lock, Wrench, Search, Laptop } from "lucide-react";

export function App() {
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("servisku_theme") === "dark";
  });

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("servisku_is_authenticated") === "true";
  });
  const [isCustomerTrackingDirect, setIsCustomerTrackingDirect] = useState<boolean>(false);

  // Main Data States
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([
    {
      id: "usr-1",
      name: "H. Suwandi",
      username: "owner",
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
      role: "cashier",
      phone: "081322334455",
      email: "maya@servisku.com",
      status: "active",
      specialization: "Front Office & Transaksi POS",
      notes: "Kasir & Pelayanan Pelanggan"
    }
  ]);

  // Current Active User
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem("servisku_active_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      id: "usr-1",
      name: "H. Suwandi",
      username: "owner",
      role: "owner",
      phone: "081234567890",
      email: "suwandi@servisku.com",
      status: "active",
      specialization: "Owner & Manajemen Toko"
    };
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
    setIsAuthenticated(false);
    setIsCustomerTrackingDirect(false);
    localStorage.removeItem("servisku_is_authenticated");
    toast.info("Anda telah keluar dari sesi aplikasi.");
  };

  const handleSetCurrentUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("servisku_active_user", JSON.stringify(user));
    toast.success(`Beralih ke akun: ${user.name} (${user.role.toUpperCase()})`);
  };

  const [settings, setSettings] = useState<StoreSettings>({
    storeName: "ServisKu Computer",
    tagline: "Pusat Service Komputer, Laptop & Penjualan Sparepart",
    address: "Jl. Pemuda No. 88, Kota Semarang, Jawa Tengah",
    phone: "024-87654321",
    whatsapp: "6281234567890",
    receiptFooter: "Terima kasih atas kepercayaan Anda. Harap simpan nota ini sebagai bukti garansi yang sah.",
    warrantyTerms: "Garansi servis berlaku sesuai catatan nota. Tidak berlaku untuk kerusakan fisik, terkena cairan, atau segel rusak."
  });

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

  // Load Initial Data from API
  const loadAllData = async () => {
    try {
      const [resStats, resTickets, resProducts, resTx, resSettings, resUsers] = await Promise.all([
        axios.get("/api/stats"),
        axios.get("/api/services"),
        axios.get("/api/products"),
        axios.get("/api/transactions"),
        axios.get("/api/settings"),
        axios.get("/api/users").catch(() => ({ data: null }))
      ]);

      if (resStats.data) setStats(resStats.data);
      if (resTickets.data) setTickets(resTickets.data);
      if (resProducts.data) setProducts(resProducts.data);
      if (resTx.data) setTransactions(resTx.data);
      if (resSettings.data) setSettings(resSettings.data);
      if (resUsers && resUsers.data && resUsers.data.length > 0) {
        setUsers(resUsers.data);
      }
    } catch (err) {
      console.warn("Failed to load initial data:", err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // CRUD Users
  const handleCreateUser = async (userData: Partial<User>) => {
    try {
      const res = await axios.post("/api/users", userData);
      const newUser: User = res.data;
      setUsers((prev) => [...prev, newUser]);
      toast.success(`Pengguna "${newUser.name}" berhasil didaftarkan!`);
      loadAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Gagal membuat pengguna baru.");
    }
  };

  const handleUpdateUser = async (id: string, userData: Partial<User>) => {
    try {
      const res = await axios.put(`/api/users/${id}`, userData);
      const updatedUser: User = res.data;
      setUsers((prev) => prev.map((u) => (u.id === id ? updatedUser : u)));
      if (currentUser.id === id) {
        setCurrentUser(updatedUser);
        localStorage.setItem("servisku_active_user", JSON.stringify(updatedUser));
      }
      toast.success(`Profil "${updatedUser.name}" berhasil diperbarui!`);
      loadAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Gagal memperbarui data pengguna.");
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await axios.delete(`/api/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("Pengguna berhasil dihapus.");
      loadAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Gagal menghapus pengguna.");
    }
  };

  // CRUD Service Tickets
  const handleCreateTicket = async (ticketData: Partial<ServiceTicket>) => {
    try {
      const res = await axios.post("/api/services", ticketData);
      const newTicket: ServiceTicket = res.data;
      setTickets((prev) => [newTicket, ...prev]);
      toast.success(`Tiket servis ${newTicket.ticketNumber} berhasil didaftarkan!`);
      
      // Auto open print modal for intake continuous form
      setReceiptModal({
        isOpen: true,
        mode: "intake_service",
        ticket: newTicket,
        transaction: null,
        defaultFormat: "continuous"
      });

      loadAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Gagal membuat tiket servis.");
    }
  };

  const handleUpdateTicket = async (id: string, ticketData: Partial<ServiceTicket>) => {
    try {
      const res = await axios.put(`/api/services/${id}`, ticketData);
      const updated: ServiceTicket = res.data;
      setTickets((prev) => prev.map((t) => (t.id === id || t.ticketNumber === id ? updated : t)));
      toast.success(`Tiket servis ${updated.ticketNumber} berhasil diperbarui.`);
      loadAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Gagal mengupdate tiket servis.");
    }
  };

  const handleDeleteTicket = async (id: string) => {
    try {
      await axios.delete(`/api/services/${id}`);
      setTickets((prev) => prev.filter((t) => t.id !== id && t.ticketNumber !== id));
      toast.success("Tiket servis berhasil dihapus.");
      loadAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Gagal menghapus tiket servis.");
    }
  };

  // CRUD Products / Inventory
  const handleCreateProduct = async (productData: Partial<Product>) => {
    try {
      const res = await axios.post("/api/products", productData);
      setProducts((prev) => [res.data, ...prev]);
      toast.success(`Item "${res.data.name}" berhasil ditambahkan.`);
      loadAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Gagal menambah produk.");
    }
  };

  const handleUpdateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      const res = await axios.put(`/api/products/${id}`, productData);
      setProducts((prev) => prev.map((p) => (p.id === id ? res.data : p)));
      toast.success(`Item "${res.data.name}" berhasil diupdate.`);
      loadAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Gagal update produk.");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await axios.delete(`/api/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Item berhasil dihapus dari inventaris.");
      loadAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Gagal menghapus item.");
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
    try {
      const res = await axios.post("/api/transactions", {
        ...txData,
        cashierName: currentUser.name || "Kasir Toko"
      });
      const newTx: Transaction = res.data;
      setTransactions((prev) => [newTx, ...prev]);

      // If transaction settled a service ticket, mark ticket as completed
      for (const item of txData.items) {
        if (item.isService && item.serviceTicketId) {
          await axios.put(`/api/services/${item.serviceTicketId}`, {
            status: "completed",
            finalCost: item.subtotal
          });
        }
      }

      toast.success(`Transaksi ${newTx.invoiceNumber} berhasil disimpan!`);
      loadAllData();
      return newTx;
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Gagal memproses transaksi kasir.");
      throw err;
    }
  };

  // Settings Save
  const handleSaveSettings = async (newSettings: StoreSettings) => {
    try {
      const res = await axios.put("/api/settings", newSettings);
      setSettings(res.data);
      toast.success("Pengaturan toko berhasil disimpan!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Gagal menyimpan pengaturan.");
    }
  };

  // Search Ticket (for Public Tracking)
  const handleSearchTicket = async (query: string) => {
    const res = await axios.get(`/api/services/track/${encodeURIComponent(query)}`);
    return res.data;
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

  const handlePayInPOS = (ticket: ServiceTicket) => {
    setPreloadedTicketForPOS(ticket);
    setCurrentTab("pos");
  };

  const activeTicketsCount = tickets.filter(
    (t) => t.status !== "completed" && t.status !== "cancelled"
  ).length;

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

  // VIEW MODE 2: LOGIN SCREEN BEFORE ACCESSING APP
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Toaster position="top-right" richColors />
        <LoginView
          onLogin={handleLogin}
          onOpenCustomerTracking={() => setIsCustomerTrackingDirect(true)}
          users={users}
          settings={settings}
        />
      </div>
    );
  }

  // VIEW MODE 3: AUTHENTICATED STAFF APP DASHBOARD & POS
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row antialiased selection:bg-blue-600 selection:text-white">
      <Toaster position="top-right" richColors />

      {/* Left Sidebar Menu */}
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
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
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

        {/* Dynamic Views based on active currentTab */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {currentTab === "dashboard" && (
            <DashboardView
              stats={stats}
              tickets={tickets}
              onNavigate={(tab) => setCurrentTab(tab)}
              onOpenNewTicket={() => {
                setCurrentTab("services");
              }}
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
              onPrintTicket={(t, m, format) => {
                setReceiptModal({
                  isOpen: true,
                  mode: m === "invoice" ? "invoice_service" : "intake_service",
                  ticket: t,
                  transaction: null,
                  defaultFormat: format || "continuous"
                });
              }}
              onPayInPOS={handlePayInPOS}
              selectedTicketForDetail={selectedTicketForDetail}
              onCloseDetail={() => setSelectedTicketForDetail(null)}
            />
          )}

          {currentTab === "pos" && (
            <POSView
              products={products}
              readyTickets={tickets.filter((t) => t.status === "ready" || t.status === "waiting_approval" || t.status === "in_progress")}
              onProcessTransaction={handlePOSCheckout}
              onPrintTransaction={(tx) => {
                setReceiptModal({
                  isOpen: true,
                  mode: "pos_transaction",
                  ticket: null,
                  transaction: tx,
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
            />
          )}
        </main>

        {/* Footer */}
        <footer className="no-print border-t border-border bg-card/60 py-4 px-4 sm:px-6 text-xs text-muted-foreground mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              © {new Date().getFullYear()} {settings.storeName} — POS & Service Management
            </span>
            <div className="flex items-center space-x-4 text-[11px]">
              <button
                onClick={() => setCurrentTab("users")}
                className="hover:text-blue-600 font-medium transition-colors"
              >
                Pengguna & Tim
              </button>
              <span>•</span>
              <button
                onClick={() => setCurrentTab("tracking")}
                className="hover:text-blue-600 font-medium transition-colors"
              >
                Cek Status Servis
              </button>
              <span>•</span>
              <button
                onClick={() => setCurrentTab("settings")}
                className="hover:text-blue-600 font-medium transition-colors"
              >
                Pengaturan Toko
              </button>
              <span>•</span>
              <button
                onClick={handleLogout}
                className="hover:text-red-500 font-medium transition-colors"
              >
                Keluar
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Print / Receipt Modal */}
      <ReceiptModal
        isOpen={receiptModal.isOpen}
        onClose={() => setReceiptModal({ ...receiptModal, isOpen: false })}
        mode={receiptModal.mode}
        ticket={receiptModal.ticket}
        transaction={receiptModal.transaction}
        settings={settings}
        defaultFormat={receiptModal.defaultFormat}
      />

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
