import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Filter,
  FileSpreadsheet,
  Printer,
  Download,
  Plus,
  Trash2,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
  Wrench,
  ShoppingBag,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Receipt,
  User as UserIcon,
  ArrowUpRight,
  ArrowDownRight,
  Percent
} from "lucide-react";
import {
  ServiceTicket,
  Product,
  Transaction,
  Expense,
  ExpenseCategory,
  StoreSettings,
  User
} from "../types";
import { formatRupiah, formatDateIndo } from "../lib/utils";
import { toast } from "sonner";

interface FinancialReportsViewProps {
  tickets: ServiceTicket[];
  products: Product[];
  transactions: Transaction[];
  expenses: Expense[];
  settings: StoreSettings;
  users?: User[];
  currentUser?: User;
  onSaveExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export const FinancialReportsView: React.FC<FinancialReportsViewProps> = ({
  tickets,
  products,
  transactions,
  expenses,
  settings,
  users = [],
  currentUser,
  onSaveExpense,
  onDeleteExpense
}) => {
  // Main Sub-Tab State
  const [activeReportTab, setActiveReportTab] = useState<"pnl" | "sales" | "technicians" | "expenses">("pnl");

  // Date Range Filter State
  const [dateRangeFilter, setDateRangeFilter] = useState<
    "today" | "yesterday" | "last7days" | "thisMonth" | "lastMonth" | "thisYear" | "all" | "custom"
  >("thisMonth");
  
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Expense Form Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseFormData, setExpenseFormData] = useState<{
    category: ExpenseCategory;
    description: string;
    amount: number;
    notes: string;
  }>({
    category: "listrik_internet",
    description: "",
    amount: 0,
    notes: ""
  });

