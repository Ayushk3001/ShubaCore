"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createPaymentAction } from "@/lib/actions";

interface PaymentModalProps {
  orders: Array<{ id: string; orderNumber: string; customer: { name: string }; total: any }>;
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentModal({ orders, isOpen, onClose }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      orderId: formData.get("orderId") as string,
      amount: Number(formData.get("amount")),
      type: formData.get("type") as "ADVANCE" | "PARTIAL" | "FINAL" | "REFUND",
      method: formData.get("method") as "UPI" | "BANK_TRANSFER" | "CASH" | "OTHER",
      reference: formData.get("reference") as string,
      paidAt: formData.get("paidAt") as string,
      notes: formData.get("notes") as string,
    };

    try {
      await createPaymentAction(data);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to record payment.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-[#d8ded2] bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#edf1e8] pb-4">
          <h2 className="text-lg font-bold text-[#20231f]">Record Order Payment</h2>
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
            <label className="block text-xs font-semibold text-[#4e584f]">Select Order *</label>
            <select
              name="orderId"
              required
              className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
            >
              <option value="">Select order...</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} - {o.customer.name} (Total: ₹{Number(o.total).toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Amount (₹) *</label>
              <input
                type="number"
                name="amount"
                step="0.01"
                required
                placeholder="2000"
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Payment Type *</label>
              <select
                name="type"
                required
                defaultValue="ADVANCE"
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              >
                <option value="ADVANCE">ADVANCE</option>
                <option value="PARTIAL">PARTIAL</option>
                <option value="FINAL">FINAL</option>
                <option value="REFUND">REFUND</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Method *</label>
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
              <label className="block text-xs font-semibold text-[#4e584f]">Payment Date</label>
              <input
                type="date"
                name="paidAt"
                defaultValue={new Date().toISOString().split("T")[0]}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Transaction Ref / UTR</label>
            <input
              type="text"
              name="reference"
              placeholder="e.g. UTR 429381920394"
              className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Notes</label>
            <textarea
              name="notes"
              rows={2}
              placeholder="Payment remarks..."
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
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
