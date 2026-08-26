import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ServiceStatus, UserRole } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getUserRoleConfig(role: UserRole) {
  switch (role) {
    case "owner":
      return {
        label: "Pemilik Toko",
        badge: "bg-purple-600 text-white",
        bg: "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/60",
        description: "Akses penuh seluruh modul, omset, laporan keuangan & kelola pengguna"
      };
    case "admin":
      return {
        label: "Admin",
        badge: "bg-blue-600 text-white",
        bg: "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60",
        description: "Manajemen servis, master stok sparepart, kasir & pengguna"
      };
    case "technician":
      return {
        label: "Teknisi",
        badge: "bg-amber-600 text-white",
        bg: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60",
        description: "Pengerjaan unit servis, diagnosa, part pengganti & cetak stiker 58mm"
      };
    case "cashier":
      return {
        label: "Kasir",
        badge: "bg-emerald-600 text-white",
        bg: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60",
        description: "Transaksi kasir POS, penjualan sparepart & pelunasan nota servis"
      };
    default:
      return {
        label: role,
        badge: "bg-zinc-600 text-white",
        bg: "bg-zinc-100 text-zinc-800 border-zinc-200",
        description: ""
      };
  }
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDateIndo(dateStr?: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function getStatusConfig(status: ServiceStatus) {
  switch (status) {
    case "received":
      return {
        label: "Antrean Masuk",
        bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
        badge: "bg-amber-500 text-white",
        desc: "Unit telah diterima & menunggu antrean pengecekan."
      };
    case "diagnosing":
      return {
        label: "Pengecekan / Diagnosa",
        bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
        badge: "bg-blue-500 text-white",
        desc: "Teknisi sedang melakukan diagnosa kerusakan hardware & software."
      };
    case "waiting_approval":
      return {
        label: "Menunggu Persetujuan",
        bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
        badge: "bg-purple-500 text-white",
        desc: "Menunggu konfirmasi biaya & spare part dari pemilik unit."
      };
    case "in_progress":
      return {
        label: "Sedang Dikerjakan",
        bg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
        badge: "bg-cyan-500 text-white",
        desc: "Unit sedang dalam proses perbaikan / penggantian sparepart."
      };
    case "ready":
      return {
        label: "Siap Diambil",
        bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        badge: "bg-emerald-500 text-white",
        desc: "Perbaikan selesai & sudah lolos QC test. Unit siap diambil!"
      };
    case "completed":
      return {
        label: "Selesai & Diambil",
        bg: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/30",
        badge: "bg-zinc-700 text-white",
        desc: "Unit telah diserahkan kembali kepada pelanggan."
      };
    case "cancelled":
      return {
        label: "Dibatalkan / Retur",
        bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
        badge: "bg-rose-500 text-white",
        desc: "Perbaikan dibatalkan atau unit tidak dapat diperbaiki."
      };
    default:
      return {
        label: status,
        bg: "bg-zinc-100 text-zinc-800 border-zinc-200",
        badge: "bg-zinc-500 text-white",
        desc: ""
      };
  }
}

export function formatWhatsAppPhone(phone: string): string {
  let clean = phone.replace(/[^0-9]/g, "");
  if (clean.startsWith("0")) {
    clean = "62" + clean.substring(1);
  } else if (clean.startsWith("8")) {
    clean = "62" + clean;
  }
  return clean;
}

export function createWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = formatWhatsAppPhone(phone);
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
}
