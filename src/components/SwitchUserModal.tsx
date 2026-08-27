import React, { useState } from "react";
import {
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  LogOut,
  X,
  Shield,
  ArrowRight
} from "lucide-react";
import { User } from "../types";
import { getUserRoleConfig } from "../lib/utils";

interface SwitchUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User;
  onSwitchUser: (user: User) => void;
  onLogout: () => void;
  targetUserInitial?: User | null;
}

export const SwitchUserModal: React.FC<SwitchUserModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onSwitchUser,
  onLogout,
  targetUserInitial
}) => {
  const [selectedUser, setSelectedUser] = useState<User>(() => {
    return targetUserInitial || users.find((u) => u.id !== currentUser.id) || currentUser;
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Sync when initial target user changes
  React.useEffect(() => {
    if (targetUserInitial) {
      setSelectedUser(targetUserInitial);
      setPassword("");
      setErrorMessage("");
    }
  }, [targetUserInitial]);

  if (!isOpen) return null;

  const handleSelectUser = (u: User) => {
    setSelectedUser(u);
    setPassword("");
    setErrorMessage("");
  };

  const handleConfirmSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (selectedUser.id === currentUser.id) {
      onClose();
      return;
    }

    if (selectedUser.status === "inactive") {
      setErrorMessage("Akun pengguna ini berstatus nonaktif.");
      return;
    }

    const cleanPass = password.trim();
    if (!cleanPass) {
      setErrorMessage("Silakan masukkan Password atau PIN akses akun ini.");
      return;
    }

    const registeredPass = selectedUser.password || selectedUser.pin || "password123";
    const registeredPin = selectedUser.pin || selectedUser.password || "123456";

    const isMatch =
      cleanPass === registeredPass ||
      cleanPass === registeredPin ||
      (cleanPass === "123456" && !selectedUser.password && !selectedUser.pin);

    if (!isMatch) {
      setErrorMessage(`Password atau PIN untuk akun "${selectedUser.name}" tidak sesuai.`);
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      onSwitchUser(selectedUser);
      setIsLoading(false);
      onClose();
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-foreground relative">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Ganti Akun / Pengguna
              </h2>
              <p className="text-xs text-muted-foreground">
                Wajib verifikasi Password / PIN akun yang dituju
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List of Users to Pick */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Pilih Akun Tujuan:
          </label>

          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
            {users.map((u) => {
              const isSelected = selectedUser.id === u.id;
              const isCurrent = currentUser.id === u.id;
              const roleCfg = getUserRoleConfig(u.role);

              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleSelectUser(u)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all text-left ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-foreground ring-2 ring-blue-400/30 font-semibold"
                      : "border-border hover:bg-muted/60 text-foreground"
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold truncate">{u.name}</span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-muted font-normal text-muted-foreground">
                            (Saat Ini)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        @{u.username}
                      </div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${roleCfg.bg}`}>
                    {roleCfg.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Password / PIN Form */}
        <form onSubmit={handleConfirmSwitch} className="space-y-3.5 pt-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-foreground">
                <Lock className="h-3.5 w-3.5 text-blue-600" />
                <span>Password / PIN Akun: <strong>{selectedUser.name}</strong></span>
              </span>
              <span className="text-[10px] text-muted-foreground">
                ({getUserRoleConfig(selectedUser.role).label})
              </span>
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoFocus
                placeholder={`Masukkan Password/PIN ${selectedUser.name}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 bg-muted/40 border border-input rounded-xl text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                title={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Perpindahan hak akses akun membutuhkan otentikasi kata sandi / PIN yang valid.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2 border-t border-border">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-70"
            >
              <span>{isLoading ? "Memverifikasi..." : `Masuk sebagai ${selectedUser.name.split(" ")[0]}`}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-muted-foreground hover:text-foreground font-medium"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold flex items-center gap-1"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Keluar / Logout ke Layar Utama</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
