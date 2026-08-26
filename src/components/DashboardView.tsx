import React from "react";
import {
  Wrench,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  Laptop,
  Monitor,
  Printer,
  ChevronRight
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import { DashboardStats, ServiceTicket } from "../types";
import { formatRupiah, getStatusConfig, formatDateIndo } from "../lib/utils";

interface DashboardViewProps {
  stats: DashboardStats | null;
  tickets: ServiceTicket[];
  onOpenNewTicket: () => void;
  onNavigate: (tab: string) => void;
  onSelectTicket: (ticket: ServiceTicket) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  tickets,
  onOpenNewTicket,
  onNavigate,
  onSelectTicket
}) => {
  const recentTickets = tickets.slice(0, 5);

  const formatShortRupiah = (value: number) => {
    if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)} jt`;
    if (value >= 1000) return `Rp ${(value / 1000).toFixed(0)} rb`;
    return `Rp ${value}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ringkasan Operasional Toko & Servis</h1>
          <p className="text-blue-100 text-sm mt-1">
            Pantau arus transaksi kasir, tiket pengerjaan teknisi, dan kepuasan pelanggan secara realtime.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            id="btn-dashboard-new-ticket"
            onClick={onOpenNewTicket}
            className="flex items-center space-x-2 bg-white text-blue-700 hover:bg-blue-50 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Terima Servis Baru</span>
          </button>
          <button
            id="btn-dashboard-open-pos"
            onClick={() => onNavigate("pos")}
            className="flex items-center space-x-2 bg-blue-500/30 hover:bg-blue-500/40 text-white border border-white/20 font-medium px-4 py-2.5 rounded-xl text-sm transition-all"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Buka Kasir</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Omset Kasir & Servis
            </span>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-foreground">
              {stats ? formatRupiah(stats.totalRevenue) : "Rp 0"}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
              POS & Pelunasan Servis
            </p>
          </div>
        </div>

        {/* Active Services */}
        <div 
          onClick={() => onNavigate("services")}
          className="bg-card border border-border rounded-xl p-5 shadow-xs relative overflow-hidden cursor-pointer hover:border-blue-500/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Servis Dalam Proses
            </span>
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-foreground">
              {stats ? stats.activeServices : 0} Unit
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium flex items-center justify-between">
              <span>Antrean, diagnosa & pengerjaan</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </p>
          </div>
        </div>

        {/* Ready For Pickup */}
        <div 
          onClick={() => onNavigate("services")}
          className="bg-card border border-border rounded-xl p-5 shadow-xs relative overflow-hidden cursor-pointer hover:border-emerald-500/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Siap Diambil Pelanggan
            </span>
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats ? stats.readyServices : 0} Unit
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
              <span>Siap diinfokan via WhatsApp</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </p>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div 
          onClick={() => onNavigate("inventory")}
          className="bg-card border border-border rounded-xl p-5 shadow-xs relative overflow-hidden cursor-pointer hover:border-rose-500/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Peringatan Stok Menipis
            </span>
            <div className="h-9 w-9 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-bold ${stats && stats.lowStockCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"}`}>
              {stats ? stats.lowStockCount : 0} Produk
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
              <span>Di bawah batas minimum stok</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Charts & Device Type breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-foreground">Tren Pendapatan Mingguan</h2>
              <p className="text-xs text-muted-foreground">Komparasi transaksi Kasir Toko vs Jasa Servis</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-xs bg-blue-500"></div>
                <span className="text-muted-foreground">POS / Part</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-xs bg-indigo-500"></div>
                <span className="text-muted-foreground">Jasa Servis</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            {stats && stats.revenueChart ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.revenueChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={formatShortRupiah} tickLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: any) => [formatRupiah(Number(value)), ""]}
                    contentStyle={{
                      backgroundColor: "rgba(23, 23, 23, 0.95)",
                      color: "#ffffff",
                      borderRadius: "8px",
                      fontSize: "12px",
                      border: "none"
                    }}
                  />
                  <Bar dataKey="pos" name="Kasir POS" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="service" name="Servis" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Memuat data grafik...
              </div>
            )}
          </div>
        </div>

        {/* Device Distribution */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Kategori Perangkat Servis</h2>
            <p className="text-xs text-muted-foreground">Distribusi unit yang masuk ke bengkel servis</p>

            <div className="mt-5 space-y-3.5">
              <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-border/50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                    <Laptop className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Laptop / Notebook</div>
                    <div className="text-xs text-muted-foreground">Asus, Lenovo, Acer, HP, MacBook</div>
                  </div>
                </div>
                <div className="font-bold text-sm">{stats?.deviceCounts?.laptop ?? 0} unit</div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-border/50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                    <Monitor className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">PC Desktop & AIO</div>
                    <div className="text-xs text-muted-foreground">PC Rakitan Gaming & Office</div>
                  </div>
                </div>
                <div className="font-bold text-sm">{stats?.deviceCounts?.pc ?? 0} unit</div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-border/50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                    <Printer className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Printer & Monitor</div>
                    <div className="text-xs text-muted-foreground">Epson, Canon, HP, Monitor LCD</div>
                  </div>
                </div>
                <div className="font-bold text-sm">{stats?.deviceCounts?.printer ?? 0} unit</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Servis Tercatat:</span>
            <span className="font-semibold text-foreground">{tickets.length} Tiket</span>
          </div>
        </div>
      </div>

      {/* Recent Service Tickets Table */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-foreground">Tiket Servis Terbaru</h2>
            <p className="text-xs text-muted-foreground">Perkembangan unit servis pelanggan terkini</p>
          </div>
          <button
            onClick={() => onNavigate("services")}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center space-x-1"
          >
            <span>Lihat Semua Tiket</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3 rounded-l-lg">No. Tiket</th>
                <th className="py-2.5 px-3">Pelanggan</th>
                <th className="py-2.5 px-3">Perangkat</th>
                <th className="py-2.5 px-3">Keluhan</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Biaya</th>
                <th className="py-2.5 px-3 text-right rounded-r-lg">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {recentTickets.map((ticket) => {
                const statusCfg = getStatusConfig(ticket.status);
                return (
                  <tr key={ticket.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-3 font-semibold text-blue-600 dark:text-blue-400">
                      {ticket.ticketNumber}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-foreground">{ticket.customerName}</div>
                      <div className="text-xs text-muted-foreground">{ticket.customerPhone}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium">{ticket.deviceBrandModel}</div>
                      <div className="text-xs text-muted-foreground capitalize">{ticket.deviceType}</div>
                    </td>
                    <td className="py-3 px-3 max-w-[200px] truncate text-xs text-muted-foreground">
                      {ticket.complaints}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${statusCfg.bg}`}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold">
                      {ticket.finalCost > 0
                        ? formatRupiah(ticket.finalCost)
                        : ticket.estimatedCost > 0
                        ? `Est. ${formatRupiah(ticket.estimatedCost)}`
                        : "Menunggu Cek"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onSelectTicket(ticket)}
                        className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 rounded-md transition-colors"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
