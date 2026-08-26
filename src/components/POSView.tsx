import React, { useState } from "react";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  CreditCard,
  QrCode,
  Banknote,
  Receipt,
  User,
  Phone,
  Wrench,
  Sparkles,
  ArrowRight,
  Printer,
  FileText
} from "lucide-react";
import { Product, CartItem, ServiceTicket, Transaction } from "../types";
import { formatRupiah, formatDateIndo } from "../lib/utils";

interface POSViewProps {
  products: Product[];
  readyTickets: ServiceTicket[];
  onProcessTransaction: (txData: {
    customerName: string;
    customerPhone: string;
    items: CartItem[];
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    paymentMethod: "cash" | "qris" | "transfer";
    amountPaid: number;
    change: number;
    notes?: string;
  }) => Promise<Transaction | void>;
  onPrintTransaction: (tx: Transaction) => void;
  recentTransactions: Transaction[];
  preloadedTicket?: ServiceTicket | null;
  onClearPreloadedTicket?: () => void;
}

export const POSView: React.FC<POSViewProps> = ({
  products,
  readyTickets,
  onProcessTransaction,
  onPrintTransaction,
  recentTransactions,
  preloadedTicket,
  onClearPreloadedTicket
}) => {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris" | "transfer">("cash");
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // Handle preloaded ticket from Service view
  React.useEffect(() => {
    if (preloadedTicket) {
      const remaining = Math.max(
        0,
        (preloadedTicket.finalCost || preloadedTicket.estimatedCost) - preloadedTicket.downPayment
      );
      setCustomerName(preloadedTicket.customerName);
      setCustomerPhone(preloadedTicket.customerPhone);

      // Add to cart
      setCart([
        {
          id: `srv-item-${preloadedTicket.id}`,
          serviceTicketId: preloadedTicket.id,
          name: `Pelunasan Servis #${preloadedTicket.ticketNumber} (${preloadedTicket.deviceBrandModel})`,
          price: remaining,
          qty: 1,
          subtotal: remaining,
          isService: true
        }
      ]);
      setAmountPaid(remaining);
      if (onClearPreloadedTicket) onClearPreloadedTicket();
    }
  }, [preloadedTicket]);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCat = activeCategory === "all" || p.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const addToCart = (product: Product) => {
    const existingIndex = cart.findIndex((item) => item.productId === product.id);
    if (existingIndex !== -1) {
      const updated = [...cart];
      updated[existingIndex].qty += 1;
      updated[existingIndex].subtotal = updated[existingIndex].qty * updated[existingIndex].price;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          id: `cart-${Date.now()}-${product.id}`,
          productId: product.id,
          name: product.name,
          price: product.sellPrice,
          qty: 1,
          subtotal: product.sellPrice,
          isService: product.category === "jasa"
        }
      ]);
    }
  };

  const addServiceTicketToCart = (ticket: ServiceTicket) => {
    const remaining = Math.max(
      0,
      (ticket.finalCost || ticket.estimatedCost) - ticket.downPayment
    );
    const existing = cart.find((item) => item.serviceTicketId === ticket.id);
    if (existing) return;

    setCustomerName(ticket.customerName);
    setCustomerPhone(ticket.customerPhone);

    setCart([
      ...cart,
      {
        id: `srv-item-${ticket.id}`,
        serviceTicketId: ticket.id,
        name: `Pelunasan Servis #${ticket.ticketNumber} (${ticket.deviceBrandModel})`,
        price: remaining,
        qty: 1,
        subtotal: remaining,
        isService: true
      }
    ]);
  };

  const updateQty = (index: number, delta: number) => {
    const updated = [...cart];
    const newQty = updated[index].qty + delta;
    if (newQty <= 0) {
      setCart(cart.filter((_, i) => i !== index));
    } else {
      updated[index].qty = newQty;
      updated[index].subtotal = newQty * updated[index].price;
      setCart(updated);
    }
  };

  const removeItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setAmountPaid(0);
    setNotes("");
    setCustomerName("");
    setCustomerPhone("");
  };

  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const total = Math.max(0, subtotal - discount);
  const change = Math.max(0, (amountPaid || 0) - total);

  // Quick cash amount presets
  const setExactAmount = () => setAmountPaid(total);
  const addCashPreset = (val: number) => setAmountPaid(val);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (paymentMethod === "cash" && amountPaid < total) {
      alert("Nominal pembayaran tunai kurang dari total tagihan.");
      return;
    }

    setIsProcessing(true);
    try {
      const finalPaid = paymentMethod === "cash" ? amountPaid : total;
      const finalChange = paymentMethod === "cash" ? change : 0;

      const createdTx = await onProcessTransaction({
        customerName: customerName.trim() || "Pelanggan Umum",
        customerPhone: customerPhone.trim() || "-",
        items: cart,
        subtotal,
        discount,
        tax: 0,
        total,
        paymentMethod,
        amountPaid: finalPaid,
        change: finalChange,
        notes
      });

      if (createdTx) {
        onPrintTransaction(createdTx);
      }
      clearCart();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            <span>Kasir POS & Transaksi Penjualan</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Transaksi cepat untuk penjualan spare part, jasa servis, dan pelunasan unit servis.
          </p>
        </div>

        <button
          onClick={() => setShowHistoryModal(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-card border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
        >
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span>Riwayat Transaksi</span>
        </button>
      </div>

      {/* Main Grid: Products Catalog on Left, Checkout Cart on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Product Selector (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Quick Notice for Ready Services */}
          {readyTickets.length > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Wrench className="h-4 w-4" />
                  Unit Servis Siap Diambil ({readyTickets.length} Unit)
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Klik untuk masukkan ke kasir
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {readyTickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => addServiceTicketToCart(t)}
                    className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs text-left shrink-0 hover:bg-emerald-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <div className="font-bold text-emerald-700 dark:text-emerald-400">
                      {t.ticketNumber}
                    </div>
                    <div className="text-[11px] text-zinc-600 dark:text-zinc-300 truncate max-w-[140px]">
                      {t.customerName} ({t.deviceBrandModel})
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search & Category Filter */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-xs space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari spare part, SSD, RAM, Jasa Install..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-muted/40 border border-input rounded-lg"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {[
                { id: "all", label: "Semua Kategori" },
                { id: "komponen_pc", label: "Komponen PC" },
                { id: "part_laptop", label: "Part Laptop" },
                { id: "aksesoris", label: "Aksesoris" },
                { id: "jasa", label: "Jasa & Servis" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    activeCategory === cat.id
                      ? "bg-blue-600 text-white"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[560px] overflow-y-auto pr-1">
            {filteredProducts.map((product) => {
              const isLowStock = product.category !== "jasa" && product.stock <= product.minStock;
              return (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-card border border-border rounded-xl p-3 shadow-xs hover:border-blue-500 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span className="font-mono">{product.code}</span>
                      {product.category !== "jasa" ? (
                        <span className={`font-semibold ${isLowStock ? "text-rose-500" : "text-emerald-600"}`}>
                          Stok: {product.stock}
                        </span>
                      ) : (
                        <span className="text-blue-500 font-semibold">Jasa</span>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-foreground line-clamp-2">
                      {product.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between">
                    <span className="font-bold text-xs text-blue-600 dark:text-blue-400">
                      {formatRupiah(product.sellPrice)}
                    </span>
                    <button className="h-6 w-6 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs hover:bg-blue-600 hover:text-white transition-colors">
                      +
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-10 text-center text-muted-foreground text-xs">
                Tidak ada produk ditemukan.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Checkout Cart & Payment (5 cols) */}
        <div className="lg:col-span-5 bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                <h2 className="font-bold text-foreground text-sm">Keranjang Transaksi</h2>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-500 hover:text-rose-600 font-medium"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Customer Inputs */}
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Nama Pelanggan"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-7 pr-2 py-1.5 bg-muted/40 border border-input rounded-lg"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="tel"
                  placeholder="No. WhatsApp"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-7 pr-2 py-1.5 bg-muted/40 border border-input rounded-lg"
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="mt-3.5 space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {cart.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border text-xs"
                >
                  <div className="flex-1 pr-2">
                    <div className="font-medium text-foreground line-clamp-1">{item.name}</div>
                    <div className="text-muted-foreground text-[11px]">
                      {formatRupiah(item.price)} x {item.qty} = <span className="font-bold text-foreground">{formatRupiah(item.subtotal)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => updateQty(idx, -1)}
                      className="p-1 rounded-md bg-muted hover:bg-muted/80 text-foreground"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center font-bold">{item.qty}</span>
                    <button
                      onClick={() => updateQty(idx, 1)}
                      className="p-1 rounded-md bg-muted hover:bg-muted/80 text-foreground"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeItem(idx)}
                      className="p-1 rounded-md text-rose-500 hover:text-rose-700 ml-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="py-8 text-center text-muted-foreground text-xs">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-1 opacity-40" />
                  <span>Keranjang kosong. Pilih barang dari katalog sebelah kiri.</span>
                </div>
              )}
            </div>
          </div>

          {/* Pricing & Checkout Form */}
          <div className="pt-3 border-t border-border space-y-3 text-xs">
            {/* Calculation summary */}
            <div className="space-y-1.5 text-muted-foreground">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium text-foreground">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Diskon (Rp):</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={discount || ""}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="0"
                  className="w-24 px-2 py-0.5 text-right bg-muted/40 border border-input rounded-md"
                />
              </div>
              <div className="flex justify-between text-sm font-bold text-foreground pt-1 border-t border-border">
                <span>Total Bayar:</span>
                <span className="text-base text-blue-600 dark:text-blue-400">{formatRupiah(total)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block font-semibold text-foreground mb-1">Metode Pembayaran:</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "cash", label: "Tunai", icon: Banknote },
                  { id: "qris", label: "QRIS", icon: QrCode },
                  { id: "transfer", label: "Transfer", icon: CreditCard },
                ].map((pm) => {
                  const Icon = pm.icon;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(pm.id as any);
                        if (pm.id !== "cash") setAmountPaid(total);
                      }}
                      className={`py-2 px-2 rounded-lg font-medium flex items-center justify-center space-x-1.5 transition-colors ${
                        paymentMethod === pm.id
                          ? "bg-blue-600 text-white font-bold"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{pm.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Input & Change Helper */}
            {paymentMethod === "cash" && (
              <div className="space-y-2 bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Jumlah Uang Diterima:</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={amountPaid || ""}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    placeholder="0"
                    className="w-32 px-2 py-1 text-right font-bold text-sm bg-card border border-input rounded-lg"
                  />
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={setExactAmount}
                    className="px-2 py-0.5 bg-white dark:bg-zinc-800 border border-border rounded text-[11px] font-medium"
                  >
                    Uang Pas
                  </button>
                  {[50000, 100000, 200000, 500000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => addCashPreset(preset)}
                      className="px-2 py-0.5 bg-white dark:bg-zinc-800 border border-border rounded text-[11px]"
                    >
                      {formatRupiah(preset)}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between pt-1 border-t border-blue-200/50 dark:border-blue-900/50 text-xs">
                  <span className="text-muted-foreground">Kembalian:</span>
                  <span className={`font-bold text-sm ${change > 0 ? "text-emerald-600" : "text-foreground"}`}>
                    {formatRupiah(change)}
                  </span>
                </div>
              </div>
            )}

            {/* Submit Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{isProcessing ? "Memproses Transaksi..." : `Selesaikan & Cetak Struk (${formatRupiah(total)})`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: RIWAYAT TRANSAKSI TERAKHIR */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-foreground text-base">Riwayat Transaksi Penjualan</h3>
                <p className="text-xs text-muted-foreground">Daftar transaksi kasir & pelunasan servis terakhir.</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-xl bg-muted/30 border border-border flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-600">{tx.invoiceNumber}</span>
                      <span className="text-muted-foreground">• {formatDateIndo(tx.date)}</span>
                    </div>
                    <div className="font-medium text-foreground mt-0.5">
                      {tx.customerName} ({tx.items.length} item)
                    </div>
                    <div className="text-muted-foreground capitalize">
                      Metode: {tx.paymentMethod}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-foreground">{formatRupiah(tx.total)}</span>
                    <button
                      onClick={() => {
                        setShowHistoryModal(false);
                        onPrintTransaction(tx);
                      }}
                      className="p-1.5 rounded-lg bg-card border border-border hover:bg-muted text-foreground"
                      title="Cetak Ulang Struk"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {recentTransactions.length === 0 && (
                <div className="py-6 text-center text-muted-foreground text-xs">
                  Belum ada riwayat transaksi.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
