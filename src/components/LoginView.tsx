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
  Shield
} from "lucide-react";
import { User, StoreSettings } from "../types";

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
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      setErrorMessage("Silakan masukkan Username atau No. HP Anda.");
      return;
    }

    if (!cleanPassword) {
      setErrorMessage("Silakan masukkan Password atau PIN akses Anda.");
      return;
    }

    // Find user in registered list by username, full name, or phone number
    const matchedUser = users.find(
      (u) =>
        u.username.toLowerCase() === cleanUsername ||
        u.name.toLowerCase() === cleanUsername ||
        u.phone.replace(/[^0-9]/g, "") === cleanUsername.replace(/[^0-9]/g, "")
    );

    if (!matchedUser) {
      setErrorMessage("Akun / Username tidak ditemukan. Silakan periksa kembali atau hubungi Administrator.");
      return;
    }

    if (matchedUser.status === "inactive") {
      setErrorMessage("Akun ini sedang dinonaktifkan oleh Administrator.");
      return;
    }

    // Validate Password or PIN
    const registeredPass = matchedUser.password || matchedUser.pin || "password123";
    const registeredPin = matchedUser.pin || matchedUser.password || "123456";

    const isPasswordCorrect =
      cleanPassword === registeredPass ||
      cleanPassword === registeredPin ||
      (cleanPassword === "123456" && !matchedUser.password && !matchedUser.pin);

    if (!isPasswordCorrect) {
      setErrorMessage("Password atau PIN yang Anda masukkan salah. Silakan coba lagi.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      onLogin(matchedUser);
      setIsLoading(false);
    }, 200);
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
                POS & SERVICE
              </span>
            </h1>
            <p className="text-xs text-slate-400">{settings.tagline}</p>
          </div>
        </div>

        {/* Customer Direct Portal Button */}
        <button
          id="btn-customer-tracking-portal"
          onClick={onOpenCustomerTracking}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-400/40 transition-all shadow-sm active:scale-95 cursor-pointer"
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
            <span>Sistem Kasir POS & Manajemen Bengkel Servis</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Selamat Datang di <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300">
                {settings.storeName}
              </span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Akses sistem informasi operasional untuk penerimaan unit servis, estimasi biaya, cetak nota SPK 21 x 15 cm continuous form, kasir POS, dan inventaris sparepart.
            </p>
          </div>

          {/* Role Access Badges */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="font-bold text-xs text-white flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-purple-400"></span>
                <span>Owner & Admin</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Laporan omset keuangan, master data staf, pengaturan nota & sistem.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="font-bold text-xs text-white flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                <span>Teknisi & Kasir POS</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Pengerjaan unit, penggantian part, cetak label stiker 58mm & kasir.
              </p>
            </div>
          </div>

          {/* Mobile Customer Portal Button */}
          <div className="sm:hidden pt-2">
            <button
              onClick={onOpenCustomerTracking}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-400/30 transition-all cursor-pointer"
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
                Masukkan Username dan Password / PIN terdaftar Anda untuk melanjutkan.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-shake">
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
                    placeholder="Masukkan username atau nama pengguna"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password / PIN Akses
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="login-password-input"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Masukkan password atau PIN akses"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    title={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Ingat sesi login di perangkat ini</span>
                </label>
              </div>

              <button
                id="btn-submit-login"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 active:scale-98 cursor-pointer disabled:opacity-70"
              >
                <span>{isLoading ? "Memverifikasi..." : "Masuk ke Dashboard"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Customer Direct Portal Section */}
            <div className="pt-3 border-t border-slate-700/60">
              <button
                type="button"
                onClick={onOpenCustomerTracking}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600/30 to-blue-600/30 hover:from-emerald-600/40 hover:to-blue-600/40 border border-emerald-500/40 text-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer"
              >
                <Search className="h-4 w-4 text-emerald-400" />
                <span>Pelanggan? Lacak Status Servis & Garansi Toko</span>
              </button>
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
