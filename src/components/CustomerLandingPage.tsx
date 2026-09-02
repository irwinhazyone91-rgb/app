import React, { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import {
  Search,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Wrench,
  AlertCircle,
  Laptop,
  Phone,
  MessageCircle,
  HelpCircle,
  Calendar,
  Sparkles,
  Lock,
  ArrowRight,
  FileText,
  MapPin,
  Cpu,
  HardDrive,
  Monitor,
  Zap,
  CheckCircle,
  RefreshCw,
  Printer,
  ChevronDown,
  ShieldAlert,
  SlidersHorizontal,
  ExternalLink
} from "lucide-react";
import { ServiceTicket, StoreSettings } from "../types";
import {
  formatRupiah,
  formatDateIndo,
  getStatusConfig,
  createWhatsAppUrl
} from "../lib/utils";

interface CustomerLandingPageProps {
  onSearchTicket: (query: string) => Promise<ServiceTicket | null>;
  onOpenQRScanner: () => void;
  onOpenLoginStaff: () => void;
  onPrintTicket?: (ticket: ServiceTicket) => void;
  settings: StoreSettings;
  prefilledTicket?: ServiceTicket | null;
}

export const CustomerLandingPage: React.FC<CustomerLandingPageProps> = ({
  onSearchTicket,
  onOpenQRScanner,
  onOpenLoginStaff,
  onPrintTicket,
  settings,
  prefilledTicket
}) => {
  const [searchMode, setSearchMode] = useState<"service" | "warranty">("service");
  const [query, setQuery] = useState("");
  const [searchedTicket, setSearchedTicket] = useState<ServiceTicket | null>(
    prefilledTicket || null
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    if (prefilledTicket) {
      setSearchedTicket(prefilledTicket);
      setQuery(prefilledTicket.ticketNumber);
    }
  }, [prefilledTicket]);

  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = customQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const ticket = await onSearchTicket(q.trim());
      if (ticket) {
        setSearchedTicket(ticket);
        // Scroll smoothly to results
        setTimeout(() => {
          const resElement = document.getElementById("search-results-section");
          if (resElement) {
            resElement.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      } else {
        setSearchedTicket(null);
        setErrorMsg(
          searchMode === "warranty"
            ? `Data garansi untuk "${q}" tidak ditemukan. Pastikan Nomor Tiket, Serial Number, atau No. WhatsApp sudah sesuai.`
            : `Data tiket servis "${q}" tidak ditemukan di database. Pastikan Nomor Tiket (misal: SRV-202508-001) atau No. WhatsApp Anda benar.`
        );
      }
    } catch {
      setErrorMsg("Gagal menghubungi server database. Silakan coba sesaat lagi.");
    } finally {
      setLoading(false);
    }
  };

  // Stepper timeline definition
  const steps = [
    { key: "received", label: "Penerimaan Unit", desc: "Unit masuk & SPK 21x15cm dicatat" },
    { key: "diagnosing", label: "Pengecekan / Diagnosa", desc: "Pemeriksaan hardware & software" },
    { key: "waiting_approval", label: "Konfirmasi Pelanggan", desc: "Persetujuan biaya & sparepart" },
    { key: "in_progress", label: "Pengerjaan Reparasi", desc: "Proses perbaikan & ganti part" },
    { key: "ready", label: "Siap Diambil (QC Lolos)", desc: "Uji fungsi & Quality Control" },
    { key: "completed", label: "Selesai & Diambil", desc: "Pelunasan & garansi aktif" },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case "received": return 0;
      case "diagnosing": return 1;
      case "waiting_approval": return 2;
      case "in_progress": return 3;
      case "ready": return 4;
      case "completed": return 5;
      default: return 0;
    }
  };

  const currentStepIdx = searchedTicket ? getStepIndex(searchedTicket.status) : 0;
  const statusCfg = searchedTicket ? getStatusConfig(searchedTicket.status) : null;
  const remaining = searchedTicket
    ? Math.max(0, (searchedTicket.finalCost || searchedTicket.estimatedCost) - searchedTicket.downPayment)
    : 0;

  // Calculate warranty status
  let isWarrantyActive = false;
  let daysLeftWarranty = 0;
  let effectiveWarrantyUntil = searchedTicket?.warrantyUntil || "";

  if (searchedTicket) {
    const wDays = searchedTicket.warrantyDays !== undefined ? searchedTicket.warrantyDays : 30;
    if (wDays > 0) {
      if (!effectiveWarrantyUntil) {
        const baseDate = new Date(searchedTicket.completedAt || searchedTicket.updatedAt || searchedTicket.createdAt || Date.now());
        effectiveWarrantyUntil = new Date(baseDate.getTime() + wDays * 86400000).toISOString().split("T")[0];
      }
      const today = new Date();
      const until = new Date(effectiveWarrantyUntil);
      const diffTime = until.getTime() - today.getTime();
      daysLeftWarranty = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      isWarrantyActive = daysLeftWarranty >= 0;
    }
  }

  const quickSampleTickets = ["SRV-202508-001", "SRV-202508-002", "SRV-202508-003"];

  const servicesList = [
    {
      icon: <Cpu className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
      title: "Reparasi Motherboard & Chipset",
      desc: "Penanganan laptop mati total, korsleting jalur IC power, reballing VGA/GPU gaming, dan BIOS flashing."
    },
    {
      icon: <Monitor className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />,
      title: "Ganti Layar LCD & Keyboard",
      desc: "Penggantian panel LCD pecah, garis, flickering, serta penggantian keyboard original untuk semua merk laptop."
    },
    {
      icon: <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
      title: "Upgrade SSD & RAM Super Cepat",
      desc: "Upgrade performa komputasi menggunakan SSD NVMe PCIe gen 4 dan RAM Dual Channel dengan garansi resmi."
    },
    {
      icon: <Wrench className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
      title: "Pembersihan & Ganti Thermal Paste",
      desc: "Maintenance thermal cooling system menggunakan pasta pendingin high-grade agar suhu CPU/GPU tetap dingin."
    },
    {
      icon: <HardDrive className="h-6 w-6 text-rose-600 dark:text-rose-400" />,
      title: "Penyelamatan Data & Instalasi OS",
      desc: "Data recovery dari harddisk bad sector/terformat, instalasi OS resmi, driver update, & aplikasi produktivitas."
    },
    {
      icon: <Laptop className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />,
      title: "Rakit PC Custom & Office/Gaming",
      desc: "Perakitan PC custom gaming, content creation, maupun workstation kantor dengan cable management rapi."
    }
  ];

  const faqs = [
    {
      q: "Bagaimana cara mengecek status pengerjaan servis laptop/PC saya?",
      a: "Cukup masukkan Nomor Tiket yang tertera di sudut kanan atas lembar Tanda Terima (SPK 21x15cm) atau masukkan Nomor WhatsApp Anda pada kolom pencarian di atas. Anda juga bisa langsung memindai QR Code di lembar SPK menggunakan kamera ponsel."
    },
    {
      q: "Berapa lama masa garansi servis yang diberikan oleh toko?",
      a: "Masa garansi servis berkisar antara 30 hari hingga 90 hari tergantung jenis perbaikan dan komponen suku cadang yang diganti. Informasi masa garansi dan tanggal berakhir tercantum secara detail pada Nota Konsumen dan di sistem pencarian garansi ini."
    },
    {
      q: "Apakah ada biaya pengecekan jika unit tidak jadi diperbaiki?",
      a: "Kami mengutamakan transparansi. Biaya diagnosa dan estimasi awal bersifat transparan dan dikonfirmasikan terlebih dahulu ke pelanggan sebelum tindakan pengerjaan dilakukan."
    },
    {
      q: "Bagaimana prosedur klaim garansi jika terjadi kendala kembali?",
      a: "Anda cukup membawa unit dan menunjukkan Nota Konsumen asli (ukuran 21cm x 15cm) atau menunjukkan data servis di website ini dengan kondisi segel servis pada unit masih utuh."
    },
    {
      q: "Apakah data dan privasi file saya di dalam perangkat aman?",
      a: "Toko kami menerapkan standar operasional ketat untuk menjaga keamanan privasi data pelanggan. Teknisi hanya berfokus pada perbaikan hardware atau sistem yang disetujui."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-blue-600 selection:text-white">
      {/* 1. TOP NAVBAR FOR CONSUMER PORTAL */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Store Identity */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-foreground">
                  {settings.storeName}
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  ● Portal Pelanggan
                </span>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block truncate max-w-sm">
                {settings.tagline}
              </p>
            </div>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <a
              href={createWhatsAppUrl(
                settings.whatsapp,
                `Halo ${settings.storeName}, saya ingin bertanya mengenai layanan servis dan garansi komputer/laptop.`
              )}
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 border border-emerald-200/60 dark:border-emerald-900 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp Toko</span>
            </a>

            <button
              onClick={onOpenLoginStaff}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 text-foreground border border-border transition-all shadow-2xs"
              title="Masuk sebagai Administrator / Teknisi / Kasir"
            >
              <Lock className="h-3.5 w-3.5 text-blue-600" />
              <span>Login Petugas</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION & DEDICATED TRACKING / WARRANTY SEARCH BOX */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-background to-background dark:from-blue-950/20 dark:via-background dark:to-background pt-8 pb-12 sm:pt-12 sm:pb-16 px-4 sm:px-6 border-b border-border/50">
        <div className="max-w-4xl mx-auto space-y-6 text-center">
          {/* Hero Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-900/60 shadow-2xs">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span>Lacak Status Pengerjaan & Cek Validasi Garansi Toko Realtime</span>
          </div>

          {/* Hero Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
            Pantau Progres Servis & <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Klaim Garansi Resmi
            </span>{" "}
            Secara Online
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Masukkan <strong>Nomor Tiket Servis</strong> (pada lembar SPK 21x15cm), <strong>No. WhatsApp</strong>, atau <strong>Nomor Seri Perangkat</strong> Anda untuk memantau status diagnosa teknisi dan masa aktif garansi.
          </p>

          {/* Search Tabs & Box */}
          <div className="bg-card border-2 border-border/80 rounded-2xl p-4 sm:p-6 shadow-xl text-left max-w-3xl mx-auto">
            {/* Search Mode Switcher Tabs */}
            <div className="flex items-center space-x-2 border-b border-border pb-3 mb-4 text-xs">
              <button
                type="button"
                onClick={() => setSearchMode("service")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold transition-all ${
                  searchMode === "service"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Wrench className="h-4 w-4" />
                <span>🔍 Lacak Status Servis</span>
              </button>

              <button
                type="button"
                onClick={() => setSearchMode("warranty")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold transition-all ${
                  searchMode === "warranty"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>🛡️ Cek Masa Garansi Toko</span>
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={(e) => handleSearch(e)} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={
                    searchMode === "warranty"
                      ? "Masukkan No. Tiket, No. Seri (SN), atau No. WhatsApp..."
                      : "Masukkan No. Tiket Servis (misal: SRV-202508-001) atau No. WA..."
                  }
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 text-sm bg-muted/40 border border-input rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium placeholder:text-muted-foreground/70"
                />
              </div>

              {/* QR Scanner Trigger */}
              <button
                type="button"
                onClick={onOpenQRScanner}
                className="flex items-center justify-center space-x-2 px-4 py-3.5 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-xl text-xs sm:text-sm transition-colors border border-border shadow-2xs shrink-0"
                title="Pindai QR Code Tiket / SPK dengan Kamera HP"
              >
                <QrCode className="h-4 w-4 text-blue-600" />
                <span>Scan QR</span>
              </button>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`flex items-center justify-center space-x-2 px-6 py-3.5 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 shrink-0 ${
                  searchMode === "warranty"
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Mencari...</span>
                  </>
                ) : (
                  <>
                    <span>{searchMode === "warranty" ? "Cek Garansi" : "Lacak Servis"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Sample Tiket Suggestions */}
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
              <span className="font-semibold text-[11px]">Contoh Tiket Demo:</span>
              {quickSampleTickets.map((tNum) => (
                <button
                  key={tNum}
                  type="button"
                  onClick={() => {
                    setQuery(tNum);
                    handleSearch(undefined, tNum);
                  }}
                  className="px-2 py-0.5 bg-muted hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-950/60 dark:hover:text-blue-300 rounded-md font-mono text-[11px] border border-border transition-colors font-medium"
                >
                  {tNum}
                </button>
              ))}
            </div>

            {/* Error Message if not found */}
            {errorMsg && (
              <div className="mt-4 p-3.5 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 rounded-xl text-xs flex items-center gap-2.5 border border-rose-200 dark:border-rose-900 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. SEARCH RESULTS SECTION (IF TICKET FOUND) */}
      {searchedTicket && statusCfg && (
        <section
          id="search-results-section"
          className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6"
        >
          <div className="bg-card border-2 border-blue-500/40 dark:border-blue-500/30 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6 relative overflow-hidden">
            {/* Header Result Line */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
                    {searchedTicket.ticketNumber}
                  </span>
                  <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                    📅 Masuk: {formatDateIndo(searchedTicket.createdAt)}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {searchedTicket.deviceBrandModel}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Pemilik: <span className="font-semibold text-foreground">{searchedTicket.customerName}</span> ({searchedTicket.customerPhone})
                  {searchedTicket.serialNumber && (
                    <span className="ml-2 font-mono text-[11px] bg-muted/60 px-2 py-0.5 rounded">
                      SN: {searchedTicket.serialNumber}
                    </span>
                  )}
                </p>
              </div>

              {/* Status Pill & Action Buttons */}
              <div className="flex flex-col sm:items-end gap-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold border shadow-xs ${statusCfg.bg}`}>
                    {statusCfg.label}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground text-left sm:text-right font-medium">
                  {statusCfg.desc}
                </span>

                {/* Quick Print Nota 21x15cm Button */}
                {onPrintTicket && (
                  <button
                    type="button"
                    onClick={() => onPrintTicket(searchedTicket)}
                    className="mt-1 flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 rounded-lg text-xs font-bold border border-blue-200/60 dark:border-blue-900/60 transition-colors"
                    title="Cetak Tanda Terima Nota Konsumen 21 cm x 15 cm (1 Rangkap)"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>📄 Cetak Nota SPK (21x15cm)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="space-y-3 bg-muted/20 p-4 sm:p-5 rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>Tahapan Pengerjaan Servis:</span>
                </h3>
                <span className="text-xs text-muted-foreground">
                  Langkah {currentStepIdx + 1} dari {steps.length}
                </span>
              </div>

              <div className="relative pt-2">
                {/* Horizontal Progress Line for desktop */}
                <div className="hidden sm:block absolute top-6 left-6 right-6 h-1 bg-muted rounded-full">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }}
                  ></div>
                </div>

                {/* Step Circles */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 sm:gap-2">
                  {steps.map((step, idx) => {
                    const isDone = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;

                    return (
                      <div key={step.key} className="flex flex-col items-center text-center relative z-10">
                        <div
                          className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isDone
                              ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                              : "bg-card text-muted-foreground border-2 border-border"
                          } ${isCurrent ? "ring-4 ring-blue-500/20 scale-110" : ""}`}
                        >
                          {isDone ? <CheckCircle2 className="h-4.5 w-4.5" /> : idx + 1}
                        </div>
                        <span
                          className={`text-xs font-bold mt-2.5 ${
                            isCurrent
                              ? "text-blue-600 dark:text-blue-400"
                              : isDone
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {step.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground hidden sm:block mt-0.5 line-clamp-2">
                          {step.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Two Column Service & Warranty Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Diagnostics & Device details */}
              <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-3 text-xs">
                <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Laptop className="h-3.5 w-3.5 text-blue-600" />
                  <span>Detail Keluhan & Diagnosa Unit</span>
                </h4>

                <div className="space-y-1">
                  <span className="text-muted-foreground block text-[11px]">Keluhan Saat Didaftarkan:</span>
                  <div className="font-semibold text-foreground bg-card p-2 rounded-lg border border-border">
                    {searchedTicket.complaints}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground block text-[11px]">Kelengkapan Unit:</span>
                  <div className="font-medium text-foreground bg-card p-2 rounded-lg border border-border">
                    {searchedTicket.accessories || "Hanya Unit"}
                  </div>
                </div>

                {searchedTicket.technicianNotes && (
                  <div className="p-3 rounded-lg bg-blue-50/80 dark:bg-blue-950/50 text-blue-950 dark:text-blue-200 border border-blue-200/80 dark:border-blue-900/60 space-y-1">
                    <span className="font-bold block text-[11px] text-blue-700 dark:text-blue-300">
                      🛠️ Catatan Diagnosa & Pengerjaan Teknisi:
                    </span>
                    <p className="leading-relaxed">{searchedTicket.technicianNotes}</p>
                    <span className="block text-[10px] text-muted-foreground pt-1">
                      Teknisi PIC: <strong>{searchedTicket.technicianName}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Right Column: Financial & Dedicated Digital Warranty Box */}
              <div className="space-y-4">
                {/* Cost Breakdown */}
                <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-2.5 text-xs">
                  <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span>Rincian Biaya & Pembayaran</span>
                    <span className="text-[10px] text-muted-foreground font-normal">Nota 21x15cm (1 Rangkap)</span>
                  </h4>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Biaya Perbaikan:</span>
                      <span className="font-bold text-foreground">
                        {searchedTicket.finalCost > 0
                          ? formatRupiah(searchedTicket.finalCost)
                          : searchedTicket.estimatedCost > 0
                          ? `Est. ${formatRupiah(searchedTicket.estimatedCost)}`
                          : "Menunggu Diagnosa"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Uang Muka (DP) Diterima:</span>
                      <span className="font-semibold text-emerald-600">
                        {formatRupiah(searchedTicket.downPayment)}
                      </span>
                    </div>

                    <div className="flex justify-between font-black text-sm text-foreground pt-2 border-t border-border">
                      <span>Sisa Pelunasan:</span>
                      <span className="text-blue-600 dark:text-blue-400">
                        {formatRupiah(remaining)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* DIGITAL WARRANTY CARD */}
                <div className={`p-4 rounded-xl border space-y-2.5 ${
                  searchedTicket.warrantyDays > 0 && isWarrantyActive
                    ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200"
                    : searchedTicket.warrantyDays > 0
                    ? "bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200"
                    : "bg-muted/40 border-border text-muted-foreground"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-extrabold text-xs uppercase tracking-wider">
                        Status Garansi Toko
                      </span>
                    </div>

                    {searchedTicket.warrantyDays > 0 && isWarrantyActive ? (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-600 text-white">
                        AKTIF (SISA {daysLeftWarranty} HARI)
                      </span>
                    ) : searchedTicket.warrantyDays > 0 ? (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-600 text-white">
                        GARANSI BERAKHIR
                      </span>
                    ) : (
                      <span className="text-[11px]">Garansi standar pengerjaan</span>
                    )}
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Masa Berlaku Garansi:</span>
                      <span className="font-bold">{searchedTicket.warrantyDays || 30} Hari</span>
                    </div>
                    {effectiveWarrantyUntil && (
                      <div className="flex justify-between">
                        <span>Berlaku Sampai Tanggal:</span>
                        <span className="font-bold font-mono">
                          {formatDateIndo(effectiveWarrantyUntil)}
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground/90 pt-1 border-t border-emerald-200/60 dark:border-emerald-900/60 leading-tight">
                    {settings.warrantyTerms}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Contact & Claim Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border text-xs">
              <span className="text-muted-foreground text-center sm:text-left">
                Butuh bantuan teknisi atau ingin melakukan klaim garansi?
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={createWhatsAppUrl(
                    settings.whatsapp,
                    `Halo Admin ${settings.storeName}, saya ingin menanyakan perbaikan/klaim garansi unit servis No. Tiket *${searchedTicket.ticketNumber}* (${searchedTicket.deviceBrandModel}). Terima kasih.`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Hubungi CS WhatsApp Toko</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. LAYANAN SERVIS UNGGULAN KAMI */}
      <section className="py-12 px-4 sm:px-6 bg-muted/20 border-t border-border">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Layanan Spesialis Servis Komputer & Laptop
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Dikerjakan langsung oleh teknisi berpengalaman dengan peralatan modern, komponen original, dan garansi resmi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {servicesList.map((srv, idx) => (
              <div
                key={idx}
                className="bg-card border border-border rounded-2xl p-5 shadow-xs hover:border-blue-500/50 hover:shadow-md transition-all space-y-3"
              >
                <div className="p-3 bg-muted rounded-xl w-fit">{srv.icon}</div>
                <h3 className="font-bold text-foreground text-sm sm:text-base">{srv.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{srv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SYARAT & KETENTUAN GARANSI RESMI TOKO */}
      <section className="py-12 px-4 sm:px-6 border-t border-border">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-xl text-xs font-bold mb-1">
              <ShieldCheck className="h-4 w-4" />
              <span>Jaminan Kualitas Pelanggan</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Ketentuan Garansi Servis & Suku Cadang
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              Komitmen kami memberikan perlindungan penuh atas setiap unit yang selesai diperbaiki di {settings.storeName}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2 text-emerald-600">
                <CheckCircle className="h-4 w-4" />
                <span>Yang Termasuk Dalam Garansi:</span>
              </h3>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside">
                <li>Kerusakan yang sama pada modul/komponen yang diperbaiki sebelumnya.</li>
                <li>Penggantian suku cadang baru jika terjadi kegagalan fungsi manufaktur dalam masa garansi.</li>
                <li>Pengecekan dan kalibrasi ulang tanpa dipungut biaya jasa tambahan.</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2 text-rose-600">
                <ShieldAlert className="h-4 w-4" />
                <span>Ketentuan Garansi Tidak Berlaku:</span>
              </h3>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside">
                <li>Segel garansi toko pada fisik unit rusak, robek, atau pernah dibongkar pihak lain.</li>
                <li>Kerusakan baru akibat kelalaian fisik, jatuh, tertindih, atau tersiram cairan.</li>
                <li>Kerusakan akibat lonjakan listrik / petir yang merusak power supply atau adaptor.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section className="py-12 px-4 sm:px-6 bg-muted/20 border-t border-border">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Pertanyaan Umum (FAQ)
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Jawaban atas pertanyaan yang sering diajukan konsumen seputar perbaikan & garansi.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="bg-card border border-border rounded-xl overflow-hidden shadow-2xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full p-4 text-left font-semibold text-xs sm:text-sm flex items-center justify-between text-foreground hover:bg-muted/40"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform ${
                        isOpen ? "rotate-180 text-blue-600" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-0 text-xs text-muted-foreground leading-relaxed border-t border-border/40 bg-muted/10">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. FOOTER & STORE LOCATION */}
      <footer className="mt-auto bg-card border-t border-border py-8 px-4 sm:px-6 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Store Address */}
          <div className="space-y-2">
            <h4 className="font-bold text-foreground text-sm uppercase tracking-wider">
              {settings.storeName}
            </h4>
            <p className="leading-relaxed">{settings.address}</p>
            <div className="space-y-1 font-medium text-foreground">
              <p>📞 Telp: {settings.phone}</p>
              <p>💬 WhatsApp: {settings.whatsapp}</p>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="space-y-2">
            <h4 className="font-bold text-foreground text-sm uppercase tracking-wider">
              Jam Operasional Bengkel
            </h4>
            <p>Senin – Sabtu: <strong>08.30 – 20.00 WIB</strong></p>
            <p>Minggu: <strong>10.00 – 17.00 WIB</strong></p>
            <p className="text-[11px] text-muted-foreground pt-1">
              *Penerimaan servis dan konsultasi teknisi buka setiap hari kerja.
            </p>
          </div>

          {/* Staff & Links */}
          <div className="space-y-2">
            <h4 className="font-bold text-foreground text-sm uppercase tracking-wider">
              Akses & Bantuan
            </h4>
            <div className="space-y-2">
              <button
                onClick={onOpenLoginStaff}
                className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Portal Login Administrator / Teknisi / Kasir</span>
              </button>
              <p className="text-[11px]">
                Format Cetak Nota Resmi: Kertas 21 cm x 15 cm (1 Rangkap)
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <span>
            © {new Date().getFullYear()} {settings.storeName} — Portal Lacak Servis & Garansi Konsumen
          </span>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="hover:text-blue-600 font-semibold transition-colors"
            >
              Kembali ke Atas ↑
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLandingPage;
