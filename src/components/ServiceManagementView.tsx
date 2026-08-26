import React, { useState } from "react";
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
  ChevronDown,
  Tag,
  FileText
} from "lucide-react";
import { ServiceTicket, ServiceStatus, Product, ServicePart, User } from "../types";
import {
  formatRupiah,
  formatDateIndo,
  getStatusConfig,
  createWhatsAppUrl
} from "../lib/utils";

interface ServiceManagementViewProps {
  tickets: ServiceTicket[];
  products: Product[];
  users?: User[];
  onCreateTicket: (ticketData: Partial<ServiceTicket>) => void;
  onUpdateTicket: (id: string, updates: Partial<ServiceTicket>) => void;
  onDeleteTicket: (id: string) => void;
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
  users = [],
  onCreateTicket,
  onUpdateTicket,
  onDeleteTicket,
  onPrintTicket,
  onPayInPOS,
  selectedTicketForDetail,
  onCloseDetail
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<ServiceTicket | null>(
    selectedTicketForDetail || null
  );

  // New Ticket Form State
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    deviceType: "laptop" as const,
    deviceBrandModel: "",
    serialNumber: "",
    complaints: "",
    accessories: "Unit + Charger",
    technicianName: "Rian (Senior Tech)",
    estimatedCost: 0,
    downPayment: 0,
    warrantyDays: 30
  });

  // Ticket Editing State
  const [editStatus, setEditStatus] = useState<ServiceStatus>("received");
  const [editTechNotes, setEditTechNotes] = useState("");
  const [editTechName, setEditTechName] = useState("");
  const [editFinalCost, setEditFinalCost] = useState(0);
  const [editDownPayment, setEditDownPayment] = useState(0);
  const [editWarrantyDays, setEditWarrantyDays] = useState(30);
  const [partsList, setPartsList] = useState<ServicePart[]>([]);

  // Sparepart selector helper
  const [selectedSparepartId, setSelectedSparepartId] = useState("");
  const [customPartName, setCustomPartName] = useState("");
  const [customPartPrice, setCustomPartPrice] = useState(0);

  // Open Edit Modal
  const openDetail = (ticket: ServiceTicket) => {
    setActiveTicket(ticket);
    setEditStatus(ticket.status);
    setEditTechNotes(ticket.technicianNotes || "");
    setEditTechName(ticket.technicianName || "Teknisi Utama");
    setEditFinalCost(ticket.finalCost || ticket.estimatedCost || 0);
    setEditDownPayment(ticket.downPayment || 0);
    setEditWarrantyDays(ticket.warrantyDays || 30);
    setPartsList(ticket.partsUsed || []);
  };

  const closeDetailModal = () => {
    setActiveTicket(null);
    if (onCloseDetail) onCloseDetail();
  };

  // Filtered list
  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
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

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateTicket(formData);
    setIsNewModalOpen(false);
    setFormData({
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      deviceType: "laptop",
      deviceBrandModel: "",
      serialNumber: "",
      complaints: "",
      accessories: "Unit + Charger",
      technicianName: "Rian (Senior Tech)",
      estimatedCost: 0,
      downPayment: 0,
      warrantyDays: 30
    });
  };

  const handleAddPartFromInventory = () => {
    if (!selectedSparepartId) return;
    const prod = products.find((p) => p.id === selectedSparepartId);
    if (!prod) return;

    const newPart: ServicePart = {
      id: `part-${Date.now()}`,
      name: prod.name,
      price: prod.sellPrice,
      qty: 1
    };

    const updatedParts = [...partsList, newPart];
    setPartsList(updatedParts);
    
    // Auto update total final cost
    const partsSum = updatedParts.reduce((acc, p) => acc + p.price * p.qty, 0);
    if (editFinalCost < partsSum) {
      setEditFinalCost(partsSum);
    }
    setSelectedSparepartId("");
  };

  const handleAddCustomPart = () => {
    if (!customPartName || customPartPrice <= 0) return;
    const newPart: ServicePart = {
      id: `part-${Date.now()}`,
      name: customPartName,
      price: customPartPrice,
      qty: 1
    };
    const updatedParts = [...partsList, newPart];
    setPartsList(updatedParts);
    setCustomPartName("");
    setCustomPartPrice(0);
  };

  const handleRemovePart = (index: number) => {
    const updated = partsList.filter((_, i) => i !== index);
    setPartsList(updated);
  };

  const handleSaveTicketUpdates = () => {
    if (!activeTicket) return;
    onUpdateTicket(activeTicket.id, {
      status: editStatus,
      technicianNotes: editTechNotes,
      technicianName: editTechName,
      finalCost: editFinalCost,
      downPayment: editDownPayment,
      warrantyDays: editWarrantyDays,
      partsUsed: partsList
    });
    closeDetailModal();
  };

  // Generate customized WhatsApp Message
  const getWhatsAppMessage = (ticket: ServiceTicket) => {
    const remaining = Math.max(0, (ticket.finalCost || ticket.estimatedCost) - ticket.downPayment);
    
    if (ticket.status === "ready") {
      return `Halo Kak *${ticket.customerName}*,\n\nKabar baik dari *ServisKu Computer*! Unit perbaikan Anda:\n🔹 *No. Tiket*: ${ticket.ticketNumber}\n🔹 *Perangkat*: ${ticket.deviceBrandModel}\n🔹 *Status*: *SELESAI & SIAP DIAMBIL*\n🔹 *Total Biaya*: ${formatRupiah(ticket.finalCost || ticket.estimatedCost)}\n🔹 *Sisa Pembayaran*: ${formatRupiah(remaining)}\n🔹 *Garansi Servis*: ${ticket.warrantyDays} Hari\n\nUnit sudah melewati tahap Quality Control (QC). Silakan datang ke toko kami dengan membawa tanda terima/nota ini.\n\nTerima kasih! 🙏`;
    }

    if (ticket.status === "waiting_approval") {
      return `Halo Kak *${ticket.customerName}*,\n\nUpdate dari teknisi *ServisKu Computer* untuk tiket *${ticket.ticketNumber}* (${ticket.deviceBrandModel}):\n\n📌 *Hasil Diagnosa*: ${ticket.technicianNotes || "Pengecekan komponen rusak"}\n📌 *Estimasi Biaya*: ${formatRupiah(ticket.estimatedCost || ticket.finalCost)}\n\nMohon konfirmasi persetujuan perbaikan agar teknisi kami dapat segera melanjutkan pengerjaan. Terima kasih! 🙏`;
    }

    if (ticket.status === "in_progress") {
      return `Halo Kak *${ticket.customerName}*,\n\nPerbaikan unit Anda dengan No. Tiket *${ticket.ticketNumber}* (${ticket.deviceBrandModel}) saat ini *SEDANG DALAM PROSES PENGERJAAN* oleh teknisi kami (${ticket.technicianName}). Kami akan menginfokan kembali begitu unit selesai diuji. Terima kasih! 🙏`;
    }

    // Default / Received
    return `Halo Kak *${ticket.customerName}*,\n\nTerima kasih telah mempercayakan perbaikan di *ServisKu Computer*.\n\n📋 *Tanda Terima Servis Masuk*:\n🔹 No. Tiket: *${ticket.ticketNumber}*\n🔹 Perangkat: ${ticket.deviceBrandModel}\n🔹 Keluhan: ${ticket.complaints}\n🔹 Kelengkapan: ${ticket.accessories}\n🔹 Uang Muka (DP): ${formatRupiah(ticket.downPayment)}\n\nAnda dapat mengecek status pengerjaan secara online kapan saja di website kami dengan memasukkan Nomor Tiket *${ticket.ticketNumber}*. Terima kasih! 🙏`;
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
            Kelola pendaftaran unit masuk, status diagnosa teknisi, nota tanda terima, & garansi.
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

        {/* Status Filter */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
          {[
            { id: "all", label: "Semua" },
            { id: "received", label: "Antrean" },
            { id: "diagnosing", label: "Diagnosa" },
            { id: "in_progress", label: "Pengerjaan" },
            { id: "ready", label: "Siap Ambil" },
            { id: "completed", label: "Selesai" },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === s.id
                  ? "bg-blue-600 text-white"
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
              className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-blue-500/40 transition-all hover:shadow-md"
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
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${statusCfg.bg}`}>
                    {statusCfg.label}
                  </span>
                </div>

                {/* Device & Complaints */}
                <div className="mt-3.5 space-y-2 text-xs">
                  <div className="flex items-center text-foreground font-medium">
                    <Laptop className="h-3.5 w-3.5 text-muted-foreground mr-1.5 shrink-0" />
                    <span className="truncate">{ticket.deviceBrandModel}</span>
                  </div>

                  <div className="bg-muted/40 p-2.5 rounded-lg text-muted-foreground">
                    <span className="font-semibold text-foreground">Keluhan: </span>
                    <span className="line-clamp-2">{ticket.complaints}</span>
                  </div>

                  {ticket.technicianNotes && (
                    <div className="p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40">
                      <span className="font-semibold">Catatan Teknisi: </span>
                      <span className="line-clamp-2">{ticket.technicianNotes}</span>
                    </div>
                  )}
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
                      onClick={() => onPrintTicket(ticket, ticket.status === "ready" || ticket.status === "completed" ? "invoice" : "intake", "continuous")}
                      title="Cetak Surat Perintah Kerja (SPK) / Nota Tanda Terima untuk Konsumen"
                      className="py-1.5 px-2 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 font-bold rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors border border-blue-200/50 dark:border-blue-900/50"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">📄 Nota Konsumen</span>
                    </button>

                    <button
                      onClick={() => onPrintTicket(ticket, "intake", "sticker_58mm")}
                      title="Cetak Stiker Tempel Ukuran 58mm untuk ditempel langsung di Casing Unit Servis"
                      className="py-1.5 px-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-2xs"
                    >
                      <Tag className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">🏷️ Stiker 58mm</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => openDetail(ticket)}
                      title="Buka detail & update pengerjaan teknisi"
                      className="col-span-2 py-1.5 px-2 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-lg text-xs flex items-center justify-center space-x-1 transition-colors border border-border"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Update Servis</span>
                    </button>

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
              Tidak ada data servis yang sesuai dengan filter atau kata kunci pencarian.
            </p>
          </div>
        )}
      </div>

      {/* MODAL: BUAT TIKET SERVIS BARU */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Pendaftaran Unit Servis Baru</h2>
                <p className="text-xs text-muted-foreground">Catat data pelanggan & kerusakan untuk diterbitkan SPK Masuk.</p>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-sm">
              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
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
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Nomor WhatsApp / HP *
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
              </div>

              {/* Device Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Jenis Perangkat *
                  </label>
                  <select
                    value={formData.deviceType}
                    onChange={(e) => setFormData({ ...formData, deviceType: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
                  >
                    <option value="laptop">Laptop / Notebook</option>
                    <option value="pc">PC Desktop / Rakitan</option>
                    <option value="printer">Printer / Scanner</option>
                    <option value="monitor">Monitor LCD / LED</option>
                    <option value="other">Perangkat Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Merek & Seri / Model *
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

              {/* Financials & Tech */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Estimasi Biaya Awal (Rp)
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

              <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md"
                >
                  Simpan & Cetak Tanda Terima
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL & UPDATE PROGRESS TIKET */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-600 text-base">
                    {activeTicket.ticketNumber}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    • Dibuat: {formatDateIndo(activeTicket.createdAt)}
                  </span>
                </div>
                <h2 className="text-base font-bold text-foreground mt-0.5">
                  {activeTicket.customerName} — {activeTicket.deviceBrandModel}
                </h2>
              </div>
              <button
                onClick={closeDetailModal}
                className="text-muted-foreground hover:text-foreground p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick Actions in Detail */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 border border-border rounded-xl">
              <span className="text-xs font-semibold text-muted-foreground mr-1">Cetak Cepat:</span>
              <button
                type="button"
                onClick={() => onPrintTicket(activeTicket, "intake", "sticker_58mm")}
                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Tag className="h-3.5 w-3.5" />
                <span>🏷️ Stiker Tempel 58mm</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onPrintTicket(
                    activeTicket,
                    editStatus === "ready" || editStatus === "completed" ? "invoice" : "intake",
                    "continuous"
                  )
                }
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>📄 Nota Konsumen (21x15cm)</span>
              </button>
            </div>

            {/* Quick Status Bar */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Update Status Pengerjaan:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "received", label: "Antrean Masuk" },
                  { id: "diagnosing", label: "Pengecekan" },
                  { id: "waiting_approval", label: "Menunggu ACC" },
                  { id: "in_progress", label: "Pengerjaan" },
                  { id: "ready", label: "Siap Diambil" },
                  { id: "completed", label: "Selesai/Diambil" },
                  { id: "cancelled", label: "Dibatalkan" },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setEditStatus(st.id as ServiceStatus)}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all ${
                      editStatus === st.id
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Technician Diagnostics Note */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Catatan Diagnosa & Tindakan Teknisi:
              </label>
              <textarea
                rows={3}
                placeholder="Tuliskan temuan kerusakan, tindakan yang sudah diambil, atau rekomendasi penggantian part..."
                value={editTechNotes}
                onChange={(e) => setEditTechNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
              ></textarea>
            </div>

            {/* Spare Parts & Service Addons */}
            <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground uppercase tracking-wider">
                  Spare Part & Jasa Tambahan
                </span>
                <span className="text-xs text-muted-foreground">
                  Subtotal: {formatRupiah(partsList.reduce((acc, p) => acc + p.price * p.qty, 0))}
                </span>
              </div>

              {/* Add from inventory */}
              <div className="flex gap-2">
                <select
                  value={selectedSparepartId}
                  onChange={(e) => setSelectedSparepartId(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-card border border-input rounded-lg"
                >
                  <option value="">-- Pilih dari Stok Toko --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatRupiah(p.sellPrice)}) - Stok: {p.stock}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddPartFromInventory}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg"
                >
                  + Tambah
                </button>
              </div>

              {/* Custom Part / Jasa Input */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-border/50">
                <input
                  type="text"
                  placeholder="Atau nama part custom..."
                  value={customPartName}
                  onChange={(e) => setCustomPartName(e.target.value)}
                  className="sm:col-span-2 px-3 py-1.5 text-xs bg-card border border-input rounded-lg"
                />
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    placeholder="Harga (Rp)"
                    value={customPartPrice || ""}
                    onChange={(e) => setCustomPartPrice(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-card border border-input rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomPart}
                    className="px-2.5 py-1.5 bg-zinc-700 hover:bg-zinc-800 text-white text-xs font-bold rounded-lg"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Table of selected parts */}
              {partsList.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  {partsList.map((part, idx) => (
                    <div
                      key={part.id || idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-card border border-border text-xs"
                    >
                      <div>
                        <div className="font-medium text-foreground">{part.name}</div>
                        <div className="text-muted-foreground">{formatRupiah(part.price)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePart(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Final Cost & Warranty Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Total Biaya Akhir (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={editFinalCost}
                  onChange={(e) => setEditFinalCost(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg font-bold text-foreground"
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
                  value={editDownPayment}
                  onChange={(e) => setEditDownPayment(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Masa Garansi Servis
                </label>
                <select
                  value={editWarrantyDays}
                  onChange={(e) => setEditWarrantyDays(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
                >
                  <option value="0">Tanpa Garansi</option>
                  <option value="7">7 Hari</option>
                  <option value="14">14 Hari</option>
                  <option value="30">30 Hari (1 Bulan)</option>
                  <option value="60">60 Hari (2 Bulan)</option>
                  <option value="90">90 Hari (3 Bulan)</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-border">
              <div className="flex items-center space-x-2">
                <a
                  href={createWhatsAppUrl(activeTicket.customerPhone, getWhatsAppMessage({ ...activeTicket, status: editStatus, finalCost: editFinalCost, downPayment: editDownPayment, technicianNotes: editTechNotes }))}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Kirim WA ke Pelanggan</span>
                </a>

                <button
                  type="button"
                  onClick={() => onPrintTicket(activeTicket, editStatus === "ready" || editStatus === "completed" ? "invoice" : "intake")}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold"
                >
                  <Printer className="h-4 w-4" />
                  <span>Cetak Nota</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={closeDetailModal}
                  className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveTicketUpdates}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
