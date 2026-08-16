"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createProductAction, updateProductAction } from "@/lib/actions";

interface ProductModalProps {
  product?: {
    id: string;
    name: string;
    sku: string;
    category: string | null;
    unit: string;
    currentStock: number;
    minStock: number;
    purchaseCost: any;
    supplierId: string | null;
  } | null;
  suppliers: Array<{ id: string; name: string }>;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductModal({ product, suppliers, isOpen, onClose }: ProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const isEditing = Boolean(product);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: (formData.get("name") as string) || "",
      sku: (formData.get("sku") as string) || "",
      category: (formData.get("category") as string) || undefined,
      unit: (formData.get("unit") as string) || "pcs",
      currentStock: Number(formData.get("currentStock")),
      minStock: Number(formData.get("minStock")),
      purchaseCost: Number(formData.get("purchaseCost")),
      supplierId: (formData.get("supplierId") as string) || undefined,
    };

    try {
      const res = isEditing && product
        ? await updateProductAction(product.id, data)
        : await createProductAction(data);

      if (!res.success) {
        setError(res.error || "Failed to save product.");
        return;
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to save product.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-[#d8ded2] bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#edf1e8] pb-4">
          <h2 className="text-lg font-bold text-[#20231f]">
            {isEditing ? "Edit Product SKU" : "Add New Inventory Product"}
          </h2>
          <button onClick={onClose} type="button" className="rounded-lg p-1.5 text-[#6b746c] hover:bg-[#edf1e8]">
            <X className="size-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Product Name *</label>
              <input
                type="text"
                name="name"
                defaultValue={product?.name || ""}
                required
                placeholder="e.g. Brass Diya Set (Small)"
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">SKU Code *</label>
              <input
                type="text"
                name="sku"
                defaultValue={product?.sku || ""}
                required
                placeholder="e.g. BDS-001"
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm font-mono uppercase focus:border-[#3f563f] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Category</label>
              <input
                type="text"
                name="category"
                defaultValue={product?.category || ""}
                placeholder="e.g. Pooja Items, Jute Bags"
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Unit of Measure</label>
              <select
                name="unit"
                defaultValue={product?.unit || "pcs"}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="sets">Sets</option>
                <option value="boxes">Boxes</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="meters">Meters</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Current Stock *</label>
              <input
                type="number"
                name="currentStock"
                min={0}
                defaultValue={product?.currentStock ?? 50}
                required
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Min Stock Alert *</label>
              <input
                type="number"
                name="minStock"
                min={0}
                defaultValue={product?.minStock ?? 10}
                required
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Unit Cost (₹) *</label>
              <input
                type="number"
                name="purchaseCost"
                step="0.01"
                min={0}
                defaultValue={product?.purchaseCost ? Number(product.purchaseCost) : 45}
                required
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Preferred Supplier</label>
            <select
              name="supplierId"
              defaultValue={product?.supplierId || ""}
              className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
            >
              <option value="">No supplier assigned</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#d8ded2] px-4 py-2 text-xs font-medium text-[#4e584f] hover:bg-[#edf1e8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-[#263326] px-4 py-2 text-xs font-medium text-white hover:bg-[#394a39] disabled:opacity-50"
            >
              {loading && <Loader2 className="size-3.5 animate-spin" />}
              {isEditing ? "Save Product" : "Add Product SKU"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
