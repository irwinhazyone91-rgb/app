import React, { useState } from "react";
import {
  Users,
  UserCheck,
  UserPlus,
  Shield,
  Search,
  Filter,
  Edit,
  Trash2,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Wrench,
  ShoppingCart,
  ShieldAlert,
  Award,
  Crown,
  Key,
  MessageCircle,
  Check
} from "lucide-react";
import { User, UserRole } from "../types";
import { getUserRoleConfig, createWhatsAppUrl } from "../lib/utils";

interface UsersViewProps {
  users: User[];
  currentUser: User;
  setCurrentUser: (user: User) => void;
  onCreateUser: (userData: Partial<User>) => void;
  onUpdateUser: (id: string, updates: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  currentUser,
  setCurrentUser,
  onCreateUser,
  onUpdateUser,
  onDeleteUser
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<User>>({
    name: "",
    username: "",
    role: "technician",
    phone: "",
    email: "",
    status: "active",
    specialization: "",
    notes: ""
  });

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      (u.specialization && u.specialization.toLowerCase().includes(q));
    return matchesRole && matchesStatus && matchesSearch;
  });

  const openCreateModal = () => {
    setEditingUserId(null);
    setFormData({
      name: "",
      username: "",
      role: "technician",
      phone: "",
      email: "",
      status: "active",
      specialization: "",
      notes: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUserId(user.id);
    setFormData({
      name: user.name,
      username: user.username,
      role: user.role,
      phone: user.phone,
      email: user.email || "",
      status: user.status,
      specialization: user.specialization || "",
      notes: user.notes || ""
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUserId) {
      onUpdateUser(editingUserId, formData);
      if (currentUser.id === editingUserId) {
        setCurrentUser({ ...currentUser, ...formData } as User);
      }
    } else {
      onCreateUser(formData);
    }
    setIsModalOpen(false);
  };

  // Role counters
  const countOwner = users.filter((u) => u.role === "owner").length;
  const countAdmin = users.filter((u) => u.role === "admin").length;
  const countTech = users.filter((u) => u.role === "technician").length;
  const countCashier = users.filter((u) => u.role === "cashier").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            <span>Manajemen Pengguna & Tim</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola hak akses pengguna toko: Pemilik Toko, Admin, Teknisi, dan Kasir.
          </p>
        </div>

        <button
          id="btn-add-new-user"
          onClick={openCreateModal}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md active:scale-95"
        >
          <UserPlus className="h-4 w-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Active User Switcher Banner */}
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Pengguna Aktif Saat Ini
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    getUserRoleConfig(currentUser.role).bg
                  }`}
                >
                  {getUserRoleConfig(currentUser.role).label}
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground mt-0.5">
                {currentUser.name} <span className="text-xs font-normal text-muted-foreground">(@{currentUser.username})</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                {currentUser.specialization || getUserRoleConfig(currentUser.role).description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <span className="text-xs text-muted-foreground hidden lg:inline">Ganti Pengguna:</span>
            <div className="flex flex-wrap gap-1.5">
              {users.map((u) => {
                const isCurrent = currentUser.id === u.id;
                const roleCfg = getUserRoleConfig(u.role);
                return (
                  <button
                    key={u.id}
                    onClick={() => setCurrentUser(u)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isCurrent
                        ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/50"
                        : "bg-card hover:bg-muted text-foreground border border-border"
                    }`}
                  >
                    <span>{u.name.split(" ")[0]}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isCurrent ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                      {roleCfg.label}
                    </span>
                    {isCurrent && <Check className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Role Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Pemilik Toko</span>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600">
              <Crown className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{countOwner}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Owner & Direksi</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Admin Toko</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600">
              <Shield className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{countAdmin}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Operasional & Stok</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Teknisi Servis</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{countTech}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Hardware & Software</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Kasir POS</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{countCashier}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Kasir & Pelunasan</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama pengguna, username, no HP, atau keahlian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted/40 border border-input rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
          {[
            { id: "all", label: "Semua Peran" },
            { id: "owner", label: "Pemilik" },
            { id: "admin", label: "Admin" },
            { id: "technician", label: "Teknisi" },
            { id: "cashier", label: "Kasir" },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setRoleFilter(r.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                roleFilter === r.id
                  ? "bg-blue-600 text-white"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* User Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const roleCfg = getUserRoleConfig(user.role);
          const isCurrent = currentUser.id === user.id;

          return (
            <div
              key={user.id}
              className={`bg-card border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all ${
                isCurrent
                  ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10 dark:bg-blue-950/20"
                  : "border-border hover:border-blue-400/40 hover:shadow-md"
              }`}
            >
              <div>
                {/* Top Info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-foreground text-sm truncate flex items-center gap-1.5">
                        <span>{user.name}</span>
                        {isCurrent && (
                          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Sedang Aktif"></span>
                        )}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        @{user.username}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${roleCfg.bg}`}>
                    {roleCfg.label}
                  </span>
                </div>

                {/* Body Details */}
                <div className="mt-4 space-y-2 text-xs">
                  {user.specialization && (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/40 text-foreground font-medium">
                      <Award className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="truncate">{user.specialization}</span>
                    </div>
                  )}

                  <div className="space-y-1.5 pt-1 text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        <span>No. HP / WA:</span>
                      </span>
                      <span className="font-medium text-foreground">{user.phone}</span>
                    </div>

                    {user.email && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          <span>Email:</span>
                        </span>
                        <span className="font-medium text-foreground truncate max-w-[140px]">
                          {user.email}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span>Status Akun:</span>
                      <span
                        className={`font-semibold flex items-center gap-1 ${
                          user.status === "active" ? "text-emerald-600" : "text-zinc-500"
                        }`}
                      >
                        {user.status === "active" ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Aktif</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" />
                            <span>Nonaktif</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {user.notes && (
                    <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-border/50">
                      "{user.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-1.5">
                {!isCurrent ? (
                  <button
                    onClick={() => setCurrentUser(user)}
                    className="flex-1 py-1.5 px-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold rounded-xl text-xs transition-colors"
                  >
                    Gunakan Akun Ini
                  </button>
                ) : (
                  <span className="flex-1 py-1.5 px-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold rounded-xl text-xs text-center">
                    ✓ Akun Aktif
                  </span>
                )}

                <a
                  href={createWhatsAppUrl(user.phone, `Halo ${user.name}, ini dari koordinasi sistem ${roleCfg.label}.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100 transition-colors"
                  title="Hubungi WhatsApp"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </a>

                <button
                  onClick={() => openEditModal(user)}
                  className="p-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  title="Edit Pengguna"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() => onDeleteUser(user.id)}
                  disabled={user.role === "owner" && users.filter((u) => u.role === "owner").length <= 1}
                  className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Hapus Pengguna"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Permission Matrix Card */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <Key className="h-5 w-5 text-blue-600" />
          <h3 className="font-bold text-foreground text-sm">
            Panduan Hak Akses Peran Pengguna (Role Permission Matrix)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-2.5 px-3 font-semibold text-foreground">Modul & Wewenang</th>
                <th className="py-2.5 px-3 font-semibold text-purple-700 dark:text-purple-300">Pemilik Toko (Owner)</th>
                <th className="py-2.5 px-3 font-semibold text-blue-700 dark:text-blue-300">Admin Toko</th>
                <th className="py-2.5 px-3 font-semibold text-amber-700 dark:text-amber-300">Teknisi Servis</th>
                <th className="py-2.5 px-3 font-semibold text-emerald-700 dark:text-emerald-300">Kasir POS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-2.5 px-3 font-medium text-foreground">Dashboard & Laporan Omset Keuangan</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Akses Penuh</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Akses Penuh</td>
                <td className="py-2.5 px-3 text-muted-foreground">Ringkasan Servis</td>
                <td className="py-2.5 px-3 text-muted-foreground">Ringkasan Kasir</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-foreground">Penerimaan & Pembuatan SPK Servis</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Ya</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Ya (Utama)</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Ya</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Ya</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-foreground">Cetak Nota Continuous Form & Stiker 58mm</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Ya</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Ya</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Ya (Utama)</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Ya</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-foreground">Update Diagnosa & Penggantian Part Servis</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Ya</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Ya</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Ya (Utama)</td>
                <td className="py-2.5 px-3 text-zinc-400">✕ Terbatas</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-foreground">Kasir POS & Pelunasan Nota Servis</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Ya</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Ya</td>
                <td className="py-2.5 px-3 text-zinc-400">✕ Terbatas</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Ya (Utama)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-foreground">Kelola Stok & Harga Modal Sparepart</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Ya (Harga Modal)</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Ya</td>
                <td className="py-2.5 px-3 text-muted-foreground">Lihat Stok</td>
                <td className="py-2.5 px-3 text-muted-foreground">Lihat Stok/Harga Jual</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-foreground">Kelola Pengguna (Tambah/Edit Karyawan)</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Ya (Semua)</td>
                <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Ya</td>
                <td className="py-2.5 px-3 text-zinc-400">✕ Tidak</td>
                <td className="py-2.5 px-3 text-zinc-400">✕ Tidak</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: TAMBAH / EDIT PENGGUNA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-foreground">
                {editingUserId ? "Edit Profil Pengguna" : "Tambah Pengguna Baru"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rian Prasetyo"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/40 border border-input rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: rian_tech"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/40 border border-input rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Peran / Role Pengguna *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-muted/40 border border-input rounded-xl text-sm font-medium"
                  >
                    <option value="owner">Pemilik Toko (Owner)</option>
                    <option value="admin">Admin Toko</option>
                    <option value="technician">Teknisi Servis</option>
                    <option value="cashier">Kasir POS</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Status Akun
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-muted/40 border border-input rounded-xl text-sm"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    No. WhatsApp / HP *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/40 border border-input rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Email (Opsional)
                  </label>
                  <input
                    type="email"
                    placeholder="Contoh: user@servisku.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/40 border border-input rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Keahlian / Spesialisasi / Divisi
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Spesialis Motherboard, IC Power & Reballing"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/40 border border-input rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Catatan Tambahan
                </label>
                <input
                  type="text"
                  placeholder="Catatan penempatan shift / deskripsi tugas..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/40 border border-input rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end space-x-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
