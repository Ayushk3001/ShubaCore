"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createPaymentAction, updatePaymentAction } from "@/lib/actions";

interface PaymentModalProps {
  payment?: {
    id: string;
    orderId: string;
    amount: any;
    type: any;
    method: any;
    reference: string | null;
    paidAt: Date;
    notes: string | null;
  } | null;
  orders: Array<{ id: string; orderNumber: string; customer: { name: string }; total: any }>;
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentModal({ payment, orders, isOpen, onClose }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const isEditing = Boolean(payment);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      orderId: (formData.get("orderId") as string) || "",
      amount: Number(formData.get("amount")),
      type: formData.get("type") as "ADVANCE" | "PARTIAL" | "FINAL" | "REFUND",
      method: formData.get("method") as "UPI" | "BANK_TRANSFER" | "CASH" | "OTHER",
      reference: (formData.get("reference") as string) || undefined,
      paidAt: (formData.get("paidAt") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    };

    try {
      const res = isEditing && payment
        ? await updatePaymentAction(payment.id, data)
        : await createPaymentAction(data);

      if (!res.success) {
        setError(res.error || "Failed to record payment.");
        return;
      }
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

  const defaultPaidAt = payment
    ? new Date(payment.paidAt).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-[#d8ded2] bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#edf1e8] pb-4">
          <h2 className="text-lg font-bold text-[#20231f]">
            {isEditing ? "Edit Order Payment" : "Record Order Payment"}
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
          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Select Order *</label>
            <select
              name="orderId"
              required
              defaultValue={payment?.orderId || ""}
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
                min={1}
                required
                defaultValue={payment ? Number(payment.amount) : 1}
                placeholder="1"
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Payment Type *</label>
              <select
                name="type"
                required
                defaultValue={payment?.type || "ADVANCE"}
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
                defaultValue={payment?.method || "UPI"}
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
                defaultValue={defaultPaidAt}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Transaction Ref / UTR</label>
            <input
              type="text"
              name="reference"
              defaultValue={payment?.reference || ""}
              placeholder="e.g. UTR 429381920394"
              className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Notes</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={payment?.notes || ""}
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
              {isEditing ? "Save Changes" : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
