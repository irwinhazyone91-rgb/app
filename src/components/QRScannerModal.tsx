import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { QrCode, X, Camera, AlertCircle } from "lucide-react";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Helper to extract ticket or invoice code from URL or raw text
  const cleanScannedCode = (raw: string) => {
    const trimmed = raw.trim();
    if (
      trimmed.includes("track=") ||
      trimmed.includes("invoice=") ||
      trimmed.includes("inv=") ||
      trimmed.includes("ticket=") ||
      trimmed.includes("garansi=")
    ) {
      try {
        const url = new URL(trimmed.startsWith("http") ? trimmed : `https://dummy.com/${trimmed}`);
        const code =
          url.searchParams.get("track") ||
          url.searchParams.get("invoice") ||
          url.searchParams.get("inv") ||
          url.searchParams.get("ticket") ||
          url.searchParams.get("garansi");
        if (code) return code.trim();

        // Check hash parameters if any
        if (url.hash) {
          const hashParams = new URLSearchParams(url.hash.replace(/^#\/?/, ""));
          const hashCode =
            hashParams.get("track") ||
            hashParams.get("invoice") ||
            hashParams.get("inv") ||
            hashParams.get("ticket") ||
            hashParams.get("garansi");
          if (hashCode) return hashCode.trim();
        }
      } catch (e) {}
    }
    return trimmed;
  };

  useEffect(() => {
    if (!isOpen) return;

    const qrRegionId = "html5qr-code-full-region";

    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode(qrRegionId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            const parsed = cleanScannedCode(decodedText);
            // Success callback
            html5QrCode.stop().then(() => {
              onScanSuccess(parsed);
              onClose();
            }).catch(() => {
              onScanSuccess(parsed);
              onClose();
            });
          },
          (errorMessage) => {
            // Ignore normal scanning frame errors
          }
        );
      } catch (err: any) {
        console.warn("Camera scan error:", err);
        setErrorMessage("Kamera tidak dapat diakses atau izin ditolak. Anda bisa memasukkan kode secara manual di bawah.");
      }
    };

    // Small delay to ensure DOM element is mounted
    const timer = setTimeout(() => {
      startScanner();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const parsed = cleanScannedCode(manualCode.trim());
    onScanSuccess(parsed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center space-x-2">
            <QrCode className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-foreground text-sm">Scan QR Code Tiket Servis</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
          >
            ✕
          </button>
        </div>

        {/* Video stream container */}
        <div className="relative overflow-hidden rounded-xl bg-zinc-900 border border-border flex items-center justify-center min-h-[260px]">
          <div id="html5qr-code-full-region" className="w-full"></div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2 border border-rose-200 dark:border-rose-900">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Fallback Manual Input */}
        <form onSubmit={handleManualSubmit} className="pt-2 border-t border-border space-y-2 text-xs">
          <label className="block font-semibold text-foreground">
            Atau Ketik Nomor Tiket Servis:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Contoh: SRV-202508-001"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 px-3 py-2 bg-muted/40 border border-input rounded-lg font-mono text-xs"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
            >
              Cari
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
