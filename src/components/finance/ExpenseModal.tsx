"use client";

import { useState } from "react";
import { X, Loader2, Building2, Package, Wrench, Zap, Info } from "lucide-react";
import { createExpenseAction, updateExpenseAction } from "@/lib/actions";

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

export function ExpenseModal({ expense, orders, partners, isOpen, onClose }: ExpenseModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const initialType = expense?.type || "OPERATING_EXPENSE";
  const [selectedType, setSelectedType] = useState<string>(initialType);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    expense?.category || TYPE_CONFIG[initialType]?.defaultCategory || "DELIVERY"
  );

  if (!isOpen) return null;

  const isEditing = Boolean(expense);
  const activeConfig = TYPE_CONFIG[selectedType] || TYPE_CONFIG.OPERATING_EXPENSE;
  const ConfigIcon = activeConfig.icon;

  const recommendedCats = activeConfig.recommendedCategories;
  const otherCats = CATEGORIES.filter((c) => !recommendedCats.includes(c));

  function handleTypeChange(newType: string) {
    setSelectedType(newType);
    const config = TYPE_CONFIG[newType];
    if (config) {
      // If current category is not in recommended for new type, switch to default for new type
      if (!config.recommendedCategories.includes(selectedCategory)) {
        setSelectedCategory(config.defaultCategory);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

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
          {/* Classification Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Expense Classification Type *</label>
            <select
              name="type"
              required
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#f8faf6] px-3 py-2 text-xs font-bold text-[#20231f] focus:border-[#3f563f] focus:outline-none"
            >
              <option value="OPERATING_EXPENSE">🏢 Operating Overhead (OpEx) — Rent, Logistics, Transport, Tools</option>
              <option value="INVENTORY_PURCHASE">📦 Bulk Stock Purchase (CapEx) — Asset Purchase (Prevents Double-Counting)</option>
              <option value="CAPITAL_INVESTMENT">⚙️ Capital Investment — Equipment, Machinery, Founding Assets</option>
              <option value="OTHER">⚡ Other Miscellaneous</option>
            </select>
          </div>

          {/* Dynamic Context Banner */}
          <div className={`rounded-lg border p-3 text-xs ${activeConfig.cardBg} ${activeConfig.borderColor}`}>
            <div className="flex items-start gap-2.5">
              <ConfigIcon className={`size-4 shrink-0 mt-0.5 ${activeConfig.textColor}`} />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${activeConfig.textColor}`}>{activeConfig.title}</span>
                  <span className="rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold border border-black/10 text-gray-700">
                    {activeConfig.badge}
                  </span>
                </div>
                <p className="text-[#4e584f] text-[11px] leading-relaxed">
                  {activeConfig.descriptionHint}
                </p>
                <div className="flex items-center gap-1 text-[11px] font-medium text-[#20231f] pt-0.5">
                  <Info className="size-3 text-[#3f563f] shrink-0" />
                  <span>{activeConfig.impactSummary}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Category & Amount */}
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
                defaultValue={expense ? Number(expense.amount) : 1}
                placeholder="1000"
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              />
            </div>
          </div>

          {/* Description with Dynamic Placeholder */}
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
            <p className="mt-1 text-[10px] text-[#6b746c]">
              Provide a clear description for audit tracking.
            </p>
          </div>

          {/* Dynamic Link to Order and Paid By Partner */}
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
                <option value="">Current User</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method & Expense Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Payment Method *</label>
              <select
                name="method"
                required
                defaultValue={expense?.method || "UPI"}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-xs focus:border-[#3f563f] focus:outline-none"
              >
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
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
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-[#263326] px-4 py-2 text-xs font-medium text-white hover:bg-[#394a39] disabled:opacity-50"
            >
              {loading && <Loader2 className="size-3.5 animate-spin" />}
              {isEditing ? "Save Changes" : "Record Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
