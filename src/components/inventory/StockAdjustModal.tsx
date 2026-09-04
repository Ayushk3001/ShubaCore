import { useState } from "react";
import { X, Loader2, AlertTriangle, ArrowRightCircle } from "lucide-react";
import { recordStockMovementAction } from "@/lib/actions";

interface StockAdjustModalProps {
  products: Array<{ id: string; name: string; sku: string; currentStock: number; purchaseCost?: any }>;
  partners?: Array<{ id: string; name: string }>;
  availableCapital?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function StockAdjustModal({
  products,
  partners = [],
  availableCapital = 0,
  isOpen,
  onClose,
}: StockAdjustModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || "");
  const [quantity, setQuantity] = useState<number>(50);
  const [movementType, setMovementType] = useState<string>("PURCHASE");
  const [fundingSource, setFundingSource] = useState<string>("COMPANY_PROFIT");

  if (!isOpen) return null;

  const currentProduct = products.find((p) => p.id === (selectedProductId || products[0]?.id));
  const unitCost = currentProduct?.purchaseCost ? Number(currentProduct.purchaseCost) : 0;
  const totalProcurementCost = quantity * unitCost;
  const isExceedingCapital =
    movementType === "PURCHASE" &&
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
      productId: (formData.get("productId") as string) || selectedProductId,
      type: (formData.get("type") as any) || movementType,
      quantity: Number(formData.get("quantity")),
      reference: (formData.get("reference") as string) || undefined,
      fundingSource: (formData.get("fundingSource") as any) || "NONE",
      fundingPartnerId: (formData.get("fundingPartnerId") as string) || undefined,
      fundingMethod: (formData.get("fundingMethod") as any) || "UPI",
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
      <div className="w-full max-w-md rounded-xl border border-[#d8ded2] bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#edf1e8] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#20231f]">Record Stock Movement</h2>
            <p className="text-xs text-[#6b746c]">
              Restock purchases, sales deductions, returns & adjustments.
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
          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Select Product SKU *</label>
            <select
              name="productId"
              required
              value={selectedProductId || products[0]?.id}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
            >
              <option value="">Select product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) - Current: {p.currentStock} {p.purchaseCost ? `(₹${Number(p.purchaseCost)}/unit)` : ""}
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
                value={movementType}
                onChange={(e) => setMovementType(e.target.value)}
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
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 0)}
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

          {/* Funding source for PURCHASE restocks */}
          {movementType === "PURCHASE" && (
            <div className="rounded-lg border border-[#d8ded2] bg-[#f8faf6] p-3.5 space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-[#20231f]">
                    How is this stock purchase funded?
                  </label>
                  {totalProcurementCost > 0 && (
                    <span className="text-[11px] font-bold text-[#3f563f]">
                      Cost: ₹{totalProcurementCost.toLocaleString("en-IN")}
                    </span>
                  )}
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
                  <option value="COMPANY_PROFIT">
                    🏛️ Reinvested Company Capital / Profit (Avail: ₹{availableCapital.toLocaleString("en-IN")})
                  </option>
                  <option value="PARTNER_OUT_OF_POCKET">👤 Paid by Partner Out-of-Pocket (Credit Partner Capital)</option>
                  <option value="NONE">📦 Stock Adjustment / Opening Inventory (No Expense Logged)</option>
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
                        This restock costs <strong>₹{totalProcurementCost.toLocaleString("en-IN")}</strong>, but available company capital is only <strong>₹{availableCapital.toLocaleString("en-IN")}</strong>.
                      </p>
                      <p className="text-[11px] text-amber-800 mt-1">
                        Please select <strong>Paid by Partner Out-of-Pocket</strong> to have a partner fund this restock, or add a Capital Contribution in the Partners ledger first.
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

          <div className="flex justify-end gap-3 pt-2 border-t border-[#edf1e8]">
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
              Record Movement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
