import React from "react";
import {
  Wrench,
  ShoppingCart,
  Package,
  LayoutDashboard,
  Search,
  Settings,
  ShieldCheck,
  Moon,
  Sun,
  Laptop,
  UserCheck,
  TrendingUp
} from "lucide-react";
import { StoreSettings } from "../types";

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  settings: StoreSettings;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  activeTicketsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  settings,
  darkMode,
  setDarkMode,
  activeTicketsCount
}) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      id: "services",
      label: "Servis",
      icon: Wrench,
      badge: activeTicketsCount > 0 ? activeTicketsCount : undefined
    },
    { id: "pos", label: "Kasir POS", icon: ShoppingCart },
    { id: "inventory", label: "Stok", icon: Package },
    { id: "customers", label: "Pelanggan", icon: UserCheck },
    { id: "reports", label: "Laba/Rugi", icon: TrendingUp },
    { id: "tracking", label: "Cek Servis", icon: Search },
    { id: "settings", label: "Pengaturan", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-b border-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Store Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab("dashboard")}>
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50">
                  {settings.storeName || "ServisKu"}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  POS & Service
                </span>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block truncate max-w-[240px]">
                {settings.tagline || "Solusi Servis Komputer & Laptop"}
              </p>
            </div>
          </div>

          {/* Nav Items Desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setCurrentTab(item.id)}
                  className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 font-semibold"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-xs font-bold bg-amber-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            <button
              id="btn-public-track-quick"
              onClick={() => setCurrentTab("tracking")}
              title="Portal Cek Garansi & Status Servis Pelanggan"
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cek Status</span>
            </button>

            <button
              id="btn-toggle-theme"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Ganti Tema Gelap / Terang"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navbar */}
      <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-border bg-zinc-50/50 dark:bg-zinc-900/50 gap-1.5 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium shrink-0 transition-colors ${
                isActive
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-border"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className={`px-1 rounded-full text-[10px] ${isActive ? "bg-white text-blue-600" : "bg-amber-500 text-white"}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
