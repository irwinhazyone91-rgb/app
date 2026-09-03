import React, { useState, useEffect } from "react";
import {
  Search,
  QrCode,
  CheckCircle2,
  Clock,
  Wrench,
  ShieldCheck,
  AlertCircle,
  Laptop,
  Phone,
  MessageCircle,
  HelpCircle,
  Calendar,
  Sparkles,
  Receipt,
  PackageCheck,
  ShieldAlert
} from "lucide-react";
import { ServiceTicket, StoreSettings, Transaction } from "../types";
import {
  formatRupiah,
  formatDateIndo,
  getStatusConfig,
  createWhatsAppUrl
} from "../lib/utils";

interface PublicTrackingViewProps {
  onSearchTicket: (query: string) => Promise<ServiceTicket | null>;
  onSearchTracking?: (query: string) => Promise<{ ticket?: ServiceTicket | null; transaction?: Transaction | null } | null>;
  onOpenQRScanner: () => void;
  settings: StoreSettings;
  prefilledTicket?: ServiceTicket | null;
  prefilledTransaction?: Transaction | null;
}

export const PublicTrackingView: React.FC<PublicTrackingViewProps> = ({
  onSearchTicket,
  onSearchTracking,
  onOpenQRScanner,
  settings,
  prefilledTicket,
  prefilledTransaction
}) => {
  const [query, setQuery] = useState("");
  const [searchedTicket, setSearchedTicket] = useState<ServiceTicket | null>(
    prefilledTicket || null
  );
  const [searchedTransaction, setSearchedTransaction] = useState<Transaction | null>(
    prefilledTransaction || null
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (prefilledTicket) {
      setSearchedTicket(prefilledTicket);
      setQuery(prefilledTicket.ticketNumber);
    }
  }, [prefilledTicket]);

  useEffect(() => {
    if (prefilledTransaction) {
      setSearchedTransaction(prefilledTransaction);
      setQuery(prefilledTransaction.invoiceNumber);
    }
  }, [prefilledTransaction]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      let ticketRes: ServiceTicket | null = null;
      let txRes: Transaction | null = null;

      if (onSearchTracking) {
        const res = await onSearchTracking(query.trim());
        if (res) {
          ticketRes = res.ticket || null;
          txRes = res.transaction || null;
        }
      } else {
        ticketRes = await onSearchTicket(query.trim());
      }

      if (ticketRes || txRes) {
        setSearchedTicket(ticketRes);
        setSearchedTransaction(txRes);
      } else {
        setSearchedTicket(null);
        setSearchedTransaction(null);
        setErrorMsg("Data servis atau faktur penjualan tidak ditemukan. Mohon periksa kembali Nomor Tiket (SRV-...), No. Faktur (INV-...), atau No. WhatsApp Anda.");
      }
    } catch {
      setErrorMsg("Gagal menghubungi server. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // Stepper timeline definition
  const steps = [
    { key: "received", label: "Unit Diterima", desc: "Masuk antrean bengkel" },
    { key: "diagnosing", label: "Pengecekan", desc: "Diagnosa hardware/software" },
    { key: "waiting_approval", label: "Konfirmasi", desc: "Persetujuan biaya/part" },
    { key: "in_progress", label: "Pengerjaan", desc: "Proses reparasi/ganti part" },
    { key: "ready", label: "Siap Diambil", desc: "Lolos Quality Control (QC)" },
    { key: "completed", label: "Selesai", desc: "Unit telah diambil" },
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

  const wDays = searchedTicket ? (searchedTicket.warrantyDays !== undefined ? searchedTicket.warrantyDays : 30) : 30;
  let effectiveWarrantyUntil = searchedTicket?.warrantyUntil || "";
  if (searchedTicket && wDays > 0 && !effectiveWarrantyUntil) {
    const baseDate = new Date(searchedTicket.completedAt || searchedTicket.updatedAt || searchedTicket.createdAt || Date.now());
    effectiveWarrantyUntil = new Date(baseDate.getTime() + wDays * 86400000).toISOString().split("T")[0];
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="text-center space-y-2 py-4">
        <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 text-blue-600 rounded-2xl mb-1">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Portal Tracking Servis & Garansi
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Cek progres perbaikan laptop / PC Anda secara realtime menggunakan Nomor Tiket atau No. WhatsApp.
        </p>
      </div>

      {/* Search Bar Card */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-md">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Masukkan No. Tiket (SRV-...), No. Faktur (INV-...), atau No. WhatsApp..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm bg-muted/40 border border-input rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={onOpenQRScanner}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl text-sm transition-colors border border-border cursor-pointer"
            title="Scan QR Code Tiket / Faktur POS dengan Kamera"
          >
            <QrCode className="h-4 w-4 text-blue-600" />
            <span className="hidden sm:inline">Scan QR</span>
          </button>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? "Mencari..." : "Lacak Status"}</span>
          </button>
        </form>

        {/* Quick Demo Suggestions */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
          <span className="font-semibold text-[11px]">Sampel Cepat:</span>
          {["SRV-202508-001", "INV-202608-001", "INV-202608-002", "INV-202608-003"].map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                setQuery(code);
                if (onSearchTracking) {
                  setLoading(true);
                  onSearchTracking(code).then((res) => {
                    if (res) {
                      setSearchedTicket(res.ticket || null);
                      setSearchedTransaction(res.transaction || null);
                    }
                    setLoading(false);
                  });
                }
              }}
              className={`px-2 py-0.5 rounded-md font-mono text-[11px] border transition-colors font-semibold cursor-pointer ${
                code.startsWith("INV")
                  ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  : "bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800"
              }`}
            >
              {code}
            </button>
          ))}
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2 border border-rose-200 dark:border-rose-900">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* RESULT CARD IF FOUND */}
      {searchedTicket && statusCfg && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-md space-y-6 animate-in fade-in duration-300">
          {/* Ticket Header & Status Pill */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
                  {searchedTicket.ticketNumber}
                </span>
                <span className="text-xs text-muted-foreground">
                  • Masuk: {formatDateIndo(searchedTicket.createdAt)}
                </span>
              </div>
              <h2 className="text-xl font-bold text-foreground mt-1">
                {searchedTicket.deviceBrandModel}
              </h2>
              <p className="text-xs text-muted-foreground">
                Pemilik: <span className="font-semibold text-foreground">{searchedTicket.customerName}</span> ({searchedTicket.customerPhone})
              </p>
            </div>

            <div className="flex flex-col sm:items-end">
              <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold border ${statusCfg.bg}`}>
                {statusCfg.label}
              </span>
              <span className="text-[11px] text-muted-foreground mt-1 text-right">
                {statusCfg.desc}
              </span>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">
              Tahapan Pengerjaan Servis:
            </h3>

            <div className="relative">
              {/* Progress Line */}
              <div className="hidden sm:block absolute top-4 left-6 right-6 h-0.5 bg-muted">
                <div
                  className="h-full bg-blue-600 transition-all duration-500"
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
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                          isDone
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                            : "bg-muted text-muted-foreground border border-border"
                        } ${isCurrent ? "ring-4 ring-blue-500/20" : ""}`}
                      >
                        {isDone ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                      </div>
                      <span className={`text-xs font-semibold mt-2 ${isCurrent ? "text-blue-600 dark:text-blue-400 font-bold" : "text-foreground"}`}>
                        {step.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground hidden sm:block mt-0.5 line-clamp-1">
                        {step.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Left: Device & Complaints */}
            <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-2.5 text-xs">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                Informasi Kerusakan & Pengecekan
              </h4>
              <div>
                <span className="text-muted-foreground block">Keluhan Saat Masuk:</span>
                <span className="font-medium text-foreground">{searchedTicket.complaints}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Kelengkapan:</span>
                <span className="font-medium text-foreground">{searchedTicket.accessories}</span>
              </div>
              {searchedTicket.technicianNotes && (
                <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-900/50 mt-2">
                  <span className="font-bold block mb-0.5">Catatan Diagnosa Teknisi:</span>
                  <span>{searchedTicket.technicianNotes}</span>
                </div>
              )}
            </div>

            {/* Right: Cost Breakdown & Warranty */}
            <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-2.5 text-xs flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px] mb-2">
                  Rincian Biaya & Garansi
                </h4>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Biaya Perbaikan:</span>
                    <span className="font-bold text-foreground">
                      {searchedTicket.finalCost > 0
                        ? formatRupiah(searchedTicket.finalCost)
                        : searchedTicket.estimatedCost > 0
                        ? `Est. ${formatRupiah(searchedTicket.estimatedCost)}`
                        : "Sedang dihitung teknisi"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uang Muka (DP):</span>
                    <span className="font-medium text-emerald-600">
                      {formatRupiah(searchedTicket.downPayment)}
                    </span>
                  </div>

                  <div className="flex justify-between font-bold text-sm text-foreground pt-1.5 border-t border-border">
                    <span>Sisa Tagihan:</span>
                    <span className="text-blue-600 dark:text-blue-400">{formatRupiah(remaining)}</span>
                  </div>
                </div>
              </div>

              {/* Warranty Badge */}
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <div>
                    <div className="font-bold">Masa Garansi Servis: {wDays} Hari</div>
                    {effectiveWarrantyUntil && (
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Berlaku sampai: {formatDateIndo(effectiveWarrantyUntil)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Store Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">
              Ada pertanyaan seputar servis unit ini? Hubungi tim support kami:
            </span>
            <a
              href={createWhatsAppUrl(
                settings.whatsapp,
                `Halo Admin ${settings.storeName}, saya ingin menanyakan perkembangan servis unit saya dengan No. Tiket *${searchedTicket.ticketNumber}* (${searchedTicket.deviceBrandModel}). Terima kasih.`
              )}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-xs"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Hubungi CS WhatsApp Toko</span>
            </a>
          </div>
        </div>
      )}

      {/* RESULT CARD IF INVOICE TRANSACTION FOUND */}
      {searchedTransaction && (
        <div className="bg-card border-2 border-emerald-500/30 rounded-2xl p-6 shadow-md space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                  <Receipt className="h-3 w-3" />
                  Faktur Penjualan POS
                </span>
                <span className="text-xs text-muted-foreground">
                  • {formatDateIndo(searchedTransaction.date)}
                </span>
              </div>
              <h2 className="text-xl font-bold font-mono text-foreground mt-1">
                {searchedTransaction.invoiceNumber}
              </h2>
              <p className="text-xs text-muted-foreground">
                Pelanggan: <span className="font-semibold text-foreground">{searchedTransaction.customerName}</span> ({searchedTransaction.customerPhone || "-"})
              </p>
            </div>

            <div className="flex flex-col sm:items-end">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                LUNAS ({searchedTransaction.paymentMethod.toUpperCase()})
              </span>
              <span className="text-[11px] text-muted-foreground mt-1">
                Kasir: {searchedTransaction.cashierName}
              </span>
            </div>
          </div>

          {/* Purchased Items List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <PackageCheck className="h-4 w-4 text-blue-500" />
              Item & Status Garansi Toko:
            </h3>

            <div className="space-y-2.5">
              {searchedTransaction.items.map((item, idx) => {
                const wDays = (item.warrantyDays && item.warrantyDays > 0)
                  ? item.warrantyDays
                  : item.isService
                  ? 90
                  : (item.name.toLowerCase().includes("laptop") || item.name.toLowerCase().includes("notebook") || item.name.toLowerCase().includes("pc"))
                  ? 730
                  : (item.name.toLowerCase().includes("adaptor") || item.name.toLowerCase().includes("charger") || item.name.toLowerCase().includes("baterai"))
                  ? 180
                  : 30;

                const baseDate = new Date(searchedTransaction.date || Date.now());
                const itemExpiryDate = new Date(baseDate.getTime() + wDays * 86400000).toISOString().split("T")[0];
                const today = new Date();
                const until = new Date(itemExpiryDate);
                const diffTime = until.getTime() - today.getTime();
                const itemDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const isItemWarrantyActive = itemDaysLeft >= 0;

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-muted/30 border border-border space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-foreground">{item.name}</span>
                          {item.conditionGrade && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-muted border text-muted-foreground">
                              {item.conditionGrade}
                            </span>
                          )}
                        </div>
                        {item.specsSummary && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">{item.specsSummary}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-muted-foreground block">{item.qty} x {formatRupiah(item.price)}</span>
                        <span className="font-bold text-foreground">{formatRupiah(item.subtotal)}</span>
                      </div>
                    </div>

                    <div className={`p-2 rounded-lg border text-[11px] flex items-center justify-between gap-2 ${
                      wDays > 0 && isItemWarrantyActive
                        ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                        : wDays > 0
                        ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                        : "bg-muted/40 border-border text-muted-foreground"
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Garansi: {wDays > 0 ? `${wDays} Hari (s/d ${formatDateIndo(itemExpiryDate)})` : "Standar Toko"}</span>
                      </div>
                      {wDays > 0 && isItemWarrantyActive ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">AKTIF ({itemDaysLeft} hari lagi)</span>
                      ) : wDays > 0 ? (
                        <span className="font-bold text-amber-600 dark:text-amber-400">BERAKHIR</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transaction Summary */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border flex justify-between items-center text-xs">
            <div>
              <span className="text-muted-foreground block">Total Pembayaran:</span>
              <span className="text-base font-bold text-emerald-600">{formatRupiah(searchedTransaction.total)}</span>
            </div>
            <a
              href={createWhatsAppUrl(
                settings.whatsapp,
                `Halo Admin ${settings.storeName}, saya ingin menanyakan klaim garansi untuk Faktur Pembelian *${searchedTransaction.invoiceNumber}* atas nama *${searchedTransaction.customerName}*. Terima kasih.`
              )}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-xs"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Klaim Garansi via WA</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
