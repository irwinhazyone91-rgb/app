import React, { useState } from "react";
import { toast } from "sonner";
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
  User as UserIcon,
  Phone,
  Wrench,
  Sparkles,
  Laptop,
  Cpu,
  ShieldCheck,
  Users,
  FileText,
  Printer,
  ChevronDown,
  LayoutGrid,
  Grid3X3,
  List,
  Tag,
  Boxes
} from "lucide-react";
import { Product, CartItem, ServiceTicket, Transaction, ProductCategory } from "../types";
import { formatRupiah, formatDateIndo } from "../lib/utils";

type POSViewMode = "grid" | "compact" | "list";

interface POSViewProps {
  products: Product[];
  readyTickets: ServiceTicket[];
  onProcessTransaction: (txData: {
    customerName: string;
    customerPhone: string;
    customerType?: "regular" | "reseller";
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
  onNavigateToHistory?: () => void;
}

export const POSView: React.FC<POSViewProps> = ({
  products,
  readyTickets,
  onProcessTransaction,
  onPrintTransaction,
  recentTransactions,
  preloadedTicket,
  onClearPreloadedTicket,
  onNavigateToHistory
}) => {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerType, setCustomerType] = useState<"regular" | "reseller">("regular");
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris" | "transfer">("cash");
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [posViewMode, setPosViewMode] = useState<POSViewMode>(() => {
    return (localStorage.getItem("pos_view_mode") as POSViewMode) || "grid";
  });

  const handleSetViewMode = (mode: POSViewMode) => {
    setPosViewMode(mode);
    localStorage.setItem("pos_view_mode", mode);
  };

  // Handle preloaded ticket from Service view
  React.useEffect(() => {
    if (preloadedTicket) {
      if (preloadedTicket.status === "completed") {
        toast.error(
          `Tiket servis #${preloadedTicket.ticketNumber} sudah berstatus LUNAS & SELESAI (Finish) dan tidak dapat dibayar lagi.`
        );
        if (onClearPreloadedTicket) onClearPreloadedTicket();
        return;
      }
      const remaining = Math.max(
        0,
        (preloadedTicket.finalCost || preloadedTicket.estimatedCost) - preloadedTicket.downPayment
      );
      setCustomerName(preloadedTicket.customerName);
      setCustomerPhone(preloadedTicket.customerPhone);

      // Add to cart if not already present
      const existing = cart.find((item) => item.serviceTicketId === preloadedTicket.id);
      if (!existing) {
        setCart([
          ...cart,
          {
            id: `srv-item-${preloadedTicket.id}`,
            serviceTicketId: preloadedTicket.id,
            name: `Pelunasan Servis #${preloadedTicket.ticketNumber} (${preloadedTicket.deviceBrandModel})`,
            price: remaining,
            regularPrice: remaining,
            resellerPrice: remaining,
            priceType: "regular",
            qty: 1,
            subtotal: remaining,
            isService: true,
            warrantyDays: preloadedTicket.warrantyDays || 14,
            specsSummary: `Unit: ${preloadedTicket.deviceBrandModel} | Keluhan: ${preloadedTicket.complaints}`
          }
        ]);
        setAmountPaid(remaining);
        toast.success(`Tiket servis #${preloadedTicket.ticketNumber} dimasukkan ke kasir.`);
      }
      if (onClearPreloadedTicket) onClearPreloadedTicket();
    }
  }, [preloadedTicket]);

  // When changing customerType, optionally update cart items to new pricing tier
  const handleCustomerTypeChange = (newType: "regular" | "reseller") => {
    setCustomerType(newType);
    if (cart.length > 0) {
      const updated = cart.map((item) => {
        if (item.isService) return item;
        const matchedProduct = products.find((p) => p.id === item.productId);
        if (!matchedProduct) return item;

        const effectivePrice =
          newType === "reseller" && matchedProduct.resellerPrice
            ? matchedProduct.resellerPrice
            : matchedProduct.sellPrice;

        return {
          ...item,
          price: effectivePrice,
          priceType: newType,
          subtotal: effectivePrice * item.qty
        };
      });
      setCart(updated);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCat = activeCategory === "all" || p.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      (p.processor && p.processor.toLowerCase().includes(q)) ||
      (p.ram && p.ram.toLowerCase().includes(q)) ||
      (p.storage && p.storage.toLowerCase().includes(q)) ||
      (p.graphics && p.graphics.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  const getProductSpecsSummary = (p: Product) => {
    const parts = [];
    if (p.processor) parts.push(`CPU: ${p.processor}`);
    if (p.ram) parts.push(`RAM: ${p.ram}`);
    if (p.storage) parts.push(`Storage: ${p.storage}`);
    if (p.graphics) parts.push(`VGA: ${p.graphics}`);
    if (p.screenSize) parts.push(`Layar: ${p.screenSize}`);
    return parts.join(" | ");
  };

  const addToCart = (product: Product) => {
    const activePrice =
      customerType === "reseller" && product.resellerPrice
        ? product.resellerPrice
        : product.sellPrice;

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
          price: activePrice,
          regularPrice: product.sellPrice,
          resellerPrice: product.resellerPrice || product.sellPrice,
          priceType: customerType,
          qty: 1,
          subtotal: activePrice,
          isService: product.category === "jasa",
          warrantyDays: product.warrantyDays || (product.category === "jasa" ? 7 : 30),
          specsSummary: getProductSpecsSummary(product),
          conditionGrade: product.conditionGrade
        }
      ]);
    }
  };

