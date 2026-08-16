"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createPartnerTransactionAction, updatePartnerTransactionAction } from "@/lib/actions";

interface PartnerTransactionModalProps {
  transaction?: {
    id: string;
    partnerId: string;
    type: any;
    amount: any;
    description: string;
    method: any;
    occurredAt: Date;
  } | null;
  partners: Array<{ id: string; name: string }>;
  isOpen: boolean;
  onClose: () => void;
}

const TYPES = [
  "INITIAL_INVESTMENT",
  "ADDITIONAL_INVESTMENT",
  "EXPENSE_PAID",
  "REIMBURSEMENT",
  "WITHDRAWAL",
  "OTHER",
];

export function PartnerTransactionModal({ transaction, partners, isOpen, onClose }: PartnerTransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const isEditing = Boolean(transaction);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      partnerId: (formData.get("partnerId") as string) || "",
      type: formData.get("type") as any,
      amount: Number(formData.get("amount")),
      description: (formData.get("description") as string) || "",
      method: (formData.get("method") as any) || undefined,
      occurredAt: (formData.get("occurredAt") as string) || undefined,
    };

    try {
      const res = isEditing && transaction
        ? await updatePartnerTransactionAction(transaction.id, data)
        : await createPartnerTransactionAction(data);

      if (!res.success) {
        setError(res.error || "Failed to record transaction.");
        return;
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to record transaction.");
      }
    } finally {
      setLoading(false);
    }
  }

  const defaultOccurredAt = transaction
    ? new Date(transaction.occurredAt).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-[#d8ded2] bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#edf1e8] pb-4">
          <h2 className="text-lg font-bold text-[#20231f]">
            {isEditing ? "Edit Partner Transaction" : "Record Partner Capital Transaction"}
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
            <label className="block text-xs font-semibold text-[#4e584f]">Partner *</label>
            <select
              name="partnerId"
              required
              defaultValue={transaction?.partnerId || ""}
              className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
            >
              <option value="">Select partner...</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Transaction Type *</label>
              <select
                name="type"
                required
                defaultValue={transaction?.type || "ADDITIONAL_INVESTMENT"}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
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
                min={1}
                required
                defaultValue={transaction ? Number(transaction.amount) : 1}
                placeholder="1"
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
              defaultValue={transaction?.description || ""}
              placeholder="e.g. Initial capital contribution for machinery"
              className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Method</label>
              <select
                name="method"
                defaultValue={transaction?.method || "BANK_TRANSFER"}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              >
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="CASH">Cash</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Date</label>
              <input
                type="date"
                name="occurredAt"
                defaultValue={defaultOccurredAt}
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
              {isEditing ? "Save Changes" : "Save Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
