import React, { useState } from "react";
import {
  LayoutDashboard,
  Wrench,
  ShoppingCart,
  ReceiptText,
  Package,
  Search,
  Settings,
  ShieldCheck,
  Moon,
  Sun,
  Laptop,
  QrCode,
  PlusCircle,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Store,
  Sparkles,
  Users,
  UserCheck,
  TrendingUp,
  Lock,
  LogOut
} from "lucide-react";
import { StoreSettings, User } from "../types";
import { createWhatsAppUrl, getUserRoleConfig } from "../lib/utils";
import { isTabAllowedForRole } from "../lib/permissions";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  settings: StoreSettings;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  activeTicketsCount: number;
  readyTicketsCount?: number;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  onOpenQRScanner: () => void;
  currentUser?: User;
  onOpenSwitchUserModal?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  settings,
  darkMode,
  setDarkMode,
  activeTicketsCount,
  readyTicketsCount = 0,
  isOpenMobile,
  setIsOpenMobile,
  onOpenQRScanner,
  currentUser,
  onOpenSwitchUserModal,
  onLogout
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const rawNavGroups = [
    {
      group: "Menu Utama",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          subtitle: "Ringkasan & Analisis",
          icon: LayoutDashboard,
        },
        {
          id: "services",
          label: "Manajemen Servis",
          subtitle: "Tiket & Progres",
          icon: Wrench,
          badge: activeTicketsCount > 0 ? activeTicketsCount : undefined,
          badgeColor: "bg-blue-600 text-white",
        },
        {
          id: "pos",
          label: "Kasir POS",
          subtitle: "Penjualan & Pelunasan",
          icon: ShoppingCart,
          badge: readyTicketsCount > 0 ? readyTicketsCount : undefined,
          badgeColor: "bg-emerald-600 text-white",
        },
        {
          id: "transactions",
          label: "Riwayat Transaksi",
          subtitle: "Nota & Koreksi Transaksi",
          icon: ReceiptText,
        },
        {
          id: "inventory",
          label: "Sparepart & Stok",
          subtitle: "Katalog & Jasa",
          icon: Package,
        },
        {
          id: "customers",
          label: "Daftar Pelanggan",
          subtitle: "CRM & Riwayat Konsumen",
          icon: UserCheck,
        },
        {
          id: "reports",
          label: "Laporan Laba / Rugi",
          subtitle: "P&L, Omzet & Beban",
          icon: TrendingUp,
        },
      ],
    },
    {
      group: "Layanan Pelanggan",
      items: [
        {
          id: "tracking",
          label: "Lacak Servis",
          subtitle: "Cek Garansi & Status",
          icon: Search,
        },
      ],
    },
    {
      group: "Sistem & Tim",
      items: [
        {
          id: "users",
          label: "Manajemen Pengguna",
          subtitle: "Owner, Admin, Teknisi, Kasir",
          icon: Users,
        },
        {
          id: "settings",
          label: "Pengaturan Toko",
          subtitle: "Profil & Format Nota",
          icon: Settings,
        },
      ],
    },
  ];

  // Filter groups and items based on role permissions
  const navGroups = rawNavGroups
    .map((grp) => ({
      ...grp,
      items: grp.items.filter((item) => isTabAllowedForRole(item.id, currentUser?.role))
    }))
    .filter((grp) => grp.items.length > 0);

  const handleNavClick = (id: string) => {
    setCurrentTab(id);
    setIsOpenMobile(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card border-r border-border select-none">
      {/* 1. Header Logo & Brand */}
      <div className={`p-4 border-b border-border flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
        <button
          onClick={() => {
            const firstAllowed = navGroups[0]?.items[0]?.id || "services";
            handleNavClick(firstAllowed);
          }}
          className="flex items-center space-x-3 text-left group focus:outline-hidden cursor-pointer"
        >
          <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Laptop className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-foreground truncate">
                  {settings.storeName || "ServisKu"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] text-muted-foreground truncate font-medium">
                  POS & Service Pro
                </span>
              </div>
            </div>
          )}
        </button>

        {/* Mobile close button */}
        <button
          onClick={() => setIsOpenMobile(false)}
          className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* 2. Quick Action Button (QR Scan / Servis Baru) */}
      {!isCollapsed && (
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={onOpenQRScanner}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/40 dark:to-indigo-950/40 text-blue-700 dark:text-blue-300 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/60 dark:hover:to-indigo-900/60 border border-blue-200/60 dark:border-blue-800/40 rounded-xl text-xs font-semibold shadow-2xs transition-all active:scale-98 cursor-pointer"
            title="Scan QR Code Tiket Servis"
          >
            <QrCode className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <span className="truncate">Scan QR Tiket Servis</span>
          </button>
        </div>
      )}

      {/* 3. Navigation List with Categories */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 scrollbar-thin">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-2 pb-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {group.group}
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full group relative flex items-center ${
                      isCollapsed ? "justify-center px-2" : "px-3"
                    } py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive
                          ? "text-white"
                          : "text-muted-foreground group-hover:text-foreground"
                      } ${!isCollapsed ? "mr-3" : ""}`}
                    />

                    {!isCollapsed && (
                      <div className="flex-1 text-left min-w-0">
                        <div className="truncate leading-tight">{item.label}</div>
                        <div
                          className={`text-[10px] truncate leading-tight mt-0.5 ${
                            isActive
                              ? "text-blue-100 font-normal"
                              : "text-muted-foreground/80 font-normal"
                          }`}
                        >
                          {item.subtitle}
                        </div>
                      </div>
                    )}

                    {!isCollapsed && item.badge !== undefined && (
                      <span
                        className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          isActive
                            ? "bg-white text-blue-600"
                            : item.badgeColor || "bg-blue-600 text-white"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {isCollapsed && item.badge !== undefined && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-card"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 4. Bottom User Profile & Theme Switcher */}
      <div className="p-3 border-t border-border space-y-2 bg-muted/20">
        {currentUser && !isCollapsed && (
          <div className="p-2.5 rounded-xl bg-card border border-border space-y-2">
            <div
              onClick={() => {
                if (isTabAllowedForRole("users", currentUser.role)) {
                  handleNavClick("users");
                } else if (onOpenSwitchUserModal) {
                  onOpenSwitchUserModal();
                }
              }}
              className="flex items-center justify-between cursor-pointer group"
              title="Info Pengguna & Hak Akses"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-foreground truncate group-hover:text-blue-600">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    @{currentUser.username}
                  </div>
                </div>
              </div>

              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                  getUserRoleConfig(currentUser.role).bg
                }`}
              >
                {getUserRoleConfig(currentUser.role).label}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-border/60 text-[10px]">
              <button
                type="button"
                onClick={() => {
                  if (onOpenSwitchUserModal) {
                    onOpenSwitchUserModal();
                  } else if (onLogout) {
                    onLogout();
                  }
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                title="Ganti Pengguna dengan Password"
              >
                <Lock className="h-3 w-3" />
                <span>Ganti User</span>
              </button>

              {onLogout && (
                <button
                  type="button"
                  id="btn-sidebar-logout"
                  onClick={onLogout}
                  className="text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 cursor-pointer"
                  title="Keluar dari Aplikasi"
                >
                  <LogOut className="h-3 w-3" />
                  <span>Keluar</span>
                </button>
              )}
            </div>
          </div>
        )}

        {currentUser && isCollapsed && (
          <button
            onClick={() => {
              if (onOpenSwitchUserModal) {
                onOpenSwitchUserModal();
              } else if (isTabAllowedForRole("users", currentUser.role)) {
                handleNavClick("users");
              }
            }}
            className="w-full flex justify-center py-1 cursor-pointer"
            title={`${currentUser.name} (${getUserRoleConfig(currentUser.role).label}) - Klik untuk Ganti Akun`}
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          </button>
        )}

        <div className="flex items-center justify-between gap-1">
          {/* Theme Toggle Button */}
          <button
            id="sidebar-theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            className={`flex items-center justify-center p-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer ${
              isCollapsed ? "w-full" : "flex-1"
            }`}
            title="Ganti Tema Gelap / Terang"
          >
            {darkMode ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : (
              <Moon className="h-4 w-4 text-blue-600" />
            )}
            {!isCollapsed && (
              <span className="ml-2 text-xs">
                {darkMode ? "Mode Terang" : "Mode Gelap"}
              </span>
            )}
          </button>

          {/* Collapse toggle button (desktop only) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex items-center justify-center p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title={isCollapsed ? "Buka Sidebar" : "Ciutkan Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside
        className={`hidden md:block shrink-0 h-screen sticky top-0 transition-all duration-300 z-30 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Overlay + Drawer) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpenMobile(false)}
          ></div>

          {/* Drawer container */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-250">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
