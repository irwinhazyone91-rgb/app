import React, { useState } from "react";
import { toast } from "sonner";
import {
  Wrench,
  Plus,
  Search,
  Filter,
  MessageCircle,
  Printer,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Laptop,
  Monitor,
  AlertCircle,
  Send,
  Sparkles,
  DollarSign,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  Tag,
  FileText,
  AlertTriangle,
  Lock,
  Copy,
  Check,
  Smartphone,
  Phone,
  User as UserIcon,
  PackageCheck,
  Cpu,
  Receipt,
  Calendar,
  Layers,
  HelpCircle,
  ExternalLink,
  Boxes,
  PlusCircle,
  Minus,
  Calculator,
  RotateCcw,
  Save,
  UserCheck
} from "lucide-react";
import { ServiceTicket, ServiceStatus, Product, ServicePart, User, Customer } from "../types";
import {
  formatRupiah,
  formatDateIndo,
  getStatusConfig,
  createWhatsAppUrl
} from "../lib/utils";

interface ServiceManagementViewProps {
  tickets: ServiceTicket[];
  products: Product[];
  customers?: Customer[];
  users?: User[];
  currentUser?: User;
  onCreateTicket: (ticketData: Partial<ServiceTicket>) => void;
  onUpdateTicket: (id: string, updates: Partial<ServiceTicket>) => void;
  onDeleteTicket: (id: string) => void;
  onSaveCustomer?: (customer: Customer) => void;
  onPrintTicket: (
    ticket: ServiceTicket,
    mode: "intake" | "invoice",
    format?: "continuous" | "sticker_58mm" | "thermal"
  ) => void;
  onPayInPOS: (ticket: ServiceTicket) => void;
  selectedTicketForDetail?: ServiceTicket | null;
  onCloseDetail?: () => void;
}

