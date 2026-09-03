import React, { useState, useRef } from "react";
import { 
  Settings, 
  Store, 
  Phone, 
  Shield, 
  Save, 
  CheckCircle, 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  Globe, 
  Server, 
  HardDrive,
  Info,
  Check
} from "lucide-react";
import { StoreSettings } from "../types";
import { exportDatabaseBackup } from "../lib/storage";
import { toast } from "sonner";

interface SettingsViewProps {
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => void;
  onRestoreBackup?: (jsonString: string) => boolean;
  onResetDefaultData?: () => void;
  counts?: {
    tickets: number;
    products: number;
    transactions: number;
    users: number;
  };
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onRestoreBackup,
  onResetDefaultData,
  counts = { tickets: 0, products: 0, transactions: 0, users: 0 }
}) => {
  const [formData, setFormData] = useState<StoreSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [showVercelGuide, setShowVercelGuide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && onRestoreBackup) {
        const success = onRestoreBackup(content);
        if (success) {
          toast.success("Database berhasil dipulihkan dari file backup!");
        } else {
          toast.error("Format file backup tidak valid!");
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-blue-600" />
            <span>Pengaturan Aplikasi & Database</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola profil toko, format nota, penyimpanan data persisten, dan konfigurasi online Vercel.
          </p>
        </div>

        <button
          onClick={() => setShowVercelGuide(!showVercelGuide)}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 text-white rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition-all cursor-pointer"
        >
          <Globe className="h-4 w-4 text-emerald-400" />
          <span>{showVercelGuide ? "Tutup Panduan Vercel" : "🚀 Panduan Online Vercel"}</span>
        </button>
      </div>

      {/* Vercel Deployment Guide Banner */}
      {showVercelGuide && (
        <div className="bg-slate-950 text-slate-100 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                ▲
              </div>
              <span className="font-bold text-sm text-white">Panduan Deploy Aplikasi ke Vercel (Online 24 Jam Gratis)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
              Ready for Vercel
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">1</span>
                <span>Export / Push ke GitHub</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Download project atau push kode repositori ini ke akun GitHub Anda.
              </p>
            </div>

            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">2</span>
                <span>Import di Vercel.com</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Buka <strong className="text-white">vercel.com</strong>, klik <em>Add New Project</em> ➔ Import repo GitHub Anda. Konfigurasi <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">vercel.json</code> sudah otomatis siap pakai!
              </p>
            </div>

            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">3</span>
                <span>Langsung Online & Siap Pakai</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Klik tombol <strong className="text-white">Deploy</strong>. Dalam 1 menit, domain online (misal: <em>servisku.vercel.app</em>) sudah aktif dengan penyimpanan persisten anti-hilang!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Database & Data Persistence Status */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <span>Penyimpanan Data Persisten (Anti-Hilang)</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 text-[11px] font-semibold flex items-center gap-1">
                  <Check className="h-3 w-3" /> Auto-Save Aktif
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Data tiket servis, inventaris sparepart, kasir POS, dan akun staf tersimpan aman di sistem dan tidak akan hilang saat logout atau ditutup.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                exportDatabaseBackup();
                toast.success("File cadangan database berhasil diunduh!");
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Ekspor Backup (.JSON)</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5 text-blue-600" />
              <span>Impor / Pulihkan</span>
            </button>
          </div>
        </div>

        {/* Database Records Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
          <div className="bg-muted/40 p-3 rounded-xl border border-border">
            <span className="text-muted-foreground block text-[11px]">Tiket Servis Tersimpan</span>
            <span className="text-lg font-bold text-foreground font-mono">{counts.tickets} Tiket</span>
          </div>
          <div className="bg-muted/40 p-3 rounded-xl border border-border">
            <span className="text-muted-foreground block text-[11px]">Item Produk & Sparepart</span>
            <span className="text-lg font-bold text-foreground font-mono">{counts.products} Item</span>
          </div>
          <div className="bg-muted/40 p-3 rounded-xl border border-border">
            <span className="text-muted-foreground block text-[11px]">Transaksi Kasir POS</span>
            <span className="text-lg font-bold text-foreground font-mono">{counts.transactions} Transaksi</span>
          </div>
          <div className="bg-muted/40 p-3 rounded-xl border border-border">
            <span className="text-muted-foreground block text-[11px]">Akun Staf & Teknisi</span>
            <span className="text-lg font-bold text-foreground font-mono">{counts.users} Akun</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-5 text-sm">
        {/* Store Info */}
        <div className="space-y-4">
          <h3 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5 text-blue-600">
            <Store className="h-4 w-4" />
            <span>Identitas Toko / Bengkel</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Nama Toko / Service Center *
              </label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Slogan / Tagline
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Alamat Lengkap Toko *
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5 text-blue-600">
            <Phone className="h-4 w-4" />
            <span>Kontak & WhatsApp Notifikasi</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Nomor Telepon Toko
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Nomor WhatsApp Toko (Format: 62812...) *
              </label>
              <input
                type="tel"
                required
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Receipt & Warranty Notes */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5 text-blue-600">
            <Shield className="h-4 w-4" />
            <span>Catatan Kaki Struk & Ketentuan Garansi (Nota 21cm x 15cm)</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Pesan Footer Struk Kasir / Tanda Terima
            </label>
            <input
              type="text"
              value={formData.receiptFooter}
              onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Syarat & Ketentuan Garansi Servis (Tercetak di Nota 21x15cm)
            </label>
            <textarea
              rows={3}
              value={formData.warrantyTerms}
              onChange={(e) => setFormData({ ...formData, warrantyTerms: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Ukuran Default Printer Struk Thermal Kasir
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  (formData.defaultThermalSize || "58mm") === "58mm"
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200"
                    : "border-border hover:bg-muted/40 text-foreground"
                }`}
              >
                <input
                  type="radio"
                  name="defaultThermalSize"
                  value="58mm"
                  checked={(formData.defaultThermalSize || "58mm") === "58mm"}
                  onChange={() => setFormData({ ...formData, defaultThermalSize: "58mm" })}
                  className="mt-1"
                />
                <div>
                  <div className="font-bold text-xs">Roll 58mm (Mini / Bluetooth)</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Lebar cetak ~48mm-50mm. Cocok untuk printer bluetooth kasir portable, Panda, Eppos, dll.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  formData.defaultThermalSize === "80mm"
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200"
                    : "border-border hover:bg-muted/40 text-foreground"
                }`}
              >
                <input
                  type="radio"
                  name="defaultThermalSize"
                  value="80mm"
                  checked={formData.defaultThermalSize === "80mm"}
                  onChange={() => setFormData({ ...formData, defaultThermalSize: "80mm" })}
                  className="mt-1"
                />
                <div>
                  <div className="font-bold text-xs">Roll 80mm (Standar POS Desktop)</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Lebar cetak ~72mm-74mm. Cocok untuk Epson TM-T82, Xprinter 80, Iware 80mm, dll.
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          {isSaved ? (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle className="h-4 w-4" /> Pengaturan berhasil disimpan!
            </span>
          ) : (
            <div></div>
          )}

          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </form>
    </div>
  );
};
