import React, { useState, useMemo } from "react";
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageCircle,
  MapPin,
  Mail,
  Edit2,
  Trash2,
  Wrench,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  UserCheck,
  Building,
  User as UserIcon,
  Filter,
  ArrowRight
} from "lucide-react";
import { Customer, ServiceTicket, Transaction, User } from "../types";
import { formatRupiah, formatDateIndo, createWhatsAppUrl, getStatusConfig } from "../lib/utils";
import { toast } from "sonner";

interface CustomersViewProps {
  customers: Customer[];
  tickets: ServiceTicket[];
  transactions: Transaction[];
  currentUser?: User;
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onSelectCustomerForService?: (customer: Customer) => void;
  onSelectCustomerForPOS?: (customer: Customer) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  tickets,
  transactions,
  currentUser,
  onSaveCustomer,
  onDeleteCustomer,
  onSelectCustomerForService,
  onSelectCustomerForPOS,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const canDelete =
    !currentUser || currentUser.role === "owner" || currentUser.role === "admin";

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    address: string;
    email: string;
    type: "regular" | "reseller";
    notes: string;
  }>({
    name: "",
    phone: "",
    address: "",
    email: "",
    type: "regular",
    notes: "",
  });

  // Calculate dynamic stats for customers based on actual tickets and transactions
  const customerStatsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        services: ServiceTicket[];
        transactions: Transaction[];
        totalSpent: number;
        activeWarrantiesCount: number;
      }
    >();

    customers.forEach((cust) => {
      const cleanPhone = cust.phone ? cust.phone.replace(/[^0-9]/g, "") : "";
      const custName = cust.name.toLowerCase().trim();

      // Find matched tickets
      const matchedTickets = tickets.filter((t) => {
        const tPhone = t.customerPhone ? t.customerPhone.replace(/[^0-9]/g, "") : "";
        const tName = t.customerName.toLowerCase().trim();
        if (cleanPhone && tPhone && (cleanPhone === tPhone || cleanPhone.endsWith(tPhone) || tPhone.endsWith(cleanPhone))) {
          return true;
        }
        return custName && tName === custName;
      });

      // Find matched transactions
      const matchedTx = transactions.filter((tx) => {
        const txPhone = tx.customerPhone ? tx.customerPhone.replace(/[^0-9]/g, "") : "";
        const txName = tx.customerName.toLowerCase().trim();
        if (cleanPhone && txPhone && (cleanPhone === txPhone || cleanPhone.endsWith(txPhone) || txPhone.endsWith(cleanPhone))) {
          return true;
        }
        return custName && txName === custName;
      });

      // Calculate total spent
      const serviceSpent = matchedTickets
        .filter((t) => t.status === "completed")
        .reduce((sum, t) => sum + (t.finalCost || t.estimatedCost || 0), 0);
      
      const posSpent = matchedTx.reduce((sum, tx) => sum + (tx.total || 0), 0);

      // Active warranties count
      const now = new Date();
      const activeWarranties = matchedTickets.filter((t) => {
        if (t.status !== "completed" || !t.warrantyUntil) return false;
        const exp = new Date(t.warrantyUntil);
        return exp >= now;
      }).length;

      map.set(cust.id, {
        services: matchedTickets,
        transactions: matchedTx,
        totalSpent: serviceSpent + posSpent,
        activeWarrantiesCount: activeWarranties,
      });
    });

    return map;
  }, [customers, tickets, transactions]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      const matchType = typeFilter === "all" || cust.type === typeFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        cust.name.toLowerCase().includes(q) ||
        cust.phone.includes(q) ||
        (cust.address && cust.address.toLowerCase().includes(q)) ||
        (cust.notes && cust.notes.toLowerCase().includes(q));
      return matchType && matchSearch;
    });
  }, [customers, typeFilter, searchQuery]);

  // Overview metrics
  const totalCustomersCount = customers.length;
  const resellerCount = customers.filter((c) => c.type === "reseller").length;
  const activeServiceCustomersCount = customers.filter((c) => {
    const stats = customerStatsMap.get(c.id);
    return stats && stats.services.some((t) => t.status !== "completed" && t.status !== "cancelled");
  }).length;
  const totalLifetimeValue = Array.from(customerStatsMap.values()).reduce(
    (sum, item) => sum + item.totalSpent,
    0
  );

  const handleOpenCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: "",
      phone: "",
      address: "",
      email: "",
      type: "regular",
      notes: "",
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (cust: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCustomer(cust);
    setFormData({
      name: cust.name,
      phone: cust.phone || "",
      address: cust.address || "",
      email: cust.email || "",
      type: cust.type || "regular",
      notes: cust.notes || "",
    });
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Nama pelanggan wajib diisi.");
      return;
    }

    const now = new Date().toISOString();
    if (editingCustomer) {
      const updated: Customer = {
        ...editingCustomer,
        name: formData.name.trim(),
        phone: formData.phone.trim() || "-",
        address: formData.address.trim(),
        email: formData.email.trim(),
        type: formData.type,
        notes: formData.notes.trim(),
        updatedAt: now,
      };
      onSaveCustomer(updated);
      toast.success(`Data pelanggan ${updated.name} berhasil diperbarui.`);
      if (selectedCustomer && selectedCustomer.id === updated.id) {
        setSelectedCustomer(updated);
      }
    } else {
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        name: formData.name.trim(),
        phone: formData.phone.trim() || "-",
        address: formData.address.trim(),
        email: formData.email.trim(),
        type: formData.type,
        notes: formData.notes.trim(),
        createdAt: now,
        updatedAt: now,
        totalServicesCount: 0,
        totalTransactionsCount: 0,
        totalSpent: 0,
      };
      onSaveCustomer(newCust);
      toast.success(`Pelanggan baru ${newCust.name} berhasil ditambahkan.`);
    }

    setIsFormModalOpen(false);
  };

  const confirmDeleteCustomer = () => {
    if (customerToDelete) {
      onDeleteCustomer(customerToDelete.id);
      toast.success(`Pelanggan ${customerToDelete.name} berhasil dihapus.`);
      setCustomerToDelete(null);
      if (selectedCustomer && selectedCustomer.id === customerToDelete.id) {
        setSelectedCustomer(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            <span>Daftar Pelanggan & Mitra</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Data pelanggan tersimpan otomatis dari pendaftaran servis masuk & kasir POS. Kelola profil, riwayat unit servis, dan riwayat belanja.
          </p>
        </div>

        <button
          id="btn-add-customer"
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Pelanggan Baru</span>
        </button>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-card border border-border p-4 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Pelanggan</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{totalCustomersCount}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              Terdaftar di Database
            </p>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl border border-blue-200/50">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Servis Sedang Berjalan</p>
            <p className="text-2xl font-bold text-blue-600 mt-0.5">{activeServiceCustomersCount}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Pelanggan aktif servis</p>
          </div>
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl border border-amber-200/50">
            <Wrench className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Mitra & Reseller IT</p>
            <p className="text-2xl font-bold text-purple-600 mt-0.5">{resellerCount}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Harga Khusus Reseller</p>
          </div>
          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-xl border border-purple-200/50">
            <Building className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Omset Pelanggan</p>
            <p className="text-xl font-bold text-foreground mt-0.5">
              {formatRupiah(totalLifetimeValue)}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              Servis & Penjualan POS
            </p>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl border border-emerald-200/50">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari Nama Pelanggan, No. Telepon/WhatsApp, Alamat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted/40 border border-input rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
          {[
            { id: "all", label: "Semua Pelanggan" },
            { id: "regular", label: "Retail / Umum" },
            { id: "reseller", label: "Mitra / Reseller" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setTypeFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                typeFilter === f.id
                  ? "bg-blue-600 text-white"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customers List Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">Tidak Ada Data Pelanggan Ditemukan</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            {searchQuery
              ? "Tidak ada pelanggan yang cocok dengan kata kunci pencarian Anda."
              : "Belum ada data pelanggan. Pelanggan baru akan otomatis tersimpan saat Anda mendaftarkan servis baru atau bertransaksi di Kasir POS."}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Pelanggan Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => {
            const stats = customerStatsMap.get(cust.id) || {
              services: [],
              transactions: [],
              totalSpent: 0,
              activeWarrantiesCount: 0,
            };

            const activeTicketCount = stats.services.filter(
              (t) => t.status !== "completed" && t.status !== "cancelled"
            ).length;

            return (
              <div
                key={cust.id}
                onClick={() => setSelectedCustomer(cust)}
                className="bg-card border border-border rounded-xl p-5 shadow-xs hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative"
              >
                <div>
                  {/* Card Header: Name & Type Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm shrink-0 border border-blue-200/50">
                        {cust.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-base group-hover:text-blue-600 transition-colors line-clamp-1">
                          {cust.name}
                        </h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" />
                          <span>{cust.phone || "-"}</span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                        cust.type === "reseller"
                          ? "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200"
                      }`}
                    >
                      {cust.type === "reseller" ? "Mitra Reseller" : "Retail"}
                    </span>
                  </div>

                  {/* Address & Email info */}
                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground border-t border-border/60 pt-3">
                    {cust.address && (
                      <p className="flex items-start gap-1.5 line-clamp-1">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0 mt-0.5" />
                        <span>{cust.address}</span>
                      </p>
                    )}
                    {cust.notes && (
                      <p className="text-[11px] italic bg-muted/40 p-1.5 rounded-md text-foreground/80 line-clamp-2">
                        "{cust.notes}"
                      </p>
                    )}
                  </div>

                  {/* Activity Badges */}
                  <div className="mt-4 grid grid-cols-2 gap-2 bg-muted/30 p-2.5 rounded-lg border border-border/50 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">Riwayat Servis</span>
                      <p className="font-bold text-foreground flex items-center gap-1.5 mt-0.5">
                        <Wrench className="h-3.5 w-3.5 text-blue-600" />
                        <span>{stats.services.length} Unit</span>
                        {activeTicketCount > 0 && (
                          <span className="bg-amber-500 text-white text-[10px] px-1.5 rounded-full">
                            {activeTicketCount} Aktif
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">Total Belanja</span>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {formatRupiah(stats.totalSpent)}
                      </p>
                    </div>
                  </div>

                  {/* Warranty Active Notice if any */}
                  {stats.activeWarrantiesCount > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-md border border-emerald-200/60 font-medium">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>{stats.activeWarrantiesCount} Garansi Servis Masih Aktif</span>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {cust.phone && cust.phone !== "-" && (
                      <a
                        href={createWhatsAppUrl(
                          cust.phone,
                          `Halo Kak ${cust.name}, terima kasih telah mempercayakan perbaikan komputer dan belanja di ServisKu Computer. Ada yang bisa kami bantu?`
                        )}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-md transition-colors"
                        title="Chat WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      onClick={(e) => handleOpenEditModal(cust, e)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-md transition-colors"
                      title="Edit Data Pelanggan"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {canDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCustomerToDelete(cust);
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition-colors"
                        title="Hapus Pelanggan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Lihat Riwayat</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-base shrink-0 shadow-xs">
                  {selectedCustomer.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-foreground">{selectedCustomer.name}</h2>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        selectedCustomer.type === "reseller"
                          ? "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200"
                      }`}
                    >
                      {selectedCustomer.type === "reseller" ? "Mitra Reseller IT" : "Pelanggan Retail"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Terdaftar sejak {formatDateIndo(selectedCustomer.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditModal(selectedCustomer)}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit Profil</span>
                </button>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Contact Info & Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/30 border border-border p-3.5 rounded-xl space-y-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Kontak & Alamat</span>
                  <div className="space-y-1.5 text-xs text-foreground">
                    <p className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-semibold">{selectedCustomer.phone || "-"}</span>
                    </p>
                    {selectedCustomer.email && (
                      <p className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{selectedCustomer.email}</span>
                      </p>
                    )}
                    <p className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      <span>{selectedCustomer.address || "Belum ada alamat tersimpan"}</span>
                    </p>
                  </div>
                </div>

                <div className="bg-muted/30 border border-border p-3.5 rounded-xl space-y-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Ringkasan Finansial</span>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Servisan:</span>
                      <span className="font-bold">
                        {customerStatsMap.get(selectedCustomer.id)?.services.length || 0} Unit
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transaksi Kasir POS:</span>
                      <span className="font-bold">
                        {customerStatsMap.get(selectedCustomer.id)?.transactions.length || 0} Transaksi
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-1">
                      <span className="font-semibold text-foreground">Total Nilai Transaksi:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(customerStatsMap.get(selectedCustomer.id)?.totalSpent || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 p-3.5 rounded-xl space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 uppercase">Tindakan Cepat</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      Buat tiket servis baru atau mulai transaksi kasir dengan data pelanggan ini.
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 pt-1">
                    {onSelectCustomerForService && (
                      <button
                        onClick={() => {
                          onSelectCustomerForService(selectedCustomer);
                          setSelectedCustomer(null);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Wrench className="h-3.5 w-3.5" />
                        <span>Daftarkan Unit Servis Baru</span>
                      </button>
                    )}
                    {selectedCustomer.phone && selectedCustomer.phone !== "-" && (
                      <a
                        href={createWhatsAppUrl(selectedCustomer.phone, `Halo Kak ${selectedCustomer.name}, dari ServisKu Computer...`)}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs text-center"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>Kirim Pesan WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Riwayat Unit Servis */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-blue-600" />
                    <span>Riwayat Unit Servis ({customerStatsMap.get(selectedCustomer.id)?.services.length || 0})</span>
                  </h4>
                </div>

                {(!customerStatsMap.get(selectedCustomer.id)?.services.length) ? (
                  <p className="text-xs text-muted-foreground italic bg-muted/20 p-4 rounded-xl text-center">
                    Belum ada riwayat pendaftaran servis untuk pelanggan ini.
                  </p>
                ) : (
                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">No. Tiket & Tanggal</th>
                          <th className="py-2.5 px-3">Perangkat / Model</th>
                          <th className="py-2.5 px-3">Keluhan & Catatan Teknisi</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Garansi</th>
                          <th className="py-2.5 px-3 text-right">Biaya Servis</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {customerStatsMap.get(selectedCustomer.id)?.services.map((t) => {
                          const statusCfg = getStatusConfig(t.status);
                          const isWarrantyActive =
                            t.status === "completed" &&
                            t.warrantyUntil &&
                            new Date(t.warrantyUntil) >= new Date();

                          return (
                            <tr key={t.id} className="hover:bg-muted/30">
                              <td className="py-2.5 px-3">
                                <span className="font-mono font-bold text-blue-600">{t.ticketNumber}</span>
                                <p className="text-[10px] text-muted-foreground">{formatDateIndo(t.createdAt)}</p>
                              </td>
                              <td className="py-2.5 px-3 font-medium text-foreground">
                                {t.deviceBrandModel}
                                {t.serialNumber && (
                                  <p className="text-[10px] font-mono text-muted-foreground">SN: {t.serialNumber}</p>
                                )}
                              </td>
                              <td className="py-2.5 px-3 max-w-xs text-muted-foreground">
                                <p className="line-clamp-1">{t.complaints}</p>
                                {t.technicianNotes && (
                                  <p className="text-[10px] text-foreground font-medium line-clamp-1 mt-0.5">
                                    Teknisi ({t.technicianName}): {t.technicianNotes}
                                  </p>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.bg}`}>
                                  {statusCfg.label}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                {t.status === "completed" ? (
                                  isWarrantyActive ? (
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                      Garansi s/d {t.warrantyUntil}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground">Garansi Berakhir</span>
                                  )
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">{t.warrantyDays || 30} Hari (Setelah Selesai)</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-foreground">
                                {formatRupiah(t.finalCost || t.estimatedCost || 0)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Riwayat Transaksi Kasir POS */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-emerald-600" />
                  <span>Riwayat Pembelian & Pembayaran Kasir ({customerStatsMap.get(selectedCustomer.id)?.transactions.length || 0})</span>
                </h4>

                {(!customerStatsMap.get(selectedCustomer.id)?.transactions.length) ? (
                  <p className="text-xs text-muted-foreground italic bg-muted/20 p-4 rounded-xl text-center">
                    Belum ada transaksi pembelian produk di Kasir POS untuk pelanggan ini.
                  </p>
                ) : (
                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">No. Faktur & Waktu</th>
                          <th className="py-2.5 px-3">Item Pembelian</th>
                          <th className="py-2.5 px-3">Metode Bayar</th>
                          <th className="py-2.5 px-3">Kasir</th>
                          <th className="py-2.5 px-3 text-right">Total Transaksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {customerStatsMap.get(selectedCustomer.id)?.transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-muted/30">
                            <td className="py-2.5 px-3">
                              <span className="font-mono font-bold text-foreground">{tx.invoiceNumber}</span>
                              <p className="text-[10px] text-muted-foreground">{formatDateIndo(tx.date)}</p>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="space-y-0.5">
                                {tx.items.map((item, idx) => (
                                  <p key={idx} className="line-clamp-1 text-foreground">
                                    • {item.name} ({item.qty}x)
                                  </p>
                                ))}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="uppercase font-bold text-[10px] bg-muted px-2 py-0.5 rounded-md text-foreground">
                                {tx.paymentMethod}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-muted-foreground">
                              {tx.cashierName || "Kasir"}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                              {formatRupiah(tx.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-border bg-muted/30 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs rounded-xl transition-colors"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal: Tambah / Edit Pelanggan */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-center justify-between">
              <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>{editingCustomer ? "Edit Profil Pelanggan" : "Tambah Pelanggan Baru"}</span>
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nama Lengkap / Instansi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso atau CV. Mitra IT"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-muted/30 border border-input rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    No. WhatsApp / Telepon <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="081234567890"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-muted/30 border border-input rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Tipe Pelanggan
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as "regular" | "reseller" })}
                    className="w-full px-3 py-2 text-sm bg-muted/30 border border-input rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="regular">Retail / Konsumen Biasa</option>
                    <option value="reseller">Mitra Reseller IT (Harga Khusus)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Alamat / Domisili
                </label>
                <textarea
                  rows={2}
                  placeholder="Alamat rumah, kantor, atau kelurahan..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-muted/30 border border-input rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Email (Opsional)
                </label>
                <input
                  type="email"
                  placeholder="pelanggan@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-muted/30 border border-input rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Pelanggan setia kantor Bappeda, dsb."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-muted/30 border border-input rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-md active:scale-95"
                >
                  {editingCustomer ? "Simpan Perubahan" : "Tambah Pelanggan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Hapus Data Pelanggan?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Data pelanggan <strong>{customerToDelete.name}</strong> akan dihapus dari daftar pelanggan.
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmDeleteCustomer}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl transition-colors"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
