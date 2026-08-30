import React, { useState, useRef, useEffect } from "react";
import QRCode from "react-qr-code";
import {
  Printer,
  MessageCircle,
  X,
  Laptop,
  CheckCircle,
  ShieldCheck,
  Share2,
  Tag,
  FileText,
  Receipt,
  QrCode,
  Sparkles,
  Info,
  Layers,
  Scissors
} from "lucide-react";
import { ServiceTicket, Transaction, StoreSettings, User, Product } from "../types";
import {
  formatRupiah,
  formatDateIndo,
  createWhatsAppUrl,
  getStatusConfig
} from "../lib/utils";

export type PrintFormat = "continuous" | "sticker_58mm" | "thermal";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "intake_service" | "invoice_service" | "pos_transaction";
  ticket?: ServiceTicket | null;
  transaction?: Transaction | null;
  settings: StoreSettings;
  defaultFormat?: PrintFormat;
  currentUser?: User;
  users?: User[];
  products?: Product[];
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  mode,
  ticket,
  transaction,
  settings,
  defaultFormat,
  currentUser,
  users = [],
  products = []
}) => {
  // Determine if transaction contains laptop or service
  const hasLaptopOrService = Boolean(
    ticket ||
    mode === "intake_service" ||
    mode === "invoice_service" ||
    transaction?.items.some(
      (item) =>
        item.isService ||
        item.serviceTicketId ||
        item.conditionGrade ||
        products.some((p) => p.id === item.productId && (p.category === "laptop_baru" || p.category === "laptop_bekas")) ||
        item.name.toLowerCase().includes("laptop") ||
        item.name.toLowerCase().includes("notebook") ||
        item.name.toLowerCase().includes("macbook") ||
        item.name.toLowerCase().includes("servis")
    )
  );

  // Select active print format
  const [selectedFormat, setSelectedFormat] = useState<PrintFormat>(
    defaultFormat || (hasLaptopOrService ? "continuous" : "thermal")
  );

  useEffect(() => {
    if (defaultFormat) {
      setSelectedFormat(defaultFormat);
    } else if (hasLaptopOrService) {
      setSelectedFormat("continuous");
    } else {
      setSelectedFormat("thermal");
    }
  }, [defaultFormat, mode, isOpen, hasLaptopOrService]);

  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Helper to build direct QR tracking & warranty web link
  const getTrackingUrl = (code: string) => {
    if (typeof window !== "undefined" && window.location) {
      const origin = window.location.origin;
      const pathname = window.location.pathname;
      return `${origin}${pathname}?track=${encodeURIComponent(code)}`;
    }
    return code;
  };

  // Resolve accurate staff and technician names
  const resolvedTechnicianName =
    ticket?.technicianName ||
    users.find((u) => u.role === "technician")?.name ||
    currentUser?.name ||
    "Teknisi Utama";

  const resolvedCashierName =
    transaction?.cashierName ||
    currentUser?.name ||
    users.find((u) => u.role === "cashier" || u.role === "admin" || u.role === "owner")?.name ||
    "Petugas Kasir";

  // Construct share text for WhatsApp
  let shareText = "";
  let customerPhone = "";

  if (mode === "intake_service" && ticket) {
    customerPhone = ticket.customerPhone;
    const trackUrl = getTrackingUrl(ticket.ticketNumber);
    shareText = `*${settings.storeName.toUpperCase()}*\n${settings.address}\nTelp/WA: ${settings.whatsapp}\n--------------------------------\n📋 *TANDA TERIMA SERVIS RESMI (SPK KONSUMEN)*\nNo. Tiket: *${ticket.ticketNumber}*\nTanggal: ${formatDateIndo(ticket.createdAt)}\n\nPelanggan: ${ticket.customerName} (${ticket.customerPhone})\nPerangkat: *${ticket.deviceBrandModel}*\nKeluhan: ${ticket.complaints}\nKelengkapan: ${ticket.accessories}\nTeknisi PIC: *${resolvedTechnicianName}*\nUang Muka (DP): ${formatRupiah(ticket.downPayment)}\nEstimasi Biaya: ${formatRupiah(ticket.estimatedCost)}\n\n🔍 *Lacak Status & Garansi Online Langsung*:\n${trackUrl}\n--------------------------------\n${settings.receiptFooter}`;
  } else if (mode === "invoice_service" && ticket) {
    customerPhone = ticket.customerPhone;
    const remaining = Math.max(0, (ticket.finalCost || ticket.estimatedCost) - ticket.downPayment);
    const trackUrl = getTrackingUrl(ticket.ticketNumber);
    shareText = `*${settings.storeName.toUpperCase()}*\n${settings.address}\nTelp/WA: ${settings.whatsapp}\n--------------------------------\n🧾 *NOTA PELUNASAN SERVIS RESMI*\nNo. Tiket: *${ticket.ticketNumber}*\nTanggal: ${formatDateIndo(ticket.completedAt || ticket.updatedAt)}\n\nPelanggan: ${ticket.customerName}\nPerangkat: ${ticket.deviceBrandModel}\nTeknisi PIC: *${resolvedTechnicianName}*\nTindakan: ${ticket.technicianNotes || "Perbaikan hardware/software"}\n\nTotal Biaya: *${formatRupiah(ticket.finalCost || ticket.estimatedCost)}*\nUang Muka (DP): ${formatRupiah(ticket.downPayment)}\nSisa Lunas: *${formatRupiah(remaining)}*\n\n🛡️ *Garansi Servis*: ${ticket.warrantyDays} Hari (s/d ${formatDateIndo(ticket.warrantyUntil)})\n🔍 *Cek Status Garansi Online*:\n${trackUrl}\n--------------------------------\n${settings.receiptFooter}`;
  } else if (mode === "pos_transaction" && transaction) {
    customerPhone = transaction.customerPhone;
    const tierLabel = transaction.customerType === "reseller" ? " [Reseller/Mitra]" : " [Konsumen Biasa]";
    const itemsList = transaction.items
      .map((i) => {
        let line = `• ${i.name} (${i.qty}x) = ${formatRupiah(i.subtotal)}`;
        if (i.conditionGrade) line += `\n  Kondisi: ${i.conditionGrade}`;
        if (i.specsSummary) line += `\n  Spesifikasi: ${i.specsSummary}`;
        if (i.warrantyDays && i.warrantyDays > 0) line += `\n  Garansi: ${i.warrantyDays} Hari`;
        return line;
      })
      .join("\n");
    const trackUrl = getTrackingUrl(transaction.invoiceNumber);
    shareText = `*${settings.storeName.toUpperCase()}*\n${settings.address}\nTelp/WA: ${settings.whatsapp}\n--------------------------------\n🧾 *FAKTUR PENJUALAN & NOTA RESMI*\nNo. Faktur: *${transaction.invoiceNumber}*\nTanggal: ${formatDateIndo(transaction.date)}\nKasir: ${resolvedCashierName}\nPelanggan: ${transaction.customerName}${tierLabel}\n\n${itemsList}\n\nSubtotal: ${formatRupiah(transaction.subtotal)}\nDiskon: ${formatRupiah(transaction.discount)}\n*TOTAL: ${formatRupiah(transaction.total)}*\nBayar (${transaction.paymentMethod.toUpperCase()}): ${formatRupiah(transaction.amountPaid)}\nKembalian: ${formatRupiah(transaction.change)}\n\n🔍 *Cek & Verifikasi Nota Online*:\n${trackUrl}\n--------------------------------\n${settings.receiptFooter}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl max-w-3xl w-full max-h-[96vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between no-print border-b border-border pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 border border-blue-200/50">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
                <span>
                  {selectedFormat === "sticker_58mm"
                    ? "🏷️ Cetak Stiker Tempel Unit Servis"
                    : selectedFormat === "continuous"
                    ? mode === "intake_service"
                      ? "📄 Cetak Tanda Terima SPK Servis (1 Rangkap)"
                      : mode === "invoice_service"
                      ? "🧾 Cetak Nota Pelunasan Servis (1 Rangkap)"
                      : "📄 Cetak Faktur Penjualan Form Continuous (1 Rangkap)"
                    : "🧾 Cetak Struk Kasir POS (Thermal 58mm/80mm)"}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                {selectedFormat === "sticker_58mm"
                  ? "Format label stiker khusus untuk ditempelkan pada fisik unit/casing barang pelanggan."
                  : selectedFormat === "continuous"
                  ? "Format dokumen form continuous 1 rangkap resmi untuk servis, laptop baru & bekas, lengkap dengan rincian spesifikasi, pasal garansi, tanda tangan sah, dan QR code."
                  : "Format struk kasir thermal (58mm / 80mm) untuk transaksi sparepart, aksesoris & komponen."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm font-bold p-1.5 rounded-lg hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Format Selection Switcher (No-Print) */}
        <div className="no-print space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Pilih Format Dokumen Cetak:
            </span>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
              {selectedFormat === "sticker_58mm"
                ? "🏷️ Mode: Stiker Fisik Barang"
                : selectedFormat === "continuous"
                ? "📄 Mode: Form Continuous (1 Rangkap)"
                : "🧾 Mode: Struk Kasir (58mm / 80mm)"}
            </span>
          </div>

          <div className="bg-muted/40 p-1.5 rounded-xl border border-border grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            <button
              type="button"
              id="btn-format-continuous"
              onClick={() => setSelectedFormat("continuous")}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                selectedFormat === "continuous"
                  ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40"
                  : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span className="truncate">📄 Form Continuous (1 Rangkap)</span>
            </button>

            {ticket && (
              <button
                type="button"
                id="btn-format-sticker"
                onClick={() => setSelectedFormat("sticker_58mm")}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                  selectedFormat === "sticker_58mm"
                    ? "bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/40"
                    : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                <Tag className="h-4 w-4 shrink-0 text-amber-300" />
                <span className="truncate">🏷️ Stiker Tempel Unit</span>
              </button>
            )}

            <button
              type="button"
              id="btn-format-thermal"
              onClick={() => setSelectedFormat("thermal")}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                selectedFormat === "thermal"
                  ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40"
                  : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              <Receipt className="h-4 w-4 shrink-0" />
              <span className="truncate">🧾 Struk Kasir (58/80mm)</span>
            </button>
          </div>
        </div>

        {/* Format Explanation Banner */}
        <div className="no-print flex items-center gap-2 p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 text-xs">
          <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <span>
            {selectedFormat === "continuous" &&
              "📄 NOTA FORM CONTINUOUS (1 Rangkap): Format standar untuk Servis, Laptop Baru, dan Laptop Bekas dengan rincian spesifikasi lengkap, garansi toko, tanda tangan sah, dan QR Code verifikasi online."}
            {selectedFormat === "sticker_58mm" &&
              "🏷️ STIKER TEMPEL UNIT: Label khusus berisi nomor servis, nama pemilik, keluhan, dan QR Code untuk ditempel langsung pada casing unit/laptop pelanggan."}
            {selectedFormat === "thermal" &&
              "🧾 STRUK KASIR POS (58mm / 80mm): Format struk thermal standar untuk transaksi sparepart, aksesoris, dan komponen PC."}
          </span>
        </div>

        {/* ================================================================
            PRINTABLE CONTENT AREA (1 RANGKAP SAJA)
            ================================================================ */}
        <div ref={printAreaRef} className="print-area">
          {/* FORMAT 1: DOKUMEN NOTA KONSUMEN / SPK SERVIS (1 RANGKAP SAJA) */}
          {selectedFormat === "continuous" && ticket && (
            <div className="print-21x15 print-continuous bg-white text-zinc-950 p-4 sm:p-5 rounded-lg border border-zinc-500 font-mono text-[10.5px] leading-tight space-y-2.5 shadow-xs max-w-[210mm] mx-auto">
              {/* Form Header Line */}
              <div className="flex justify-between items-center border-b border-zinc-600 pb-1.5 text-[9.5px] text-zinc-700">
                <span className="font-extrabold tracking-wider uppercase text-zinc-900">
                  ★★★ TANDA TERIMA & NOTA SERVIS RESMI ★★★
                </span>
                <span className="font-bold px-2 py-0.5 border border-zinc-800 bg-zinc-100 text-zinc-900 text-[9px] uppercase">
                  {mode === "intake_service" ? "1 RANGKAP - SPK PENERIMAAN" : "1 RANGKAP - NOTA PELUNASAN"}
                </span>
              </div>

              {/* Header: Company & Ticket Info */}
              <div className="flex justify-between items-start gap-3 border-b border-zinc-400 pb-2">
                <div className="space-y-0.5 max-w-[66%]">
                  <h2 className="font-black text-sm tracking-wider uppercase text-zinc-950">
                    {settings.storeName}
                  </h2>
                  <p className="text-[10px] text-zinc-800 font-semibold leading-none">{settings.tagline}</p>
                  <p className="text-[9px] text-zinc-600 leading-tight">{settings.address}</p>
                  <p className="text-[9px] text-zinc-800 font-bold">
                    Telp: {settings.phone} | WA: {settings.whatsapp}
                  </p>
                </div>

                {/* Right: Boxed Ticket & Barcode */}
                <div className="text-right space-y-0.5">
                  <div className="border-2 border-zinc-950 px-2.5 py-1 rounded-xs bg-zinc-50 text-center">
                    <span className="block text-[8px] uppercase font-bold text-zinc-600 leading-none">
                      NO. TIKET SERVIS
                    </span>
                    <span className="block text-xs font-black tracking-wider text-zinc-950 font-mono">
                      {ticket.ticketNumber}
                    </span>
                  </div>
                  <div className="text-[9px] text-zinc-700 text-right font-medium">
                    Tgl: <span className="font-bold">{formatDateIndo(ticket.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Two Column Customer & Unit Details */}
              <div className="grid grid-cols-2 gap-2 border border-zinc-400 p-2 rounded-xs bg-zinc-50/70 text-[10px]">
                {/* Left: Customer Data */}
                <div className="space-y-0.5">
                  <div className="font-bold uppercase text-zinc-950 border-b border-dashed border-zinc-400 pb-0.5 text-[9px]">
                    [ DATA PELANGGAN ]
                  </div>
                  <div className="grid grid-cols-3 gap-0.5">
                    <span className="text-zinc-600">Nama</span>
                    <span className="col-span-2 font-bold text-zinc-950">: {ticket.customerName}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-0.5">
                    <span className="text-zinc-600">No. WA</span>
                    <span className="col-span-2 font-semibold text-zinc-950">: {ticket.customerPhone}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-0.5">
                    <span className="text-zinc-600">Alamat</span>
                    <span className="col-span-2 truncate">: {ticket.customerAddress || "-"}</span>
                  </div>
                </div>

                {/* Right: Device Data */}
                <div className="space-y-0.5">
                  <div className="font-bold uppercase text-zinc-950 border-b border-dashed border-zinc-400 pb-0.5 text-[9px]">
                    [ DATA PERANGKAT ]
                  </div>
                  <div className="grid grid-cols-3 gap-0.5">
                    <span className="text-zinc-600">Model</span>
                    <span className="col-span-2 font-bold text-zinc-950">: {ticket.deviceBrandModel}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-0.5">
                    <span className="text-zinc-600">Serial No</span>
                    <span className="col-span-2 font-mono">: {ticket.serialNumber || "-"}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-0.5">
                    <span className="text-zinc-600">Kelengkapan</span>
                    <span className="col-span-2 font-medium text-zinc-950">: {ticket.accessories}</span>
                  </div>
                </div>
              </div>

              {/* Complaints & Symptoms */}
              <div className="border border-zinc-400 px-2 py-1 rounded-xs space-y-0.5 text-[9.5px]">
                <div className="font-bold uppercase text-zinc-900 text-[8.5px]">
                  KELUHAN / GEJALA KERUSAKAN:
                </div>
                <div className="font-medium text-zinc-950 text-[9.5px]">
                  {ticket.complaints}
                </div>
              </div>

              {/* Technician Diagnosis & Action Table */}
              <div className="space-y-0.5">
                <div className="font-bold text-[9px] uppercase text-zinc-900 flex justify-between items-center">
                  <span>RINCIAN JASA SERVIS & SPAREPART:</span>
                  <span className="text-zinc-800 font-bold">Teknisi PIC: {resolvedTechnicianName}</span>
                </div>
                <table className="w-full text-[9.5px] border-collapse border border-zinc-400">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-400 text-[9px]">
                      <th className="py-0.5 px-1.5 text-left border-r border-zinc-400 w-6">No</th>
                      <th className="py-0.5 px-1.5 text-left border-r border-zinc-400">Uraian Pekerjaan / Sparepart</th>
                      <th className="py-0.5 px-1.5 text-center border-r border-zinc-400 w-10">Qty</th>
                      <th className="py-0.5 px-1.5 text-right border-r border-zinc-400 w-20">Harga (Rp)</th>
                      <th className="py-0.5 px-1.5 text-right w-24">Subtotal (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticket.partsUsed && ticket.partsUsed.length > 0 ? (
                      ticket.partsUsed.map((p, i) => (
                        <tr key={i} className="border-b border-zinc-300">
                          <td className="py-0.5 px-1.5 text-center border-r border-zinc-300">{i + 1}</td>
                          <td className="py-0.5 px-1.5 border-r border-zinc-300 font-medium">{p.name}</td>
                          <td className="py-0.5 px-1.5 text-center border-r border-zinc-300">{p.qty}</td>
                          <td className="py-0.5 px-1.5 text-right border-r border-zinc-300">{formatRupiah(p.price)}</td>
                          <td className="py-0.5 px-1.5 text-right font-semibold">{formatRupiah(p.price * p.qty)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-b border-zinc-300">
                        <td className="py-0.5 px-1.5 text-center border-r border-zinc-300">1</td>
                        <td className="py-0.5 px-1.5 border-r border-zinc-300 font-medium">
                          {ticket.technicianNotes || "Jasa Diagnosa, Reparasi & Quality Control"}
                        </td>
                        <td className="py-0.5 px-1.5 text-center border-r border-zinc-300">1</td>
                        <td className="py-0.5 px-1.5 text-right border-r border-zinc-300">
                          {formatRupiah(ticket.finalCost || ticket.estimatedCost)}
                        </td>
                        <td className="py-0.5 px-1.5 text-right font-semibold">
                          {formatRupiah(ticket.finalCost || ticket.estimatedCost)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation & Direct Tracking QR Code */}
              <div className="flex justify-between items-start gap-3 pt-0.5">
                {/* QR Code directly linked to warranty & service tracking */}
                <div className="flex items-center gap-2 border border-zinc-400 p-1.5 rounded-xs bg-zinc-50 max-w-[58%]">
                  <div className="p-0.5 bg-white border border-zinc-900 rounded-xs shrink-0">
                    <QRCode value={getTrackingUrl(ticket.ticketNumber)} size={56} level="M" />
                  </div>
                  <div className="text-[8px] text-zinc-700 space-y-0.5">
                    <span className="font-black text-zinc-950 block">QR TRACKING & GARANSI ONLINE:</span>
                    <span className="leading-tight block font-medium">
                      Scan dengan kamera HP untuk lacak status servis & cek masa aktif garansi secara langsung.
                    </span>
                  </div>
                </div>

                {/* Totals Table */}
                <div className="w-56 space-y-0.5 text-[9.5px] border border-zinc-400 p-1.5 rounded-xs bg-zinc-50">
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Total Biaya:</span>
                    <span className="font-bold text-zinc-950">
                      {formatRupiah(ticket.finalCost || ticket.estimatedCost)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Uang Muka (DP):</span>
                    <span className="font-semibold text-zinc-950">{formatRupiah(ticket.downPayment)}</span>
                  </div>
                  <div className="flex justify-between font-black text-[10.5px] border-t border-zinc-950 pt-0.5 text-zinc-950">
                    <span>SISA PELUNASAN:</span>
                    <span>
                      {formatRupiah(
                        Math.max(0, (ticket.finalCost || ticket.estimatedCost) - ticket.downPayment)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warranty & Terms */}
              <div className="text-[8px] text-zinc-700 border-t border-zinc-400 pt-1 space-y-0.5">
                <div className="flex justify-between font-bold text-zinc-950">
                  <span>KETENTUAN GARANSI & PENGAMBILAN UNIT:</span>
                  {ticket.warrantyDays > 0 && (
                    <span className="text-blue-900 font-black">
                      🛡️ GARANSI: {ticket.warrantyDays} HARI (s/d {formatDateIndo(ticket.warrantyUntil)})
                    </span>
                  )}
                </div>
                <p className="leading-tight">1. {settings.warrantyTerms}</p>
                <p className="leading-tight">2. Nota SPK asli ini wajib ditunjukkan saat pengambilan unit servis.</p>
              </div>

              {/* 3 Signatures Standard with Accurate Staff & Technician Names */}
              <div className="grid grid-cols-3 gap-2 text-center text-[9px] pt-1.5 border-t border-zinc-950">
                <div className="space-y-6">
                  <span className="text-zinc-600 block text-[8.5px]">Tanda Tangan Pelanggan,</span>
                  <div className="border-b border-zinc-900 w-2/3 mx-auto"></div>
                  <span className="font-bold block text-[8.5px]">( {ticket.customerName} )</span>
                </div>
                <div className="space-y-6">
                  <span className="text-zinc-600 block text-[8.5px]">Penerima / Petugas Kasir,</span>
                  <div className="border-b border-zinc-900 w-2/3 mx-auto"></div>
                  <span className="font-bold block text-[8.5px]">( {resolvedCashierName} )</span>
                </div>
                <div className="space-y-6">
                  <span className="text-zinc-600 block text-[8.5px]">Teknisi Pemeriksa,</span>
                  <div className="border-b border-zinc-900 w-2/3 mx-auto"></div>
                  <span className="font-bold block text-[8.5px]">( {resolvedTechnicianName} )</span>
                </div>
              </div>

              {/* Single Copy Footnote without paper size text */}
              <div className="text-[7.5px] text-zinc-500 text-center pt-1 border-t border-dashed border-zinc-300">
                [ DOKUMEN RESMI 1 RANGKAP — {settings.storeName.toUpperCase()} ]
              </div>
            </div>
          )}

          {/* FORMAT 1B: DOKUMEN NOTA FORM CONTINUOUS UNTUK TRANSAKSI POS (LAPTOP BARU, LAPTOP BEKAS & SERVIS) */}
          {selectedFormat === "continuous" && transaction && (
            <div className="print-21x15 print-continuous bg-white text-zinc-950 p-4 sm:p-5 rounded-lg border border-zinc-500 font-mono text-[10.5px] leading-tight space-y-2.5 shadow-xs max-w-[210mm] mx-auto">
              {/* Form Header Line */}
              <div className="flex justify-between items-center border-b border-zinc-600 pb-1.5 text-[9.5px] text-zinc-700">
                <span className="font-extrabold tracking-wider uppercase text-zinc-900">
                  ★★★ FAKTUR PENJUALAN & NOTA TRANSAKSI RESMI ★★★
                </span>
                <span className="font-bold px-2 py-0.5 border border-zinc-800 bg-zinc-100 text-zinc-900 text-[9px] uppercase">
                  1 RANGKAP - NOTA KONSUMEN
                </span>
              </div>

              {/* Header: Company & Invoice Info */}
              <div className="flex justify-between items-start gap-3 border-b border-zinc-400 pb-2">
                <div className="space-y-0.5 max-w-[66%]">
                  <h2 className="font-black text-sm tracking-wider uppercase text-zinc-950">
                    {settings.storeName}
                  </h2>
                  <p className="text-[10px] text-zinc-800 font-semibold leading-none">{settings.tagline}</p>
                  <p className="text-[9px] text-zinc-600 leading-tight">{settings.address}</p>
                  <p className="text-[9px] text-zinc-800 font-bold">
                    Telp: {settings.phone} | WA: {settings.whatsapp}
                  </p>
                </div>

                {/* Right: Boxed Invoice Number */}
                <div className="text-right space-y-0.5">
                  <div className="border-2 border-zinc-950 px-2.5 py-1 rounded-xs bg-zinc-50 text-center">
                    <span className="block text-[8px] uppercase font-bold text-zinc-600 leading-none">
                      NO. FAKTUR PENJUALAN
                    </span>
                    <span className="block text-xs font-black tracking-wider text-zinc-950 font-mono">
                      {transaction.invoiceNumber}
                    </span>
                  </div>
                  <div className="text-[9px] text-zinc-700 text-right font-medium">
                    Tgl: <span className="font-bold">{formatDateIndo(transaction.date)}</span>
                  </div>
                </div>
              </div>

              {/* Two Column Customer & Cashier Details */}
              <div className="grid grid-cols-2 gap-2 border border-zinc-400 p-2 rounded-xs bg-zinc-50/70 text-[10px]">
                {/* Left: Customer Data */}
                <div className="space-y-0.5">
                  <div className="font-bold uppercase text-zinc-950 border-b border-dashed border-zinc-400 pb-0.5 text-[9px]">
                    [ DATA PELANGGAN ]
                  </div>
                  <div className="grid grid-cols-3 gap-0.5">
                    <span className="text-zinc-600">Nama</span>
                    <span className="col-span-2 font-bold text-zinc-950">: {transaction.customerName}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-0.5">
                    <span className="text-zinc-600">No. WA</span>
                    <span className="col-span-2 font-semibold text-zinc-950">: {transaction.customerPhone}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-0.5">
                    <span className="text-zinc-600">Kategori</span>
                    <span className="col-span-2 font-bold text-zinc-900">
                      : {transaction.customerType === "reseller" ? "Reseller / Mitra Teknisi" : "Konsumen Biasa (Retail)"}
                    </span>
                  </div>
                </div>

                {/* Right: Payment & Cashier Metadata */}
                <div className="space-y-0.5">
                  <div className="font-bold uppercase text-zinc-950 border-b border-dashed border-zinc-400 pb-0.5 text-[9px]">
                    [ DETAIL TRANSAKSI ]
                  </div>
                  <div className="grid grid-cols-3 gap-0.5">
                    <span className="text-zinc-600">Kasir</span>
                    <span className="col-span-2 font-bold text-zinc-950">: {resolvedCashierName}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-0.5">
                    <span className="text-zinc-600">Pembayaran</span>
                    <span className="col-span-2 font-bold uppercase text-zinc-950">
                      : {transaction.paymentMethod}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-0.5">
                    <span className="text-zinc-600">Status</span>
                    <span className="col-span-2 font-black text-emerald-800 dark:text-emerald-700">
                      : LUNAS & SELESAI
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table with Full Specs, Condition, Warranty */}
              <div className="space-y-0.5">
                <div className="font-bold text-[9px] uppercase text-zinc-900 flex justify-between items-center">
                  <span>DAFTAR BARANG / UNIT LAPTOP / JASA SERVIS:</span>
                  <span className="text-zinc-700 text-[8.5px]">Total Item: {transaction.items.length}</span>
                </div>
                <table className="w-full text-[9.5px] border-collapse border border-zinc-400">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-400 text-[9px]">
                      <th className="py-0.5 px-1.5 text-left border-r border-zinc-400 w-6">No</th>
                      <th className="py-0.5 px-1.5 text-left border-r border-zinc-400">Nama Item & Spesifikasi Detail</th>
                      <th className="py-0.5 px-1.5 text-center border-r border-zinc-400 w-20">Garansi</th>
                      <th className="py-0.5 px-1.5 text-center border-r border-zinc-400 w-10">Qty</th>
                      <th className="py-0.5 px-1.5 text-right border-r border-zinc-400 w-24">Harga (Rp)</th>
                      <th className="py-0.5 px-1.5 text-right w-24">Subtotal (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transaction.items.map((item, i) => (
                      <tr key={i} className="border-b border-zinc-300">
                        <td className="py-1 px-1.5 text-center border-r border-zinc-300 align-top">{i + 1}</td>
                        <td className="py-1 px-1.5 border-r border-zinc-300">
                          <div className="font-bold text-zinc-950">{item.name}</div>
                          {item.conditionGrade && (
                            <div className="text-[8.5px] text-amber-800 font-bold">
                              ★ Kondisi: {item.conditionGrade}
                            </div>
                          )}
                          {item.specsSummary && (
                            <div className="text-[8.5px] text-zinc-700 leading-tight">
                              {item.specsSummary}
                            </div>
                          )}
                          {item.priceType === "reseller" && (
                            <span className="inline-block text-[8px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-1 py-0.1 rounded-xs font-semibold">
                              Tarif Reseller/Mitra
                            </span>
                          )}
                        </td>
                        <td className="py-1 px-1.5 text-center border-r border-zinc-300 font-semibold text-[9px] align-top">
                          {item.warrantyDays && item.warrantyDays > 0 ? (
                            <span className="text-emerald-800 font-bold">🛡️ {item.warrantyDays} Hari</span>
                          ) : (
                            <span className="text-zinc-500">-</span>
                          )}
                        </td>
                        <td className="py-1 px-1.5 text-center border-r border-zinc-300 align-top font-semibold">{item.qty}</td>
                        <td className="py-1 px-1.5 text-right border-r border-zinc-300 align-top">{formatRupiah(item.price)}</td>
                        <td className="py-1 px-1.5 text-right font-bold align-top">{formatRupiah(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation & Direct Verification QR Code */}
              <div className="flex justify-between items-start gap-3 pt-0.5">
                {/* QR Code directly linked to invoice & warranty verification */}
                <div className="flex items-center gap-2 border border-zinc-400 p-1.5 rounded-xs bg-zinc-50 max-w-[58%]">
                  <div className="p-0.5 bg-white border border-zinc-900 rounded-xs shrink-0">
                    <QRCode value={getTrackingUrl(transaction.invoiceNumber)} size={56} level="M" />
                  </div>
                  <div className="text-[8px] text-zinc-700 space-y-0.5">
                    <span className="font-black text-zinc-950 block">QR VERIFIKASI & GARANSI ONLINE:</span>
                    <span className="leading-tight block font-medium">
                      Scan QR dengan kamera HP untuk verifikasi keaslian nota & cek masa aktif garansi pembelian.
                    </span>
                  </div>
                </div>

                {/* Totals Table */}
                <div className="w-56 space-y-0.5 text-[9.5px] border border-zinc-400 p-1.5 rounded-xs bg-zinc-50">
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Subtotal:</span>
                    <span className="font-semibold text-zinc-950">{formatRupiah(transaction.subtotal)}</span>
                  </div>
                  {transaction.discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Diskon:</span>
                      <span>-{formatRupiah(transaction.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-[10.5px] border-t border-zinc-950 pt-0.5 text-zinc-950">
                    <span>TOTAL BAYAR:</span>
                    <span>{formatRupiah(transaction.total)}</span>
                  </div>
                  <div className="flex justify-between text-[9px]">
                    <span className="text-zinc-600">Bayar ({transaction.paymentMethod}):</span>
                    <span className="font-semibold text-zinc-950">{formatRupiah(transaction.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between text-[9px]">
                    <span className="text-zinc-600">Kembalian:</span>
                    <span className="font-semibold text-zinc-950">{formatRupiah(transaction.change)}</span>
                  </div>
                </div>
              </div>

              {/* Warranty & Terms */}
              <div className="text-[8px] text-zinc-700 border-t border-zinc-400 pt-1 space-y-0.5">
                <div className="flex justify-between font-bold text-zinc-950">
                  <span>KETENTUAN GARANSI & TRANSAKSI:</span>
                  <span className="text-blue-900 font-black">
                    TERIMA KASIH ATAS KUNJUNGAN & TRANSAKSI ANDA
                  </span>
                </div>
                <p className="leading-tight">1. {settings.warrantyTerms}</p>
                <p className="leading-tight">2. Barang yang sudah dibeli dapat diklaim garansi dengan menunjukkan nota resmi ini & segel utuh.</p>
              </div>

              {/* 2 Signatures Standard: Customer & Cashier */}
              <div className="grid grid-cols-2 gap-4 text-center text-[9px] pt-1.5 border-t border-zinc-950">
                <div className="space-y-6">
                  <span className="text-zinc-600 block text-[8.5px]">Tanda Terima Konsumen / Pembeli,</span>
                  <div className="border-b border-zinc-900 w-1/2 mx-auto"></div>
                  <span className="font-bold block text-[8.5px]">( {transaction.customerName} )</span>
                </div>
                <div className="space-y-6">
                  <span className="text-zinc-600 block text-[8.5px]">Hormat Kami (Kasir / Petugas Toko),</span>
                  <div className="border-b border-zinc-900 w-1/2 mx-auto"></div>
                  <span className="font-bold block text-[8.5px]">( {resolvedCashierName} )</span>
                </div>
              </div>

              {/* Single Copy Footnote without paper size text */}
              <div className="text-[7.5px] text-zinc-500 text-center pt-1 border-t border-dashed border-zinc-300">
                [ DOKUMEN RESMI 1 RANGKAP — {settings.storeName.toUpperCase()} ]
              </div>
            </div>
          )}

          {/* FORMAT 2: STIKER TEMPEL KHUSUS DI BARANG SERVIS */}
          {selectedFormat === "sticker_58mm" && ticket && (
            <div className="print-58mm mx-auto w-[240px] max-w-[58mm] bg-white text-zinc-950 p-2.5 rounded-xl border-2 border-dashed border-zinc-950 font-mono text-[10px] space-y-1.5 shadow-xs">
              {/* Header Label Stiker */}
              <div className="text-center border-b-2 border-zinc-950 pb-1">
                <h4 className="font-black text-xs uppercase tracking-wider leading-tight text-zinc-950">
                  {settings.storeName}
                </h4>
                <div className="inline-block px-1.5 py-0.2 bg-zinc-900 text-white text-[8px] font-black uppercase rounded-xs my-0.5">
                  ★ STIKER UNIT SERVIS ★
                </div>
                <span className="text-[7.5px] block text-zinc-600 font-semibold">
                  WA: {settings.whatsapp}
                </span>
              </div>

              {/* Big Bold Ticket Number Box */}
              <div className="text-center py-1 bg-zinc-100 border-2 border-zinc-950 rounded-xs">
                <span className="text-[8px] uppercase font-bold text-zinc-700 block leading-none">
                  NO. TIKET SERVIS
                </span>
                <span className="text-sm font-black tracking-widest text-zinc-950 block font-mono">
                  {ticket.ticketNumber}
                </span>
              </div>

              {/* QR Code in Center with direct URL to tracking & warranty */}
              <div className="flex flex-col items-center justify-center py-1">
                <div className="p-1 bg-white border border-zinc-950 rounded-xs">
                  <QRCode value={getTrackingUrl(ticket.ticketNumber)} size={92} level="M" />
                </div>
                <span className="text-[7.5px] text-zinc-700 font-black mt-0.5 tracking-tight text-center">
                  SCAN QR: LACAK SERVIS & GARANSI
                </span>
              </div>

              {/* Customer & Unit Details for Sticky Identification */}
              <div className="space-y-1 border-t border-b border-dashed border-zinc-950 py-1.5 text-[9px] leading-tight">
                <div>
                  <span className="text-zinc-500 text-[8px] block font-semibold">PEMILIK:</span>
                  <span className="font-black text-[10px] text-zinc-950 block">
                    {ticket.customerName}
                  </span>
                  <span className="font-bold text-zinc-800 text-[8.5px]">{ticket.customerPhone}</span>
                </div>

                <div className="pt-0.5">
                  <span className="text-zinc-500 text-[8px] block font-semibold">UNIT PERANGKAT:</span>
                  <span className="font-bold text-zinc-950 block text-[9.5px]">{ticket.deviceBrandModel}</span>
                  {ticket.serialNumber && (
                    <span className="text-zinc-700 text-[8px] block font-mono">SN: {ticket.serialNumber}</span>
                  )}
                </div>

                <div className="pt-0.5">
                  <span className="text-zinc-500 text-[8px] block font-semibold">KELUHAN:</span>
                  <span className="font-bold text-zinc-950 block text-[8.5px] line-clamp-2">
                    {ticket.complaints}
                  </span>
                </div>

                <div className="pt-0.5">
                  <span className="text-zinc-500 text-[8px] block font-semibold">KELENGKAPAN:</span>
                  <span className="font-medium text-zinc-900 block text-[8.5px]">{ticket.accessories}</span>
                </div>
              </div>

              {/* Date, PIC & DP */}
              <div className="text-[8px] space-y-0.5 text-zinc-800">
                <div className="flex justify-between">
                  <span className="text-zinc-600">Tgl Masuk:</span>
                  <span className="font-bold">{formatDateIndo(ticket.createdAt).split(",")[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Teknisi PIC:</span>
                  <span className="font-bold text-zinc-950">{resolvedTechnicianName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">DP:</span>
                  <span className="font-bold text-zinc-950">{formatRupiah(ticket.downPayment)}</span>
                </div>
                <div className="flex justify-between font-black text-zinc-950 border-t border-zinc-400 pt-0.5">
                  <span>Est. Biaya:</span>
                  <span>{formatRupiah(ticket.finalCost || ticket.estimatedCost)}</span>
                </div>
              </div>

              {/* Placement Guideline */}
              <div className="text-center text-[7.5px] font-black text-zinc-700 uppercase tracking-tight pt-1 border-t-2 border-zinc-950">
                ✂️ TEMPELKAN DI CASING / PERANGKAT ✂️
              </div>
            </div>
          )}

          {/* FORMAT 3: STRUK KASIR POS (1 RANGKAP SAJA) */}
          {selectedFormat === "thermal" && (
            <div className="mx-auto max-w-[320px] bg-white text-zinc-900 p-4 rounded-xl border border-zinc-400 font-mono text-xs space-y-3 shadow-xs">
              {/* Header */}
              <div className="text-center space-y-0.5 border-b border-dashed border-zinc-400 pb-2.5">
                <h3 className="font-bold text-sm tracking-wide text-zinc-950 uppercase">
                  {settings.storeName}
                </h3>
                <p className="text-[10px] text-zinc-600">{settings.tagline}</p>
                <p className="text-[10px] text-zinc-600">{settings.address}</p>
                <p className="text-[10px] text-zinc-600 font-semibold">WA: {settings.whatsapp}</p>
              </div>

              {/* Mode Title */}
              <div className="text-center py-0.5">
                <span className="font-bold text-[11px] uppercase px-2 py-0.5 border border-zinc-800 rounded-xs">
                  {mode === "intake_service" && "TANDA TERIMA SERVIS (SPK KONSUMEN)"}
                  {mode === "invoice_service" && "NOTA PELUNASAN SERVIS RESMI"}
                  {mode === "pos_transaction" && "STRUK PENJUALAN KASIR"}
                </span>
              </div>

              {/* Metadata */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-zinc-400 pb-2">
                {ticket && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">No. Tiket:</span>
                      <span className="font-bold text-zinc-950">{ticket.ticketNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Tanggal:</span>
                      <span>{formatDateIndo(ticket.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Teknisi PIC:</span>
                      <span className="font-bold text-zinc-950">{resolvedTechnicianName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Pelanggan:</span>
                      <span className="font-bold text-zinc-950">{ticket.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">No. WA:</span>
                      <span>{ticket.customerPhone}</span>
                    </div>
                  </>
                )}

                {transaction && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">No. Faktur:</span>
                      <span className="font-bold text-zinc-950">{transaction.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Tanggal:</span>
                      <span>{formatDateIndo(transaction.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Kasir:</span>
                      <span className="font-bold text-zinc-950">{resolvedCashierName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Pelanggan:</span>
                      <span className="font-semibold">{transaction.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Tipe Pelanggan:</span>
                      <span className="font-bold text-zinc-950">
                        {transaction.customerType === "reseller" ? "Reseller / Mitra" : "Konsumen Biasa"}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Service or Items Details */}
              {ticket && (
                <div className="space-y-1.5 text-[11px] border-b border-dashed border-zinc-400 pb-2.5">
                  <div>
                    <span className="text-zinc-500 block">Unit Perangkat:</span>
                    <span className="font-bold">{ticket.deviceBrandModel}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Keluhan:</span>
                    <span>{ticket.complaints}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Kelengkapan:</span>
                    <span>{ticket.accessories}</span>
                  </div>
                  {ticket.technicianNotes && (
                    <div>
                      <span className="text-zinc-500 block">Catatan Teknisi:</span>
                      <span>{ticket.technicianNotes}</span>
                    </div>
                  )}

                  {ticket.partsUsed && ticket.partsUsed.length > 0 && (
                    <div className="pt-1.5">
                      <span className="text-zinc-500 block font-semibold mb-1">Rincian Part / Jasa:</span>
                      {ticket.partsUsed.map((p, i) => (
                        <div key={i} className="flex justify-between text-[10px]">
                          <span>{p.name}</span>
                          <span>{formatRupiah(p.price * p.qty)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {transaction && (
                <div className="space-y-1 text-[11px] border-b border-dashed border-zinc-400 pb-2.5">
                  <div className="font-bold text-[10px] text-zinc-500 pb-1">DAFTAR ITEM / BARANG:</div>
                  {transaction.items.map((item, idx) => (
                    <div key={idx} className="py-1 border-b border-zinc-100 last:border-none">
                      <div className="flex justify-between items-start">
                        <div className="pr-2">
                          <div className="font-bold text-zinc-950">{item.name}</div>
                          {item.conditionGrade && (
                            <div className="text-[9.5px] text-zinc-600 font-semibold">
                              [{item.conditionGrade}]
                            </div>
                          )}
                          {item.specsSummary && (
                            <div className="text-[9px] text-zinc-500 line-clamp-2">
                              {item.specsSummary}
                            </div>
                          )}
                          <div className="text-[10px] text-zinc-500">
                            {item.qty} x {formatRupiah(item.price)}
                            {item.priceType === "reseller" && " (Harga Reseller)"}
                          </div>
                        </div>
                        <div className="font-bold text-right text-zinc-950">{formatRupiah(item.subtotal)}</div>
                      </div>
                      {item.warrantyDays !== undefined && item.warrantyDays > 0 && (
                        <div className="text-[9.5px] text-zinc-700 font-semibold mt-0.5">
                          🛡️ Garansi: {item.warrantyDays} Hari
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Totals */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-zinc-400 pb-2.5">
                {ticket && (
                  <>
                    <div className="flex justify-between">
                      <span>Estimasi / Biaya:</span>
                      <span className="font-bold">
                        {formatRupiah(ticket.finalCost || ticket.estimatedCost)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Uang Muka (DP):</span>
                      <span>{formatRupiah(ticket.downPayment)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold pt-1 border-t border-zinc-300">
                      <span>Sisa Pelunasan:</span>
                      <span>
                        {formatRupiah(
                          Math.max(0, (ticket.finalCost || ticket.estimatedCost) - ticket.downPayment)
                        )}
                      </span>
                    </div>
                  </>
                )}

                {transaction && (
                  <>
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatRupiah(transaction.subtotal)}</span>
                    </div>
                    {transaction.discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Diskon:</span>
                        <span>-{formatRupiah(transaction.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs font-bold pt-1 border-t border-zinc-300">
                      <span>TOTAL AKHIR:</span>
                      <span>{formatRupiah(transaction.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="capitalize">Bayar ({transaction.paymentMethod}):</span>
                      <span>{formatRupiah(transaction.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kembalian:</span>
                      <span>{formatRupiah(transaction.change)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* QR Code directly linked to web warranty & tracking */}
              <div className="flex flex-col items-center justify-center py-1.5 space-y-1">
                <div className="p-1 bg-white border border-zinc-900 rounded-xs">
                  <QRCode
                    value={getTrackingUrl(ticket ? ticket.ticketNumber : transaction?.invoiceNumber || "")}
                    size={80}
                    level="M"
                  />
                </div>
                <span className="text-[8px] text-zinc-600 text-center font-semibold">
                  Scan QR dengan kamera HP untuk cek status & garansi online
                </span>
              </div>

              {/* Footer */}
              <div className="text-center text-[8.5px] text-zinc-500 space-y-0.5 pt-1">
                {ticket && ticket.warrantyDays > 0 && (
                  <p className="font-bold text-zinc-800">
                    🛡️ Garansi Servis: {ticket.warrantyDays} Hari
                  </p>
                )}
                <p>{settings.receiptFooter}</p>
                <p className="text-[7.5px] text-zinc-400 pt-0.5">[ 1 RANGKAP ]</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons in Modal (No-Print) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border no-print">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="btn-print-active-receipt"
              onClick={handlePrint}
              className={`flex items-center space-x-1.5 px-4 py-2.5 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 ${
                selectedFormat === "sticker_58mm"
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <Printer className="h-4 w-4" />
              <span>
                Cetak {selectedFormat === "continuous" && "Nota Konsumen (1 Rangkap)"}
                {selectedFormat === "sticker_58mm" && "Label Stiker Unit"}
                {selectedFormat === "thermal" && "Struk Kasir POS"}
              </span>
            </button>

            {ticket && selectedFormat !== "sticker_58mm" && (
              <button
                type="button"
                id="btn-quick-switch-sticker"
                onClick={() => {
                  setSelectedFormat("sticker_58mm");
                  setTimeout(() => window.print(), 100);
                }}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95"
                title="Langsung cetak stiker tempel untuk ditempel di fisik laptop/unit"
              >
                <Tag className="h-4 w-4" />
                <span>🏷️ Cetak Stiker Unit</span>
              </button>
            )}

            {ticket && selectedFormat === "sticker_58mm" && (
              <button
                type="button"
                id="btn-quick-switch-continuous"
                onClick={() => {
                  setSelectedFormat("continuous");
                  setTimeout(() => window.print(), 100);
                }}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95"
                title="Beralih dan cetak Nota SPK Konsumen"
              >
                <FileText className="h-4 w-4" />
                <span>📄 Cetak Nota SPK (1 Rangkap)</span>
              </button>
            )}

            {customerPhone && customerPhone !== "-" && (
              <a
                href={createWhatsAppUrl(customerPhone, shareText)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Kirim WhatsApp</span>
              </a>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