  const toggleItemPriceType = (index: number) => {
    const updated = [...cart];
    const item = updated[index];
    if (item.isService) return;

    const nextType: "regular" | "reseller" = item.priceType === "reseller" ? "regular" : "reseller";
    const nextPrice = nextType === "reseller" ? (item.resellerPrice || item.regularPrice || item.price) : (item.regularPrice || item.price);

    updated[index] = {
      ...item,
      priceType: nextType,
      price: nextPrice,
      subtotal: nextPrice * item.qty
    };
    setCart(updated);
  };

  const addServiceTicketToCart = (ticket: ServiceTicket) => {
    if (ticket.status === "completed") {
      toast.error(
        `Tiket servis #${ticket.ticketNumber} sudah berstatus LUNAS & SELESAI (Finish) dan tidak dapat dibayar lagi.`
      );
      return;
    }

    const existing = cart.find((item) => item.serviceTicketId === ticket.id);
    if (existing) {
      toast.info(`Tiket servis #${ticket.ticketNumber} sudah ada dalam keranjang kasir.`);
      return;
    }

    const remaining = Math.max(
      0,
      (ticket.finalCost || ticket.estimatedCost) - ticket.downPayment
    );

    setCustomerName(ticket.customerName);
    setCustomerPhone(ticket.customerPhone);

    setCart([
      ...cart,
      {
        id: `srv-item-${ticket.id}`,
        serviceTicketId: ticket.id,
        name: `Pelunasan Servis #${ticket.ticketNumber} (${ticket.deviceBrandModel})`,
        price: remaining,
        regularPrice: remaining,
        resellerPrice: remaining,
        priceType: "regular",
        qty: 1,
        subtotal: remaining,
        isService: true,
        warrantyDays: ticket.warrantyDays || 14,
        specsSummary: `Unit: ${ticket.deviceBrandModel} | Keluhan: ${ticket.complaints}`
      }
    ]);
    toast.success(`Tiket servis #${ticket.ticketNumber} berhasil ditambahkan ke keranjang.`);
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
        customerType,
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

  const getWarrantyLabel = (days?: number) => {
    if (!days || days <= 0) return "Tanpa Garansi";
    if (days >= 730) return `${Math.round(days / 365)} Thn`;
    if (days >= 365) return "1 Tahun";
    if (days % 30 === 0) return `${days / 30} Bulan`;
    return `${days} Hari`;
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
            Penjualan Laptop Baru & Bekas lengkap dengan spesifikasi, sparepart, serta tarif Konsumen Biasa / Reseller.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (onNavigateToHistory) {
                onNavigateToHistory();
              } else {
                setShowHistoryModal(true);
              }
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-card border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs"
          >
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Riwayat Transaksi</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Products Catalog on Left, Checkout Cart on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Product Selector (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Pricing Tier Selector (Konsumen Biasa vs Reseller) */}
          <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Pilih Tipe Harga Pelanggan:</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleCustomerTypeChange("regular")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  customerType === "regular"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Konsumen Biasa</span>
              </button>

              <button
                type="button"
                onClick={() => handleCustomerTypeChange("reseller")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  customerType === "reseller"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Reseller / Mitra</span>
              </button>
            </div>
          </div>

          {/* Quick Notice for Ready Services (Siap Diambil & Belum Dibayar) */}
          {readyTickets.filter((t) => t.status === "ready").length > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Wrench className="h-4 w-4" />
                  Unit Servis Siap Diambil & Pelunasan (
                  {readyTickets.filter((t) => t.status === "ready").length} Unit)
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Klik untuk masukkan ke kasir
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {readyTickets
                  .filter((t) => t.status === "ready")
                  .map((t) => {
                    const inCart = cart.some((c) => c.serviceTicketId === t.id);
                    return (
                      <button
                        key={t.id}
                        onClick={() => addServiceTicketToCart(t)}
                        className={`px-3 py-1.5 border rounded-lg text-xs text-left shrink-0 transition-all ${
                          inCart
                            ? "bg-emerald-100 dark:bg-emerald-900/60 border-emerald-500 font-semibold"
                            : "bg-white dark:bg-zinc-800 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-zinc-700"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">
                            {t.ticketNumber}
                          </span>
                          {inCart && (
                            <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-xs">
                              Di Kasir
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-300 truncate max-w-[150px]">
                          {t.customerName} ({t.deviceBrandModel})
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Search, Category Filter & Display Mode Switcher */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari Nama Laptop, Kode (LTP-...), Core i5/Ryzen, RAM, SSD, atau Jasa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-muted/40 border border-input rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Layout Switcher */}
              <div className="flex items-center self-end sm:self-auto bg-muted/50 p-1 rounded-xl border border-border shrink-0">
                <button
                  type="button"
                  title="Tampilan Grid Detail"
                  onClick={() => handleSetViewMode("grid")}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    posViewMode === "grid"
                      ? "bg-card text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kartu Detail</span>
                </button>

                <button
                  type="button"
                  title="Tampilan Ubin Cepat POS (Touch Keypad)"
                  onClick={() => handleSetViewMode("compact")}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    posViewMode === "compact"
                      ? "bg-card text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ubin POS</span>
                </button>

                <button
                  type="button"
                  title="Tampilan Daftar / Tabel Barcode"
                  onClick={() => handleSetViewMode("list")}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    posViewMode === "list"
                      ? "bg-card text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Daftar Baris</span>
                </button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {[
                { id: "all", label: "Semua Item" },
                { id: "laptop_baru", label: "✨ Laptop Baru" },
                { id: "laptop_bekas", label: "🔄 Laptop Bekas" },
                { id: "komponen_pc", label: "Komponen PC" },
                { id: "part_laptop", label: "Part Laptop" },
                { id: "aksesoris", label: "Aksesoris" },
                { id: "jasa", label: "Jasa & Servis" }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    activeCategory === cat.id
                      ? "bg-blue-600 text-white shadow-xs font-bold"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* PRODUCT CATALOG CONTAINER (3 MODES) */}
          <div className="max-h-[580px] overflow-y-auto pr-1">
            {/* MODE 1: DETAIL CARDS GRID */}
            {posViewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredProducts.map((product) => {
                  const isLowStock = product.category !== "jasa" && product.stock <= product.minStock;
                  const isLaptop = product.category === "laptop_baru" || product.category === "laptop_bekas";
                  const activePrice =
                    customerType === "reseller" && product.resellerPrice
                      ? product.resellerPrice
                      : product.sellPrice;
                  const hasResellerDiscount =
                    product.resellerPrice && product.resellerPrice < product.sellPrice;

                  return (
                    <div
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="bg-card border border-border rounded-xl p-3.5 shadow-xs hover:border-blue-500 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Top Row: Category badge, Stock, Warranty */}
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                              {product.code}
                            </span>
                            {product.category === "laptop_baru" && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                ✨ Baru
                              </span>
                            )}
                            {product.category === "laptop_bekas" && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                🔄 Bekas
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {product.warrantyDays > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                                <ShieldCheck className="w-3 h-3" />
                                {getWarrantyLabel(product.warrantyDays)}
                              </span>
                            )}
                            {product.category !== "jasa" ? (
                              <span
                                className={`font-bold text-[10px] ${
                                  isLowStock ? "text-rose-500 font-bold" : "text-foreground"
                                }`}
                              >
                                Stok: {product.stock}
                              </span>
                            ) : (
                              <span className="text-purple-600 dark:text-purple-400 text-[10px] font-bold">Jasa</span>
                            )}
                          </div>
                        </div>

                        <h4 className="text-xs font-bold text-foreground line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {product.name}
                        </h4>

                        {/* Detailed Specifications for Laptops */}
                        {isLaptop && (
                          <div className="mt-2 p-2 bg-muted/40 rounded-lg text-[11px] space-y-1">
                            {product.conditionGrade && (
                              <div className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                <span>🏷️</span>
                                <span>{product.conditionGrade}</span>
                              </div>
                            )}
                            {product.processor && (
                              <div className="text-foreground flex items-center gap-1">
                                <Cpu className="w-3 h-3 text-blue-500 shrink-0" />
                                <span className="truncate">{product.processor}</span>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-x-2 text-muted-foreground text-[10px]">
                              {product.ram && <span>🧠 {product.ram}</span>}
                              {product.storage && <span>💾 {product.storage}</span>}
                              {product.screenSize && <span>🖥️ {product.screenSize}</span>}
                            </div>
                            {product.batteryHealth && (
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                🔋 {product.batteryHealth}
                              </div>
                            )}
                          </div>
                        )}

                        {!isLaptop && product.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
                            {product.description}
                          </p>
                        )}
                      </div>

                      {/* Pricing Bar */}
                      <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-sm text-blue-600 dark:text-blue-400">
                              {formatRupiah(activePrice)}
                            </span>
                            {customerType === "reseller" && hasResellerDiscount && (
                              <span className="text-[10px] line-through text-muted-foreground">
                                {formatRupiah(product.sellPrice)}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground block">
                            {customerType === "reseller" && product.resellerPrice
                              ? "🏷️ Harga Reseller Mitra"
                              : "🏷️ Harga Konsumen Biasa"}
                          </span>
                        </div>

                        <button className="h-7 px-2.5 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs hover:bg-blue-700 transition-colors shadow-2xs">
                          + Masuk Kasir
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* MODE 2: COMPACT TOUCH KEYPAD TILES */}
            {posViewMode === "compact" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {filteredProducts.map((product) => {
                  const isLowStock = product.category !== "jasa" && product.stock <= product.minStock;
                  const activePrice =
                    customerType === "reseller" && product.resellerPrice
                      ? product.resellerPrice
                      : product.sellPrice;

                  return (
                    <div
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="bg-card border border-border rounded-xl p-3 shadow-2xs hover:border-blue-500 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group active:scale-95 select-none"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 truncate">
                            {product.code}
                          </span>
                          {product.category !== "jasa" ? (
                            <span
                              className={`px-1.5 py-0.2 rounded font-bold ${
                                isLowStock
                                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              Stok {product.stock}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                              Jasa
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-foreground line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors pt-0.5">
                          {product.name}
                        </h4>

                        {product.processor && (
                          <div className="text-[10px] text-muted-foreground truncate">
                            {product.processor}
                          </div>
                        )}
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between">
                        <span className="font-extrabold text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                          {formatRupiah(activePrice)}
                        </span>
                        <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-xs font-bold transition-colors shrink-0">
                          +
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* MODE 3: DENSE LIST / TABLE VIEW */}
            {posViewMode === "list" && (
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                        <th className="py-2.5 px-3">Kode / Item</th>
                        <th className="py-2.5 px-2">Kategori</th>
                        <th className="py-2.5 px-2">Garansi</th>
                        <th className="py-2.5 px-2 text-center">Stok</th>
                        <th className="py-2.5 px-3 text-right">Harga</th>
                        <th className="py-2.5 px-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredProducts.map((product) => {
                        const isLowStock = product.category !== "jasa" && product.stock <= product.minStock;
                        const activePrice =
                          customerType === "reseller" && product.resellerPrice
                            ? product.resellerPrice
                            : product.sellPrice;
                        const hasResellerDiscount =
                          product.resellerPrice && product.resellerPrice < product.sellPrice;

                        return (
                          <tr
                            key={product.id}
                            onClick={() => addToCart(product)}
                            className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 cursor-pointer transition-colors group"
                          >
                            <td className="py-2 px-3">
                              <div className="font-mono font-bold text-[11px] text-blue-600 dark:text-blue-400">
                                {product.code}
                              </div>
                              <div className="font-bold text-foreground group-hover:text-blue-600">
                                {product.name}
                              </div>
                              {product.processor && (
                                <div className="text-[10px] text-muted-foreground truncate max-w-xs">
                                  {product.processor} {product.ram ? `• ${product.ram}` : ""}{" "}
                                  {product.storage ? `• ${product.storage}` : ""}
                                </div>
                              )}
                            </td>

                            <td className="py-2 px-2 whitespace-nowrap">
                              {product.category === "laptop_baru" && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                  ✨ Laptop Baru
                                </span>
                              )}
                              {product.category === "laptop_bekas" && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                  🔄 Laptop Bekas
                                </span>
                              )}
                              {product.category === "komponen_pc" && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                                  Komponen PC
                                </span>
                              )}
                              {product.category === "part_laptop" && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                                  Part Laptop
                                </span>
                              )}
                              {product.category === "aksesoris" && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                                  Aksesoris
                                </span>
                              )}
                              {product.category === "jasa" && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                  Jasa & Servis
                                </span>
                              )}
                            </td>

                            <td className="py-2 px-2 whitespace-nowrap text-muted-foreground text-[11px]">
                              {product.warrantyDays > 0 ? (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  <ShieldCheck className="w-3 h-3" />
                                  {getWarrantyLabel(product.warrantyDays)}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>

                            <td className="py-2 px-2 text-center whitespace-nowrap">
                              {product.category !== "jasa" ? (
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                                    isLowStock
                                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                      : "bg-muted text-foreground"
                                  }`}
                                >
                                  {product.stock}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-[11px]">∞</span>
                              )}
                            </td>

                            <td className="py-2 px-3 text-right whitespace-nowrap">
                              <div className="font-extrabold text-blue-600 dark:text-blue-400 text-xs sm:text-sm">
                                {formatRupiah(activePrice)}
                              </div>
                              {customerType === "reseller" && hasResellerDiscount && (
                                <div className="text-[10px] line-through text-muted-foreground">
                                  {formatRupiah(product.sellPrice)}
                                </div>
                              )}
                            </td>

                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(product);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-2xs"
                              >
                                + Pilih
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty state */}
            {filteredProducts.length === 0 && (
              <div className="py-12 text-center text-muted-foreground text-xs bg-card border border-border rounded-xl">
                Tidak ada produk yang cocok dengan pencarian / filter kategori ini.
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
                <div>
                  <h2 className="font-bold text-foreground text-sm">Keranjang Transaksi</h2>
                  <span className="text-[11px] text-muted-foreground">
                    Harga Aktif:{" "}
                    <span className="font-semibold text-foreground">
                      {customerType === "reseller" ? "Reseller / Mitra" : "Konsumen Biasa"}
                    </span>
                  </span>
                </div>
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
                <UserIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
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
            <div className="mt-3.5 space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {cart.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-2.5 rounded-xl bg-muted/30 border border-border text-xs space-y-1.5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-2">
                      <div className="font-bold text-foreground line-clamp-1">{item.name}</div>
                      {item.conditionGrade && (
                        <div className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold">
                          🏷️ {item.conditionGrade}
                        </div>
                      )}
                      {item.specsSummary && (
                        <div className="text-[10px] text-muted-foreground line-clamp-1">
                          {item.specsSummary}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => removeItem(idx)}
                      className="p-1 rounded-md text-rose-500 hover:text-rose-700 shrink-0"
                      title="Hapus Item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      {/* Price Tier Switcher per Item */}
                      {!item.isService && item.resellerPrice && item.regularPrice && (
                        <button
                          type="button"
                          onClick={() => toggleItemPriceType(idx)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                            item.priceType === "reseller"
                              ? "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                          title="Klik untuk ubah harga Biasa / Reseller item ini"
                        >
                          {item.priceType === "reseller" ? "👥 Reseller" : "👤 Biasa"}
                        </button>
                      )}

                      {item.warrantyDays !== undefined && (
                        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1 py-0.5 rounded">
                          🛡️ {getWarrantyLabel(item.warrantyDays)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-foreground">
                        {formatRupiah(item.subtotal)}
                      </span>

                      <div className="flex items-center space-x-1 bg-card border border-border rounded-md px-1 py-0.5">
                        <button
                          onClick={() => updateQty(idx, -1)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-4 text-center font-bold">{item.qty}</span>
                        <button
                          onClick={() => updateQty(idx, 1)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="py-10 text-center text-muted-foreground text-xs">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-1 opacity-40" />
                  <span>Keranjang kasir masih kosong. Klik barang di katalog sebelah kiri.</span>
                </div>
              )}
            </div>
          </div>

          {/* Pricing & Checkout Form */}
          <div className="pt-3 border-t border-border space-y-3 text-xs">
            {/* Calculation summary */}
            <div className="space-y-1.5 text-muted-foreground">
              <div className="flex justify-between">
                <span>Subtotal ({cart.length} item):</span>
                <span className="font-medium text-foreground">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Diskon / Potongan (Rp):</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={discount || ""}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="0"
                  className="w-24 px-2 py-0.5 text-right bg-muted/40 border border-input rounded-md font-bold"
                />
              </div>
              <div className="flex justify-between text-sm font-bold text-foreground pt-1 border-t border-border">
                <span>Total Bayar:</span>
                <span className="text-base text-blue-600 dark:text-blue-400">
                  {formatRupiah(total)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block font-semibold text-foreground mb-1">
                Metode Pembayaran:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "cash", label: "Tunai", icon: Banknote },
                  { id: "qris", label: "QRIS", icon: QrCode },
                  { id: "transfer", label: "Transfer", icon: CreditCard }
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
                  {[50000, 100000, 200000, 500000, 1000000, 5000000].map((preset) => (
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
                  <span
                    className={`font-bold text-sm ${
                      change > 0 ? "text-emerald-600" : "text-foreground"
                    }`}
                  >
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
              <span>
                {isProcessing
                  ? "Memproses Transaksi..."
                  : `Selesaikan & Cetak Struk (${formatRupiah(total)})`}
              </span>
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
                <p className="text-xs text-muted-foreground">
                  Daftar transaksi kasir & pelunasan servis terakhir.
                </p>
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
                      {tx.customerType === "reseller" && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          Reseller
                        </span>
                      )}
                    </div>
                    <div className="font-medium text-foreground mt-0.5">
                      {tx.customerName} ({tx.items.length} item)
                    </div>
                    <div className="text-muted-foreground capitalize">
                      Metode: {tx.paymentMethod}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-foreground">
                      {formatRupiah(tx.total)}
                    </span>
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
