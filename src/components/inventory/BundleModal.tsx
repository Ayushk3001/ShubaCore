"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2, PackageCheck } from "lucide-react";
import { createProductBundleAction, updateProductBundleAction } from "@/lib/actions";
import { calculateBundlePrice, calculateBundleVirtualStock } from "@/lib/bundles";

interface ComponentProductOption {
  id: string;
  name: string;
  sku: string;
  purchaseCost: any;
  currentStock: number;
}

interface BundleModalProps {
  bundle?: {
    id: string;
    name: string;
    sku: string;
    description: string | null;
    pricingType: "FIXED" | "DYNAMIC_SUM";
    bundlePrice: any;
    isActive: boolean;
    bundleItems: Array<{
      id: string;
      productId: string;
      quantity: number;
      product?: ComponentProductOption;
    }>;
  } | null;
  products: ComponentProductOption[];
  isOpen: boolean;
  onClose: () => void;
}

export function BundleModal({ bundle, products, isOpen, onClose }: BundleModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pricingType, setPricingType] = useState<"FIXED" | "DYNAMIC_SUM">("DYNAMIC_SUM");
  const [bundlePrice, setBundlePrice] = useState<number>(0);
  const [items, setItems] = useState<Array<{ productId: string; quantity: number }>>([
    { productId: "", quantity: 1 },
  ]);

  const isEditing = Boolean(bundle);

  useEffect(() => {
    if (bundle) {
      setPricingType(bundle.pricingType || "DYNAMIC_SUM");
      setBundlePrice(bundle.bundlePrice ? Number(bundle.bundlePrice) : 0);
      if (bundle.bundleItems && bundle.bundleItems.length > 0) {
        setItems(
          bundle.bundleItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          }))
        );
      }
    } else {
      setPricingType("DYNAMIC_SUM");
      setBundlePrice(0);
      setItems([{ productId: products[0]?.id || "", quantity: 1 }]);
    }
  }, [bundle, isOpen, products]);

  if (!isOpen) return null;

  function handleAddItem() {
    setItems([...items, { productId: products[0]?.id || "", quantity: 1 }]);
  }

  function handleRemoveItem(index: number) {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  }

  function handleItemChange(index: number, field: "productId" | "quantity", value: string | number) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  }

  // Calculate live virtual stock and dynamic sum price
  const itemsWithProduct = items.map((item) => {
    const prod = products.find((p) => p.id === item.productId);
    return {
      quantity: item.quantity,
      product: prod
        ? { currentStock: prod.currentStock, purchaseCost: Number(prod.purchaseCost) }
        : { currentStock: 0, purchaseCost: 0 },
    };
  });

  const calculatedDynamicPrice = calculateBundlePrice("DYNAMIC_SUM", 0, itemsWithProduct);
  const effectivePrice = pricingType === "FIXED" ? bundlePrice : calculatedDynamicPrice;
  const virtualStock = calculateBundleVirtualStock(itemsWithProduct);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: (formData.get("name") as string) || "",
      sku: (formData.get("sku") as string) || "",
      description: (formData.get("description") as string) || undefined,
      pricingType,
      bundlePrice: pricingType === "FIXED" ? bundlePrice : undefined,
      isActive: true,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: Number(i.quantity),
      })),
    };

    try {
      const res = isEditing && bundle
        ? await updateProductBundleAction(bundle.id, data)
        : await createProductBundleAction(data);

      if (!res.success) {
        setError(res.error || "Failed to save product combo bundle.");
        return;
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to save product combo bundle.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-[#d8ded2] bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#edf1e8] pb-4">
          <div className="flex items-center gap-2">
            <PackageCheck className="size-5 text-[#3f563f]" />
            <h2 className="text-lg font-bold text-[#20231f]">
              {isEditing ? "Edit Product Combo / Bundle" : "Create Product Combo / Bundle"}
            </h2>
          </div>
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
              <label className="block text-xs font-semibold text-[#4e584f]">Combo Name *</label>
              <input
                type="text"
                name="name"
                required
                defaultValue={bundle?.name || ""}
                placeholder="e.g. Wedding Deluxe Gift Box"
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">SKU Code *</label>
              <input
                type="text"
                name="sku"
                required
                defaultValue={bundle?.sku || ""}
                placeholder="e.g. BNDL-WDG-01"
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm uppercase focus:border-[#3f563f] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Description</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={bundle?.description || ""}
              placeholder="e.g. Includes 2 Jute Bags, 1 Scented Candle, and 1 Card"
              className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Pricing Strategy *</label>
              <select
                value={pricingType}
                onChange={(e) => setPricingType(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              >
                <option value="DYNAMIC_SUM">Sum of Components (Dynamic)</option>
                <option value="FIXED">Fixed Combo Package Price</option>
              </select>
            </div>

            {pricingType === "FIXED" && (
              <div>
                <label className="block text-xs font-semibold text-[#4e584f]">Fixed Package Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min={1}
                  required
                  value={bundlePrice}
                  onChange={(e) => setBundlePrice(Number(e.target.value))}
                  placeholder="1500"
                  className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Component Products Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#4e584f]">Component Products *</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#3f563f] hover:underline"
              >
                <Plus className="size-3.5" /> Add Component
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const currentProd = products.find((p) => p.id === item.productId);
                return (
                  <div key={idx} className="flex items-center gap-2 rounded-lg border border-[#edf1e8] bg-[#f8faf6] p-3">
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
                      required
                      className="flex-1 rounded-md border border-[#d8ded2] bg-white px-2.5 py-1.5 text-xs focus:border-[#3f563f] focus:outline-none"
                    >
                      <option value="">Select product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) - Stock: {p.currentStock} - ₹{Number(p.purchaseCost).toLocaleString()}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-[#6b746c]">Qty:</span>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                        required
                        className="w-16 rounded-md border border-[#d8ded2] bg-white px-2 py-1.5 text-xs focus:border-[#3f563f] focus:outline-none text-center"
                      />
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Virtual Stock & Price Summary Banner */}
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-[#edf1e8] p-3 text-xs">
            <div>
              <span className="text-[#6b746c]">Available Virtual Stock:</span>
              <p className="text-sm font-bold text-[#263326] mt-0.5">{virtualStock} combos</p>
            </div>
            <div className="text-right">
              <span className="text-[#6b746c]">Calculated Bundle Rate:</span>
              <p className="text-sm font-bold text-[#263326] mt-0.5">₹{effectivePrice.toLocaleString()}</p>
            </div>
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
              {isEditing ? "Save Changes" : "Create Combo Bundle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
