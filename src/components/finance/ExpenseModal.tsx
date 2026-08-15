"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createExpenseAction } from "@/lib/actions";

interface ExpenseModalProps {
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

export function ExpenseModal({ orders, partners, isOpen, onClose }: ExpenseModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      category: formData.get("category") as any,
      amount: Number(formData.get("amount")),
      description: formData.get("description") as string,
      orderId: formData.get("orderId") as string,
      paidById: formData.get("paidById") as string,
      method: formData.get("method") as any,
      expenseDate: formData.get("expenseDate") as string,
    };

    try {
      await createExpenseAction(data);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-[#d8ded2] bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#edf1e8] pb-4">
          <h2 className="text-lg font-bold text-[#20231f]">Record Business Expense</h2>
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
              <label className="block text-xs font-semibold text-[#4e584f]">Category *</label>
              <select
                name="category"
                required
                defaultValue="MATERIALS"
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Amount (₹) *</label>
              <input
                type="number"
                name="amount"
                step="0.01"
                required
                placeholder="1500"
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
              placeholder="e.g. 50 Jute Bags from Wholesale Supplier"
              className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Link to Order (Optional)</label>
              <select
                name="orderId"
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
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
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Payment Method *</label>
              <select
                name="method"
                required
                defaultValue="UPI"
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
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
                defaultValue={new Date().toISOString().split("T")[0]}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              />
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
              Record Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
