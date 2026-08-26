import React, { useState } from "react";
import { Settings, Store, Phone, MessageSquare, Shield, Save, CheckCircle } from "lucide-react";
import { StoreSettings } from "../types";

interface SettingsViewProps {
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings
}) => {
  const [formData, setFormData] = useState<StoreSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-blue-600" />
          <span>Pengaturan Profil Toko & Format Nota</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Konfigurasi identitas toko, nomor WhatsApp notifikasi, dan syarat garansi pada nota fisik.
        </p>
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
            <span>Catatan Kaki Struk & Ketentuan Garansi</span>
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
              Syarat & Ketentuan Garansi Servis (Tercetak di Nota)
            </label>
            <textarea
              rows={3}
              value={formData.warrantyTerms}
              onChange={(e) => setFormData({ ...formData, warrantyTerms: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
            ></textarea>
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
            className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-95"
          >
            <Save className="h-4 w-4" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </form>
    </div>
  );
};