export const ServiceManagementView: React.FC<ServiceManagementViewProps> = ({
  tickets,
  products,
  customers = [],
  users = [],
  currentUser,
  onCreateTicket,
  onUpdateTicket,
  onDeleteTicket,
  onSaveCustomer,
  onPrintTicket,
  onPayInPOS,
  selectedTicketForDetail,
  onCloseDetail
}) => {
  const [viewCategory, setViewCategory] = useState<"active" | "completed" | "all">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<ServiceTicket | null>(
    selectedTicketForDetail || null
  );
  const [ticketToDelete, setTicketToDelete] = useState<ServiceTicket | null>(null);

  // Customer search & autocomplete inside New Ticket Modal
  const [customerSearchInput, setCustomerSearchInput] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [selectedCustomerBadge, setSelectedCustomerBadge] = useState<Customer | null>(null);

  const isOwner = currentUser?.role === "owner";

  const canDelete =
    !currentUser || currentUser.role === "owner" || currentUser.role === "admin";

  const defaultTechName =
    currentUser?.role === "technician" || currentUser?.role === "admin" || currentUser?.role === "owner"
      ? currentUser.name
      : users.find((u) => u.role === "technician")?.name || currentUser?.name || "Teknisi Utama";

  // Category counts
  const activeTicketsTotal = tickets.filter((t) => t.status !== "completed" && t.status !== "cancelled").length;
  const completedTicketsTotal = tickets.filter((t) => t.status === "completed").length;
  const allTicketsTotal = tickets.length;

  // New Ticket Form State
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    customerType: "regular" as "regular" | "reseller",
    deviceType: "laptop" as const,
    deviceBrandModel: "",
    serialNumber: "",
    complaints: "",
    accessories: "Unit + Charger",
    technicianName: defaultTechName,
    estimatedCost: 0,
    downPayment: 0,
    warrantyDays: 30
  });

  // Keep technician name in sync with logged-in user if not touched
  React.useEffect(() => {
    if (defaultTechName && (!formData.technicianName || formData.technicianName === "Rian (Senior Tech)")) {
      setFormData((prev) => ({ ...prev, technicianName: defaultTechName }));
    }
  }, [defaultTechName]);

  // Ticket Editing State
  const [editStatus, setEditStatus] = useState<ServiceStatus>("received");
  const [editTechNotes, setEditTechNotes] = useState("");
  const [editTechName, setEditTechName] = useState(defaultTechName);
  const [editFinalCost, setEditFinalCost] = useState(0);
  const [editDownPayment, setEditDownPayment] = useState(0);
  const [editWarrantyDays, setEditWarrantyDays] = useState(30);
  const [partsList, setPartsList] = useState<ServicePart[]>([]);

  // Sparepart selector helper
  const [sparepartTab, setSparepartTab] = useState<"inventory" | "manual">("inventory");
  const [selectedSparepartId, setSelectedSparepartId] = useState("");
  const [inventoryPartQty, setInventoryPartQty] = useState<number>(1);
  const [customPartName, setCustomPartName] = useState("");
  const [customPartPrice, setCustomPartPrice] = useState<number>(0);
  const [customPartQty, setCustomPartQty] = useState<number>(1);

  // Open Edit Modal
  const openDetail = (ticket: ServiceTicket) => {
    setActiveTicket(ticket);
    setEditStatus(ticket.status);
    setEditTechNotes(ticket.technicianNotes || "");
    setEditTechName(ticket.technicianName || defaultTechName);
    setEditFinalCost(ticket.finalCost || ticket.estimatedCost || 0);
    setEditDownPayment(ticket.downPayment || 0);
    setEditWarrantyDays(ticket.warrantyDays || 30);
    setPartsList(ticket.partsUsed || []);
    setSparepartTab("inventory");
    setSelectedSparepartId("");
    setInventoryPartQty(1);
    setCustomPartName("");
    setCustomPartPrice(0);
    setCustomPartQty(1);
  };

  const closeDetailModal = () => {
    setActiveTicket(null);
    if (onCloseDetail) onCloseDetail();
  };

  // Filtered list
  const filteredTickets = tickets.filter((t) => {
    // 1. Category filter (Separate active vs completed)
    if (viewCategory === "active") {
      if (t.status === "completed" || t.status === "cancelled") return false;
    } else if (viewCategory === "completed") {
      if (t.status !== "completed") return false;
    }

    // 2. Sub-status filter
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;

    // 3. Search filter
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      t.ticketNumber.toLowerCase().includes(q) ||
      t.customerName.toLowerCase().includes(q) ||
      t.customerPhone.includes(q) ||
      t.deviceBrandModel.toLowerCase().includes(q) ||
      (t.serialNumber && t.serialNumber.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  // Customer suggestions for autocomplete
  const filteredCustomerSuggestions = (customers || []).filter((c) => {
    const q = (customerSearchInput || "").trim().toLowerCase();
    if (!q) return false;
    const cleanQ = q.replace(/[^0-9]/g, "");
    const cleanPhone = (c.phone || "").replace(/[^0-9]/g, "");
    return (
      c.name.toLowerCase().includes(q) ||
      (cleanQ && cleanPhone && cleanPhone.includes(cleanQ)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });

  const handleSelectCustomer = (c: Customer) => {
    setFormData((prev) => ({
      ...prev,
      customerName: c.name,
      customerPhone: c.phone !== "-" ? c.phone : "",
      customerAddress: c.address || "",
      customerType: c.type || "regular"
    }));
    setSelectedCustomerBadge(c);
    setCustomerSearchInput("");
    setIsCustomerDropdownOpen(false);
    toast.success(`Data pelanggan "${c.name}" (${c.type === "reseller" ? "Reseller" : "Reguler"}) berhasil dipilih & dimuat.`);
  };

  const handleResetCustomerSelection = () => {
    setSelectedCustomerBadge(null);
    setCustomerSearchInput("");
    setFormData((prev) => ({
      ...prev,
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      customerType: "regular"
    }));
  };

  const handleSaveCustomerDirect = () => {
    const name = (formData.customerName || "").trim();
    const phone = (formData.customerPhone || "").trim();
    const address = (formData.customerAddress || "").trim();

    if (!name) {
      toast.error("Silakan isi Nama Pelanggan terlebih dahulu sebelum menyimpan.");
      return;
    }
    if (!phone) {
      toast.error("Silakan isi No. WhatsApp Pelanggan sebelum menyimpan.");
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const existing = (customers || []).find((c) => {
      const existingClean = (c.phone || "").replace(/[^0-9]/g, "");
      if (cleanPhone.length >= 7 && existingClean.length >= 7 && cleanPhone === existingClean) return true;
      return c.name.trim().toLowerCase() === name.toLowerCase();
    });

    const custObj: Customer = {
      id: existing ? existing.id : `cust-${Date.now()}`,
      name: name,
      phone: phone,
      address: address,
      type: formData.customerType || existing?.type || "regular",
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalServicesCount: existing?.totalServicesCount || 0,
      totalSpent: existing?.totalSpent || 0
    };

    if (onSaveCustomer) {
      onSaveCustomer(custObj);
    }
    setSelectedCustomerBadge(custObj);
    toast.success(`Data pelanggan "${name}" (${custObj.type === "reseller" ? "Reseller" : "Reguler"}) berhasil disimpan ke daftar CRM Toko!`);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateTicket(formData);
    setIsNewModalOpen(false);
    setSelectedCustomerBadge(null);
    setCustomerSearchInput("");
    setIsCustomerDropdownOpen(false);
    setFormData({
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      customerType: "regular",
      deviceType: "laptop",
      deviceBrandModel: "",
      serialNumber: "",
      complaints: "",
      accessories: "Unit + Charger",
      technicianName: defaultTechName,
      estimatedCost: 0,
      downPayment: 0,
      warrantyDays: 30
    });
  };

  const handleAddPartFromInventory = () => {
    if (!selectedSparepartId) {
      toast.error("Pilih sparepart dari daftar stok terlebih dahulu.");
      return;
    }
    const prod = products.find((p) => p.id === selectedSparepartId);
    if (!prod) return;

    if (prod.stock <= 0) {
      toast.error(`Stok "${prod.name}" sedang kosong (0 ${prod.unit || "unit"}).`);
      return;
    }

    const qtyToAdd = Math.max(1, Number(inventoryPartQty) || 1);
    const existingIndex = partsList.findIndex((p) => (p.productId || p.id) === prod.id || p.name === prod.name);
    const currentQty = existingIndex >= 0 ? partsList[existingIndex].qty : 0;

    if (currentQty + qtyToAdd > prod.stock) {
      toast.error(`Total kebutuhan (${currentQty + qtyToAdd}) melebihi stok yang ada (${prod.stock} ${prod.unit || "unit"}).`);
      return;
    }

    let updatedParts: ServicePart[];
    if (existingIndex >= 0) {
      updatedParts = partsList.map((p, idx) =>
        idx === existingIndex ? { ...p, qty: p.qty + qtyToAdd, productId: prod.id } : p
      );
    } else {
      const newPart: ServicePart = {
        id: prod.id,
        productId: prod.id,
        name: prod.name,
        price: prod.sellPrice,
        qty: qtyToAdd,
        stockDeducted: false
      };
      updatedParts = [...partsList, newPart];
    }

    setPartsList(updatedParts);

    // Auto update total final cost if lower than parts total
    const partsSum = updatedParts.reduce((acc, p) => acc + p.price * p.qty, 0);
    if (editFinalCost < partsSum) {
      setEditFinalCost(partsSum);
    }

    setSelectedSparepartId("");
    setInventoryPartQty(1);
    toast.success(`${prod.name} (${qtyToAdd}x) ditambahkan ke daftar suku cadang.`);
  };

  const handleAddCustomPart = () => {
    if (!customPartName.trim()) {
      toast.error("Nama sparepart manual tidak boleh kosong.");
      return;
    }
    if (customPartPrice <= 0) {
      toast.error("Harga sparepart harus lebih dari 0.");
      return;
    }
    const qtyToAdd = Math.max(1, Number(customPartQty) || 1);
    const newPart: ServicePart = {
      id: `part-manual-${Date.now()}`,
      name: customPartName.trim(),
      price: customPartPrice,
      qty: qtyToAdd
    };
    const updatedParts = [...partsList, newPart];
    setPartsList(updatedParts);

    const partsSum = updatedParts.reduce((acc, p) => acc + p.price * p.qty, 0);
    if (editFinalCost < partsSum) {
      setEditFinalCost(partsSum);
    }
    setCustomPartName("");
    setCustomPartPrice(0);
    setCustomPartQty(1);
    toast.success(`${newPart.name} (${qtyToAdd}x) ditambahkan ke daftar.`);
  };

  const handleUpdatePartQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemovePart(index);
      return;
    }
    const updated = partsList.map((p, idx) =>
      idx === index ? { ...p, qty: newQty } : p
    );
    setPartsList(updated);
  };

  const handleRemovePart = (index: number) => {
    const itemToRemove = partsList[index];
    const updated = partsList.filter((_, i) => i !== index);
    setPartsList(updated);
    if (itemToRemove) {
      toast.info(`${itemToRemove.name} dihapus dari daftar.`);
    }
  };

  const handleSyncPartsToTotal = () => {
    const partsSum = partsList.reduce((acc, p) => acc + p.price * p.qty, 0);
    if (partsSum === 0) {
      toast.info("Tidak ada biaya sparepart untuk disinkronkan.");
      return;
    }
    setEditFinalCost(partsSum);
    toast.success(`Total biaya servis disinkronkan menjadi ${formatRupiah(partsSum)}.`);
  };

  const handleSaveTicketUpdates = () => {
    if (!activeTicket) return;

    if (activeTicket.status === "completed" && !isOwner) {
      toast.error(
        "Pengeditan dinonaktifkan. Hanya Pemilik Toko (Owner) yang memiliki wewenang mengubah tiket servis yang sudah Selesai & Diambil."
      );
      return;
    }

    onUpdateTicket(activeTicket.id, {
      status: editStatus,
      technicianNotes: editTechNotes,
      technicianName: editTechName,
      finalCost: editFinalCost,
      downPayment: editDownPayment,
      warrantyDays: editWarrantyDays,
      partsUsed: partsList
    });
    toast.success(`Tiket servis #${activeTicket.ticketNumber} berhasil diperbarui.`);
    closeDetailModal();
  };

  const confirmDeleteTicket = () => {
    if (ticketToDelete) {
      onDeleteTicket(ticketToDelete.id);
      setTicketToDelete(null);
      if (activeTicket && activeTicket.id === ticketToDelete.id) {
        closeDetailModal();
      }
    }
  };

  // Generate customized WhatsApp Message
  const getWhatsAppMessage = (ticket: ServiceTicket) => {
    const remaining = Math.max(
      0,
      (ticket.finalCost || ticket.estimatedCost) - ticket.downPayment
    );

    if (ticket.status === "ready") {
      return `Halo Kak *${ticket.customerName}*,\n\nKabar baik dari *ServisKu Computer*! Unit perbaikan Anda:\n🔹 *No. Tiket*: ${ticket.ticketNumber}\n🔹 *Perangkat*: ${ticket.deviceBrandModel}\n🔹 *Status*: *SELESAI & SIAP DIAMBIL*\n🔹 *Total Biaya*: ${formatRupiah(ticket.finalCost || ticket.estimatedCost)}\n🔹 *Sisa Pembayaran*: ${formatRupiah(remaining)}\n🔹 *Garansi Servis*: ${ticket.warrantyDays || 30} Hari\n\nUnit sudah melewati tahap Quality Control (QC). Silakan datang ke toko kami dengan membawa tanda terima/nota ini.\n\nTerima kasih! 🙏`;
    }

    if (ticket.status === "waiting_approval") {
      return `Halo Kak *${ticket.customerName}*,\n\nUpdate dari teknisi *ServisKu Computer* untuk tiket *${ticket.ticketNumber}* (${ticket.deviceBrandModel}):\n\n📌 *Hasil Diagnosa*: ${ticket.technicianNotes || "Pengecekan komponen rusak"}\n📌 *Estimasi Biaya*: ${formatRupiah(ticket.estimatedCost || ticket.finalCost)}\n\nMohon konfirmasi persetujuan perbaikan agar teknisi kami dapat segera melanjutkan pengerjaan. Terima kasih! 🙏`;
    }

    if (ticket.status === "in_progress") {
      return `Halo Kak *${ticket.customerName}*,\n\nPerbaikan unit Anda dengan No. Tiket *${ticket.ticketNumber}* (${ticket.deviceBrandModel}) saat ini *SEDANG DALAM PROSES PENGERJAAN* oleh teknisi kami (${ticket.technicianName}). Kami akan menginfokan kembali begitu unit selesai diuji. Terima kasih! 🙏`;
    }

    // Default / Received
    return `Halo Kak *${ticket.customerName}*,\n\nTerima kasih telah mempercayakan perbaikan di *ServisKu Computer*.\n\n📋 *Tanda Terima Servis Masuk*:\n🔹 No. Tiket: *${ticket.ticketNumber}*\n🔹 Perangkat: ${ticket.deviceBrandModel}\n🔹 Keluhan: ${ticket.complaints}\n🔹 Kelengkapan: ${ticket.accessories}\n🔹 Uang Muka (DP): ${formatRupiah(ticket.downPayment)}\n🔹 Garansi Servis: ${ticket.warrantyDays || 30} Hari\n\nAnda dapat mengecek status pengerjaan secara online kapan saja di website kami dengan memasukkan Nomor Tiket *${ticket.ticketNumber}*. Terima kasih! 🙏`;
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wrench className="h-6 w-6 text-blue-600" />
            <span>Manajemen Tiket Servis</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola pendaftaran unit masuk, status diagnosa teknisi, pengaturan garansi, nota tanda terima, & pembatalan salah input.
          </p>
        </div>

        <button
          id="btn-create-service-ticket"
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Buat Tiket Servis Baru</span>
        </button>
      </div>

      {/* Primary Category Selector Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2 bg-muted/60 p-1.5 rounded-2xl border border-border">
          <button
            type="button"
            onClick={() => {
              setViewCategory("active");
              setStatusFilter("all");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              viewCategory === "active"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <span>🔥 Servisan Masuk & Pengerjaan</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-black ${
                viewCategory === "active"
                  ? "bg-white text-blue-700"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
              }`}
            >
              {activeTicketsTotal}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewCategory("completed");
              setStatusFilter("all");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              viewCategory === "completed"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <span>✅ Selesai & Telah Diambil</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-black ${
                viewCategory === "completed"
                  ? "bg-white text-emerald-700"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              }`}
            >
              {completedTicketsTotal}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewCategory("all");
              setStatusFilter("all");
            }}
            className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              viewCategory === "all"
                ? "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <span>Semua ({allTicketsTotal})</span>
          </button>
        </div>

        <div className="text-xs text-muted-foreground flex items-center gap-2 px-1">
          <span>Menampilkan <strong>{filteredTickets.length}</strong> dari {tickets.length} total tiket</span>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari No. Tiket, Nama Pelanggan, No. WA, atau Model Laptop..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted/40 border border-input rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Sub-Filter */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
          {(viewCategory === "completed"
            ? [
                { id: "all", label: "Semua Selesai & Diambil" }
              ]
            : viewCategory === "active"
            ? [
                { id: "all", label: "Semua Aktif" },
                { id: "received", label: "Antrean Masuk" },
                { id: "diagnosing", label: "Diagnosa" },
                { id: "in_progress", label: "Pengerjaan" },
                { id: "ready", label: "Siap Diambil" }
              ]
            : [
                { id: "all", label: "Semua" },
                { id: "received", label: "Antrean" },
                { id: "diagnosing", label: "Diagnosa" },
                { id: "in_progress", label: "Pengerjaan" },
                { id: "ready", label: "Siap Ambil" },
                { id: "completed", label: "Selesai" }
              ]
          ).map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === s.id
                  ? viewCategory === "completed"
                    ? "bg-emerald-600 text-white"
                    : "bg-blue-600 text-white"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTickets.map((ticket) => {
          const statusCfg = getStatusConfig(ticket.status);
          const remaining = Math.max(
            0,
            (ticket.finalCost > 0 ? ticket.finalCost : ticket.estimatedCost) - ticket.downPayment
          );

          return (
            <div
              key={ticket.id}
              className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-blue-500/40 transition-all hover:shadow-md relative group"
            >
              <div>
                {/* Header: Ticket No & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                      {ticket.ticketNumber}
                    </span>
                    <h3 className="font-semibold text-foreground text-base mt-0.5">
                      {ticket.customerName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${statusCfg.bg}`}
                    >
                      {statusCfg.label}
                    </span>

                    {/* Owner/Admin Delete Button */}
                    {canDelete && (
                      <button
                        onClick={() => setTicketToDelete(ticket)}
                        title="Hapus Tiket Servis (Salah Input)"
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Device & Complaints */}
                <div className="mt-3.5 space-y-2 text-xs">
                  <div className="flex items-center text-muted-foreground">
                    <Laptop className="h-4 w-4 mr-2 text-blue-500 shrink-0" />
                    <span className="font-medium text-foreground truncate">
                      {ticket.deviceBrandModel}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-muted/40 text-foreground border border-border/50">
                    <span className="font-semibold text-muted-foreground block text-[11px]">
                      Keluhan:
                    </span>
                    <p className="line-clamp-2 mt-0.5">{ticket.complaints}</p>
                  </div>

                  {ticket.warrantyDays !== undefined && (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Garansi: {ticket.warrantyDays > 0 ? `${ticket.warrantyDays} Hari` : "Tanpa Garansi"}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-muted-foreground text-[11px] pt-1">
                    <span>Teknisi: {ticket.technicianName || "Teknisi Utama"}</span>
                    <span>{formatDateIndo(ticket.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Footer / Cost & Actions */}
              <div className="mt-4 pt-3.5 border-t border-border">
                <div className="flex items-center justify-between text-xs mb-3">
                  <div>
                    <span className="text-muted-foreground">Total Biaya: </span>
                    <span className="font-bold text-foreground">
                      {ticket.finalCost > 0
                        ? formatRupiah(ticket.finalCost)
                        : ticket.estimatedCost > 0
                        ? `Est. ${formatRupiah(ticket.estimatedCost)}`
                        : "Belum Ada"}
                    </span>
                  </div>
                  {ticket.downPayment > 0 && (
                    <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                      DP: {formatRupiah(ticket.downPayment)}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 pt-1 border-t border-border">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() =>
                        onPrintTicket(
                          ticket,
                          ticket.status === "ready" || ticket.status === "completed"
                            ? "invoice"
                            : "intake",
                          "continuous"
                        )
                      }
                      title="Cetak Surat Perintah Kerja (SPK) / Nota Tanda Terima untuk Konsumen"
                      className="py-1.5 px-2 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 font-bold rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors border border-blue-200/50 dark:border-blue-900/50"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">📄 Nota Konsumen</span>
                    </button>

                    <button
                      onClick={() => onPrintTicket(ticket, "intake", "sticker_58mm")}
                      title="Cetak Stiker Tempel untuk ditempel langsung di Casing Unit Servis"
                      className="py-1.5 px-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-2xs"
                    >
                      <Tag className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">🏷️ Stiker Unit</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {ticket.status === "completed" && !isOwner ? (
                      <button
                        onClick={() => openDetail(ticket)}
                        title="Tiket berstatus Selesai & Diambil (Terkunci - Hanya Owner yang dapat mengubah data)"
                        className="col-span-2 py-1.5 px-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors border border-border hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      >
                        <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        <span className="truncate">Lihat Detail (Terkunci)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => openDetail(ticket)}
                        title={
                          ticket.status === "completed"
                            ? "Update Servis (Akses Khusus Owner)"
                            : "Buka detail & update pengerjaan teknisi"
                        }
                        className={`col-span-2 py-1.5 px-2 font-semibold rounded-lg text-xs flex items-center justify-center space-x-1 transition-colors border ${
                          ticket.status === "completed"
                            ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                            : "bg-muted hover:bg-muted/80 text-foreground border-border"
                        }`}
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span>{ticket.status === "completed" ? "Update (Owner)" : "Update Servis"}</span>
                      </button>
                    )}

                    <a
                      href={createWhatsAppUrl(ticket.customerPhone, getWhatsAppMessage(ticket))}
                      target="_blank"
                      rel="noreferrer"
                      title="Kirim Status Servis via WhatsApp ke Pelanggan"
                      className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs flex items-center justify-center transition-colors shadow-2xs font-bold"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                {ticket.status === "ready" && (
                  <button
                    onClick={() => onPayInPOS(ticket)}
                    className="w-full mt-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center space-x-1 transition-all shadow-xs"
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>Pelunasan di Kasir POS (Sisa: {formatRupiah(remaining)})</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredTickets.length === 0 && (
          <div className="col-span-full py-12 text-center bg-card border border-border rounded-xl">
            <Wrench className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
            <h3 className="font-semibold text-foreground">Tidak Ada Tiket Servis</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Tidak ditemukan data servis yang cocok dengan kata kunci atau filter.
            </p>
          </div>
        )}
      </div>

      {/* MODAL: BUAT TIKET SERVIS BARU */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">Pendaftaran Unit Servis Baru</h2>
                <p className="text-xs text-muted-foreground">
                  Isi data pelanggan, keluhan kerusakan, estimasi biaya, dan masa garansi.
                </p>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Customer Search / Selection Box */}
              <div className="bg-muted/30 border border-border/80 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Search className="h-3.5 w-3.5 text-blue-500" />
                    Cari & Pilih Pelanggan Terdaftar (CRM)
                  </label>
                  {selectedCustomerBadge && (
                    <button
                      type="button"
                      onClick={handleResetCustomerSelection}
                      className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 hover:underline"
                    >
                      ✕ Reset / Input Pelanggan Baru
                    </button>
                  )}
                </div>

                {selectedCustomerBadge ? (
                  <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/30 rounded-lg p-2.5 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                        <UserIcon className="h-3.5 w-3.5" />
                        {selectedCustomerBadge.name}
                        {selectedCustomerBadge.type === "reseller" && (
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.2 rounded-xs font-semibold">
                            Reseller/Mitra
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground text-[11px]">
                        WA: <span className="font-semibold text-foreground">{selectedCustomerBadge.phone}</span>
                        {selectedCustomerBadge.address && ` • ${selectedCustomerBadge.address}`}
                        {selectedCustomerBadge.totalServicesCount !== undefined && (
                          <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-medium">
                            ({selectedCustomerBadge.totalServicesCount}x Servis)
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-md font-semibold border border-emerald-500/30">
                      ✓ Terhubung
                    </span>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Ketik Nama, No. WhatsApp, atau Alamat untuk mencari pelanggan lama..."
                        value={customerSearchInput}
                        onChange={(e) => {
                          setCustomerSearchInput(e.target.value);
                          setIsCustomerDropdownOpen(true);
                        }}
                        onFocus={() => setIsCustomerDropdownOpen(true)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>

                    {isCustomerDropdownOpen && customerSearchInput.trim() !== "" && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-card border border-border rounded-xl shadow-xl divide-y divide-border">
                        {filteredCustomerSuggestions.length > 0 ? (
                          filteredCustomerSuggestions.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleSelectCustomer(c)}
                              className="w-full text-left px-3 py-2.5 hover:bg-muted/60 transition-colors flex items-center justify-between group"
                            >
                              <div>
                                <div className="font-semibold text-xs text-foreground group-hover:text-blue-500 flex items-center gap-1.5">
                                  {c.name}
                                  {c.type === "reseller" && (
                                    <span className="text-[9px] bg-indigo-500/10 text-indigo-600 px-1 rounded-xs">
                                      Reseller
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  <span>{c.phone}</span>
                                  {c.address && <span className="ml-1.5 opacity-80 truncate">| {c.address}</span>}
                                </div>
                              </div>
                              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                                {c.totalServicesCount || 0}x Servis
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="p-3 text-center text-xs text-muted-foreground">
                            Pelanggan belum ada di database. Silakan isi form nama & nomor WA di bawah untuk otomatis mendaftarkannya.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Customer Info Form */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5 text-blue-500" />
                    Data Identitas Pelanggan
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveCustomerDirect}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-lg transition-all shadow-2xs active:scale-95 cursor-pointer"
                    title="Simpan data nama & kontak pelanggan ini ke database CRM Toko"
                  >
                    <Save className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Simpan Pelanggan ke CRM</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Nama Pelanggan *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      No. WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 081234567890"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Kategori Pelanggan
                    </label>
                    <select
                      value={formData.customerType}
                      onChange={(e) => setFormData({ ...formData, customerType: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
                    >
                      <option value="regular">Konsumen Reguler</option>
                      <option value="reseller">Reseller / Toko Mitra</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Alamat Pelanggan (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Jl. Pemuda No. 88, Semarang"
                      value={formData.customerAddress}
                      onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
                    />
                  </div>

                  {/* Customer Quick Save Bar */}
                  <div className="sm:col-span-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/80 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="text-xs text-emerald-950 dark:text-emerald-200">
                        {selectedCustomerBadge ? (
                          <>
                            ✓ Terhubung dengan database CRM: <strong>{selectedCustomerBadge.name}</strong> ({selectedCustomerBadge.type === "reseller" ? "Reseller" : "Konsumen Reguler"})
                          </>
                        ) : (
                          <>
                            Simpan identitas pelanggan ini ke <strong>Buku Pelanggan CRM</strong> agar riwayat & garansi servis masa depan tersimpan rapi.
                          </>
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveCustomerDirect}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg transition-all shadow-xs shrink-0 cursor-pointer"
                      title="Klik untuk langsung menyimpan data pelanggan ini ke CRM"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{selectedCustomerBadge ? "Perbarui di CRM" : "Simpan Pelanggan ke CRM"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Device Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Jenis Perangkat
                  </label>
                  <select
                    value={formData.deviceType}
                    onChange={(e) => setFormData({ ...formData, deviceType: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
                  >
                    <option value="laptop">Laptop / Notebook</option>
                    <option value="pc_desktop">PC Desktop / Komputer</option>
                    <option value="printer">Printer</option>
                    <option value="all_in_one">PC All-In-One (AIO)</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Merk & Model Unit *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Asus ROG Zephyrus G14 / Lenovo Slim 3"
                    value={formData.deviceBrandModel}
                    onChange={(e) => setFormData({ ...formData, deviceBrandModel: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nomor Seri / Serial Number (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: SN-88392183"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
                />
              </div>

              {/* Complaints & Accessories */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Keluhan / Gejala Kerusakan *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Mati total setelah kena petir / Blue screen saat buka aplikasi / Keyboard mencet terus"
                  value={formData.complaints}
                  onChange={(e) => setFormData({ ...formData, complaints: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Kelengkapan Unit yang Ditinggal
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Unit Laptop, Adaptor Charger Ori, Tas"
                  value={formData.accessories}
                  onChange={(e) => setFormData({ ...formData, accessories: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
                />
              </div>

              {/* Financials & Warranty & Tech */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Estimasi Biaya (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData({ ...formData, estimatedCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Uang Muka / DP (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={formData.downPayment}
                    onChange={(e) => setFormData({ ...formData, downPayment: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Masa Garansi Servis
                  </label>
                  <select
                    value={formData.warrantyDays}
                    onChange={(e) => setFormData({ ...formData, warrantyDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg font-medium"
                  >
                    <option value="0">Tanpa Garansi</option>
                    <option value="7">7 Hari (1 Minggu)</option>
                    <option value="14">14 Hari (2 Minggu)</option>
                    <option value="30">30 Hari (1 Bulan)</option>
                    <option value="60">60 Hari (2 Bulan)</option>
                    <option value="90">90 Hari (3 Bulan)</option>
                    <option value="180">180 Hari (6 Bulan)</option>
                    <option value="365">365 Hari (1 Tahun)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Teknisi PIC
                  </label>
                  {users.length > 0 ? (
                    <select
                      value={formData.technicianName}
                      onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
                    >
                      {users
                        .filter((u) => u.role === "technician" || u.role === "admin" || u.role === "owner")
                        .map((u) => (
                          <option key={u.id} value={u.name}>
                            {u.name} ({u.role === "technician" ? "Teknisi" : u.role === "admin" ? "Admin" : "Owner"})
                          </option>
                        ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.technicianName}
                      onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
                    />
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={handleSaveCustomerDirect}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer"
                  title="Simpan data nama & kontak pelanggan ini ke database CRM Toko"
                >
                  <Save className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Simpan Data Pelanggan</span>
                </button>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md cursor-pointer"
                  >
                    Simpan & Cetak Tanda Terima
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL & UPDATE PROGRESS TIKET */}
      {activeTicket && (() => {
        const isTicketLocked = activeTicket.status === "completed" && !isOwner;
        const remainingCost = Math.max(0, editFinalCost - editDownPayment);

        const statusOptions: {
          id: ServiceStatus;
          label: string;
          desc: string;
          icon: React.ReactNode;
          activeColor: string;
        }[] = [
          {
            id: "received",
            label: "Antrean Masuk",
            desc: "Unit baru diterima",
            icon: <Clock className="w-3.5 h-3.5" />,
            activeColor: "bg-blue-600 text-white border-blue-600 shadow-xs"
          },
          {
            id: "diagnosing",
            label: "Sedang Diagnosa",
            desc: "Pengecekan teknisi",
            icon: <Search className="w-3.5 h-3.5" />,
            activeColor: "bg-amber-600 text-white border-amber-600 shadow-xs"
          },
          {
            id: "waiting_approval",
            label: "Tunggu Persetujuan",
            desc: "Konfirmasi biaya/part",
            icon: <AlertCircle className="w-3.5 h-3.5" />,
            activeColor: "bg-orange-600 text-white border-orange-600 shadow-xs"
          },
          {
            id: "in_progress",
            label: "Dalam Pengerjaan",
            desc: "Perbaikan & instalasi",
            icon: <Wrench className="w-3.5 h-3.5" />,
            activeColor: "bg-indigo-600 text-white border-indigo-600 shadow-xs"
          },
          {
            id: "ready",
            label: "Selesai (Siap Ambil)",
            desc: "Lolos QC & siap serah",
            icon: <CheckCircle className="w-3.5 h-3.5" />,
            activeColor: "bg-emerald-600 text-white border-emerald-600 shadow-xs"
          },
          {
            id: "completed",
            label: "Sudah Diambil / Lunas",
            desc: "Transaksi servis selesai",
            icon: <PackageCheck className="w-3.5 h-3.5" />,
            activeColor: "bg-slate-700 text-white border-slate-700 shadow-xs"
          }
        ];

        const quickTechNotes = [
          "Cleaning fan & ganti thermal paste Arctic MX-4",
          "Reball chipset VGA / solder ulang komponen power",
          "Install ulang Windows 11 Pro 64-bit + Office + Driver",
          "Ganti keyboard baru original, semua tombol normal",
          "Ganti layar LCD IPS 14 inch baru",
          "Upgrade SSD NVMe 512GB & clone sistem",
          "Ganti baterai baru & running test charging normal",
          "QC passed: Running stress test 2 jam temperatur stabil <65°C"
        ];

        const handleAddQuickNote = (note: string) => {
          if (isTicketLocked) return;
          if (!editTechNotes) {
            setEditTechNotes(note);
          } else {
            setEditTechNotes((prev) => `${prev}. ${note}`);
          }
        };

        const copyTicketNumber = () => {
          navigator.clipboard.writeText(activeTicket.ticketNumber);
          toast.success(`Nomor tiket ${activeTicket.ticketNumber} disalin ke clipboard.`);
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
            <div className="bg-card border border-border rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Header Box with Meta Info */}
              <div className="p-4 sm:p-5 border-b border-border bg-gradient-to-r from-blue-50/60 via-card to-card dark:from-blue-950/30 dark:via-card dark:to-card shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-lg font-mono font-bold text-xs sm:text-sm">
                        <span>{activeTicket.ticketNumber}</span>
                        <button
                          type="button"
                          onClick={copyTicketNumber}
                          title="Salin No. Tiket"
                          className="hover:text-blue-900 dark:hover:text-blue-100 p-0.5 rounded transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        • Masuk: {formatDateIndo(activeTicket.createdAt)}
                      </span>
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center flex-wrap gap-2">
                      <span>{activeTicket.customerName}</span>
                      <span className="text-muted-foreground font-normal text-sm">—</span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm sm:text-base">
                        {activeTicket.deviceBrandModel}
                      </span>
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <a
                      href={createWhatsAppUrl(
                        activeTicket.customerPhone,
                        getWhatsAppMessage({
                          ...activeTicket,
                          status: editStatus,
                          finalCost: editFinalCost,
                          downPayment: editDownPayment,
                          technicianNotes: editTechNotes,
                          warrantyDays: editWarrantyDays
                        })
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chat WA</span>
                    </a>

                    <button
                      type="button"
                      onClick={closeDetailModal}
                      className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-base font-bold leading-none"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Initial Device & Complaint Quick Summary Card */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-muted/40 border border-border/70 p-3 rounded-xl">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                      <Laptop className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="font-semibold text-foreground">Kelengkapan Bawaan:</span>
                    </div>
                    <p className="text-foreground pl-5">{activeTicket.accessories || "Hanya Unit"}</p>
                    {activeTicket.serialNumber && (
                      <div className="pl-5 text-muted-foreground text-[11px]">
                        No. Seri: <span className="font-mono text-foreground font-semibold">{activeTicket.serialNumber}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-semibold text-foreground">Keluhan Awal Konsumen:</span>
                    </div>
                    <p className="text-foreground pl-5 line-clamp-2 italic">
                      "{activeTicket.complaints}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Scrollable Modal Body Form */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {/* Status Lock Warning or Owner Access Indicator */}
                {isTicketLocked ? (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 text-xs">
                    <Lock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <span className="font-bold block text-sm">TIKET TELAH SELESAI & DIAMBIL (MODE TERKUNCI):</span>
                      <span className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed mt-0.5 block">
                        Status tiket servis ini telah lunas dan unit sudah diambil. Formulir perubahan data dinonaktifkan untuk staff/teknisi/kasir dan <strong>hanya dapat diubah oleh Owner (Pemilik Toko)</strong>.
                      </span>
                    </div>
                  </div>
                ) : activeTicket.status === "completed" && isOwner ? (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800 text-xs">
                    <Sparkles className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <span className="font-bold block">AKSES OWNER (PEMILIK TOKO):</span>
                      <span className="text-xs text-blue-800 dark:text-blue-300 mt-0.5 block">
                        Anda login sebagai Owner dan memiliki hak akses khusus untuk memperbarui atau mengoreksi data tiket yang telah berstatus Selesai & Diambil.
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* 1. STATUS WORKFLOW SELECTOR */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-blue-600" />
                      1. Status Pengerjaan Servis:
                    </label>
                    {isTicketLocked && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Status Terkunci
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {statusOptions.map((st) => {
                      const isCurrentActive = editStatus === st.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          disabled={isTicketLocked}
                          onClick={() => !isTicketLocked && setEditStatus(st.id)}
                          className={`p-3 rounded-xl text-xs font-semibold border transition-all text-left flex items-start gap-2.5 ${
                            isCurrentActive
                              ? st.activeColor
                              : "bg-card text-foreground border-border hover:bg-muted/60"
                          } ${isTicketLocked ? "cursor-not-allowed opacity-75" : ""}`}
                        >
                          <span className="mt-0.5 shrink-0">{st.icon}</span>
                          <div className="min-w-0">
                            <div className="font-bold leading-tight truncate">{st.label}</div>
                            <div
                              className={`text-[10px] truncate mt-0.5 ${
                                isCurrentActive ? "text-white/80" : "text-muted-foreground"
                              }`}
                            >
                              {st.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. TECHNICIAN DIAGNOSIS & ACTIONS */}
                <div className="space-y-3 bg-muted/20 border border-border rounded-xl p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-blue-600" />
                      2. Catatan Diagnosa & Tindakan Teknisi:
                    </label>
                    <span className="text-[10px] text-muted-foreground">
                      *Tercantum pada nota & laporan servis konsumen
                    </span>
                  </div>

                  {/* Quick Note Chips */}
                  {!isTicketLocked && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold text-muted-foreground block">
                        Template Cepat Teknisi (Klik untuk menambahkan):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {quickTechNotes.map((chip, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleAddQuickNote(chip)}
                            className="px-2.5 py-1 rounded-lg text-[10px] bg-card border border-border text-foreground hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:hover:bg-blue-950 dark:hover:text-blue-300 transition-colors shadow-2xs font-medium"
                          >
                            + {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <textarea
                    rows={3}
                    disabled={isTicketLocked}
                    value={editTechNotes}
                    onChange={(e) => setEditTechNotes(e.target.value)}
                    placeholder="Contoh: Reball chipset VGA berhasil, thermal paste Arctic MX-4 diganti, running test 2 jam temperatur aman 65°C."
                    className={`w-full px-3 py-2.5 text-xs sm:text-sm bg-card border border-input rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden ${
                      isTicketLocked ? "cursor-not-allowed opacity-75" : ""
                    }`}
                  ></textarea>
                </div>

                {/* 3. SPAREPARTS & COMPONENTS MANAGEMENT */}
                <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-foreground">
                          3. Sparepart & Komponen Pengganti
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Suku cadang dan komponen yang terpasang pada unit servis pelanggan
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <div className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 px-3 py-1.5 rounded-xl font-bold border border-blue-200 dark:border-blue-800">
                        Total Part:{" "}
                        <span className="font-extrabold text-blue-800 dark:text-blue-200">
                          {formatRupiah(
                            partsList.reduce((acc, p) => acc + p.price * p.qty, 0)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!isTicketLocked && (
                    <div className="space-y-3 bg-muted/20 border border-border/80 rounded-2xl p-4">
                      {/* Sub-tab Mode Switcher */}
                      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
                        <button
                          type="button"
                          onClick={() => setSparepartTab("inventory")}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                            sparepartTab === "inventory"
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-card text-muted-foreground hover:text-foreground border border-border"
                          }`}
                        >
                          <Boxes className="w-3.5 h-3.5" />
                          <span>Ambil dari Stok Inventaris Toko</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSparepartTab("manual")}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                            sparepartTab === "manual"
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-card text-muted-foreground hover:text-foreground border border-border"
                          }`}
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Input Sparepart / Komponen Manual</span>
                        </button>
                      </div>

                      {/* Tab 1: Ambil dari Stok Toko */}
                      {sparepartTab === "inventory" ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-bold text-foreground mb-1.5">
                              Pilih Produk / Sparepart dari Inventaris Toko:
                            </label>
                            <select
                              value={selectedSparepartId}
                              onChange={(e) => setSelectedSparepartId(e.target.value)}
                              className="w-full px-3.5 py-2.5 text-xs bg-card border border-input rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">-- Cari & Pilih Suku Cadang Toko --</option>
                              {products
                                .filter((p) => p.category !== "jasa")
                                .map((p) => (
                                  <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                                    {p.name} — {p.stock > 0 ? `Stok: ${p.stock} ${p.unit || 'unit'}` : "[HABIS - STOK 0]"} | {formatRupiah(p.sellPrice)}
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div className="flex items-center gap-3 bg-card p-2.5 rounded-xl border border-input">
                              <label className="text-xs font-semibold text-muted-foreground shrink-0">
                                Jumlah (Qty):
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={inventoryPartQty}
                                onChange={(e) => setInventoryPartQty(Math.max(1, Number(e.target.value)))}
                                className="w-20 px-2.5 py-1.5 text-xs text-center font-bold bg-muted border border-border rounded-lg"
                              />
                              {selectedSparepartId && (
                                <div className="text-xs text-muted-foreground ml-auto">
                                  Subtotal:{" "}
                                  <strong className="text-blue-600 dark:text-blue-400 font-black">
                                    {formatRupiah(
                                      (products.find((p) => p.id === selectedSparepartId)?.sellPrice || 0) *
                                        inventoryPartQty
                                    )}
                                  </strong>
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={handleAddPartFromInventory}
                              disabled={!selectedSparepartId}
                              className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                                selectedSparepartId
                                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:scale-98 cursor-pointer"
                                  : "bg-muted text-muted-foreground cursor-not-allowed"
                              }`}
                            >
                              <Plus className="w-4 h-4" />
                              <span>Tambahkan ke Daftar Servis</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Tab 2: Input Part Manual / Luar */
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-bold text-foreground mb-1.5">
                              Nama Komponen / Sparepart Khusus:
                            </label>
                            <input
                              type="text"
                              placeholder="Contoh: IC Power TPS51285B / Kabel Fleksibel eDP 30 Pin"
                              value={customPartName}
                              onChange={(e) => setCustomPartName(e.target.value)}
                              className="w-full px-3.5 py-2.5 text-xs bg-card border border-input rounded-xl focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-foreground mb-1">
                                Harga Satuan (Rp):
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="5000"
                                placeholder="Rp 0"
                                value={customPartPrice || ""}
                                onChange={(e) => setCustomPartPrice(Number(e.target.value))}
                                className="w-full px-3 py-2 text-xs bg-card border border-input rounded-xl font-semibold focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-foreground mb-1">
                                Jumlah (Qty):
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={customPartQty}
                                onChange={(e) => setCustomPartQty(Math.max(1, Number(e.target.value)))}
                                className="w-full px-3 py-2 text-xs text-center font-bold bg-card border border-input rounded-xl focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={handleAddCustomPart}
                                disabled={!customPartName.trim() || customPartPrice <= 0}
                                className={`w-full py-2.5 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                                  customPartName.trim() && customPartPrice > 0
                                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:scale-98 cursor-pointer"
                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                                }`}
                              >
                                <Plus className="w-4 h-4" />
                                <span>Tambah Manual</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Parts List Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
                      <span>Daftar Sparepart Terpasang ({partsList.length})</span>
                      {partsList.length > 0 && !isTicketLocked && (
                        <button
                          type="button"
                          onClick={handleSyncPartsToTotal}
                          className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold"
                          title="Klik untuk otomatis menyetel Total Biaya Servis sama dengan total part ini"
                        >
                          <Calculator className="w-3 h-3" />
                          <span>Setel Total Servis ke Total Part</span>
                        </button>
                      )}
                    </div>

                    {partsList.length > 0 ? (
                      <div className="border border-border rounded-xl overflow-hidden divide-y divide-border/60 bg-card">
                        {partsList.map((part, idx) => {
                          const isInventoryItem = products.some((p) => p.id === part.id || p.name === part.name);
                          return (
                            <div
                              key={part.id || idx}
                              className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-muted/20 transition-colors"
                            >
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-foreground text-xs sm:text-sm">
                                    {part.name}
                                  </span>
                                  <span
                                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                      isInventoryItem
                                        ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                                        : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                                    }`}
                                  >
                                    {isInventoryItem ? "Stok Toko" : "Manual"}
                                  </span>
                                  {isInventoryItem && (
                                    <span
                                      className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                                        part.stockDeducted
                                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                                      }`}
                                    >
                                      {part.stockDeducted ? `✓ Stok Terpotong (-${part.qty})` : `⏳ Potong Stok Saat Disimpan / Kasir`}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Harga Satuan: {formatRupiah(part.price)}
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                {/* Qty Stepper */}
                                {!isTicketLocked ? (
                                  <div className="flex items-center border border-border rounded-lg bg-muted/30 overflow-hidden">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdatePartQty(idx, part.qty - 1)}
                                      className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                                      title="Kurangi Qty"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="px-2.5 text-xs font-bold text-foreground min-w-[24px] text-center">
                                      {part.qty}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdatePartQty(idx, part.qty + 1)}
                                      className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                                      title="Tambah Qty"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs font-bold px-2 py-0.5 bg-muted rounded border border-border">
                                    {part.qty}x
                                  </span>
                                )}

                                {/* Line Subtotal */}
                                <div className="text-right min-w-[90px]">
                                  <span className="text-xs sm:text-sm font-extrabold text-foreground block">
                                    {formatRupiah(part.price * part.qty)}
                                  </span>
                                </div>

                                {/* Remove Button */}
                                {!isTicketLocked && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePart(idx)}
                                    className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                                    title="Hapus part ini"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-muted/20 border border-dashed border-border text-center text-xs text-muted-foreground">
                        Belum ada sparepart / suku cadang tambahan yang tercatat pada tiket ini.
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. FINANCIAL SUMMARY, DP, WARRANTY, & TECHNICIAN PIC */}
                <div className="bg-gradient-to-br from-muted/30 via-card to-card border border-border rounded-xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <h3 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      4. Rincian Biaya, Pembayaran, Garansi & Teknisi PIC
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Total Final Cost */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-foreground">
                        Total Biaya Servis (Rp)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        disabled={isTicketLocked}
                        value={editFinalCost}
                        onChange={(e) => setEditFinalCost(Number(e.target.value))}
                        className={`w-full px-3 py-2 text-sm bg-card border border-input rounded-xl font-bold text-foreground focus:ring-2 focus:ring-blue-500 ${
                          isTicketLocked ? "cursor-not-allowed opacity-75" : ""
                        }`}
                      />
                      <span className="text-[10px] text-muted-foreground block">
                        Jasa pengerjaan & sparepart
                      </span>
                    </div>

                    {/* Down Payment (DP) */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-foreground">
                        Uang Muka / DP (Rp)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        disabled={isTicketLocked}
                        value={editDownPayment}
                        onChange={(e) => setEditDownPayment(Number(e.target.value))}
                        className={`w-full px-3 py-2 text-sm bg-card border border-input rounded-xl font-semibold text-foreground focus:ring-2 focus:ring-blue-500 ${
                          isTicketLocked ? "cursor-not-allowed opacity-75" : ""
                        }`}
                      />
                      <span className="text-[10px] text-muted-foreground block">
                        Telah dibayar di muka
                      </span>
                    </div>

                    {/* Sisa Pelunasan (Auto-Calculated) */}
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                        Sisa Pelunasan di Kasir:
                      </span>
                      <span className="text-base sm:text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
                        {formatRupiah(remainingCost)}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {remainingCost === 0 ? "✓ Lunas / Tidak ada tagihan" : "Tagihan saat unit diambil"}
                      </span>
                    </div>

                    {/* Warranty Selector */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-foreground">
                        Garansi Servis
                      </label>
                      <select
                        disabled={isTicketLocked}
                        value={editWarrantyDays}
                        onChange={(e) => setEditWarrantyDays(Number(e.target.value))}
                        className={`w-full px-3 py-2 text-xs bg-card border border-input rounded-xl font-semibold text-foreground focus:ring-2 focus:ring-blue-500 ${
                          isTicketLocked ? "cursor-not-allowed opacity-75" : ""
                        }`}
                      >
                        <option value="0">Tanpa Garansi</option>
                        <option value="7">7 Hari (1 Minggu)</option>
                        <option value="14">14 Hari (2 Minggu)</option>
                        <option value="30">30 Hari (1 Bulan)</option>
                        <option value="60">60 Hari (2 Bulan)</option>
                        <option value="90">90 Hari (3 Bulan)</option>
                        <option value="180">180 Hari (6 Bulan)</option>
                        <option value="365">365 Hari (1 Tahun)</option>
                      </select>
                      <span className="text-[10px] text-muted-foreground block">
                        Jaminan setelah perbaikan
                      </span>
                    </div>
                  </div>

                  {/* Technician PIC Row */}
                  <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground shrink-0">
                        Teknisi Penanggung Jawab (PIC):
                      </span>
                      {users.length > 0 ? (
                        <select
                          disabled={isTicketLocked}
                          value={editTechName}
                          onChange={(e) => setEditTechName(e.target.value)}
                          className={`px-3 py-1.5 text-xs bg-card border border-input rounded-lg font-semibold text-foreground ${
                            isTicketLocked ? "cursor-not-allowed opacity-75" : ""
                          }`}
                        >
                          {users
                            .filter((u) => u.role === "technician" || u.role === "admin" || u.role === "owner")
                            .map((u) => (
                              <option key={u.id} value={u.name}>
                                {u.name} ({u.role === "technician" ? "Teknisi" : u.role === "admin" ? "Admin" : "Owner"})
                              </option>
                            ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          disabled={isTicketLocked}
                          value={editTechName}
                          onChange={(e) => setEditTechName(e.target.value)}
                          className={`px-3 py-1.5 text-xs bg-card border border-input rounded-lg font-semibold text-foreground ${
                            isTicketLocked ? "cursor-not-allowed opacity-75" : ""
                          }`}
                        />
                      )}
                    </div>

                    {editWarrantyDays > 0 && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        Garansi aktif {editWarrantyDays} hari terhitung sejak tanggal pelunasan/pengambilan.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-4 sm:p-5 border-t border-border bg-muted/20 shrink-0 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onPrintTicket(
                        activeTicket,
                        editStatus === "ready" || editStatus === "completed" ? "invoice" : "intake",
                        "continuous"
                      )
                    }
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Cetak Nota SPK</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onPrintTicket(activeTicket, "intake", "sticker_58mm")}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800 transition-colors"
                  >
                    <Tag className="h-4 w-4" />
                    <span>Cetak Stiker Unit</span>
                  </button>

                  {canDelete && !isTicketLocked && (
                    <button
                      type="button"
                      onClick={() => setTicketToDelete(activeTicket)}
                      className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-300 text-xs font-bold transition-colors border border-rose-200 dark:border-rose-900"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Hapus Tiket</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={closeDetailModal}
                    className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl border border-transparent hover:border-border transition-colors"
                  >
                    {isTicketLocked ? "Tutup" : "Batal"}
                  </button>

                  {isTicketLocked ? (
                    <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800">
                      <Lock className="h-3.5 w-3.5" />
                      <span>Terkunci (Khusus Owner)</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSaveTicketUpdates}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Simpan Perubahan</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CONFIRMATION MODAL: HAPUS TIKET SERVIS */}
      {ticketToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/60">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base">Hapus Tiket Servis?</h3>
                <p className="text-xs text-muted-foreground">Opsi ini khusus Pemilik Toko / Admin.</p>
              </div>
            </div>

            <div className="p-3.5 bg-muted/40 rounded-xl text-xs space-y-1.5 border border-border">
              <div>
                <span className="text-muted-foreground">Nomor Tiket: </span>
                <span className="font-mono font-bold text-blue-600">
                  {ticketToDelete.ticketNumber}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Pelanggan: </span>
                <span className="font-bold text-foreground">{ticketToDelete.customerName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Perangkat: </span>
                <span className="font-bold text-foreground">{ticketToDelete.deviceBrandModel}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Apakah Anda yakin ingin menghapus data servis yang salah input ini? Data yang terhapus
              tidak dapat dikembalikan.
            </p>

            <div className="flex justify-end space-x-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setTicketToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteTicket}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Ya, Hapus Tiket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
