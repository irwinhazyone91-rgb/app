import React, { useState } from "react";
import {
  Menu,
  ShieldCheck,
  Search,
  Wrench,
  ShoppingCart,
  ReceiptText,
  Package,
  LayoutDashboard,
  Settings,
  QrCode,
  Laptop,
  Users,
  ChevronDown,
  UserCheck,
  Check,
  Lock,
  LogOut
} from "lucide-react";
import { StoreSettings, User } from "../types";
import { getUserRoleConfig } from "../lib/utils";

interface TopBarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenMobileMenu: () => void;
  onOpenQRScanner: () => void;
  settings: StoreSettings;
  activeTicketsCount: number;
  currentUser?: User;
  users?: User[];
  onOpenSwitchUserModal?: (targetUser?: User) => void;
  onLogout?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenMobileMenu,
  onOpenQRScanner,
  settings,
  activeTicketsCount,
  currentUser,
  users = [],
  onOpenSwitchUserModal,
  onLogout
}) => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const getTabInfo = () => {
    switch (currentTab) {
      case "dashboard":
        return {
          title: "Dashboard & Analitik",
          subtitle: "Pantau performa omset, antrean servis, dan status toko",
          icon: LayoutDashboard
        };
      case "services":
        return {
          title: "Manajemen Tiket Servis",
          subtitle: "Penerimaan unit, diagnosa kerusakan, progres, & nota SPK",
          icon: Wrench
        };
      case "pos":
        return {
          title: "Kasir POS & Penjualan",
          subtitle: "Transaksi sparepart, jasa servis, dan pelunasan nota",
          icon: ShoppingCart
        };
      case "transactions":
        return {
          title: "Riwayat Transaksi & Nota",
          subtitle: "Arsip seluruh penjualan kasir, pelunasan servis, serta pembatalan nota khusus Pemilik Toko",
          icon: ReceiptText
        };
      case "inventory":
        return {
          title: "Inventaris Sparepart & Jasa",
          subtitle: "Kelola stok fisik, harga modal, tarif jasa, dan batas minimum",
          icon: Package
        };
      case "users":
        return {
          title: "Manajemen Pengguna & Tim",
          subtitle: "Kelola hak akses: Pemilik Toko, Admin, Teknisi, dan Kasir",
          icon: Users
        };
      case "tracking":
        return {
          title: "Portal Tracking & Garansi",
          subtitle: "Pengecekan status pengerjaan unit & klaim garansi online",
          icon: Search
        };
      case "settings":
        return {
          title: "Pengaturan Profil & Nota",
          subtitle: "Konfigurasi identitas toko, nomor WhatsApp, & syarat garansi",
          icon: Settings
        };
      default:
        return {
          title: "ServisKu POS",
          subtitle: "Sistem Manajemen Servis & Kasir",
          icon: Laptop
        };
    }
  };

  const tabInfo = getTabInfo();
  const Icon = tabInfo.icon;

  return (
    <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-md border-b border-border py-3 px-4 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile menu button & Title Breadcrumb */}
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-xl border border-border text-foreground hover:bg-muted focus:outline-hidden cursor-pointer"
            title="Buka Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate flex items-center gap-2">
                <span>{tabInfo.title}</span>
                {currentTab === "services" && activeTicketsCount > 0 && (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                    {activeTicketsCount} Unit Berjalan
                  </span>
                )}
              </h1>
              <p className="text-xs text-muted-foreground truncate hidden md:block">
                {tabInfo.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Right: User Switcher Dropdown & Quick Actions */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* User Account Button with Dropdown */}
          {currentUser && (
            <div className="relative">
              <button
                id="topbar-user-switcher"
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl border border-border bg-card hover:bg-muted/70 transition-all text-xs font-semibold text-foreground shadow-2xs cursor-pointer"
                title="Info Pengguna & Opsi Ganti Akun"
              >
                <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-[11px]">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="truncate font-bold leading-tight">{currentUser.name}</div>
                  <div className="text-[10px] text-muted-foreground leading-tight">
                    {getUserRoleConfig(currentUser.role).label}
                  </div>
                </div>
                <span
                  className={`hidden sm:inline-block px-1.5 py-0.2 rounded-md text-[10px] font-bold border ${
                    getUserRoleConfig(currentUser.role).bg
                  }`}
                >
                  {getUserRoleConfig(currentUser.role).label}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>

              {/* Dropdown Menu */}
              {isUserDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserDropdownOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-card border border-border shadow-xl z-50 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2.5 py-2 border-b border-border text-xs bg-muted/30 rounded-xl">
                      <p className="font-bold text-foreground">{currentUser.name}</p>
                      <p className="text-[11px] text-muted-foreground">@{currentUser.username}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            getUserRoleConfig(currentUser.role).bg
                          }`}
                        >
                          {getUserRoleConfig(currentUser.role).label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          • {currentUser.phone}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {/* Secure Switch User Action */}
                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          if (onOpenSwitchUserModal) {
                            onOpenSwitchUserModal();
                          }
                        }}
                        className="w-full flex items-center space-x-2.5 p-2 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors text-left cursor-pointer"
                      >
                        <Lock className="h-4 w-4" />
                        <div className="flex-1">
                          <div>Ganti Akun / Pengguna</div>
                          <div className="text-[10px] text-muted-foreground font-normal">
                            Verifikasi Password/PIN akun baru
                          </div>
                        </div>
                      </button>

                      {/* Manage Users (if owner / admin) */}
                      {(currentUser.role === "owner" || currentUser.role === "admin") && (
                        <button
                          onClick={() => {
                            setCurrentTab("users");
                            setIsUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center space-x-2.5 p-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted transition-colors text-left cursor-pointer"
                        >
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>Kelola Master Pengguna</span>
                        </button>
                      )}

                      {/* Logout Action */}
                      {onLogout && (
                        <button
                          id="btn-topbar-logout"
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            onLogout();
                          }}
                          className="w-full flex items-center space-x-2.5 p-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 font-semibold transition-colors text-left cursor-pointer border-t border-border pt-2"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Keluar / Logout Akun</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <button
            onClick={onOpenQRScanner}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors shadow-2xs cursor-pointer"
            title="Scan QR Code Tiket Servis dengan Kamera"
          >
            <QrCode className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">Scan QR</span>
          </button>

          <button
            onClick={() => setCurrentTab("tracking")}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors shadow-2xs cursor-pointer"
            title="Lacak Status Servis & Garansi"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Lacak Servis</span>
          </button>
        </div>
      </div>
    </header>
  );
};

