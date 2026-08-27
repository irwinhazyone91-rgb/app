import React, { useState, useMemo } from "react";
import {
  ReceiptText,
  Search,
  Calendar,
  Filter,
  Trash2,
  Printer,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  CreditCard,
  Banknote,
  QrCode,
  ArrowUpDown,
  Download,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  MessageCircle,
  Layers,
  ChevronRight,
  Package,
  Wrench
} from "lucide-react";
import { Transaction, ServiceTicket, Product, User as UserType, StoreSettings } from "../types";
import { formatRupiah, formatDateIndo, createWhatsAppUrl } from "../lib/utils";

interface TransactionHistoryViewProps {
  transactions: Transaction[];
  tickets: ServiceTicket[];
  products: Product[];
  currentUser: UserType;
  settings: StoreSettings;
  onDeleteTransaction: (
    txId: string,
    options?: { restoreStock?: boolean; restoreServiceTicket?: boolean }
  ) => Promise<void>;
  onPrintTransaction: (tx: Transaction) => void;
  onNavigateToPOS?: () => void;
}

export const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({
  transactions,
  tickets,
  products,
  currentUser,
  settings,
  onDeleteTransaction,
  onPrintTransaction,
  onNavigateToPOS
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "cash" | "qris" | "transfer">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "service" | "retail">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");

  // Selected Transaction for Detail Modal
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Deletion Confirmation State
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [restoreStock, setRestoreStock] = useState<boolean>(true);
  const [restoreServiceTicket, setRestoreServiceTicket] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState<string>("");

  const isOwnerOrAdmin = currentUser.role === "owner" || currentUser.role === "admin";

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    return transactions
      .filter((tx) => {
        // Search query
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          tx.invoiceNumber.toLowerCase().includes(q) ||
          tx.customerName.toLowerCase().includes(q) ||
          tx.customerPhone.toLowerCase().includes(q) ||
          tx.cashierName.toLowerCase().includes(q) ||
          tx.items.some((it) => it.name.toLowerCase().includes(q));

        if (!matchesSearch) return false;

        // Date filter
        if (dateFilter !== "all") {
          const txDate = new Date(tx.date);
          if (dateFilter === "today") {
            if (tx.date.split("T")[0] !== todayStr) return false;
          } else if (dateFilter === "week") {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);
            if (txDate < sevenDaysAgo) return false;
          } else if (dateFilter === "month") {
            if (
              txDate.getMonth() !== now.getMonth() ||
              txDate.getFullYear() !== now.getFullYear()
            ) {
              return false;
            }
          }
        }

        // Payment method filter
        if (paymentFilter !== "all" && tx.paymentMethod !== paymentFilter) {
          return false;
        }

        // Type filter (contains service vs purely product retail)
        if (typeFilter === "service") {
          const hasService = tx.items.some((it) => it.isService);
          if (!hasService) return false;
        } else if (typeFilter === "retail") {
          const hasService = tx.items.some((it) => it.isService);
          if (hasService) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === "newest") {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        } else if (sortOrder === "oldest") {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        } else if (sortOrder === "highest") {
          return b.total - a.total;
        } else if (sortOrder === "lowest") {
          return a.total - b.total;
        }
        return 0;
      });
  }, [transactions, searchQuery, dateFilter, paymentFilter, typeFilter, sortOrder]);

  // Key Summary Metrics
  const metrics = useMemo(() => {
    const totalRevenue = filteredTransactions.reduce((acc, t) => acc + t.total, 0);
    const count = filteredTransactions.length;
    const cashTotal = filteredTransactions
      .filter((t) => t.paymentMethod === "cash")
      .reduce((acc, t) => acc + t.total, 0);
    const qrisTotal = filteredTransactions
      .filter((t) => t.paymentMethod === "qris")
      .reduce((acc, t) => acc + t.total, 0);
    const transferTotal = filteredTransactions
      .filter((t) => t.paymentMethod === "transfer")
      .reduce((acc, t) => acc + t.total, 0);

    const now = new Date().toISOString().split("T")[0];
    const todayRevenue = transactions
      .filter((t) => t.date.split("T")[0] === now)
      .reduce((acc, t) => acc + t.total, 0);

    return {
      totalRevenue,
      count,
      cashTotal,
      qrisTotal,
      transferTotal,
      todayRevenue
    };
  }, [filteredTransactions, transactions]);

  // Handle Delete Confirmation
  const confirmDelete = async () => {
    if (!txToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteTransaction(txToDelete.id, {
        restoreStock,
        restoreServiceTicket
      });
      setTxToDelete(null);
      setDeleteConfirmationText("");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header View */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-5 rounded-2xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40">
              <ReceiptText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Riwayat Transaksi & Nota
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Laporan arsip seluruh transaksi POS kasir, pelunasan servis, serta pembatalan nota salah khusus Pemilik Toko.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToPOS && (
            <button
              onClick={onNavigateToPOS}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-98 flex items-center gap-1.5"
            >
              <CreditCard className="h-4 w-4" />
              <span>Buka Kasir POS</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card border border-border p-4 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Omset Terfilter</span>
            <ReceiptText className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-foreground">
            {formatRupiah(metrics.totalRevenue)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Dari {metrics.count} transaksi terpilih
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Omset Hari Ini</span>
            <Calendar className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatRupiah(metrics.todayRevenue)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Penjualan & servis hari ini
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Pembayaran Tunai (Cash)</span>
            <Banknote className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-foreground">
            {formatRupiah(metrics.cashTotal)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Uang fisik kasir
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Non-Tunai (QRIS & Bank)</span>
            <QrCode className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-foreground">
            {formatRupiah(metrics.qrisTotal + metrics.transferTotal)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            QRIS: {formatRupiah(metrics.qrisTotal)} | Transfer: {formatRupiah(metrics.transferTotal)}
          </div>
        </div>
      </div>

      {/* 3. Role Notice Banner */}
      {!isOwnerOrAdmin && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-800 dark:text-amber-300 text-xs">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            Anda masuk sebagai <strong>{currentUser.role.toUpperCase()}</strong> ({currentUser.name}). Anda dapat melihat riwayat dan mencetak ulang nota transaksi, namun <strong>penghapusan / pembatalan transaksi yang salah</strong> hanya dapat dilakukan oleh akun <strong>Pemilik Toko (Owner)</strong> atau <strong>Admin</strong>.
          </span>
        </div>
      )}

      {/* 4. Filter & Search Controls */}
      <div className="bg-card border border-border p-4 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nomor nota (INV-...), pelanggan, no HP, kasir, atau nama item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-input rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-foreground placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs font-medium text-muted-foreground">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-transparent border-none text-foreground font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value="newest" className="bg-card text-foreground">Terbaru</option>
                <option value="oldest" className="bg-card text-foreground">Terlama</option>
                <option value="highest" className="bg-card text-foreground">Nominal Tertinggi</option>
                <option value="lowest" className="bg-card text-foreground">Nominal Terendah</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {/* Date Filter */}
          <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
            {(["all", "today", "week", "month"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDateFilter(d)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  dateFilter === d
                    ? "bg-blue-600 text-white font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {d === "all" ? "Semua Waktu" : d === "today" ? "Hari Ini" : d === "week" ? "7 Hari" : "Bulan Ini"}
              </button>
            ))}
          </div>

          {/* Payment Method Filter */}
          <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
            {(["all", "cash", "qris", "transfer"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPaymentFilter(p)}
                className={`px-2.5 py-1 rounded-lg font-medium capitalize transition-all ${
                  paymentFilter === p
                    ? "bg-blue-600 text-white font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p === "all" ? "Semua Bayar" : p.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
            {(["all", "service", "retail"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  typeFilter === t
                    ? "bg-blue-600 text-white font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "all" ? "Semua Jenis" : t === "service" ? "Pelunasan Servis" : "Penjualan Barang"}
              </button>
            ))}
          </div>

          {(searchQuery || dateFilter !== "all" || paymentFilter !== "all" || typeFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setDateFilter("all");
                setPaymentFilter("all");
                setTypeFilter("all");
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* 5. Transactions Table / List */}
      <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <ReceiptText className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">Tidak Ada Transaksi</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {transactions.length === 0
                  ? "Belum ada transaksi POS yang tercatat. Silakan lakukan transaksi di menu Kasir POS."
                  : "Tidak ada transaksi yang cocok dengan kata kunci atau filter yang dipilih."}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">No. Faktur & Waktu</th>
                  <th className="py-3.5 px-4">Pelanggan</th>
                  <th className="py-3.5 px-4">Rincian Item</th>
                  <th className="py-3.5 px-4">Metode</th>
                  <th className="py-3.5 px-4 text-right">Total Transaksi</th>
                  <th className="py-3.5 px-4">Kasir</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTransactions.map((tx) => {
                  const hasService = tx.items.some((i) => i.isService);
                  const isCash = tx.paymentMethod === "cash";
                  const isQRIS = tx.paymentMethod === "qris";

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Invoice & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                          {tx.invoiceNumber}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDateIndo(tx.date)}</span>
                        </div>
                        {hasService && (
                          <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 text-[10px] font-semibold">
                            <Wrench className="h-2.5 w-2.5" /> Pelunasan Servis
                          </span>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground">
                            {tx.customerName || "Pelanggan Umum"}
                          </span>
                          {tx.customerType === "reseller" ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                              Reseller
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                              Biasa
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {tx.customerPhone && tx.customerPhone !== "-" ? tx.customerPhone : "Tanpa No. HP"}
                        </div>
                      </td>

                      {/* Items Preview */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-xs text-foreground truncate font-medium">
                          {tx.items[0]?.name}
                          {tx.items.length > 1 && ` (+${tx.items.length - 1} item lainnya)`}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {tx.items.reduce((acc, i) => acc + i.qty, 0)} total pcs / item
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${
                            isCash
                              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40"
                              : isQRIS
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
                              : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40"
                          }`}
                        >
                          {isCash ? (
                            <Banknote className="h-3 w-3" />
                          ) : isQRIS ? (
                            <QrCode className="h-3 w-3" />
                          ) : (
                            <CreditCard className="h-3 w-3" />
                          )}
                          <span className="capitalize">{tx.paymentMethod}</span>
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-foreground text-sm">
                          {formatRupiah(tx.total)}
                        </div>
                        {tx.discount > 0 && (
                          <div className="text-[10px] text-red-500 font-medium">
                            Diskon: -{formatRupiah(tx.discount)}
                          </div>
                        )}
                      </td>

                      {/* Cashier */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-foreground font-medium flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span>{tx.cashierName || "Kasir"}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Detail Button */}
                          <button
                            onClick={() => setSelectedTx(tx)}
                            className="p-1.5 rounded-lg bg-muted/60 hover:bg-muted text-foreground border border-border transition-colors"
                            title="Lihat Detail Transaksi"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Print Receipt Button */}
                          <button
                            onClick={() => onPrintTransaction(tx)}
                            className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40 transition-colors"
                            title="Cetak Struk Nota"
                          >
                            <Printer className="h-4 w-4" />
                          </button>

                          {/* Delete / Void Button (Owner / Admin only) */}
                          <button
                            onClick={() => {
                              if (isOwnerOrAdmin) {
                                setTxToDelete(tx);
                                setRestoreStock(true);
                                setRestoreServiceTicket(true);
                                setDeleteConfirmationText("");
                              }
                            }}
                            disabled={!isOwnerOrAdmin}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isOwnerOrAdmin
                                ? "bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-800/40 cursor-pointer"
                                : "opacity-30 text-muted-foreground bg-muted border border-border cursor-not-allowed"
                            }`}
                            title={
                              isOwnerOrAdmin
                                ? "Hapus / Batalkan Transaksi yang Salah"
                                : "Hanya Pemilik Toko (Owner/Admin) yang dapat menghapus transaksi"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. MODAL: DETAIL TRANSAKSI */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600">
                  <ReceiptText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">Detail Nota #{selectedTx.invoiceNumber}</h3>
                  <p className="text-xs text-muted-foreground">{formatDateIndo(selectedTx.date)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Info Box */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/40 border border-border text-xs">
              <div>
                <div className="text-muted-foreground">Pelanggan</div>
                <div className="font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                  <span>{selectedTx.customerName || "Pelanggan Umum"}</span>
                  {selectedTx.customerType === "reseller" ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      Reseller
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                      Biasa
                    </span>
                  )}
                </div>
                <div className="text-muted-foreground text-[11px]">{selectedTx.customerPhone || "-"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Kasir</div>
                <div className="font-bold text-foreground mt-0.5">{selectedTx.cashierName || "Kasir"}</div>
                <div className="text-muted-foreground text-[11px] capitalize">Metode: {selectedTx.paymentMethod}</div>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Item Transaksi</div>
              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-card text-xs">
                {selectedTx.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                        <span>{item.name}</span>
                        {item.conditionGrade && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                            {item.conditionGrade}
                          </span>
                        )}
                        {item.priceType === "reseller" && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            Harga Reseller
                          </span>
                        )}
                      </div>
                      {item.specsSummary && (
                        <div className="text-[11px] text-muted-foreground">{item.specsSummary}</div>
                      )}
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                        <span>
                          {item.qty} x {formatRupiah(item.price)}
                          {item.isService && " (Biaya Servis)"}
                        </span>
                        {item.warrantyDays !== undefined && item.warrantyDays > 0 && (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            🛡️ Garansi: {item.warrantyDays} Hari
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="font-bold text-foreground whitespace-nowrap">{formatRupiah(item.subtotal)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Calculations */}
            <div className="space-y-1.5 p-3.5 rounded-xl bg-muted/30 border border-border text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatRupiah(selectedTx.subtotal)}</span>
              </div>
              {selectedTx.discount > 0 && (
                <div className="flex justify-between text-red-500 font-medium">
                  <span>Diskon Potongan</span>
                  <span>-{formatRupiah(selectedTx.discount)}</span>
                </div>
              )}
              {selectedTx.tax > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Pajak (PPN)</span>
                  <span>+{formatRupiah(selectedTx.tax)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-foreground pt-1.5 border-t border-border">
                <span>Total Bayar</span>
                <span>{formatRupiah(selectedTx.total)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground pt-1">
                <span>Nominal Diterima ({selectedTx.paymentMethod.toUpperCase()})</span>
                <span>{formatRupiah(selectedTx.amountPaid)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Kembalian</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(selectedTx.change)}
                </span>
              </div>
            </div>

            {selectedTx.notes && (
              <div className="p-3 rounded-xl bg-muted/20 border border-border text-xs space-y-1">
                <span className="font-semibold text-muted-foreground">Catatan Kasir:</span>
                <p className="text-foreground">{selectedTx.notes}</p>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
              {isOwnerOrAdmin && (
                <button
                  onClick={() => {
                    const toDel = selectedTx;
                    setSelectedTx(null);
                    setTxToDelete(toDel);
                    setRestoreStock(true);
                    setRestoreServiceTicket(true);
                    setDeleteConfirmationText("");
                  }}
                  className="px-3 py-2 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold border border-red-200/60 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Hapus Transaksi Ini</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                {selectedTx.customerPhone && selectedTx.customerPhone !== "-" && (
                  <a
                    href={createWhatsAppUrl(
                      selectedTx.customerPhone,
                      `*${settings.storeName.toUpperCase()}*\nNota Faktur: *${selectedTx.invoiceNumber}*\nTotal: *${formatRupiah(selectedTx.total)}*\nTerima kasih telah berbelanja di ${settings.storeName}!`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Kirim WA</span>
                  </a>
                )}

                <button
                  onClick={() => {
                    const toPrint = selectedTx;
                    setSelectedTx(null);
                    onPrintTransaction(toPrint);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Cetak Ulang Struk</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: KONFIRMASI HAPUS / BATALKAN TRANSAKSI YANG SALAH (KHUSUS PEMILIK TOKO) */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-card border border-destructive/40 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Header Warning */}
            <div className="flex items-center space-x-3 text-red-600 dark:text-red-400">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-800">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base sm:text-lg">
                  Hapus / Batalkan Transaksi?
                </h3>
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  Fitur Koreksi Nota Khusus Pemilik Toko & Admin
                </p>
              </div>
            </div>

            {/* Target Transaction Summary */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nomor Faktur:</span>
                <span className="font-mono font-bold text-foreground">{txToDelete.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tanggal:</span>
                <span className="font-medium text-foreground">{formatDateIndo(txToDelete.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pelanggan:</span>
                <span className="font-medium text-foreground">{txToDelete.customerName}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1 font-bold text-sm">
                <span className="text-foreground">Total Nilai Nota:</span>
                <span className="text-red-600 dark:text-red-400">{formatRupiah(txToDelete.total)}</span>
              </div>
            </div>

            {/* Restoration Options */}
            <div className="space-y-2.5 p-3.5 rounded-xl bg-red-500/5 border border-red-500/20 text-xs">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <RotateCcw className="h-3.5 w-3.5 text-blue-600" />
                <span>Opsi Pemulihan Otomatis (Restorasi):</span>
              </div>

              <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={restoreStock}
                  onChange={(e) => setRestoreStock(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded-sm text-blue-600 border-border focus:ring-blue-500 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-semibold text-foreground">Kembalikan Stok Barang</span>
                  <p className="text-[11px] text-muted-foreground">
                    Jumlah sparepart / aksesoris yang ada di nota ini akan otomatis ditambahkan kembali ke inventaris.
                  </p>
                </div>
              </label>

              {txToDelete.items.some((i) => i.isService) && (
                <label className="flex items-start space-x-2.5 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={restoreServiceTicket}
                    onChange={(e) => setRestoreServiceTicket(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded-sm text-blue-600 border-border focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-foreground">Kembalikan Status Tiket Servis ke "Siap Diambil"</span>
                    <p className="text-[11px] text-muted-foreground">
                      Tiket servis yang terkait dengan transaksi ini akan dikembalikan dari status selesai ke status siap bayar agar dapat diproses ulang dengan benar.
                    </p>
                  </div>
                </label>
              )}
            </div>

            <div className="text-[11px] text-muted-foreground italic">
              * Penghapusan ini akan langsung disinkronkan secara permanen ke database lokal dan Firebase Firestore.
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-border">
              <button
                onClick={() => {
                  setTxToDelete(null);
                  setDeleteConfirmationText("");
                }}
                disabled={isDeleting}
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-98 flex items-center space-x-1.5"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isDeleting ? "Menghapus Transaksi..." : "Hapus Transaksi Sekarang"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