  // Calculate Date Range Boundaries
  const dateRangeBounds = useMemo(() => {
    const now = new Date();
    let start = new Date(0);
    let end = new Date(8640000000000000);

    if (dateRangeFilter === "today") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (dateRangeFilter === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      start = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
      end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
    } else if (dateRangeFilter === "last7days") {
      const d7 = new Date(now);
      d7.setDate(d7.getDate() - 7);
      start = new Date(d7.getFullYear(), d7.getMonth(), d7.getDate(), 0, 0, 0, 0);
      end = new Date();
    } else if (dateRangeFilter === "thisMonth") {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (dateRangeFilter === "lastMonth") {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (dateRangeFilter === "thisYear") {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (dateRangeFilter === "custom") {
      if (customStartDate) {
        start = new Date(`${customStartDate}T00:00:00.000Z`);
      }
      if (customEndDate) {
        end = new Date(`${customEndDate}T23:59:59.999Z`);
      }
    }

    return { start, end };
  }, [dateRangeFilter, customStartDate, customEndDate]);

  // Filtered dataset within date bounds
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const d = new Date(tx.date);
      return d >= dateRangeBounds.start && d <= dateRangeBounds.end;
    });
  }, [transactions, dateRangeBounds]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const d = new Date(t.completedAt || t.updatedAt || t.createdAt);
      return d >= dateRangeBounds.start && d <= dateRangeBounds.end;
    });
  }, [tickets, dateRangeBounds]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const d = new Date(e.date);
      return d >= dateRangeBounds.start && d <= dateRangeBounds.end;
    });
  }, [expenses, dateRangeBounds]);

  // 1. REVENUE CALCULATIONS
  // POS Sales Breakdown
  const posSalesData = useMemo(() => {
    let laptopBaru = 0;
    let laptopBekas = 0;
    let komponen = 0;
    let aksesoris = 0;
    let jasaPOS = 0;
    let serviceTicketsPaid = 0;
    let totalGrossSales = 0;
    let totalDiscount = 0;

    // COGS / HPP Modal Product
    let totalProductCostPrice = 0;

    filteredTransactions.forEach((tx) => {
      totalGrossSales += tx.subtotal || tx.total;
      totalDiscount += tx.discount || 0;

      tx.items.forEach((item) => {
        if (item.isService) {
          serviceTicketsPaid += item.subtotal;
        } else if (item.productId) {
          const prod = products.find((p) => p.id === item.productId);
          const itemCost = (prod?.costPrice || 0) * item.qty;
          totalProductCostPrice += itemCost;

          if (prod) {
            if (prod.category === "laptop_baru") laptopBaru += item.subtotal;
            else if (prod.category === "laptop_bekas") laptopBekas += item.subtotal;
            else if (prod.category === "komponen_pc" || prod.category === "part_laptop") komponen += item.subtotal;
            else if (prod.category === "aksesoris") aksesoris += item.subtotal;
            else if (prod.category === "jasa") jasaPOS += item.subtotal;
          } else {
            komponen += item.subtotal;
          }
        } else {
          komponen += item.subtotal;
        }
      });
    });

    const netSalesRevenue = totalGrossSales - totalDiscount;

    return {
      laptopBaru,
      laptopBekas,
      komponen,
      aksesoris,
      jasaPOS,
      serviceTicketsPaid,
      totalGrossSales,
      totalDiscount,
      netSalesRevenue,
      totalProductCostPrice
    };
  }, [filteredTransactions, products]);

  // Service Labor & Spareparts Cost Breakdown
  const serviceFinancials = useMemo(() => {
    let completedTicketsCount = 0;
    let totalServiceRevenue = 0;
    let totalPartsRevenue = 0;
    let totalPartsCostPrice = 0;
    let pureLaborProfit = 0;

    filteredTickets.forEach((t) => {
      if (t.status === "completed") {
        completedTicketsCount++;
        const cost = t.finalCost || t.estimatedCost || 0;
        totalServiceRevenue += cost;

        // Calculate parts used cost vs sell price
        let partsTotal = 0;
        let partsCost = 0;
        if (t.partsUsed && t.partsUsed.length > 0) {
          t.partsUsed.forEach((part) => {
            const partSell = (part.price || 0) * (part.qty || 1);
            partsTotal += partSell;

            // Find matching product cost price
            const prod = products.find((p) => p.id === part.id || p.name === part.name);
            const unitCost = prod ? prod.costPrice : Math.round(part.price * 0.7); // fallback 70% if unlisted
            partsCost += unitCost * (part.qty || 1);
          });
        }

        totalPartsRevenue += partsTotal;
        totalPartsCostPrice += partsCost;
        pureLaborProfit += Math.max(0, cost - partsCost);
      }
    });

    return {
      completedTicketsCount,
      totalServiceRevenue,
      totalPartsRevenue,
      totalPartsCostPrice,
      pureLaborProfit
    };
  }, [filteredTickets, products]);

  // Total Operational Expenses
  const totalOperationalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [filteredExpenses]);

  // PROFIT & LOSS AGGREGATION
  // Total Revenue: Penjualan POS + Servis Selesai
  const totalRevenue = posSalesData.netSalesRevenue;
  // Total COGS / HPP Modal: Modal Produk POS + Modal Sparepart Servis
  const totalHPP = posSalesData.totalProductCostPrice + serviceFinancials.totalPartsCostPrice;
  // Gross Profit (Laba Kotor)
  const grossProfit = Math.max(0, totalRevenue - totalHPP);
  const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  // Net Profit (Laba Bersih)
  const netProfit = grossProfit - totalOperationalExpenses;
  const netMarginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Payment Methods Breakdown
  const paymentBreakdown = useMemo(() => {
    let cash = 0;
    let qris = 0;
    let transfer = 0;

    filteredTransactions.forEach((tx) => {
      if (tx.paymentMethod === "cash") cash += tx.total;
      else if (tx.paymentMethod === "qris") qris += tx.total;
      else if (tx.paymentMethod === "transfer") transfer += tx.total;
      else cash += tx.total;
    });

    return { cash, qris, transfer };
  }, [filteredTransactions]);

  // Technician Performance Report
  const technicianStats = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        assignedCount: number;
        completedCount: number;
        inProgressCount: number;
        totalRevenue: number;
        avgCost: number;
      }
    >();

    filteredTickets.forEach((t) => {
      const techName = t.technicianName || "Teknisi Toko";
      const existing = map.get(techName) || {
        name: techName,
        assignedCount: 0,
        completedCount: 0,
        inProgressCount: 0,
        totalRevenue: 0,
        avgCost: 0
      };

      existing.assignedCount++;
      if (t.status === "completed") {
        existing.completedCount++;
        existing.totalRevenue += t.finalCost || t.estimatedCost || 0;
      } else if (t.status === "in_progress" || t.status === "diagnosing" || t.status === "ready") {
        existing.inProgressCount++;
      }

      map.set(techName, existing);
    });

    // Compute averages
    return Array.from(map.values()).map((tech) => ({
      ...tech,
      avgCost: tech.completedCount > 0 ? Math.round(tech.totalRevenue / tech.completedCount) : 0
    }));
  }, [filteredTickets]);

  const handleCreateExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseFormData.amount <= 0) {
      toast.error("Nominal pengeluaran harus lebih dari Rp 0.");
      return;
    }
    if (!expenseFormData.description.trim()) {
      toast.error("Keterangan pengeluaran tidak boleh kosong.");
      return;
    }

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      date: new Date().toISOString(),
      category: expenseFormData.category,
      description: expenseFormData.description.trim(),
      amount: Number(expenseFormData.amount),
      recordedBy: currentUser?.name || "Admin Toko",
      notes: expenseFormData.notes.trim()
    };

    onSaveExpense(newExpense);
    toast.success(`Pengeluaran ${formatRupiah(newExpense.amount)} berhasil dicatat.`);
    setIsExpenseModalOpen(false);
    setExpenseFormData({
      category: "listrik_internet",
      description: "",
      amount: 0,
      notes: ""
    });
  };

  const handleExportCSV = () => {
    const rows = [
      ["LAPORAN LABA RUGI & ARUS KAS - " + settings.storeName.toUpperCase()],
      ["Periode:", dateRangeFilter, "Rentang Tanggal:", `${formatDateIndo(dateRangeBounds.start.toISOString())} s/d ${formatDateIndo(dateRangeBounds.end.toISOString())}`],
      ["Tanggal Ekspor:", formatDateIndo(new Date().toISOString())],
      [],
      ["KOMPONEN KEUANGAN", "JUMLAH (RP)"],
      ["Total Omset Penjualan POS & Servis", totalRevenue],
      ["- Penjualan Unit Laptop Baru", posSalesData.laptopBaru],
      ["- Penjualan Unit Laptop Bekas", posSalesData.laptopBekas],
      ["- Penjualan Sparepart & Komponen PC", posSalesData.komponen],
      ["- Penjualan Aksesoris & Charger", posSalesData.aksesoris],
      ["- Pelunasan Jasa Servis Komputer", posSalesData.serviceTicketsPaid + posSalesData.jasaPOS],
      [],
      ["Beban Pokok Penjualan (HPP Modal)", totalHPP],
      ["- Modal Produk Terjual di Kasir", posSalesData.totalProductCostPrice],
      ["- Modal Sparepart Terpasang pada Servis", serviceFinancials.totalPartsCostPrice],
      [],
      ["LABA KOTOR (GROSS PROFIT)", grossProfit, `Margin: ${grossMarginPct.toFixed(1)}%`],
      [],
      ["Beban Operasional Toko", totalOperationalExpenses],
      ...filteredExpenses.map((e) => [`- [${e.category}] ${e.description}`, e.amount]),
      [],
      ["LABA BERSIH (NET PROFIT)", netProfit, `Margin: ${netMarginPct.toFixed(1)}%`],
      [],
      ["METODE PEMBAYARAN KASIR"],
      ["- Kas Tunai", paymentBreakdown.cash],
      ["- QRIS Dinamis/Statiss", paymentBreakdown.qris],
      ["- Transfer Bank", paymentBreakdown.transfer],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_keuangan_${settings.storeName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Laporan berhasil diekspor ke format CSV/Excel.");
  };

  const handlePrintOfficialReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Printable Report Header (Hidden in Screen, Visible in Print) */}
      <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold uppercase">{settings.storeName}</h1>
        <p className="text-sm">{settings.address} | Telp/WA: {settings.phone} / {settings.whatsapp}</p>
        <h2 className="text-lg font-bold mt-2 uppercase underline">Laporan Keuangan Laba Rugi & Arus Kas</h2>
        <p className="text-xs">Periode: {formatDateIndo(dateRangeBounds.start.toISOString())} s/d {formatDateIndo(dateRangeBounds.end.toISOString())}</p>
      </div>

      {/* Screen Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-emerald-600" />
            <span>Laporan Laba Rugi & Analisis Keuangan</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Laporan akuntansi komprehensif omset kasir, pendapatan jasa servis, HPP modal produk, beban operasional, dan laba bersih riil toko.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-muted hover:bg-muted/80 text-foreground font-semibold px-3.5 py-2 rounded-xl text-xs transition-colors border border-border shadow-xs"
          >
            <Download className="h-4 w-4 text-muted-foreground" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={handlePrintOfficialReport}
            className="flex items-center gap-1.5 bg-muted hover:bg-muted/80 text-foreground font-semibold px-3.5 py-2 rounded-xl text-xs transition-colors border border-border shadow-xs"
          >
            <Printer className="h-4 w-4 text-muted-foreground" />
            <span>Cetak Laporan</span>
          </button>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all shadow-md active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>+ Catat Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar: Date Range & Subtabs */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        {/* Navigation Subtabs */}
        <div className="flex items-center space-x-1 bg-muted/60 p-1 rounded-xl border border-border/40 overflow-x-auto">
          {[
            { id: "pnl", label: "📊 Laba & Rugi (P&L)" },
            { id: "sales", label: "🛒 Penjualan & Kas" },
            { id: "technicians", label: "🔧 Produktivitas Teknisi" },
            { id: "expenses", label: "💸 Biaya Operasional" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveReportTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeReportTab === tab.id
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
            {[
              { id: "today", label: "Hari Ini" },
              { id: "last7days", label: "7 Hari" },
              { id: "thisMonth", label: "Bulan Ini" },
              { id: "lastMonth", label: "Bulan Lalu" },
              { id: "thisYear", label: "Tahun Ini" },
              { id: "custom", label: "Kustom" }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setDateRangeFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  dateRangeFilter === f.id
                    ? "bg-blue-600 text-white font-semibold"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {dateRangeFilter === "custom" && (
            <div className="flex items-center gap-1.5 text-xs bg-muted/40 p-1 rounded-lg border border-border">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-transparent border-0 text-xs text-foreground focus:outline-hidden"
              />
              <span className="text-muted-foreground">s/d</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-transparent border-0 text-xs text-foreground focus:outline-hidden"
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Total Omset */}
        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Pendapatan (Omset)</span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{formatRupiah(totalRevenue)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {filteredTransactions.length} Transaksi Kasir
          </p>
        </div>

        {/* HPP Modal */}
        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Beban Pokok (HPP Modal)</span>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-lg">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{formatRupiah(totalHPP)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Modal unit & sparepart
          </p>
        </div>

        {/* Laba Kotor */}
        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Laba Kotor (Gross Profit)</span>
            <div className="p-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-lg">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
            {formatRupiah(grossProfit)}
          </p>
          <p className="text-[11px] text-purple-700 dark:text-purple-300 font-medium mt-1">
            Margin: {grossMarginPct.toFixed(1)}%
          </p>
        </div>

        {/* Laba Bersih */}
        <div className={`border p-4 rounded-xl shadow-xs ${
          netProfit >= 0
            ? "bg-emerald-500/5 border-emerald-500/30"
            : "bg-red-500/5 border-red-500/30"
        }`}>
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold text-foreground">Laba Bersih (Net Profit)</span>
            <div className={`p-1.5 rounded-lg ${netProfit >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
              {netProfit >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 ${netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600"}`}>
            {formatRupiah(netProfit)}
          </p>
          <p className="text-[11px] font-semibold text-muted-foreground mt-1">
            Setelah beban operasional ({formatRupiah(totalOperationalExpenses)})
          </p>
        </div>
      </div>

      {/* SUB-TAB 1: Laporan Laba & Rugi (P&L Income Statement) */}
      {activeReportTab === "pnl" && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="p-5 border-b border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-foreground">Laporan Laba & Rugi (Income Statement)</h3>
                <p className="text-xs text-muted-foreground">
                  Rincian sumber pendapatan, biaya modal, dan biaya operasional selama periode terpilih.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold bg-muted px-3 py-1 rounded-lg text-foreground border border-border">
                {formatDateIndo(dateRangeBounds.start.toISOString())} - {formatDateIndo(dateRangeBounds.end.toISOString())}
              </span>
            </div>

            <div className="p-6 space-y-6 text-sm">
              {/* 1. Pendapatan Usaha */}
              <div>
                <div className="flex justify-between items-center pb-2 border-b-2 border-blue-600 font-bold text-foreground">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                    <span>1. PENDAPATAN USAHA (REVENUE)</span>
                  </span>
                  <span className="text-blue-600 dark:text-blue-400">{formatRupiah(totalRevenue)}</span>
                </div>

                <div className="divide-y divide-border/60 pl-4 text-xs mt-2">
                  <div className="py-2 flex justify-between">
                    <span className="text-muted-foreground">Penjualan Laptop Baru (BNIB Garansi Resmi)</span>
                    <span className="font-semibold text-foreground">{formatRupiah(posSalesData.laptopBaru)}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-muted-foreground">Penjualan Laptop Bekas Berkualitas (Grade A)</span>
                    <span className="font-semibold text-foreground">{formatRupiah(posSalesData.laptopBekas)}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-muted-foreground">Penjualan Komponen PC & Sparepart Laptop</span>
                    <span className="font-semibold text-foreground">{formatRupiah(posSalesData.komponen)}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-muted-foreground">Penjualan Aksesoris, Adaptor & Periferal</span>
                    <span className="font-semibold text-foreground">{formatRupiah(posSalesData.aksesoris)}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-muted-foreground">Pendapatan Jasa Servis & Perbaikan Komputer/Laptop</span>
                    <span className="font-semibold text-foreground">
                      {formatRupiah(posSalesData.serviceTicketsPaid + posSalesData.jasaPOS)}
                    </span>
                  </div>
                  {posSalesData.totalDiscount > 0 && (
                    <div className="py-2 flex justify-between text-red-500">
                      <span>Potongan Diskon Penjualan</span>
                      <span>- {formatRupiah(posSalesData.totalDiscount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Beban Pokok Penjualan (HPP) */}
              <div>
                <div className="flex justify-between items-center pb-2 border-b-2 border-amber-600 font-bold text-foreground">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-600"></span>
                    <span>2. BEBAN POKOK PENJUALAN (HPP / COGS)</span>
                  </span>
                  <span className="text-amber-600 dark:text-amber-400">- {formatRupiah(totalHPP)}</span>
                </div>

                <div className="divide-y divide-border/60 pl-4 text-xs mt-2">
                  <div className="py-2 flex justify-between">
                    <span className="text-muted-foreground">Modal Pokok Produk & Sparepart Terjual di Kasir POS</span>
                    <span className="font-semibold text-foreground">{formatRupiah(posSalesData.totalProductCostPrice)}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-muted-foreground">Modal Pokok Sparepart yang Digunakan pada Tiket Servis</span>
                    <span className="font-semibold text-foreground">{formatRupiah(serviceFinancials.totalPartsCostPrice)}</span>
                  </div>
                </div>
              </div>

              {/* LABA KOTOR SUB-TOTAL */}
              <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/70 p-3.5 rounded-xl flex justify-between items-center font-bold">
                <div>
                  <span className="text-purple-900 dark:text-purple-200">LABA KOTOR USAHA (GROSS PROFIT)</span>
                  <p className="text-[11px] text-purple-700 dark:text-purple-300 font-normal">
                    Pendapatan Usaha dikurangi Beban Pokok Modal (HPP)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg text-purple-700 dark:text-purple-300">{formatRupiah(grossProfit)}</span>
                  <p className="text-[11px] text-purple-600 font-semibold">Margin: {grossMarginPct.toFixed(1)}%</p>
                </div>
              </div>

              {/* 3. Beban Operasional Toko */}
              <div>
                <div className="flex justify-between items-center pb-2 border-b-2 border-red-500 font-bold text-foreground">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    <span>3. BEBAN PENGELUARAN OPERASIONAL (EXPENSES)</span>
                  </span>
                  <span className="text-red-500">- {formatRupiah(totalOperationalExpenses)}</span>
                </div>

                {filteredExpenses.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic pl-4 py-2">
                    Belum ada catatan biaya operasional di periode ini. Klik tombol "+ Catat Pengeluaran" di kanan atas untuk menambahkan.
                  </p>
                ) : (
                  <div className="divide-y divide-border/60 pl-4 text-xs mt-2">
                    {filteredExpenses.map((exp) => (
                      <div key={exp.id} className="py-2 flex justify-between items-center group">
                        <div>
                          <span className="font-semibold text-foreground">{exp.description}</span>
                          <span className="text-[11px] text-muted-foreground ml-2">
                            ({exp.category.replace(/_/g, " ").toUpperCase()} • {formatDateIndo(exp.date)})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{formatRupiah(exp.amount)}</span>
                          <button
                            onClick={() => onDeleteExpense(exp.id)}
                            className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            title="Hapus Pengeluaran"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* LABA BERSIH TOTAL */}
              <div className={`p-4 rounded-xl border-2 flex justify-between items-center font-bold ${
                netProfit >= 0
                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-950 dark:text-emerald-100"
                  : "bg-red-500/10 border-red-500 text-red-950 dark:text-red-100"
              }`}>
                <div>
                  <span className="text-base uppercase tracking-wide">
                    {netProfit >= 0 ? "LABA BERSIH USAHA (NET PROFIT)" : "RUGI USAHA BERSIH"}
                  </span>
                  <p className="text-xs font-normal opacity-80">
                    Laba Bersih Akhir setelah memperhitungkan seluruh modal dan pengeluaran operasional.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black">{formatRupiah(netProfit)}</span>
                  <p className="text-xs font-semibold">Net Profit Margin: {netMarginPct.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Laporan Penjualan & Arus Kas */}
      {activeReportTab === "sales" && (
        <div className="space-y-6">
          {/* Payment Methods Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase">Kas Tunai (Cash)</span>
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-xl font-bold text-foreground mt-2">{formatRupiah(paymentBreakdown.cash)}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Uang fisik di laci kasir</p>
            </div>

            <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase">QRIS (GoPay/OVO/ShopeePay)</span>
                <CreditCard className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-xl font-bold text-foreground mt-2">{formatRupiah(paymentBreakdown.qris)}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Settlement saldo digital</p>
            </div>

            <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase">Transfer Bank / EDC</span>
                <Building className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-xl font-bold text-foreground mt-2">{formatRupiah(paymentBreakdown.transfer)}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Rekening Bank Toko</p>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
              <h3 className="font-bold text-foreground text-sm">Daftar Faktur Transaksi Kasir POS</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">No. Faktur & Waktu</th>
                    <th className="py-2.5 px-3">Pelanggan</th>
                    <th className="py-2.5 px-3">Rincian Item</th>
                    <th className="py-2.5 px-3">Metode</th>
                    <th className="py-2.5 px-3 text-right">Modal Pokok</th>
                    <th className="py-2.5 px-3 text-right">Omset (Total)</th>
                    <th className="py-2.5 px-3 text-right">Estimasi Laba</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTransactions.map((tx) => {
                    let txCost = 0;
                    tx.items.forEach((it) => {
                      if (it.productId) {
                        const p = products.find((pr) => pr.id === it.productId);
                        txCost += (p?.costPrice || 0) * it.qty;
                      }
                    });
                    const txProfit = Math.max(0, tx.total - txCost);

                    return (
                      <tr key={tx.id} className="hover:bg-muted/30">
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-foreground">{tx.invoiceNumber}</span>
                          <p className="text-[10px] text-muted-foreground">{formatDateIndo(tx.date)}</p>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-foreground">
                          {tx.customerName}
                          <p className="text-[10px] text-muted-foreground">{tx.customerPhone}</p>
                        </td>
                        <td className="py-2.5 px-3 max-w-xs">
                          {tx.items.map((it, idx) => (
                            <p key={idx} className="line-clamp-1 text-muted-foreground">
                              • {it.name} ({it.qty}x)
                            </p>
                          ))}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="uppercase font-bold text-[10px] bg-muted px-2 py-0.5 rounded-md">
                            {tx.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-muted-foreground">
                          {formatRupiah(txCost)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-foreground">
                          {formatRupiah(tx.total)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          +{formatRupiah(txProfit)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Laporan Produktivitas & Kinerja Teknisi */}
      {activeReportTab === "technicians" && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
              <h3 className="font-bold text-foreground text-sm">Produktivitas & Omset Jasa per Teknisi</h3>
              <p className="text-xs text-muted-foreground">
                Evaluasi performa pengerjaan tiket servis teknisi toko selama periode terpilih.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Nama Teknisi</th>
                    <th className="py-2.5 px-4 text-center">Unit Ditangani</th>
                    <th className="py-2.5 px-4 text-center">Unit Selesai & Lunas</th>
                    <th className="py-2.5 px-4 text-center">Sedang Dikerjakan</th>
                    <th className="py-2.5 px-4 text-right">Rata-Rata Biaya/Unit</th>
                    <th className="py-2.5 px-4 text-right">Total Omset Jasa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {technicianStats.map((tech, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="py-3 px-4 font-bold text-foreground flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                          {tech.name.substring(0, 1).toUpperCase()}
                        </div>
                        <span>{tech.name}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-foreground">
                        {tech.assignedCount} Unit
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                          {tech.completedCount} Selesai
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-muted-foreground">
                        {tech.inProgressCount} Unit
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground">
                        {formatRupiah(tech.avgCost)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-600 dark:text-blue-400">
                        {formatRupiah(tech.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: Biaya Operasional */}
      {activeReportTab === "expenses" && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground text-sm">Daftar Pengeluaran & Biaya Operasional Toko</h3>
                <p className="text-xs text-muted-foreground">
                  Catatan pengeluaran non-stok seperti listrik, sewa ruko, gaji, dan konsumsi.
                </p>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Pengeluaran</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Tanggal</th>
                    <th className="py-2.5 px-4">Kategori Biaya</th>
                    <th className="py-2.5 px-4">Deskripsi / Keterangan</th>
                    <th className="py-2.5 px-4">Dicatat Oleh</th>
                    <th className="py-2.5 px-4 text-right">Nominal (Rp)</th>
                    <th className="py-2.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">
                        Belum ada data pengeluaran di periode ini.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-muted/30">
                        <td className="py-3 px-4 text-muted-foreground">
                          {formatDateIndo(exp.date)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="capitalize font-semibold text-foreground bg-muted px-2 py-0.5 rounded-md">
                            {exp.category.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-foreground">
                          {exp.description}
                          {exp.notes && <p className="text-[10px] text-muted-foreground italic">{exp.notes}</p>}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {exp.recordedBy}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-red-600 dark:text-red-400">
                          {formatRupiah(exp.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => onDeleteExpense(exp.id)}
                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors"
                            title="Hapus Pengeluaran"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tambah Pengeluaran Baru */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-center justify-between">
              <h3 className="font-bold text-foreground text-base flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <span>Catat Pengeluaran Operasional Toko</span>
              </h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1.5 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpenseSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Kategori Pengeluaran
                </label>
                <select
                  value={expenseFormData.category}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, category: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm bg-muted/30 border border-input rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="listrik_internet">Listrik PLN & Internet Wi-Fi</option>
                  <option value="sewa_tempat">Sewa Ruko / Tempat Usaha</option>
                  <option value="alat_servis">Alat Servis (Timah, BGA, Pasta Flux, Baut, dll)</option>
                  <option value="gaji_karyawan">Gaji & Insentif Karyawan</option>
                  <option value="transport_logistik">Transport & Logistik Ekspedisi</option>
                  <option value="konsumsi">Konsumsi Toko & Galon Air</option>
                  <option value="operasional">Operasional Rutin Toko</option>
                  <option value="lainnya">Pengeluaran Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Keterangan / Deskripsi Biaya <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tagihan Listrik PLN Bulan September"
                  value={expenseFormData.description}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-muted/30 border border-input rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nominal Pengeluaran (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="1000"
                  placeholder="0"
                  value={expenseFormData.amount || ""}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm font-bold bg-muted/30 border border-input rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="No. Bukti / Kuitansi..."
                  value={expenseFormData.notes}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-muted/30 border border-input rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-md active:scale-95"
                >
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
