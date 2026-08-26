import React, { useState } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Tag,
  Layers
} from "lucide-react";
import { Product } from "../types";
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
    category: Product["category"];
    costPrice: number;
    sellPrice: number;
    stock: number;
    minStock: number;
    unit: string;
    description: string;
  }>({
    code: "",
    name: "",
    category: "komponen_pc",
    costPrice: 0,
    sellPrice: 0,
    stock: 0,
    minStock: 2,
    unit: "Pcs",
    description: ""
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      code: `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
      name: "",
      category: "komponen_pc",
      costPrice: 0,
      sellPrice: 0,
      stock: 5,
      minStock: 2,
      unit: "Pcs",
      description: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      code: product.code,
      name: product.name,
      category: product.category as any,
      costPrice: product.costPrice,
      sellPrice: product.sellPrice,
      stock: product.stock,
      minStock: product.minStock,
      unit: product.unit,
      description: product.description || ""
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      onUpdateProduct(editingProduct.id, formData);
    } else {
      onCreateProduct(formData);
    }
    setIsModalOpen(false);
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = categoryFilter === "all" || p.category === categoryFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const totalAssetValue = products.reduce((acc, p) => acc + (p.category !== "jasa" ? p.costPrice * p.stock : 0), 0);
  const totalPotentialRevenue = products.reduce((acc, p) => acc + (p.category !== "jasa" ? p.sellPrice * p.stock : 0), 0);
  const lowStockCount = products.filter((p) => p.category !== "jasa" && p.stock <= p.minStock).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            <span>Inventaris Sparepart & Katalog Jasa</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola stok sparepart laptop, komponen PC, aksesoris, dan tarif jasa perbaikan.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Sparepart / Jasa</span>
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
          <div className="text-xs text-muted-foreground mt-0.5">
            Komponen, Part Laptop & Jasa
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase">
            <span>Nilai Modal Stok (Aset)</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatRupiah(totalAssetValue)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Potensi Jual: {formatRupiah(totalPotentialRevenue)}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase">
            <span>Peringatan Stok Menipis</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className={`mt-2 text-2xl font-bold ${lowStockCount > 0 ? "text-rose-500" : "text-foreground"}`}>
            {lowStockCount} Produk
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Perlu segera dilakukan restock
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari Kode SKU, Nama Sparepart, atau Jasa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted/40 border border-input rounded-lg"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
          {[
            { id: "all", label: "Semua Kategori" },
            { id: "komponen_pc", label: "Komponen PC" },
            { id: "part_laptop", label: "Part Laptop" },
            { id: "aksesoris", label: "Aksesoris" },
            { id: "jasa", label: "Jasa & Servis" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat.id
                  ? "bg-blue-600 text-white"
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
                <th className="py-3 px-4">Nama Produk / Jasa</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Harga Modal</th>
                <th className="py-3 px-4">Harga Jual</th>
                <th className="py-3 px-4">Stok</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((p) => {
                const isJasa = p.category === "jasa";
                const isLow = !isJasa && p.stock <= p.minStock;
                const margin = p.sellPrice - p.costPrice;

                return (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-xs text-blue-600 dark:text-blue-400">
                      {p.code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-foreground">{p.name}</div>
                      {p.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">{p.description}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground capitalize">
                        {p.category.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                      {isJasa ? "-" : formatRupiah(p.costPrice)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      {formatRupiah(p.sellPrice)}
                      {!isJasa && margin > 0 && (
                        <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                          +Margin {formatRupiah(margin)}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {isJasa ? (
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          Unlimited (Jasa)
                        </span>
                      ) : (
                        <div className="flex items-center space-x-1.5">
                          <span className={`font-bold ${isLow ? "text-rose-600 dark:text-rose-400" : "text-foreground"}`}>
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
                  <td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">
                    Tidak ada produk ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: TAMBAH / EDIT PRODUK */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-foreground text-base">
                {editingProduct ? "Edit Sparepart / Jasa" : "Tambah Sparepart / Jasa Baru"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Kode SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Kategori *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
                  >
                    <option value="komponen_pc">Komponen PC</option>
                    <option value="part_laptop">Part Laptop</option>
                    <option value="aksesoris">Aksesoris</option>
                    <option value="jasa">Jasa & Servis</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nama Produk / Layanan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SSD NVMe 512GB Kingston NV2"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Harga Modal / Beli (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Harga Jual (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={formData.sellPrice}
                    onChange={(e) => setFormData({ ...formData, sellPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg font-bold"
                  />
                </div>
              </div>

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
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm bg-muted/40 border border-input rounded-lg"
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
                      onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
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
                  Deskripsi / Spesifikasi / Garansi
                </label>
                <textarea
                  rows={2}
                  placeholder="Spesifikasi teknis, garansi distributor, dsb."
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
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
