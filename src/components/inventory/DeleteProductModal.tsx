"use client";

import { useState } from "react";
import { X, Loader2, AlertTriangle, Trash2, Undo2 } from "lucide-react";
import { deleteProductAction } from "@/lib/actions";

interface DeleteProductModalProps {
  product: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    purchaseCost: any;
    unit?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteProductModal({
  product,
  isOpen,
  onClose,
  onSuccess,
}: DeleteProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !product) return null;

  const stockQty = Number(product.currentStock || 0);
  const unitCost = Number(product.purchaseCost || 0);
  const initialStockValue = Math.round(stockQty * unitCost * 100) / 100;
  const unit = product.unit || "pcs";

  async function handleDelete() {
    if (!product) return;
    setLoading(true);
    setError("");

    try {
      const res = await deleteProductAction(product.id);
      if (!res.success) {
        setError(res.error || "Failed to delete product.");
        return;
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete product.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-[#d8ded2] bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#edf1e8] pb-4">
          <div className="flex items-center gap-2 text-rose-800">
            <AlertTriangle className="size-5 text-rose-600" />
            <h2 className="text-lg font-bold text-[#20231f]">Delete Product?</h2>
          </div>
          <button onClick={onClose} type="button" className="rounded-lg p-1.5 text-[#6b746c] hover:bg-[#edf1e8]">
            <X className="size-5" />
          </button>
        </div>

        <p className="mt-3 text-xs text-[#5f685e] leading-relaxed">
          This product and its inventory stock will be removed. If this product was added by mistake, the original initial stock amount will be <strong>returned to Company Capital & Cash</strong>.
        </p>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200 font-medium">
            {error}
          </div>
        )}

        {/* Product Details Card */}
        <div className="mt-4 rounded-xl border border-[#d8ded2] bg-[#f8faf6] p-4 space-y-2 text-xs">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-mono text-[10px] font-bold text-[#3f563f] uppercase">{product.sku}</span>
              <h3 className="font-bold text-[#20231f] text-sm mt-0.5">{product.name}</h3>
            </div>
            {initialStockValue > 0 && (
              <span className="rounded-md bg-emerald-100 px-2 py-1 text-[11px] font-extrabold text-emerald-900 border border-emerald-300">
                +₹{initialStockValue.toLocaleString("en-IN")} Restored
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-[#edf1e8]">
            <div>
              <span className="text-[#6b746c]">Current Stock:</span>
              <p className="font-semibold text-[#20231f]">{stockQty} {unit}</p>
            </div>
            <div>
              <span className="text-[#6b746c]">Initial Stock Value:</span>
              <p className="font-bold text-emerald-950">₹{initialStockValue.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-[#d8ded2] px-4 py-2 text-xs font-medium text-[#4e584f] hover:bg-[#edf1e8]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-rose-700 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800 disabled:opacity-50 transition shadow-sm"
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : initialStockValue > 0 ? (
              <Undo2 className="size-3.5" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            {initialStockValue > 0
              ? `Delete & Undo ₹${initialStockValue.toLocaleString("en-IN")}`
              : "Delete Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
