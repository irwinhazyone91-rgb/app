import React, { useState } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  AlertTriangle,
  Layers,
  Laptop,
  ShieldCheck,
  Cpu,
  HardDrive,
  Sparkles,
  Users,
  CheckCircle2
} from "lucide-react";
import { Product, ProductCategory } from "../types";
import { formatRupiah } from "../lib/utils";

interface InventoryViewProps {
  products: Product[];
  onCreateProduct: (product: Partial<Product>) => void;
  onUpdateProduct: (id: string, updates: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    category: ProductCategory;
    costPrice: number;
    sellPrice: number;
    resellerPrice: number;
    warrantyDays: number;
    stock: number;
    minStock: number;
    unit: string;
    description: string;
    processor: string;
    ram: string;
    storage: string;
    graphics: string;
    screenSize: string;
    conditionGrade: string;
    batteryHealth: string;
    includes: string;
  }>({
    code: "",
    name: "",
    category: "laptop_baru",
    costPrice: 0,
    sellPrice: 0,
    resellerPrice: 0,
    warrantyDays: 365,
    stock: 1,
    minStock: 1,
    unit: "Unit",
    description: "",
    processor: "",
    ram: "",
    storage: "",
    graphics: "",
    screenSize: "",
    conditionGrade: "Baru Segel BNIB 100%",
    batteryHealth: "Baterai Baru 100%",
    includes: "Unit Laptop, Charger Original, Tas Laptop, Dus Box & Kartu Garansi"
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      code: `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
      name: "",
      category: "laptop_baru",
      costPrice: 0,
      sellPrice: 0,
      resellerPrice: 0,
      warrantyDays: 365,
      stock: 1,
      minStock: 1,
      unit: "Unit",
      description: "",
      processor: "",
      ram: "",
      storage: "",
      graphics: "",
      screenSize: "14.0\" FHD IPS",
      conditionGrade: "Baru Segel BNIB 100%",
      batteryHealth: "Baterai Baru 100%",
      includes: "Unit Laptop, Charger Original, Tas Laptop, Dus Box & Kartu Garansi"
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      code: product.code,
      name: product.name,
      category: product.category,
      costPrice: product.costPrice || 0,
      sellPrice: product.sellPrice || 0,
      resellerPrice: product.resellerPrice || 0,
      warrantyDays: product.warrantyDays !== undefined ? product.warrantyDays : (product.category === "jasa" ? 7 : 30),
      stock: product.stock || 0,
      minStock: product.minStock || 1,
      unit: product.unit || "Unit",
      description: product.description || "",
      processor: product.processor || "",
      ram: product.ram || "",
      storage: product.storage || "",
      graphics: product.graphics || "",
      screenSize: product.screenSize || "",
      conditionGrade: product.conditionGrade || "",
      batteryHealth: product.batteryHealth || "",
      includes: product.includes || ""
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<Product> = {
      ...formData,
      costPrice: Number(formData.costPrice) || 0,
      sellPrice: Number(formData.sellPrice) || 0,
      resellerPrice: Number(formData.resellerPrice) || undefined,
      warrantyDays: Number(formData.warrantyDays) || 0,
      stock: Number(formData.stock) || 0,
      minStock: Number(formData.minStock) || 1
    };

    if (editingProduct) {
      onUpdateProduct(editingProduct.id, payload);
    } else {
      onCreateProduct(payload);
    }
    setIsModalOpen(false);
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = categoryFilter === "all" || p.category === categoryFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      (p.processor && p.processor.toLowerCase().includes(q)) ||
      (p.ram && p.ram.toLowerCase().includes(q)) ||
      (p.storage && p.storage.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  const totalAssetValue = products.reduce(
    (acc, p) => acc + (p.category !== "jasa" ? (p.costPrice || 0) * (p.stock || 0) : 0),
    0
  );
  const totalPotentialRevenue = products.reduce(
    (acc, p) => acc + (p.category !== "jasa" ? (p.sellPrice || 0) * (p.stock || 0) : 0),
    0
  );
  const lowStockCount = products.filter(
    (p) => p.category !== "jasa" && p.stock <= p.minStock
  ).length;

  const isLaptopCategory =
    formData.category === "laptop_baru" || formData.category === "laptop_bekas";

  const getWarrantyLabel = (days: number) => {
    if (days <= 0) return "Tanpa Garansi";
    if (days >= 730) return `${Math.round(days / 365)} Thn`;
    if (days >= 365) return "1 Tahun";
    if (days % 30 === 0) return `${days / 30} Bulan`;
    return `${days} Hari`;
  };

  const getCategoryBadge = (category: ProductCategory) => {
    switch (category) {
      case "laptop_baru":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/60">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            Laptop Baru
          </span>
        );
      case "laptop_bekas":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60">
            <Laptop className="w-3 h-3 text-amber-500" />
            Laptop Bekas
          </span>
        );
      case "komponen_pc":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Cpu className="w-3 h-3 text-slate-500" />
            Komponen PC
          </span>
        );
      case "part_laptop":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300">
            <HardDrive className="w-3 h-3 text-cyan-500" />
            Part Laptop
          </span>
        );
      case "aksesoris":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            Aksesoris
          </span>
        );
      case "jasa":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
            Jasa & Servis
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground capitalize">
            {category}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            <span>Katalog Inventaris: Laptop, Sparepart & Jasa</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola stok laptop baru & bekas lengkap dengan spesifikasi teknis, harga konsumen & reseller, serta masa garansi.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Produk / Laptop / Jasa</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase">
            <span>Total Item Katalog</span>
            <Layers className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{products.length} Item</div>
          <div className="text-xs text-muted-foreground mt-0.5 flex gap-2">
            <span>Laptop Baru ({products.filter((p) => p.category === "laptop_baru").length})</span>
            <span>•</span>
            <span>Laptop Bekas ({products.filter((p) => p.category === "laptop_bekas").length})</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase">
            <span>Nilai Modal Stok (Aset)</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatRupiah(totalAssetValue)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Estimasi Nilai Jual: {formatRupiah(totalPotentialRevenue)}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase">
            <span>Peringatan Stok Menipis</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div
            className={`mt-2 text-2xl font-bold ${
              lowStockCount > 0 ? "text-rose-500" : "text-foreground"
            }`}
          >
            {lowStockCount} Produk
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Perlu restock segera
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari SKU, Nama Produk, Processor, RAM, SSD, atau Jasa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted/40 border border-input rounded-lg"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
          {[
            { id: "all", label: "Semua Kategori" },
            { id: "laptop_baru", label: "✨ Laptop Baru" },
            { id: "laptop_bekas", label: "🔄 Laptop Bekas" },
            { id: "komponen_pc", label: "Komponen PC" },
            { id: "part_laptop", label: "Part Laptop" },
            { id: "aksesoris", label: "Aksesoris" },
            { id: "jasa", label: "Jasa & Servis" }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Products */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
              <tr>
                <th className="py-3 px-4">Kode SKU</th>
                <th className="py-3 px-4">Nama Produk & Spesifikasi</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Masa Garansi</th>
                <th className="py-3 px-4">Harga Konsumen</th>
                <th className="py-3 px-4">Harga Reseller</th>
                <th className="py-3 px-4">Stok</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((p) => {
                const isJasa = p.category === "jasa";
                const isLow = !isJasa && p.stock <= p.minStock;
                const margin = (p.sellPrice || 0) - (p.costPrice || 0);
                const hasSpecs = p.processor || p.ram || p.storage || p.graphics || p.conditionGrade;

                return (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-xs text-blue-600 dark:text-blue-400">
                      {p.code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-foreground">{p.name}</div>
                      
                      {/* Specifications Preview */}
                      {hasSpecs && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {p.conditionGrade && (
                            <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              {p.conditionGrade}
                            </span>
                          )}
                          {p.processor && (
                            <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              ⚙️ {p.processor}
                            </span>
                          )}
                          {p.ram && (
                            <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              🧠 {p.ram}
                            </span>
                          )}
                          {p.storage && (
                            <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              💾 {p.storage}
                            </span>
                          )}
                          {p.screenSize && (
                            <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              🖥️ {p.screenSize}
                            </span>
                          )}
                        </div>
                      )}

                      {p.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {p.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">{getCategoryBadge(p.category)}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        {getWarrantyLabel(p.warrantyDays || 0)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-foreground">
                        {formatRupiah(p.sellPrice || 0)}
                      </div>
                      {!isJasa && margin > 0 && (
                        <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Modal: {formatRupiah(p.costPrice || 0)}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.resellerPrice && p.resellerPrice > 0 ? (
                        <div>
                          <div className="font-bold text-indigo-600 dark:text-indigo-400">
                            {formatRupiah(p.resellerPrice)}
                          </div>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Users className="w-3 h-3" /> Mitra / Reseller
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Sama dg Biasa</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {isJasa ? (
                        <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                          Unlimited (Jasa)
                        </span>
                      ) : (
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`font-bold ${
                              isLow
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-foreground"
                            }`}
                          >
                            {p.stock} {p.unit}
                          </span>
                          {isLow && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 font-bold">
                              Menipis!
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 transition-colors"
                          title="Edit Produk"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus produk "${p.name}"?`)) {
                              onDeleteProduct(p.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 transition-colors"
                          title="Hapus Produk"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground text-xs">
                    Tidak ada produk atau data spesifikasi yang sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: TAMBAH / EDIT PRODUK & LAPTOP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                  {isLaptopCategory ? (
                    <Laptop className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Package className="h-5 w-5 text-blue-600" />
                  )}
                  <span>
                    {editingProduct ? "Edit Data Produk / Laptop" : "Tambah Produk / Laptop Baru"}
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Lengkapi informasi spesifikasi, harga konsumen & reseller, serta masa garansi.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1 rounded-lg hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              {/* Category & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Kategori Item *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const newCat = e.target.value as ProductCategory;
                      setFormData({
                        ...formData,
                        category: newCat,
                        conditionGrade:
                          newCat === "laptop_baru"
                            ? "Baru Segel BNIB 100%"
                            : newCat === "laptop_bekas"
                            ? "Bekas Mulus Grade A 98%"
                            : formData.conditionGrade,
                        warrantyDays:
                          newCat === "laptop_baru"
                            ? 730
                            : newCat === "laptop_bekas"
                            ? 30
                            : newCat === "jasa"
                            ? 7
                            : 30
                      });
                    }}
                    className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg font-semibold"
                  >
                    <option value="laptop_baru">✨ Laptop Baru</option>
                    <option value="laptop_bekas">🔄 Laptop Bekas</option>
                    <option value="komponen_pc">🖥️ Komponen PC</option>
                    <option value="part_laptop">🔧 Part Laptop</option>
                    <option value="aksesoris">🎧 Aksesoris</option>
                    <option value="jasa">🛠️ Jasa & Servis</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Kode SKU / Barcode *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nama Produk / Tipe Laptop / Jasa *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    isLaptopCategory
                      ? "Contoh: Laptop ASUS Vivobook 14 A1404ZA Core i3-1215U 8GB/512GB"
                      : "Contoh: SSD NVMe 512GB Kingston NV2 Gen4"
                  }
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg font-medium"
                />
              </div>

              {/* Laptop Detailed Specs Section (Shown for Laptop Categories or expandable) */}
              {isLaptopCategory && (
                <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/60 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                    <Laptop className="w-4 h-4" />
                    <span>Spesifikasi Lengkap Laptop ({formData.category === "laptop_baru" ? "Baru" : "Bekas"})</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-foreground mb-1">
                        Processor (CPU)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Intel Core i5-1235U up to 4.4GHz / Ryzen 5 7520U"
                        value={formData.processor}
                        onChange={(e) => setFormData({ ...formData, processor: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-card border border-input rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-foreground mb-1">
                        RAM / Memory
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 16GB DDR4 3200MHz / 8GB LPDDR5"
                        value={formData.ram}
                        onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-card border border-input rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-foreground mb-1">
                        Storage / Penyimpanan
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 512GB M.2 NVMe PCIe SSD"
                        value={formData.storage}
                        onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-card border border-input rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-foreground mb-1">
                        VGA / Kartu Grafis
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Intel UHD Graphics / NVIDIA RTX 3050"
                        value={formData.graphics}
                        onChange={(e) => setFormData({ ...formData, graphics: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-card border border-input rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-foreground mb-1">
                        Ukuran & Layar
                      </label>
                      <input
                        type="text"
                        placeholder={'Contoh: 14.0" FHD IPS (1920x1080) Anti-Glare'}
                        value={formData.screenSize}
                        onChange={(e) => setFormData({ ...formData, screenSize: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-card border border-input rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-foreground mb-1">
                        Kondisi Fisik / Grade
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Baru Segel BNIB 100% / Mulus Grade A 98%"
                        value={formData.conditionGrade}
                        onChange={(e) => setFormData({ ...formData, conditionGrade: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-card border border-input rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-foreground mb-1">
                        Kondisi Baterai
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Normal 100% / Awet 4-6 Jam"
                        value={formData.batteryHealth}
                        onChange={(e) => setFormData({ ...formData, batteryHealth: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-card border border-input rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-foreground mb-1">
                        Kelengkapan Bawaan
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Unit + Charger Original + Tas + Dus"
                        value={formData.includes}
                        onChange={(e) => setFormData({ ...formData, includes: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-card border border-input rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing Section (Modal, Biasa, Reseller) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Harga Modal / Beli (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.costPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, costPrice: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Harga Konsumen Biasa (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={formData.sellPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, sellPrice: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg font-bold text-foreground"
                  />
                  {formData.sellPrice > formData.costPrice && formData.costPrice > 0 && (
                    <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                      Margin: +{formatRupiah(formData.sellPrice - formData.costPrice)}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Harga Reseller / Mitra (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Opsional (Grosir/Mitra)"
                    value={formData.resellerPrice || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        resellerPrice: Number(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 text-sm bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 rounded-lg font-bold text-indigo-700 dark:text-indigo-300"
                  />
                  {formData.resellerPrice > formData.costPrice && formData.costPrice > 0 && (
                    <span className="text-[10px] text-indigo-600 font-semibold block mt-0.5">
                      Margin Reseller: +{formatRupiah(formData.resellerPrice - formData.costPrice)}
                    </span>
                  )}
                </div>
              </div>

              {/* Warranty Duration Setting (REQUIRED BY USER) */}
              <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/60 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Pengaturan Masa Garansi Barang / Jasa *</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded">
                    {formData.warrantyDays} Hari ({getWarrantyLabel(formData.warrantyDays)})
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                  {[
                    { label: "Tanpa Garansi", days: 0 },
                    { label: "7 Hari (1 Mgg)", days: 7 },
                    { label: "14 Hari (2 Mgg)", days: 14 },
                    { label: "30 Hari (1 Bln)", days: 30 },
                    { label: "90 Hari (3 Bln)", days: 90 },
                    { label: "180 Hari (6 Bln)", days: 180 },
                    { label: "365 Hari (1 Thn)", days: 365 },
                    { label: "730 Hari (2 Thn)", days: 730 }
                  ].map((preset) => (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => setFormData({ ...formData, warrantyDays: preset.days })}
                      className={`px-2 py-1.5 text-xs rounded-lg font-semibold transition-all border ${
                        formData.warrantyDays === preset.days
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-card text-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Atau input hari kustom:
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={formData.warrantyDays}
                    onChange={(e) =>
                      setFormData({ ...formData, warrantyDays: Number(e.target.value) })
                    }
                    className="w-28 px-2.5 py-1 text-xs bg-card border border-input rounded-lg font-mono font-bold"
                  />
                  <span className="text-xs text-muted-foreground">hari garansi toko/distributor</span>
                </div>
              </div>

              {/* Stock and Unit */}
              {formData.category !== "jasa" && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Jumlah Stok
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Batas Min. Stok
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minStock}
                      onChange={(e) =>
                        setFormData({ ...formData, minStock: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Satuan
                    </label>
                    <input
                      type="text"
                      placeholder="Pcs / Unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Catatan Tambahan / Keterangan
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan garansi distributor, nomor seri, atau kelengkapan tambahan..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  {editingProduct ? "Perbarui Data Produk" : "Simpan Produk Baru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
