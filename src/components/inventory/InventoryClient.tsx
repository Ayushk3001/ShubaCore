"use client";

import { useState } from "react";
import { Plus, Package, Layers, AlertTriangle, Search, Edit2, ArrowUpDown, PackageCheck, Trash2 } from "lucide-react";
import { ProductModal } from "./ProductModal";
import { SupplierModal } from "./SupplierModal";
import { StockAdjustModal } from "./StockAdjustModal";
import { BundleModal } from "./BundleModal";
import { deleteProductBundleAction } from "@/lib/actions";
import { calculateBundlePrice, calculateBundleVirtualStock } from "@/lib/bundles";

export function InventoryClient({
  products,
  suppliers,
  stockMovements,
  bundles = [],
}: {
  products: Array<any>;
  suppliers: Array<any>;
  stockMovements: Array<any>;
  bundles?: Array<any>;
}) {
  const [activeTab, setActiveTab] = useState<"PRODUCTS" | "BUNDLES" | "SUPPLIERS" | "MOVEMENTS">("PRODUCTS");
  const [search, setSearch] = useState("");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isBundleModalOpen, setIsBundleModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<any | null>(null);

  const lowStockCount = products.filter((p) => p.currentStock <= p.minStock).length;
  const totalInventoryValue = products.reduce((sum, p) => sum + p.currentStock * Number(p.purchaseCost), 0);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredBundles = bundles.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.sku.toLowerCase().includes(search.toLowerCase())
  );

  function handleEditProduct(product: any) {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  }

  function handleCreateProduct() {
    setSelectedProduct(null);
    setIsProductModalOpen(true);
  }

  function handleEditSupplier(supplier: any) {
    setSelectedSupplier(supplier);
    setIsSupplierModalOpen(true);
  }

  function handleCreateSupplier() {
    setSelectedSupplier(null);
    setIsSupplierModalOpen(true);
  }

  function handleCreateBundle() {
    setSelectedBundle(null);
    setIsBundleModalOpen(true);
  }

  function handleEditBundle(bundle: any) {
    setSelectedBundle(bundle);
    setIsBundleModalOpen(true);
  }

  async function handleDeleteBundle(id: string) {
    if (confirm("Are you sure you want to delete this product combo bundle?")) {
      await deleteProductBundleAction(id);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#20231f]">Inventory & Bundles</h1>
          <p className="mt-1 text-sm text-[#6b746c]">
            Track product SKUs, product combos/bundles, stock levels, vendor directory, and stock movements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsStockModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d8ded2] bg-white px-4 py-2 text-sm font-medium text-[#20231f] transition hover:bg-[#edf1e8] shadow-sm"
          >
            <ArrowUpDown className="size-4" />
            Adjust Stock
          </button>
          {activeTab === "SUPPLIERS" ? (
            <button
              onClick={handleCreateSupplier}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#263326] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#394a39] shadow-sm"
            >
              <Plus className="size-4" />
              Add Supplier
            </button>
          ) : activeTab === "BUNDLES" ? (
            <button
              onClick={handleCreateBundle}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#263326] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#394a39] shadow-sm"
            >
              <Plus className="size-4" />
              Create Combo / Bundle
            </button>
          ) : (
            <button
              onClick={handleCreateProduct}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#263326] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#394a39] shadow-sm"
            >
              <Plus className="size-4" />
              Add Product SKU
            </button>
          )}
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[#edf1e8] text-[#3f563f]">
            <Package className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[#6b746c]">Total Catalog SKUs</p>
            <p className="mt-1 text-2xl font-bold text-[#20231f]">{products.length} SKUs ({bundles.length} Combos)</p>
          </div>
        </div>

        <div className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-900">
            <Layers className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[#6b746c]">Total Inventory Valuation</p>
            <p className="mt-1 text-2xl font-bold text-[#20231f]">₹{totalInventoryValue.toLocaleString()}</p>
          </div>
        </div>

        <div className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm flex items-center gap-4">
          <div className={`flex size-10 items-center justify-center rounded-lg ${lowStockCount > 0 ? "bg-amber-100 text-amber-900" : "bg-[#edf1e8] text-[#3f563f]"}`}>
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[#6b746c]">Low Stock Threshold Alerts</p>
            <p className={`mt-1 text-2xl font-bold ${lowStockCount > 0 ? "text-amber-900" : "text-[#20231f]"}`}>
              {lowStockCount} SKUs Need Reorder
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center justify-between border-b border-[#d8ded2] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("PRODUCTS")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === "PRODUCTS"
                ? "bg-[#263326] text-white shadow-sm"
                : "bg-white text-[#5f685e] border border-[#d8ded2] hover:bg-[#edf1e8]"
            }`}
          >
            Standalone SKUs ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("BUNDLES")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === "BUNDLES"
                ? "bg-[#263326] text-white shadow-sm"
                : "bg-white text-[#5f685e] border border-[#d8ded2] hover:bg-[#edf1e8]"
            }`}
          >
            Product Combos / Bundles ({bundles.length})
          </button>
          <button
            onClick={() => setActiveTab("SUPPLIERS")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === "SUPPLIERS"
                ? "bg-[#263326] text-white shadow-sm"
                : "bg-white text-[#5f685e] border border-[#d8ded2] hover:bg-[#edf1e8]"
            }`}
          >
            Suppliers Directory ({suppliers.length})
          </button>
          <button
            onClick={() => setActiveTab("MOVEMENTS")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === "MOVEMENTS"
                ? "bg-[#263326] text-white shadow-sm"
                : "bg-white text-[#5f685e] border border-[#d8ded2] hover:bg-[#edf1e8]"
            }`}
          >
            Stock Movement Audit ({stockMovements.length})
          </button>
        </div>

        {activeTab !== "MOVEMENTS" && (
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 size-4 text-[#8a948b]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-lg border border-[#d8ded2] bg-white pl-9 pr-3 py-1.5 text-xs focus:border-[#3f563f] focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Tab: Standalone Products */}
      {activeTab === "PRODUCTS" && (
        <div className="overflow-hidden rounded-xl border border-[#d8ded2] bg-white shadow-sm">
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-[#6b746c] text-sm">No products found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#edf1e8] bg-[#f8faf6] text-xs font-semibold uppercase tracking-wider text-[#5f685e]">
                  <tr>
                    <th className="px-6 py-3.5">Product SKU</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Stock Level</th>
                    <th className="px-6 py-3.5">Unit Cost</th>
                    <th className="px-6 py-3.5">Supplier</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf1e8]">
                  {filteredProducts.map((p) => {
                    const isLow = p.currentStock <= p.minStock;
                    return (
                      <tr key={p.id} className="hover:bg-[#fbfcf9] transition">
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-bold text-[#3f563f]">{p.sku}</span>
                          <p className="font-semibold text-[#20231f]">{p.name}</p>
                        </td>
                        <td className="px-6 py-4 text-xs text-[#4e584f]">
                          {p.category || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-[#20231f]">
                              {p.currentStock} {p.unit}
                            </span>
                            {isLow && (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                                <AlertTriangle className="size-3" /> LOW (Min: {p.minStock})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-[#20231f]">
                          ₹{Number(p.purchaseCost).toLocaleString()} / {p.unit}
                        </td>
                        <td className="px-6 py-4 text-xs text-[#4e584f]">
                          {p.supplier?.name || "Unassigned"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleEditProduct(p)}
                            className="inline-flex items-center gap-1 rounded-md p-1.5 text-[#6b746c] hover:bg-[#edf1e8] hover:text-[#20231f]"
                          >
                            <Edit2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Product Combos / Bundles */}
      {activeTab === "BUNDLES" && (
        <div className="overflow-hidden rounded-xl border border-[#d8ded2] bg-white shadow-sm">
          {filteredBundles.length === 0 ? (
            <div className="p-12 text-center text-[#6b746c] text-sm">
              No product combos/bundles created yet. Click "Create Combo / Bundle" to add your first package.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#edf1e8] bg-[#f8faf6] text-xs font-semibold uppercase tracking-wider text-[#5f685e]">
                  <tr>
                    <th className="px-6 py-3.5">Combo SKU & Name</th>
                    <th className="px-6 py-3.5">Constituent Products</th>
                    <th className="px-6 py-3.5">Pricing Strategy</th>
                    <th className="px-6 py-3.5">Bundle Price</th>
                    <th className="px-6 py-3.5">Virtual Stock</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf1e8]">
                  {filteredBundles.map((b) => {
                    const price = calculateBundlePrice(b.pricingType, b.bundlePrice, b.bundleItems || []);
                    const vStock = calculateBundleVirtualStock(
                      (b.bundleItems || []).map((bi: any) => ({
                        quantity: bi.quantity,
                        product: { currentStock: bi.product?.currentStock ?? 0 },
                      }))
                    );

                    return (
                      <tr key={b.id} className="hover:bg-[#fbfcf9] transition">
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-bold text-[#3f563f]">{b.sku}</span>
                          <p className="font-semibold text-[#20231f]">{b.name}</p>
                          {b.description && <p className="text-xs text-[#6b746c]">{b.description}</p>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1 text-xs">
                            {(b.bundleItems || []).map((bi: any) => (
                              <div key={bi.id} className="flex items-center gap-1.5 text-[#4e584f]">
                                <span className="font-bold text-[#20231f]">x{bi.quantity}</span>
                                <span>{bi.product?.name || "Product"}</span>
                                <span className="text-[10px] text-[#8a948b]">({bi.product?.currentStock ?? 0} avail)</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <span className="rounded bg-[#edf1e8] px-2 py-0.5 font-semibold text-[#3f563f]">
                            {b.pricingType === "FIXED" ? "Fixed Price" : "Dynamic Sum"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-[#20231f]">
                          ₹{price.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <span className={`font-bold ${vStock > 0 ? "text-emerald-900" : "text-rose-700"}`}>
                            {vStock} Combos
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditBundle(b)}
                              className="inline-flex items-center gap-1 rounded-md p-1.5 text-[#6b746c] hover:bg-[#edf1e8] hover:text-[#20231f]"
                            >
                              <Edit2 className="size-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBundle(b.id)}
                              className="inline-flex items-center gap-1 rounded-md p-1.5 text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Suppliers */}
      {activeTab === "SUPPLIERS" && (
        <div className="overflow-hidden rounded-xl border border-[#d8ded2] bg-white shadow-sm">
          {filteredSuppliers.length === 0 ? (
            <div className="p-12 text-center text-[#6b746c] text-sm">No suppliers found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#edf1e8] bg-[#f8faf6] text-xs font-semibold uppercase tracking-wider text-[#5f685e]">
                  <tr>
                    <th className="px-6 py-3.5">Vendor Name</th>
                    <th className="px-6 py-3.5">Contact Person & Phone</th>
                    <th className="px-6 py-3.5">Address</th>
                    <th className="px-6 py-3.5">Supplied SKUs</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf1e8]">
                  {filteredSuppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-[#fbfcf9] transition">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#20231f]">{s.name}</p>
                        {s.email && <p className="text-xs text-[#6b746c]">{s.email}</p>}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <p className="font-medium text-[#20231f]">{s.contactPerson || "—"}</p>
                        <p className="text-[#6b746c]">{s.phone}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#4e584f]">
                        {s.address || "—"}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className="rounded bg-[#edf1e8] px-2 py-1 font-semibold text-[#3f563f]">
                          {s.products.length} Products
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEditSupplier(s)}
                          className="inline-flex items-center gap-1 rounded-md p-1.5 text-[#6b746c] hover:bg-[#edf1e8] hover:text-[#20231f]"
                        >
                          <Edit2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Stock Movements */}
      {activeTab === "MOVEMENTS" && (
        <div className="overflow-hidden rounded-xl border border-[#d8ded2] bg-white shadow-sm">
          {stockMovements.length === 0 ? (
            <div className="p-12 text-center text-[#6b746c] text-sm">No stock movements logged yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#edf1e8] bg-[#f8faf6] text-xs font-semibold uppercase tracking-wider text-[#5f685e]">
                  <tr>
                    <th className="px-6 py-3.5">Product SKU</th>
                    <th className="px-6 py-3.5">Movement Type</th>
                    <th className="px-6 py-3.5">Reference / PO</th>
                    <th className="px-6 py-3.5">Logged By</th>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5 text-right">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf1e8]">
                  {stockMovements.map((m) => (
                    <tr key={m.id} className="hover:bg-[#fbfcf9] transition">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-[#3f563f]">{m.product.sku}</span>
                        <p className="font-semibold text-[#20231f]">{m.product.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-semibold ${
                            m.type === "PURCHASE" || m.type === "RETURN"
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {m.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-[#6b746c]">
                        {m.reference || "—"}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#4e584f]">
                        {m.createdBy?.name || "System"}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#4e584f]">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-bold ${
                          m.type === "SALE_CONSUMPTION" ? "text-amber-800" : "text-emerald-900"
                        }`}
                      >
                        {m.type === "SALE_CONSUMPTION" ? `- ${m.quantity}` : `+ ${m.quantity}`} {m.product.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <ProductModal
        product={selectedProduct}
        suppliers={suppliers}
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
      />

      <SupplierModal
        supplier={selectedSupplier}
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
      />

      <StockAdjustModal
        products={products}
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
      />

      <BundleModal
        bundle={selectedBundle}
        products={products}
        isOpen={isBundleModalOpen}
        onClose={() => setIsBundleModalOpen(false)}
      />
    </div>
  );
}
