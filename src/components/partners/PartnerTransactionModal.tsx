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
  partnerBalances?: Array<any>;
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

export function PartnerTransactionModal({
  transaction,
  partners,
  partnerBalances = [],
  isOpen,
  onClose,
}: PartnerTransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(transaction?.partnerId || partners[0]?.id || "");
  const [txType, setTxType] = useState<string>(transaction?.type || "ADDITIONAL_INVESTMENT");
  const [amount, setAmount] = useState<number>(transaction ? Number(transaction.amount) : 1);

  if (!isOpen) return null;

  const isEditing = Boolean(transaction);
  const isWithdrawalOrReimburse = txType === "WITHDRAWAL" || txType === "REIMBURSEMENT";
  const currentPartnerBalance = partnerBalances.find((p) => p.id === selectedPartnerId);
  const availableLiquidCash = currentPartnerBalance ? currentPartnerBalance.withdrawableAmount : 0;
  const isExceedingWithdrawal = isWithdrawalOrReimburse && amount > availableLiquidCash + 0.01;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isExceedingWithdrawal) {
      setError(
        `Withdrawal of ₹${amount.toLocaleString("en-IN")} exceeds ${
          currentPartnerBalance?.name || "the partner"
        }'s available withdrawable balance of ₹${availableLiquidCash.toLocaleString(
          "en-IN"
        )}.`
      );
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data = {
      partnerId: (formData.get("partnerId") as string) || selectedPartnerId,
      type: (formData.get("type") as any) || txType,
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
      <div className="w-full max-w-md rounded-xl border border-[#d8ded2] bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
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
              value={selectedPartnerId}
              onChange={(e) => setSelectedPartnerId(e.target.value)}
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

          {currentPartnerBalance && isWithdrawalOrReimburse && (
            <div className="rounded-lg bg-[#f8faf6] p-3 border border-[#edf1e8] text-xs space-y-1.5">
              <div className="flex justify-between items-center text-[#20231f]">
                <span className="font-semibold">
                  Partner Stake ({currentPartnerBalance.stakePercent.toFixed(1)}% Equal Share):
                </span>
                <span className="font-bold">₹{Math.round(currentPartnerBalance.stakeAmount).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center text-[#4e584f] text-[11px]">
                <span>Immediate Liquid Cash Available:</span>
                <span className="font-bold text-emerald-900">
                  ₹{Math.round(currentPartnerBalance.withdrawableAmount).toLocaleString("en-IN")}
                </span>
              </div>
              {currentPartnerBalance.stockBackedStake > 0.01 && (
                <div className="flex justify-between items-center text-[#6b746c] text-[10px] pt-1 border-t border-[#edf1e8]">
                  <span>Preserved in Warehouse Inventory:</span>
                  <span className="font-medium text-amber-900">
                    ₹{Math.round(currentPartnerBalance.stockBackedStake).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Transaction Type *</label>
              <select
                name="type"
                required
                value={txType}
                onChange={(e) => setTxType(e.target.value)}
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
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-[#4e584f]">Amount (₹) *</label>
                {isWithdrawalOrReimburse && (
                  <span className="text-[10px] text-emerald-800 font-bold">
                    Max: ₹{availableLiquidCash.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
              <input
                type="number"
                name="amount"
                step="0.01"
                min={1}
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                placeholder="1"
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              />
            </div>
          </div>

          {isExceedingWithdrawal && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900">
              <p className="font-bold">⚠️ Exceeds Available Liquid Treasury</p>
              <p className="text-[11px] mt-0.5 text-amber-800">
                {currentPartnerBalance?.name || "This partner"} can only withdraw up to <strong>₹{availableLiquidCash.toLocaleString("en-IN")}</strong> from currently available company cash.
              </p>
            </div>
          )}

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
                <option value="PARTNER_CAPITAL">Partner Capital Fund</option>
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
              disabled={loading || isExceedingWithdrawal}
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
