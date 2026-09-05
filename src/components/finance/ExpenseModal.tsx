"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Building2, Package, Wrench, Zap, Info, AlertTriangle, ArrowRightCircle, Trash2 } from "lucide-react";
import { createExpenseAction, updateExpenseAction, deleteExpenseAction } from "@/lib/actions";

interface ExpenseModalProps {
  expense?: {
    id: string;
    category: any;
    type?: any;
    amount: any;
    description: string;
    orderId: string | null;
    paidById: string | null;
    method: any;
    expenseDate: Date;
  } | null;
  orders: Array<{ id: string; orderNumber: string }>;
  partners: Array<{ id: string; name: string }>;
  availableCapital?: number;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  "MATERIALS",
  "PACKAGING",
  "PRINTING",
  "DELIVERY",
  "MARKETING",
  "SOFTWARE",
  "EQUIPMENT",
  "SUPPLIER_PAYMENT",
  "MISCELLANEOUS",
];

const TYPE_CONFIG: Record<
  string,
  {
    title: string;
    badge: string;
    icon: typeof Building2;
    cardBg: string;
    borderColor: string;
    textColor: string;
    defaultCategory: string;
    recommendedCategories: string[];
    descriptionHint: string;
    placeholder: string;
    orderLabel: string;
    impactSummary: string;
  }
> = {
  OPERATING_EXPENSE: {
    title: "Operating Overhead (OpEx)",
    badge: "🏢 OpEx — Profit Overhead",
    icon: Building2,
    cardBg: "bg-blue-50/80",
    borderColor: "border-blue-200",
    textColor: "text-blue-900",
    defaultCategory: "DELIVERY",
    recommendedCategories: ["DELIVERY", "MARKETING", "SOFTWARE", "PRINTING", "MISCELLANEOUS"],
    descriptionHint: "Recurring operational overhead costs like rent, marketing, software, courier, and utilities.",
    placeholder: "e.g. Monthly Warehouse Rent, Meta Ads Campaign, Bluedream Courier Charges",
    orderLabel: "Link to Order (Optional Overhead)",
    impactSummary: "Deducted directly from Gross Profit to calculate Net Operating Profit.",
  },
  INVENTORY_PURCHASE: {
    title: "Bulk Stock Purchase (CapEx)",
    badge: "📦 CapEx — Inventory Asset",
    icon: Package,
    cardBg: "bg-amber-50/80",
    borderColor: "border-amber-200",
    textColor: "text-amber-900",
    defaultCategory: "MATERIALS",
    recommendedCategories: ["MATERIALS", "PACKAGING", "SUPPLIER_PAYMENT"],
    descriptionHint: "Bulk stock or raw material procurement from wholesale suppliers.",
    placeholder: "e.g. 500 Kraft Box Containers, 100 Jute Bags from Wholesale Supplier",
    orderLabel: "Link to Specific Client Batch (Optional)",
    impactSummary: "Builds warehouse inventory valuation & COGS upon sales (prevents double-counting).",
  },
  CAPITAL_INVESTMENT: {
    title: "Capital Investment (CapEx)",
    badge: "⚙️ CapEx — Fixed Asset",
    icon: Wrench,
    cardBg: "bg-purple-50/80",
    borderColor: "border-purple-200",
    textColor: "text-purple-900",
    defaultCategory: "EQUIPMENT",
    recommendedCategories: ["EQUIPMENT", "SOFTWARE", "MISCELLANEOUS"],
    descriptionHint: "Long-term equipment, machinery, tools, laptops, or founding physical assets.",
    placeholder: "e.g. Laser Engraving Machine, Industrial Printer, Billing Laptop",
    orderLabel: "Link to Project / Custom Order (Optional)",
    impactSummary: "Tracked as fixed company capital assets under Capital Recovery.",
  },
  OTHER: {
    title: "Other Miscellaneous",
    badge: "⚡ Miscellaneous",
    icon: Zap,
    cardBg: "bg-gray-50/80",
    borderColor: "border-gray-200",
    textColor: "text-gray-900",
    defaultCategory: "MISCELLANEOUS",
    recommendedCategories: ["MISCELLANEOUS"],
    descriptionHint: "General unclassified business expenses.",
    placeholder: "e.g. Emergency Maintenance, Office Refreshments",
    orderLabel: "Link to Order (Optional)",
    impactSummary: "General business expense record.",
  },
};

