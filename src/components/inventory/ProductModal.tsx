import { useState } from "react";
import { X, Loader2, AlertTriangle, ArrowRightCircle } from "lucide-react";
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
  partners?: Array<{ id: string; name: string }>;
  availableCapital?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductModal({
  product,
  suppliers,
  partners = [],
  availableCapital = 0,
  isOpen,
  onClose,
}: ProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fundingSource, setFundingSource] = useState<string>("NONE");
  const [stockQty, setStockQty] = useState<number>(product?.currentStock ?? 50);
  const [unitCost, setUnitCost] = useState<number>(
    product?.purchaseCost ? Number(product.purchaseCost) : 45
  );

  if (!isOpen) return null;

  const isEditing = Boolean(product);
  const totalProcurementCost = stockQty * unitCost;
  const isExceedingCapital =
    !isEditing &&
    fundingSource === "COMPANY_PROFIT" &&
    totalProcurementCost > availableCapital;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isExceedingCapital) {
      setError(
        `Insufficient company capital (Available: ₹${availableCapital.toLocaleString(
          "en-IN"
        )}, Required: ₹${totalProcurementCost.toLocaleString(
          "en-IN"
        )}). Please select 'Paid by Partner Out-of-Pocket' or add a partner capital investment first.`
      );
      setLoading(false);
      return;
    }

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
      fundingSource: (formData.get("fundingSource") as any) || "NONE",
      fundingPartnerId: (formData.get("fundingPartnerId") as string) || undefined,
      fundingMethod: (formData.get("fundingMethod") as any) || "UPI",
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
          <div>
            <h2 className="text-lg font-bold text-[#20231f]">
              {isEditing ? "Edit Product SKU" : "Add New Inventory Product"}
            </h2>
            <p className="text-xs text-[#6b746c]">
              Catalog items with automatic procurement cost & stock tracking.
            </p>
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
                value={stockQty}
                onChange={(e) => setStockQty(Number(e.target.value) || 0)}
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
                value={unitCost}
                onChange={(e) => setUnitCost(Number(e.target.value) || 0)}
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

          {/* Initial Stock Funding / Financial Tracking (Only for new products with stock > 0) */}
          {!isEditing && (
            <div className="rounded-lg border border-[#d8ded2] bg-[#f8faf6] p-3.5 space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-[#20231f]">
                    How is this initial stock funded?
                  </label>
                  <span className="text-[11px] font-bold text-[#3f563f]">
                    Cost: ₹{totalProcurementCost.toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="text-[11px] text-[#6b746c] mt-0.5">
                  Available Company Capital: <strong className="text-[#20231f]">₹{availableCapital.toLocaleString("en-IN")}</strong>
                </p>
                <select
                  name="fundingSource"
                  value={fundingSource}
                  onChange={(e) => setFundingSource(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#d8ded2] bg-white px-3 py-2 text-xs font-medium text-[#20231f] focus:border-[#3f563f] focus:outline-none"
                >
                  <option value="NONE">📦 Existing Stock / Opening Inventory (No Expense Logged)</option>
                  <option value="COMPANY_PROFIT">
                    🏛️ Reinvested Company Capital / Profit (Avail: ₹{availableCapital.toLocaleString("en-IN")})
                  </option>
                  <option value="PARTNER_OUT_OF_POCKET">👤 Paid by Partner Out-of-Pocket (Credit Partner Capital)</option>
                </select>
              </div>

              {/* Insufficient Capital Alert */}
              {isExceedingCapital && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-amber-900">
                    <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-bold">Insufficient Company Capital</p>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        This stock costs <strong>₹{totalProcurementCost.toLocaleString("en-IN")}</strong>, but available company capital is only <strong>₹{availableCapital.toLocaleString("en-IN")}</strong>.
                      </p>
                      <p className="text-[11px] text-amber-800 mt-1">
                        Please select <strong>Paid by Partner Out-of-Pocket</strong> to have a partner fund this purchase, or add a Capital Contribution in the Partners ledger first.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFundingSource("PARTNER_OUT_OF_POCKET")}
                    className="flex items-center gap-1.5 rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 transition"
                  >
                    <ArrowRightCircle className="size-3.5" />
                    Switch to Partner Out-of-Pocket
                  </button>
                </div>
              )}

              {fundingSource === "PARTNER_OUT_OF_POCKET" && (
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#edf1e8]">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#4e584f]">Purchased By Partner *</label>
                    <select
                      name="fundingPartnerId"
                      required
                      className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-white px-3 py-1.5 text-xs focus:border-[#3f563f] focus:outline-none"
                    >
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#4e584f]">Payment Method *</label>
                    <select
                      name="fundingMethod"
                      defaultValue="UPI"
                      className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-white px-3 py-1.5 text-xs focus:border-[#3f563f] focus:outline-none"
                    >
                      <option value="UPI">UPI</option>
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

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
              disabled={loading || isExceedingCapital}
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
