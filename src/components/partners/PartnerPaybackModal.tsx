"use client";

import { useState, useEffect } from "react";
import { X, Loader2, ShieldCheck, CheckCircle2, Wallet, CreditCard, Sliders } from "lucide-react";
import { createPartnerPaybackAction } from "@/lib/actions";

interface PartnerPaybackModalProps {
  partners: Array<{ id: string; name: string; isActive?: boolean }>;
  partnerBalances?: Array<any>;
  isOpen: boolean;
  onClose: () => void;
  prefillPayerId?: string;
  prefillRecipientId?: string;
}

export function PartnerPaybackModal({
  partners = [],
  partnerBalances = [],
  isOpen,
  onClose,
  prefillPayerId,
  prefillRecipientId,
}: PartnerPaybackModalProps) {
  const activePartners = partners.filter((p) => p.isActive !== false);

  // Find partner with deficit and partner with surplus
  const deficitPartner = partnerBalances.find((b) => b.investmentDeficit > 0.01);
  const surplusPartner = partnerBalances.find((b) => b.investmentSurplus > 0.01);

  const defaultPayerId = prefillPayerId || deficitPartner?.id || activePartners[0]?.id || "";
  const defaultRecipientId = prefillRecipientId || surplusPartner?.id || activePartners.find((p) => p.id !== defaultPayerId)?.id || activePartners[0]?.id || "";

  const [payerId, setPayerId] = useState<string>(defaultPayerId);
  const [recipientId, setRecipientId] = useState<string>(defaultRecipientId);

  // Settlement Amounts & Mode
  const [totalDue, setTotalDue] = useState<number>(825);
  const [settlementMode, setSettlementMode] = useState<"FULL_DIRECT" | "PROFIT_PLUS_DIRECT" | "CUSTOM_SPLIT">("PROFIT_PLUS_DIRECT");
  const [userProfitInput, setUserProfitInput] = useState<number>(0);
  const [customDirectInput, setCustomDirectInput] = useState<number>(0);

  const [description, setDescription] = useState<string>("");
  const [method, setMethod] = useState<string>("BANK_TRANSFER");
  const [occurredAt, setOccurredAt] = useState<string>(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const payerBalance = partnerBalances.find((b) => b.id === payerId);
  const recipientBalance = partnerBalances.find((b) => b.id === recipientId);
  const availableProfit = Math.max(0, payerBalance?.allocatedProfit || 0);

  useEffect(() => {
    if (isOpen) {
      const payer = prefillPayerId || deficitPartner?.id || activePartners[0]?.id || "";
      const recipient = prefillRecipientId || surplusPartner?.id || activePartners.find((p) => p.id !== payer)?.id || "";
      setPayerId(payer);
      setRecipientId(recipient);

      const pBal = partnerBalances.find((b) => b.id === payer);
      const rBal = partnerBalances.find((b) => b.id === recipient);
      const suggestedDue = Math.round(pBal?.investmentDeficit || rBal?.investmentSurplus || 825);
      const due = suggestedDue > 0 ? suggestedDue : 825;
      setTotalDue(due);

      const availP = Math.max(0, pBal?.allocatedProfit || 0);
      const maxProfit = Math.min(availP, due);

      if (availP > 0.01) {
        setSettlementMode("PROFIT_PLUS_DIRECT");
        setUserProfitInput(Math.round(maxProfit * 100) / 100);
        setCustomDirectInput(Math.round((due - maxProfit) * 100) / 100);
      } else {
        setSettlementMode("FULL_DIRECT");
        setUserProfitInput(0);
        setCustomDirectInput(due);
      }
      setError("");
    }
  }, [isOpen, prefillPayerId, prefillRecipientId]);

  // Recalculate profit input when payer changes
  useEffect(() => {
    const pBal = partnerBalances.find((b) => b.id === payerId);
    const availP = Math.max(0, pBal?.allocatedProfit || 0);
    const maxP = Math.min(availP, totalDue);

    if (settlementMode === "PROFIT_PLUS_DIRECT") {
      setUserProfitInput(Math.round(maxP * 100) / 100);
    }
  }, [payerId, totalDue]);

  if (!isOpen) return null;

  const payerPartner = activePartners.find((p) => p.id === payerId);
  const recipientPartner = activePartners.find((p) => p.id === recipientId);
  const maxUsableProfit = Math.min(availableProfit, totalDue);

  // Compute actual profitUsed and directPayment based on mode
  let profitUsed = 0;
  let directPayment = 0;

  if (settlementMode === "FULL_DIRECT") {
    profitUsed = 0;
    directPayment = totalDue;
  } else if (settlementMode === "PROFIT_PLUS_DIRECT") {
    profitUsed = Math.min(userProfitInput, maxUsableProfit);
    directPayment = Math.max(0, Math.round((totalDue - profitUsed) * 100) / 100);
  } else if (settlementMode === "CUSTOM_SPLIT") {
    profitUsed = Math.min(userProfitInput, maxUsableProfit);
    directPayment = Math.max(0, Math.round((totalDue - profitUsed) * 100) / 100);
  }

  // Validation Checks
  let validationError = "";
  if (payerId === recipientId) {
    validationError = "Payer and Recipient must be different partners.";
  } else if (totalDue <= 0) {
    validationError = "Total settlement amount must be greater than 0.";
  } else if (userProfitInput > availableProfit + 0.01 && settlementMode !== "FULL_DIRECT") {
    validationError = `You can use a maximum of ₹${Math.round(availableProfit).toLocaleString("en-IN")} from available profit.`;
  } else if (userProfitInput > totalDue + 0.01 && settlementMode !== "FULL_DIRECT") {
    validationError = `Profit used cannot exceed the total settlement amount of ₹${totalDue.toLocaleString("en-IN")}.`;
  } else if (profitUsed < 0 || directPayment < 0) {
    validationError = "Invalid payment amounts.";
  } else if (Math.abs((profitUsed + directPayment) - totalDue) > 0.01) {
    validationError = `Profit Used (₹${profitUsed}) + Direct Payment (₹${directPayment}) must equal Total Due (₹${totalDue}).`;
  }

  // Handle Mode Selection
  function handleSelectMode(mode: "FULL_DIRECT" | "PROFIT_PLUS_DIRECT" | "CUSTOM_SPLIT") {
    setSettlementMode(mode);
    if (mode === "FULL_DIRECT") {
      setUserProfitInput(0);
      setCustomDirectInput(totalDue);
    } else if (mode === "PROFIT_PLUS_DIRECT") {
      setUserProfitInput(maxUsableProfit);
      setCustomDirectInput(Math.max(0, totalDue - maxUsableProfit));
    } else if (mode === "CUSTOM_SPLIT") {
      setUserProfitInput(maxUsableProfit);
      setCustomDirectInput(Math.max(0, totalDue - maxUsableProfit));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await createPartnerPaybackAction({
        payerPartnerId: payerId,
        recipientPartnerId: recipientId,
        amount: Number(totalDue),
        profitUsed: Number(profitUsed),
        directPaymentAmount: Number(directPayment),
        settlementSource: settlementMode,
        description: description || `Payback settlement from ${payerPartner?.name} to ${recipientPartner?.name}`,
        method: directPayment > 0 ? method : "PROFIT_SHARE",
        occurredAt,
      });

      if (!res.success) {
        setError(res.error || "Failed to record payback transaction.");
        return;
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to record payback transaction.");
    } finally {
      setLoading(false);
    }
  }

  // Dynamic Button Label
  let ctaLabel = `Pay ₹${totalDue.toLocaleString("en-IN")} Directly`;
  if (profitUsed > 0 && directPayment > 0) {
    ctaLabel = `Use ₹${profitUsed.toLocaleString("en-IN")} Profit + Pay ₹${directPayment.toLocaleString("en-IN")}`;
  } else if (profitUsed > 0 && directPayment === 0) {
    ctaLabel = `Use ₹${profitUsed.toLocaleString("en-IN")} Profit Share`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-[#d8ded2] bg-white p-6 shadow-xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#edf1e8] pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-[#3f563f]" />
            <h2 className="text-lg font-bold text-[#20231f]">Pay Back Partner (Split Settlement)</h2>
          </div>
          <button onClick={onClose} type="button" className="rounded-lg p-1.5 text-[#6b746c] hover:bg-[#edf1e8]">
            <X className="size-5" />
          </button>
        </div>

        <p className="mt-2 text-xs text-[#6b746c]">
          <strong>{payerPartner?.name || "Payer"}</strong> needs to settle <strong>₹{totalDue.toLocaleString("en-IN")}</strong> with <strong>{recipientPartner?.name || "Recipient"}</strong>.
        </p>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Partner Selection Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Paying Partner (Payer) *</label>
              <select
                required
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              >
                {activePartners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Payer)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Receiving Partner (Recipient) *</label>
              <select
                required
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              >
                {activePartners.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.id === payerId}>
                    {p.name} (Recipient)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Settlement Summary Banner */}
          <div className="rounded-xl border border-[#d8ded2] bg-[#f8faf6] p-3.5 text-xs space-y-2">
            <span className="font-bold text-[#20231f] text-xs uppercase tracking-wider">Settlement Summary</span>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#edf1e8]">
              <div>
                <span className="text-[#6b746c] text-[11px]">Total Amount Due:</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={totalDue}
                    onChange={(e) => {
                      const newDue = Number(e.target.value) || 0;
                      setTotalDue(newDue);
                      if (userProfitInput > newDue) {
                        setUserProfitInput(Math.min(availableProfit, newDue));
                      }
                    }}
                    className="w-28 rounded border border-[#d8ded2] px-2 py-0.5 font-bold text-sm text-[#20231f] focus:border-[#3f563f] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <span className="text-[#6b746c] text-[11px]">Available Profit:</span>
                <p className="font-bold text-sm text-purple-900 mt-0.5">
                  ₹{Math.round(availableProfit).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>

          {/* Settlement Options Section */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#20231f]">How would you like to settle ₹{totalDue.toLocaleString("en-IN")}?</label>

            {/* Option 1: Pay Full Amount Directly */}
            <div
              onClick={() => handleSelectMode("FULL_DIRECT")}
              className={`cursor-pointer rounded-xl border p-3.5 transition space-y-1 ${
                settlementMode === "FULL_DIRECT"
                  ? "border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600"
                  : "border-[#d8ded2] bg-white hover:bg-[#fbfcf9]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="settlementMode"
                    checked={settlementMode === "FULL_DIRECT"}
                    onChange={() => handleSelectMode("FULL_DIRECT")}
                    className="size-4 text-emerald-700 focus:ring-emerald-600"
                  />
                  <span className="font-bold text-xs text-[#20231f]">Pay Full Amount Directly</span>
                </div>
                <CreditCard className="size-4 text-emerald-800" />
              </div>
              <p className="text-[11px] text-[#6b746c] pl-6">
                Pay the entire ₹{totalDue.toLocaleString("en-IN")} using Bank Transfer, UPI, Cash, etc. Your ₹{Math.round(availableProfit).toLocaleString("en-IN")} profit remains untouched.
              </p>
            </div>

            {/* Option 2: Use Available Profit + Pay Remaining (RECOMMENDED) */}
            {availableProfit > 0.01 ? (
              <div
                onClick={() => handleSelectMode("PROFIT_PLUS_DIRECT")}
                className={`cursor-pointer rounded-xl border p-3.5 transition space-y-2.5 ${
                  settlementMode === "PROFIT_PLUS_DIRECT"
                    ? "border-purple-600 bg-purple-50/60 ring-1 ring-purple-600"
                    : "border-[#d8ded2] bg-white hover:bg-[#fbfcf9]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="settlementMode"
                      checked={settlementMode === "PROFIT_PLUS_DIRECT"}
                      onChange={() => handleSelectMode("PROFIT_PLUS_DIRECT")}
                      className="size-4 text-purple-700 focus:ring-purple-600"
                    />
                    <span className="font-bold text-xs text-purple-950 flex items-center gap-1.5">
                      Use Available Profit + Pay Remaining
                      <span className="rounded bg-purple-200 px-1.5 py-0.5 text-[9px] font-extrabold text-purple-900 uppercase">
                        RECOMMENDED
                      </span>
                    </span>
                  </div>
                  <Wallet className="size-4 text-purple-800" />
                </div>

                {settlementMode === "PROFIT_PLUS_DIRECT" && (
                  <div className="pl-6 pt-1 space-y-2 text-xs">
                    <div className="flex items-center justify-between bg-white/80 p-2 rounded-lg border border-purple-200">
                      <span className="text-[#4e584f] font-medium text-[11px]">Profit Amount to Use:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-purple-900 font-bold">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={maxUsableProfit}
                          value={userProfitInput}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setUserProfitInput(val);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-24 rounded border border-purple-300 bg-white px-2 py-1 font-bold text-sm text-purple-950 focus:border-purple-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] font-medium text-purple-900 pt-0.5">
                      <span>Direct Payment Required:</span>
                      <span className="font-bold text-xs">
                        ₹{directPayment.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Option 3: Custom Split */}
            <div
              onClick={() => handleSelectMode("CUSTOM_SPLIT")}
              className={`cursor-pointer rounded-xl border p-3.5 transition space-y-2 ${
                settlementMode === "CUSTOM_SPLIT"
                  ? "border-amber-600 bg-amber-50/60 ring-1 ring-amber-600"
                  : "border-[#d8ded2] bg-white hover:bg-[#fbfcf9]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="settlementMode"
                    checked={settlementMode === "CUSTOM_SPLIT"}
                    onChange={() => handleSelectMode("CUSTOM_SPLIT")}
                    className="size-4 text-amber-700 focus:ring-amber-600"
                  />
                  <span className="font-bold text-xs text-[#20231f]">Custom Split</span>
                </div>
                <Sliders className="size-4 text-amber-800" />
              </div>

              {settlementMode === "CUSTOM_SPLIT" && (
                <div className="pl-6 pt-1 space-y-2 text-xs">
                  <p className="text-[11px] text-[#6b746c]">
                    Choose custom split between profit share and direct payment:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-2 rounded-lg border border-amber-200">
                      <label className="block text-[10px] font-semibold text-[#4e584f]">Profit to Use (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={maxUsableProfit}
                        value={userProfitInput}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setUserProfitInput(val);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 w-full rounded border border-[#d8ded2] px-2 py-1 font-bold text-xs focus:outline-none"
                      />
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-amber-200">
                      <label className="block text-[10px] font-semibold text-[#4e584f]">Direct Payment (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        readOnly
                        value={directPayment}
                        className="mt-1 w-full rounded border border-[#d8ded2] bg-slate-50 px-2 py-1 font-bold text-xs text-slate-700 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Validation Warning */}
          {validationError && (
            <div className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900 border border-amber-300 font-semibold">
              ⚠️ {validationError}
            </div>
          )}

          {/* ⚡ Live Settlement Breakdown Preview */}
          <div className="rounded-xl border border-[#edf1e8] bg-[#f8faf6] p-3.5 text-xs space-y-2">
            <span className="font-bold text-[#20231f] text-xs">⚡ Live Settlement Breakdown Preview</span>
            <div className="space-y-1 pt-1 border-t border-[#edf1e8] text-[11px]">
              <div className="flex justify-between items-center text-[#4e584f]">
                <span>Total Settlement:</span>
                <span className="font-bold text-[#20231f]">₹{totalDue.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center text-purple-900 font-medium">
                <span>💰 Profit Used:</span>
                <span className="font-bold">₹{profitUsed.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-900 font-medium">
                <span>💳 Direct Payment:</span>
                <span className="font-bold">₹{directPayment.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center text-[#20231f] font-bold border-t border-[#edf1e8] pt-1">
                <span>Total Settled:</span>
                <span>₹{totalDue.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* ⚡ Live Capital Adjustment Preview */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 text-xs space-y-2">
            <span className="font-bold text-emerald-950 text-xs">⚡ Live Capital Adjustment Preview</span>
            <div className="space-y-1 pt-1 border-t border-emerald-200 text-[11px]">
              <div className="flex justify-between items-center text-emerald-950 font-semibold">
                <span>➕ {payerPartner?.name || "Payer"} Contributed Capital:</span>
                <span className="font-bold">+₹{totalDue.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center text-rose-950 font-semibold border-b border-emerald-200 pb-1">
                <span>➖ {recipientPartner?.name || "Recipient"} Contributed Capital:</span>
                <span className="font-bold">-₹{totalDue.toLocaleString("en-IN")}</span>
              </div>
              <div className="pt-1 text-[10px] text-[#5f685e] space-y-0.5">
                <span className="font-bold text-[#20231f]">Settlement Funding:</span>
                <div className="flex justify-between">
                  <span>💰 Profit Share Reinvested: ₹{profitUsed.toLocaleString("en-IN")}</span>
                  <span>💳 Direct Payment Out-of-pocket: ₹{directPayment.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Options */}
          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Notes / Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Payback settlement from ${payerPartner?.name || "Payer"} to ${recipientPartner?.name || "Recipient"}`}
              className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Payment Method</label>
              {directPayment === 0 ? (
                <input
                  type="text"
                  readOnly
                  value="Earned Profit Share"
                  className="mt-1 w-full rounded-lg border border-purple-300 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-900 focus:outline-none"
                />
              ) : (
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
                >
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash</option>
                  <option value="OTHER">Other</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Date</label>
              <input
                type="date"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              />
            </div>
          </div>

          {/* Form Actions */}
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
              disabled={loading || Boolean(validationError)}
              className="flex items-center gap-2 rounded-lg bg-[#263326] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#394a39] disabled:opacity-50 transition shadow-sm"
            >
              {loading && <Loader2 className="size-3.5 animate-spin" />}
              {ctaLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
