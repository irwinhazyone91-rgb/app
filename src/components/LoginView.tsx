import React, { useState } from "react";
import {
  Wrench,
  ShieldCheck,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { User, StoreSettings } from "../types";
import { getUserRoleConfig } from "../lib/utils";

interface LoginViewProps {
  onLogin: (user: User) => void;
  onOpenCustomerTracking: () => void;
  users: User[];
  settings: StoreSettings;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLogin,
  onOpenCustomerTracking,
  users,
  settings
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedQuickRole, setSelectedQuickRole] = useState<string | null>(null);

  // Quick Preset Accounts for Demo / Fast Login
  const demoAccounts = [
    {
      role: "owner",
      title: "Pemilik Toko (Owner)",
      badge: "Full Akses",
      color: "border-purple-500/40 bg-purple-50/50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300",
      targetUser: users.find((u) => u.role === "owner") || users[0],
      desc: "Laporan omset, kelola staf & pengaturan",
      defaultPin: "123456"
    },
    {
      role: "admin",
      title: "Admin Toko",
      badge: "Operasional & Stok",
      color: "border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300",
      targetUser: users.find((u) => u.role === "admin") || users[1],
      desc: "Input tiket servis, sparepart & pelanggan",
      defaultPin: "123456"
    },
    {
      role: "technician",
      title: "Teknisi Hardware",
      badge: "Pengerjaan & Diagnosa",
      color: "border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300",
      targetUser: users.find((u) => u.role === "technician") || users[2],
      desc: "Diagnosa kerusakan, ganti part & QC",
      defaultPin: "123456"
    },
    {
      role: "cashier",
      title: "Kasir POS",
      badge: "Transaksi & Kasir",
      color: "border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300",
      targetUser: users.find((u) => u.role === "cashier") || users[4],
      desc: "Pelunasan servis, jual sparepart & cetak nota",
      defaultPin: "123456"
    }
  ];

  const handleSelectQuickAccount = (account: typeof demoAccounts[0]) => {
    if (account.targetUser) {
      setSelectedQuickRole(account.role);
      setUsername(account.targetUser.username);
      setPassword(account.defaultPin);
      setErrorMessage("");
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      setErrorMessage("Silakan masukkan Username atau Nama Pengguna.");
      return;
    }

    if (!cleanPassword) {
      setErrorMessage("Silakan masukkan Password / PIN akses.");
      return;
    }

    // Find user in registered list by username or phone
    const matchedUser = users.find(
      (u) =>
        u.username.toLowerCase() === cleanUsername ||
        u.name.toLowerCase() === cleanUsername ||
        u.phone.replace(/[^0-9]/g, "") === cleanUsername.replace(/[^0-9]/g, "")
    );

    if (!matchedUser) {
      setErrorMessage("Username atau akun tidak ditemukan. Silakan periksa kembali atau pilih akun cepat di bawah.");
      return;
    }

    if (matchedUser.status === "inactive") {
      setErrorMessage("Akun ini sedang dinonaktifkan oleh Administrator.");
      return;
    }

    // Success login
    onLogin(matchedUser);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 selection:bg-blue-600 selection:text-white">
      {/* Top Brand Bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center space-x-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 border border-blue-400/30">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              <span>{settings.storeName}</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                POS & SERVICE v2.0
              </span>
            </h1>
            <p className="text-xs text-slate-400">{settings.tagline}</p>
          </div>
        </div>

        {/* Customer Direct Portal Button */}
        <button
          id="btn-customer-tracking-portal"
          onClick={onOpenCustomerTracking}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-400/40 transition-all shadow-sm active:scale-95"
          title="Buka Halaman Konsumen untuk Lacak Servis & Cek Garansi"
        >
          <Search className="h-3.5 w-3.5 text-blue-400" />
          <span>🌐 Halaman Lacak Servis & Garansi Konsumen</span>
        </button>
      </header>

      {/* Main Login Content Card */}
      <main className="max-w-5xl w-full mx-auto my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Col: Welcome & System Feature Highlights */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Sistem Kasir & Manajemen Bengkel Terpadu</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Selamat Datang di <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300">
                {settings.storeName}
              </span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Platform lengkap untuk pencatatan unit masuk, diagnosa kerusakan, cetak nota SPK dot-matrix, label stiker 58mm, hingga kasir POS & stok sparepart.
            </p>
          </div>

          {/* Role Access Matrix Info */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="font-bold text-xs text-white flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-purple-400"></span>
                <span>Owner & Admin</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Dashboard omset, master data pengguna, harga modal, dan pengaturan toko.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="font-bold text-xs text-white flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                <span>Teknisi & Kasir</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Pengerjaan unit, rincian part, cetak stiker 58mm, dan transaksi kasir POS.
              </p>
            </div>
          </div>

          {/* Mobile Customer Portal Button */}
          <div className="sm:hidden pt-2">
            <button
              onClick={onOpenCustomerTracking}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-400/30 transition-all"
            >
              <Search className="h-4 w-4" />
              <span>Portal Lacak Servis Konsumen</span>
            </button>
          </div>
        </div>

        {/* Right Col: Login Form Box */}
        <div className="lg:col-span-6">
          <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="space-y-1 border-b border-slate-700/80 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-400" />
                <span>Masuk Akun Petugas</span>
              </h3>
              <p className="text-xs text-slate-400">
                Masukkan kredensial pengguna atau pilih akun demo di bawah untuk masuk.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Username / ID Pengguna
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <input
                    id="login-username-input"
                    type="text"
                    required
                    placeholder="Contoh: owner / admin / rian_tech / maya_kasir"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setSelectedQuickRole(null);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex justify-between items-center">
                  <span>Password / PIN Akses</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    (PIN Demo: 123456)
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="login-password-input"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Masukkan PIN / Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Ingat sesi login saya</span>
                </label>
              </div>

              <button
                id="btn-submit-login"
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 active:scale-98"
              >
                <span>Masuk ke Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Quick 1-Click Demo Accounts */}
            <div className="space-y-2 pt-2 border-t border-slate-700/60">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  ⚡ Pilih Akun Demo Cepat:
                </span>
                <span className="text-[10px]">Klik untuk isi otomatis</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map((acc) => {
                  const isSelected = selectedQuickRole === acc.role;
                  return (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => handleSelectQuickAccount(acc)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "bg-blue-600/30 border-blue-400 text-white shadow-sm ring-1 ring-blue-400"
                          : "bg-slate-900/60 border-slate-700/80 hover:bg-slate-900 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-xs truncate text-white">
                          {acc.title.split(" ")[0]}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-white/10 text-slate-300 font-semibold">
                          {acc.role}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {acc.targetUser ? acc.targetUser.name : acc.desc}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Customer Direct Portal Banner */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenCustomerTracking}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600/30 to-blue-600/30 hover:from-emerald-600/40 hover:to-blue-600/40 border border-emerald-500/40 text-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-xs"
                >
                  <Search className="h-4 w-4 text-emerald-400" />
                  <span>Pelanggan? Lacak Servis & Cek Garansi Toko</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 py-2 text-xs text-slate-500 border-t border-slate-800">
        <span>
          © {new Date().getFullYear()} {settings.storeName} — Sistem Informasi Servis & POS Bengkel
        </span>
        <div className="flex items-center space-x-4 text-[11px]">
          <span>Alamat: {settings.address}</span>
          <span>•</span>
          <span>WA Toko: {settings.whatsapp}</span>
        </div>
      </footer>
    </div>
  );
};
