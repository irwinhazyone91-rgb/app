import { UserRole } from "../types";

export interface RolePermission {
  role: UserRole;
  label: string;
  allowedTabs: string[];
  defaultTab: string;
  canViewDashboardFinancials: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
  canDeleteTransactions: boolean;
  canDeleteServiceTickets: boolean;
  canEditProductCostPrice: boolean;
  canDeleteProducts: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermission> = {
  owner: {
    role: "owner",
    label: "Pemilik Toko",
    allowedTabs: [
      "dashboard",
      "services",
      "pos",
      "transactions",
      "inventory",
      "customers",
      "reports",
      "tracking",
      "users",
      "settings"
    ],
    defaultTab: "dashboard",
    canViewDashboardFinancials: true,
    canManageUsers: true,
    canManageSettings: true,
    canDeleteTransactions: true,
    canDeleteServiceTickets: true,
    canEditProductCostPrice: true,
    canDeleteProducts: true
  },
  admin: {
    role: "admin",
    label: "Admin Toko",
    allowedTabs: [
      "dashboard",
      "services",
      "pos",
      "transactions",
      "inventory",
      "customers",
      "reports",
      "tracking",
      "users",
      "settings"
    ],
    defaultTab: "dashboard",
    canViewDashboardFinancials: true,
    canManageUsers: true,
    canManageSettings: true,
    canDeleteTransactions: true,
    canDeleteServiceTickets: true,
    canEditProductCostPrice: true,
    canDeleteProducts: true
  },
  technician: {
    role: "technician",
    label: "Teknisi Servis",
    allowedTabs: ["services", "inventory", "customers", "pos", "transactions", "tracking"],
    defaultTab: "services",
    canViewDashboardFinancials: false,
    canManageUsers: false,
    canManageSettings: false,
    canDeleteTransactions: false,
    canDeleteServiceTickets: false,
    canEditProductCostPrice: false,
    canDeleteProducts: false
  },
  cashier: {
    role: "cashier",
    label: "Kasir POS",
    allowedTabs: ["pos", "transactions", "customers", "services", "inventory", "tracking"],
    defaultTab: "pos",
    canViewDashboardFinancials: false,
    canManageUsers: false,
    canManageSettings: false,
    canDeleteTransactions: false,
    canDeleteServiceTickets: false,
    canEditProductCostPrice: false,
    canDeleteProducts: false
  }
};

export function isTabAllowedForRole(tabId: string, role?: UserRole): boolean {
  if (!role) return false;
  const perm = ROLE_PERMISSIONS[role];
  if (!perm) return false;
  return perm.allowedTabs.includes(tabId);
}

export function getDefaultTabForRole(role?: UserRole): string {
  if (!role) return "dashboard";
  const perm = ROLE_PERMISSIONS[role];
  return perm?.defaultTab || "services";
}
