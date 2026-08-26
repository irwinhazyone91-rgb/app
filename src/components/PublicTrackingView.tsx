import React, { useState } from "react";
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
  Sparkles
} from "lucide-react";
import { ServiceTicket, StoreSettings } from "../types";
import {
  formatRupiah,
  formatDateIndo,
  getStatusConfig,
  createWhatsAppUrl
} from "../lib/utils";

interface PublicTrackingViewProps {
  onSearchTicket: (query: string) => Promise<ServiceTicket | null>;
  onOpenQRScanner: () => void;
  settings: StoreSettings;
  prefilledTicket?: ServiceTicket | null;
}

export const PublicTrackingView: React.FC<PublicTrackingViewProps> = ({
  onSearchTicket,
  onOpenQRScanner,
  settings,
  prefilledTicket
}) => {
  const [query, setQuery] = useState("");
  const [searchedTicket, setSearchedTicket] = useState<ServiceTicket | null>(
    prefilledTicket || null
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const ticket = await onSearchTicket(query.trim());
      if (ticket) {
        setSearchedTicket(ticket);
      } else {
        setSearchedTicket(null);
        setErrorMsg("Data servis tidak ditemukan. Mohon periksa kembali Nomor Tiket atau No. WhatsApp Anda.");
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
              placeholder="Masukkan Nomor Tiket (misal: SRV-202508-001) atau No. WhatsApp..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm bg-muted/40 border border-input rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={onOpenQRScanner}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl text-sm transition-colors border border-border"
            title="Scan QR Code Tiket Servis dengan Kamera"
          >
            <QrCode className="h-4 w-4" />
            <span className="hidden sm:inline">Scan QR</span>
          </button>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <span>{loading ? "Mencari..." : "Lacak Status"}</span>
          </button>
        </form>

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
                    <div className="font-bold">Masa Garansi Servis: {searchedTicket.warrantyDays} Hari</div>
                    {searchedTicket.warrantyUntil && (
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        Berlaku sampai: {formatDateIndo(searchedTicket.warrantyUntil)}
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
    </div>
  );
};