export function ExpenseModal({ expense, orders, partners, availableCapital = 0, isOpen, onClose }: ExpenseModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const initialType = expense?.type || "OPERATING_EXPENSE";
  const [selectedType, setSelectedType] = useState<string>(initialType);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    expense?.category || TYPE_CONFIG[initialType]?.defaultCategory || "DELIVERY"
  );
  const [selectedMethod, setSelectedMethod] = useState<string>(expense?.method || "UPI");
  const [amountVal, setAmountVal] = useState<number>(expense ? Number(expense.amount) : 1000);

  useEffect(() => {
    if (expense) {
      const type = expense.type || "OPERATING_EXPENSE";
      setSelectedType(type);
      setSelectedCategory(expense.category || TYPE_CONFIG[type]?.defaultCategory || "DELIVERY");
      setSelectedMethod(expense.method || "UPI");
      setAmountVal(Number(expense.amount) || 0);
    } else {
      setSelectedType("OPERATING_EXPENSE");
      setSelectedCategory("DELIVERY");
      setSelectedMethod("UPI");
      setAmountVal(1000);
    }
    setError("");
  }, [expense, isOpen]);

  if (!isOpen) return null;

  const isEditing = Boolean(expense);
  const activeConfig = TYPE_CONFIG[selectedType] || TYPE_CONFIG.OPERATING_EXPENSE;
  const ConfigIcon = activeConfig.icon;

  const recommendedCats = activeConfig.recommendedCategories;
  const otherCats = CATEGORIES.filter((c) => !recommendedCats.includes(c));

  const isExceedingCapital =
    selectedMethod === "PARTNER_CAPITAL" &&
    amountVal > availableCapital;

  function handleTypeChange(newType: string) {
    setSelectedType(newType);
    const config = TYPE_CONFIG[newType];
    if (config) {
      if (!config.recommendedCategories.includes(selectedCategory)) {
        setSelectedCategory(config.defaultCategory);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isExceedingCapital) {
      setError(
        `Insufficient company capital (Available: ₹${availableCapital.toLocaleString(
          "en-IN"
        )}, Required: ₹${amountVal.toLocaleString(
          "en-IN"
        )}). Please select a Partner who paid out-of-pocket (UPI, Cash, Bank Transfer) or inject capital first.`
      );
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data = {
      category: (formData.get("category") as any) || selectedCategory,
      type: selectedType || "OPERATING_EXPENSE",
      amount: Number(formData.get("amount")),
      description: (formData.get("description") as string) || "",
      orderId: (formData.get("orderId") as string) || undefined,
      paidById: (formData.get("paidById") as string) || undefined,
      method: formData.get("method") as any,
      expenseDate: (formData.get("expenseDate") as string) || undefined,
    };

    try {
      const res = isEditing && expense
        ? await updateExpenseAction(expense.id, data)
        : await createExpenseAction(data);

      if (!res.success) {
        setError(res.error || "Failed to record expense.");
        return;
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to record expense.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!expense) return;
    if (!confirm(`Are you sure you want to permanently delete this expense of ₹${Number(expense.amount).toLocaleString()} (${expense.description})?`)) {
      return;
    }
    setDeleting(true);
    setError("");
    try {
      const res = await deleteExpenseAction(expense.id);
      if (!res.success) {
        setError(res.error || "Failed to delete expense.");
        return;
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to delete expense.");
      }
    } finally {
      setDeleting(false);
    }
  }

  const defaultDate = expense
    ? new Date(expense.expenseDate).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-[#d8ded2] bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#edf1e8] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#20231f]">
              {isEditing ? "Edit Business Expense" : "Record Business Expense"}
            </h2>
            <p className="text-xs text-[#6b746c]">
              Categorize expenses accurately for OpEx vs CapEx accounting.
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
            <label className="block text-xs font-semibold text-[#4e584f]">Expense Classification *</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                const isSelected = selectedType === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleTypeChange(key)}
                    className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition ${
                      isSelected
                        ? `${config.cardBg} ${config.borderColor} ring-1 ring-[#3f563f]`
                        : "border-[#d8ded2] bg-[#fdfdfc] hover:bg-[#edf1e8]"
                    }`}
                  >
                    <span className="text-xs font-semibold text-[#20231f]">{config.title}</span>
                    <span className="mt-0.5 text-[10px] text-[#6b746c] line-clamp-1">{config.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`rounded-lg border p-3 ${activeConfig.cardBg} ${activeConfig.borderColor}`}>
            <div className="flex items-start gap-2">
              <ConfigIcon className={`size-4 shrink-0 mt-0.5 ${activeConfig.textColor}`} />
              <div className="space-y-0.5 text-xs">
                <p className={`font-semibold ${activeConfig.textColor}`}>{activeConfig.badge}</p>
                <p className="text-[11px] text-[#4e584f]">{activeConfig.descriptionHint}</p>
                <p className="text-[10px] font-medium text-[#6b746c] pt-1">
                  Accounting Impact: <span className="italic">{activeConfig.impactSummary}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Category *</label>
              <select
                name="category"
                required
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-xs focus:border-[#3f563f] focus:outline-none"
              >
                <optgroup label={`Recommended for ${activeConfig.title}`}>
                  {recommendedCats.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </optgroup>
                {otherCats.length > 0 && (
                  <optgroup label="Other Categories">
                    {otherCats.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Amount (₹) *</label>
              <input
                type="number"
                name="amount"
                step="0.01"
                min={1}
                required
                value={amountVal}
                onChange={(e) => setAmountVal(Number(e.target.value) || 0)}
                placeholder="1000"
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Description *</label>
            <input
              type="text"
              name="description"
              required
              defaultValue={expense?.description || ""}
              placeholder={activeConfig.placeholder}
              className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-xs focus:border-[#3f563f] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">{activeConfig.orderLabel}</label>
              <select
                name="orderId"
                defaultValue={expense?.orderId || ""}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-xs focus:border-[#3f563f] focus:outline-none"
              >
                <option value="">General Overhead</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Paid By Partner</label>
              <select
                name="paidById"
                defaultValue={expense?.paidById || ""}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-xs focus:border-[#3f563f] focus:outline-none"
              >
                <option value="">Company Treasury / No Partner</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Payment Method *</label>
              <select
                name="method"
                required
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-xs focus:border-[#3f563f] focus:outline-none"
              >
                <option value="UPI">UPI (Partner Out-of-Pocket)</option>
                <option value="BANK_TRANSFER">Bank Transfer (Partner Out-of-Pocket)</option>
                <option value="CASH">Cash (Partner Out-of-Pocket)</option>
                <option value="PARTNER_CAPITAL">🏛️ Company Capital Fund (Avail: ₹{availableCapital.toLocaleString("en-IN")})</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Expense Date</label>
              <input
                type="date"
                name="expenseDate"
                defaultValue={defaultDate}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-xs focus:border-[#3f563f] focus:outline-none"
              />
            </div>
          </div>

          {isExceedingCapital && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 space-y-2 text-xs">
              <div className="flex items-start gap-2 text-amber-900">
                <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-bold">Insufficient Company Capital</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    This expense is <strong>₹{amountVal.toLocaleString("en-IN")}</strong>, but available company capital is only <strong>₹{availableCapital.toLocaleString("en-IN")}</strong>.
                  </p>
                  <p className="text-[11px] text-amber-800 mt-1">
                    Please switch payment method to <strong>UPI, Cash, or Bank Transfer</strong> with a partner selected to credit their invested capital.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMethod("UPI")}
                className="flex items-center gap-1.5 rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 transition"
              >
                <ArrowRightCircle className="size-3.5" />
                Switch to Partner Out-of-Pocket (UPI)
              </button>
            </div>
          )}

          {selectedMethod === "PARTNER_CAPITAL" && !isExceedingCapital && (
            <div className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900 border border-amber-200 font-medium flex items-center gap-2">
              <Info className="size-4 text-amber-800 shrink-0" />
              <span>🏛️ <strong>Company Capital Fund</strong>: This expense will be paid directly out of the liquid company capital treasury.</span>
            </div>
          )}

          {selectedMethod !== "PARTNER_CAPITAL" && (
            <div className="rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-900 border border-emerald-200 font-medium flex items-center gap-2">
              <Info className="size-4 text-emerald-800 shrink-0" />
              <span>👤 <strong>Partner Out-of-Pocket</strong>: Automatically credited to the paying partner's invested capital balance.</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-[#edf1e8]">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading || deleting}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50"
              >
                {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                Delete Expense
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#d8ded2] px-4 py-2 text-xs font-medium text-[#4e584f] hover:bg-[#edf1e8]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || deleting || isExceedingCapital}
                className="flex items-center gap-2 rounded-lg bg-[#263326] px-4 py-2 text-xs font-medium text-white hover:bg-[#394a39] disabled:opacity-50"
              >
                {loading && <Loader2 className="size-3.5 animate-spin" />}
                {isEditing ? "Save Changes" : "Record Expense"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
