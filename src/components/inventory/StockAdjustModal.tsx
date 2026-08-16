"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { recordStockMovementAction } from "@/lib/actions";

interface StockAdjustModalProps {
  products: Array<{ id: string; name: string; sku: string; currentStock: number }>;
  isOpen: boolean;
  onClose: () => void;
}

export function StockAdjustModal({ products, isOpen, onClose }: StockAdjustModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      productId: (formData.get("productId") as string) || "",
      type: formData.get("type") as any,
      quantity: Number(formData.get("quantity")),
      reference: (formData.get("reference") as string) || undefined,
    };

    try {
      const res = await recordStockMovementAction(data);
      if (!res.success) {
        setError(res.error || "Failed to record stock movement.");
        return;
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to record stock movement.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-[#d8ded2] bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#edf1e8] pb-4">
          <h2 className="text-lg font-bold text-[#20231f]">Record Stock Movement</h2>
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
          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Select Product SKU *</label>
            <select
              name="productId"
              required
              className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
            >
              <option value="">Select product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) - Current: {p.currentStock}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Movement Type *</label>
              <select
                name="type"
                required
                defaultValue="PURCHASE"
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              >
                <option value="PURCHASE">PURCHASE (+ Stock)</option>
                <option value="SALE_CONSUMPTION">SALE / CONSUMPTION (- Stock)</option>
                <option value="RETURN">RETURN (+ Stock)</option>
                <option value="ADJUSTMENT">ADJUSTMENT (+/- Stock)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Quantity *</label>
              <input
                type="number"
                name="quantity"
                required
                placeholder="50"
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Reference / Invoice #</label>
            <input
              type="text"
              name="reference"
              placeholder="e.g. PO-2026-041 or ORD-2026-0012"
              className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
            />
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
              Record Movement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
