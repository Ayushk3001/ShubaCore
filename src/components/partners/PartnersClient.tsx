"use client";

import { useState } from "react";
import { Plus, Users, Wallet, ArrowUpRight, ArrowDownRight, Shield, UserPlus, Edit, Trash2, ArrowUp, ArrowDown, Loader2, Package, Handshake } from "lucide-react";
import { PartnerTransactionModal } from "./PartnerTransactionModal";
import { AddPartnerModal } from "./AddPartnerModal";
import { PartnerPaybackModal } from "./PartnerPaybackModal";
import { calculateProfitMetrics, calculatePartnerBalances } from "@/lib/profit";
import { removePartnerUserAction, deletePartnerTransactionAction } from "@/lib/actions";

export function PartnersClient({
  partners,
  transactions,
  expenses = [],
  orders = [],
  products = [],
  payments = [],
}: {
  partners: Array<any>;
  transactions: Array<any>;
  expenses?: Array<any>;
  orders?: Array<any>;
  products?: Array<any>;
  payments?: Array<any>;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [isPaybackModalOpen, setIsPaybackModalOpen] = useState(false);
  const [paybackPayerId, setPaybackPayerId] = useState<string | undefined>(undefined);
  const [paybackRecipientId, setPaybackRecipientId] = useState<string | undefined>(undefined);
  const [deactivatingPartnerId, setDeactivatingPartnerId] = useState<string | null>(null);

  const { netProfit, totalRevenue, availableCompanyCash, totalCapitalInvested, directPartnerInvestments } = calculateProfitMetrics({
    orders,
    expenses,
    partnerTransactions: transactions,
    products,
    payments,
  });
  const {
    partnerBalances,
    totalPartnerContributed,
    totalPartnerWithdrawn,
    totalPartnerAllocatedProfit,
    totalWithdrawableCapital,
    availableCompanyCapital,
  } = calculatePartnerBalances({
    partners,
    partnerTransactions: transactions,
    expenses,
    netProfit,
    totalRevenue,
    payments,
  });

  const liquidCapital = availableCompanyCapital > 0 ? availableCompanyCapital : availableCompanyCash;

  async function handleRemovePartner(id: string, name: string) {
    if (!confirm(`Are you sure you want to remove ${name} as a partner? Their historical transactions will remain in audit logs, but future profit allocation will only be split among active remaining partners.`)) {
      return;
    }

    setDeactivatingPartnerId(id);
    try {
      const res = await removePartnerUserAction(id);
      if (!res.success) {
        alert(res.error || "Failed to remove partner.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to remove partner.");
    } finally {
      setDeactivatingPartnerId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#20231f]">Partners & Equity Ledger</h1>
          <p className="mt-1 text-sm text-[#6b746c]">
            Track capital investments, reimbursements, withdrawals, out-of-pocket business expenses, and real-time withdrawable profit balances.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setPaybackPayerId(undefined);
              setPaybackRecipientId(undefined);
              setIsPaybackModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-950 transition hover:bg-amber-100 shadow-sm"
          >
            <Handshake className="size-4 text-amber-800" />
            Pay Back Partner
          </button>
          <button
            onClick={() => setIsAddPartnerOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d8ded2] bg-white px-4 py-2 text-sm font-medium text-[#20231f] transition hover:bg-[#edf1e8] shadow-sm"
          >
            <UserPlus className="size-4" />
            Add Partner
          </button>
          <button
            onClick={() => {
              setEditingTransaction(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#263326] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#394a39] shadow-sm"
          >
            <Plus className="size-4" />
            Log Capital Transaction
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-5 shadow-sm">
          <div className="flex items-center justify-between text-emerald-950">
            <span className="text-xs font-semibold uppercase tracking-wider">Available Company Capital</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-200 text-emerald-900">
              <Wallet className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-950">₹{liquidCapital.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-emerald-800">Current liquid treasury for payouts & stock</p>
        </div>

        <div className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#6b746c]">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Capital Invested</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
              <Shield className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-[#20231f]">₹{totalPartnerContributed.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-[#8a948b]">Contributed capital basis across partners</p>
        </div>

        <div className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#6b746c]">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Business Profit</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-purple-100 text-purple-800">
              <ArrowUpRight className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-purple-950">₹{netProfit.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-[#8a948b]">Split dynamically according to stake %</p>
        </div>

        <div className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#6b746c]">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Withdrawals Taken</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-rose-100 text-rose-800">
              <ArrowDownRight className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-[#20231f]">₹{totalPartnerWithdrawn.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-[#8a948b]">Cash payouts drawn from treasury</p>
        </div>
      </div>

      {/* Stake & Withdrawable Allocation Formula Banner */}
      <div className="rounded-xl border border-[#d8ded2] bg-[#fcfdfa] p-4 text-xs text-[#5f685e] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#20231f] text-sm">📐 Equal Partner Stake & Investment Split Settlement Formula</span>
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
            Equal Equity & Split Rules
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px]">
          <div className="rounded-lg bg-white p-3 border border-[#edf1e8] space-y-1">
            <span className="font-bold text-blue-900">1. Equal Stake & Profit Ownership</span>
            <p className="text-[#4e584f]">
              <code>100% / Active Partners Count</code>
            </p>
            <p className="text-[10px] text-[#6b746c]">All active partners own equal stake and share profits equally.</p>
          </div>
          <div className="rounded-lg bg-white p-3 border border-[#edf1e8] space-y-1">
            <span className="font-bold text-purple-900">2. Investment Split Responsibility</span>
            <p className="text-[#4e584f]">
              <code>Total Invested Capital / Active Partners</code>
            </p>
            <p className="text-[10px] text-[#6b746c]">Partners who invest less owe their equal split of the total investment.</p>
          </div>
          <div className="rounded-lg bg-white p-3 border border-[#edf1e8] space-y-1">
            <span className="font-bold text-emerald-900">3. Settlement via Profit or Cash</span>
            <p className="text-[#4e584f]">
              <code>Deficit paid from Profit Share or Payments</code>
            </p>
            <p className="text-[10px] text-[#6b746c]">Profit share pays down investment deficit before cash becomes withdrawable.</p>
          </div>
        </div>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {partners.map((partner) => {
          const detail = partnerBalances.find((b) => b.id === partner.id);
          const directInvestments = detail ? detail.directInvestments : 0;
          const outOfPocket = detail ? detail.outOfPocketExpenses : 0;
          const totalInvested = directInvestments + outOfPocket;
          const withdrawals = detail ? detail.totalWithdrawn : 0;
          const allocatedProfit = detail ? detail.allocatedProfit : 0;
          const stakePercent = detail ? detail.stakePercent : 0;
          const stakeAmount = detail ? detail.stakeAmount : 0;
          const withdrawableAmount = detail ? detail.withdrawableAmount : 0;
          const stockBackedStake = detail ? detail.stockBackedStake : 0;
          const payableAmount = detail ? detail.payableAmount : 0;
          const investmentDeficit = detail ? detail.investmentDeficit : 0;
          const investmentSurplus = detail ? detail.investmentSurplus : 0;
          const profitUsedForSplit = detail ? detail.profitUsedForInvestmentSplit : 0;
          const remainingDeficit = detail ? detail.remainingInvestmentDeficit : 0;
          const status = detail ? detail.status : "SETTLED";
          const isActive = partner.isActive !== false;

          return (
            <div
              key={partner.id}
              className={`rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm space-y-4 ${
                !isActive ? "opacity-60 bg-slate-50" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-[#edf1e8] font-bold text-[#3f563f]">
                    {partner.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[#20231f]">{partner.name}</p>
                      {!isActive && (
                        <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                          Past Partner
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6b746c]">{partner.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-[#edf1e8] px-2.5 py-1 text-xs font-bold text-[#263326] border border-[#d8ded2]">
                    {stakePercent.toFixed(1)}% Equal Stake
                  </span>
                  {isActive && (
                    <button
                      title="Remove Partner"
                      onClick={() => handleRemovePartner(partner.id, partner.name)}
                      disabled={deactivatingPartnerId === partner.id}
                      className="inline-flex items-center gap-1 rounded-md p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      {deactivatingPartnerId === partner.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Total Stake Card */}
              <div className="rounded-lg bg-[#f8faf6] p-3 border border-[#edf1e8] flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6b746c]">
                    Total Equity Owned
                  </span>
                  <p className="text-lg font-bold text-[#20231f] mt-0.5">
                    ₹{Math.round(stakeAmount).toLocaleString()}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <span className="text-[#8a948b]">Equal Profit Share</span>
                  <p className="font-bold text-blue-900 mt-0.5">
                    +₹{Math.round(allocatedProfit).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-t border-[#edf1e8] pt-3">
                <div>
                  <span className="text-[#8a948b]">Capital Injected</span>
                  <p className="font-bold text-emerald-900 mt-0.5">₹{totalInvested.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[#8a948b]">Total Withdrawn</span>
                  <p className="font-bold text-rose-800 mt-0.5">₹{withdrawals.toLocaleString()}</p>
                </div>
              </div>

              {/* Investment Split Equalization Details */}
              {isActive && (
                <div className="rounded-lg bg-[#fcfdfa] p-2.5 border border-[#edf1e8] space-y-1 text-[11px]">
                  {investmentSurplus > 0.01 ? (
                    <div className="flex justify-between items-center text-emerald-900">
                      <span>Over-Invested Surplus:</span>
                      <span className="font-bold">+₹{Math.round(investmentSurplus).toLocaleString()}</span>
                    </div>
                  ) : investmentDeficit > 0.01 ? (
                    <div className="flex justify-between items-center text-amber-900 font-medium">
                      <span>Investment Split Deficit:</span>
                      <span className="font-bold text-rose-900">₹{Math.round(investmentDeficit).toLocaleString()}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-emerald-800 text-[10px]">
                      <span>Investment Split Status:</span>
                      <span className="font-bold">Fully Equalized</span>
                    </div>
                  )}
                </div>
              )}

              {/* Live Treasury Withdrawal Breakdown */}
              <div className="rounded-lg bg-emerald-50/50 p-3 border border-emerald-200 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-950">Withdrawable Cash Claim</span>
                  <span className="font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                    ₹{Math.round(withdrawableAmount).toLocaleString()}
                  </span>
                </div>
                {stockBackedStake > 0.01 && (
                  <div className="flex justify-between items-center text-[10px] text-amber-900 pt-1.5 border-t border-emerald-100">
                    <span>📦 Warehouse Stock Cushion:</span>
                    <span className="font-bold">₹{Math.round(stockBackedStake).toLocaleString()}</span>
                  </div>
                )}
                {payableAmount > 0.01 && (
                  <div className="flex justify-between items-center text-[10px] text-rose-900 pt-1.5 border-t border-rose-200">
                    <span>⚠️ Deficit Owed to Equalize Split:</span>
                    <span className="font-bold">₹{Math.round(payableAmount).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {isActive && (
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      setEditingTransaction({ partnerId: partner.id, type: "WITHDRAWAL", amount: 0, description: "", method: "BANK_TRANSFER", occurredAt: new Date() } as any);
                      setIsModalOpen(true);
                    }}
                    className="flex-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 text-center transition"
                  >
                    Withdraw Cash
                  </button>
                  {investmentDeficit > 0.01 ? (
                    <button
                      onClick={() => {
                        setPaybackPayerId(partner.id);
                        setPaybackRecipientId(undefined);
                        setIsPaybackModalOpen(true);
                      }}
                      className="flex-1 rounded-lg border border-amber-300 bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-950 hover:bg-amber-200 text-center transition shadow-sm"
                    >
                      Pay Back Deficit (₹{Math.round(investmentDeficit).toLocaleString()})
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingTransaction({ partnerId: partner.id, type: "ADDITIONAL_INVESTMENT", amount: 0, description: "", method: "BANK_TRANSFER", occurredAt: new Date() } as any);
                        setIsModalOpen(true);
                      }}
                      className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 text-center transition"
                    >
                      + Invest Capital
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Transaction History Table */}
      <div className="overflow-hidden rounded-xl border border-[#d8ded2] bg-white shadow-sm">
        <div className="p-4 border-b border-[#edf1e8] bg-[#f8faf6]">
          <h2 className="text-sm font-bold text-[#20231f]">Capital Ledger Audit History</h2>
        </div>
        {transactions.length === 0 ? (
          <div className="p-12 text-center text-[#6b746c] text-sm">No partner transactions logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#edf1e8] bg-[#f8faf6] text-xs font-semibold uppercase tracking-wider text-[#5f685e]">
                <tr>
                  <th className="px-6 py-3.5">Partner</th>
                  <th className="px-6 py-3.5">Type & Method</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1e8]">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-[#fbfcf9]">
                    <td className="px-6 py-4 font-semibold text-[#20231f]">
                      {t.partner.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded bg-[#edf1e8] px-2 py-0.5 text-xs font-semibold text-[#3f563f]">
                        {t.type}
                      </span>
                      {t.method === "PROFIT_SHARE" ? (
                        <span className="ml-2 rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-900 border border-purple-200">
                          Earned Profit Share
                        </span>
                      ) : t.method ? (
                        <span className="ml-2 text-xs text-[#6b746c]">({t.method})</span>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-xs text-[#4e584f] max-w-xs truncate">
                      {t.description}
                    </td>
                    <td className="px-6 py-4 text-xs text-[#4e584f]">
                      {new Date(t.occurredAt).toLocaleDateString()}
                    </td>
                    <td
                      className={`px-6 py-4 text-right font-bold ${
                        t.type.includes("INVESTMENT") || t.type === "EXPENSE_PAID"
                          ? "text-emerald-900"
                          : "text-rose-800"
                      }`}
                    >
                      ₹{Number(t.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="Edit Transaction"
                          onClick={() => setEditingTransaction(t)}
                          className="inline-flex items-center gap-1 rounded-md p-1.5 text-[#3f563f] hover:bg-[#edf1e8]"
                        >
                          <Edit className="size-4" />
                        </button>
                        <button
                          title="Delete Transaction"
                          onClick={async () => {
                            if (confirm(`Are you sure you want to delete this partner transaction of ₹${Number(t.amount).toLocaleString()} (${t.description})?`)) {
                              const res = await deletePartnerTransactionAction(t.id);
                              if (res && !res.success) {
                                alert(res.error || "Failed to delete transaction.");
                              }
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-md p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PartnerTransactionModal
        transaction={editingTransaction}
        partners={partners}
        partnerBalances={partnerBalances}
        isOpen={isModalOpen || Boolean(editingTransaction)}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
      />

      <AddPartnerModal
        isOpen={isAddPartnerOpen}
        onClose={() => setIsAddPartnerOpen(false)}
      />

      <PartnerPaybackModal
        partners={partners}
        partnerBalances={partnerBalances}
        isOpen={isPaybackModalOpen}
        prefillPayerId={paybackPayerId}
        prefillRecipientId={paybackRecipientId}
        onClose={() => {
          setIsPaybackModalOpen(false);
          setPaybackPayerId(undefined);
          setPaybackRecipientId(undefined);
        }}
      />
    </div>
  );
}

