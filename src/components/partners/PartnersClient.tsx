"use client";

import { useState } from "react";
import { Plus, Users, Wallet, ArrowUpRight, ArrowDownRight, Shield, UserPlus, Edit, Trash2, ArrowUp, ArrowDown, Loader2, Package } from "lucide-react";
import { PartnerTransactionModal } from "./PartnerTransactionModal";
import { AddPartnerModal } from "./AddPartnerModal";
import { calculateProfitMetrics, calculatePartnerBalances } from "@/lib/profit";
import { removePartnerUserAction } from "@/lib/actions";

export function PartnersClient({
  partners,
  transactions,
  expenses = [],
  orders = [],
  products = [],
}: {
  partners: Array<any>;
  transactions: Array<any>;
  expenses?: Array<any>;
  orders?: Array<any>;
  products?: Array<any>;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [deactivatingPartnerId, setDeactivatingPartnerId] = useState<string | null>(null);

  const { netProfit, totalRevenue } = calculateProfitMetrics({ orders, expenses, partnerTransactions: transactions, products });
  const { partnerBalances } = calculatePartnerBalances({ partners, partnerTransactions: transactions, expenses, netProfit, totalRevenue });

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
        <div className="flex items-center gap-3">
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

      {/* Partners Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {partners.map((partner) => {
          const detail = partnerBalances.find((b) => b.id === partner.id);
          const investments = detail ? detail.directInvestments + detail.outOfPocketExpenses : 0;
          const withdrawals = detail ? detail.totalWithdrawn : 0;
          const allocatedProfit = detail ? detail.allocatedProfit : 0;
          const withdrawableAmount = detail ? detail.withdrawableAmount : 0;
          const liquidCashWithdrawable = detail ? detail.liquidCashWithdrawable : 0;
          const tiedUpInStock = detail ? detail.tiedUpInStock : 0;
          const payableAmount = detail ? detail.payableAmount : 0;
          const status = detail ? detail.status : "SETTLED";
          const isActive = partner.isActive !== false;

          return (
            <div
              key={partner.id}
              className={`rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm space-y-4 ${
                !isActive ? "opacity-60 bg-slate-50" : ""
              }`}
            >
              <div className="flex items-center justify-between">
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

                {isActive && (
                  <button
                    title="Remove Partner"
                    onClick={() => handleRemovePartner(partner.id, partner.name)}
                    disabled={deactivatingPartnerId === partner.id}
                    className="inline-flex items-center gap-1 rounded-md p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  >
                    {deactivatingPartnerId === partner.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </button>
                )}
              </div>

              <div className="border-t border-[#edf1e8] pt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#8a948b]">Invested in Stock</span>
                  <p className="font-bold text-emerald-900 mt-0.5">₹{investments.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[#8a948b]">Drawn / Reimbursed</span>
                  <p className="font-bold text-rose-800 mt-0.5">₹{withdrawals.toLocaleString()}</p>
                </div>
              </div>

              <div className="border-t border-[#edf1e8] pt-2 text-xs flex justify-between items-center">
                <span className="text-[#6b746c]">Allocated Profit Share</span>
                <span className="font-semibold text-blue-900">₹{Math.round(allocatedProfit).toLocaleString()}</span>
              </div>

              {/* Settlement Balance Status Card */}
              <div className="rounded-lg bg-[#f8faf6] p-3 border border-[#edf1e8] flex justify-between items-center text-xs">
                <span className="font-semibold text-[#4e584f]">Settlement Status</span>
                {status === "LOCKED_IN_STOCK" && (
                  <span className="inline-flex items-center gap-1 font-bold text-amber-950 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                    <Package className="size-3 text-amber-800" />
                    ₹{Math.round(tiedUpInStock).toLocaleString()} Tied in Stock (Cash: ₹0)
                  </span>
                )}
                {status === "PARTIALLY_RECOVERED" && (
                  <span className="inline-flex items-center gap-1 font-bold text-blue-950 bg-blue-100 px-2 py-0.5 rounded border border-blue-300">
                    <ArrowUp className="size-3" />
                    Can Withdraw ₹{Math.round(liquidCashWithdrawable).toLocaleString()}
                  </span>
                )}
                {status === "WITHDRAWABLE" && (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                    <ArrowUp className="size-3" />
                    Can Withdraw ₹{Math.round(liquidCashWithdrawable).toLocaleString()}
                  </span>
                )}
                {status === "PAYABLE_TO_COMPANY" && (
                  <span className="inline-flex items-center gap-1 font-bold text-rose-900 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                    <ArrowDown className="size-3" />
                    Owes Company ₹{Math.round(payableAmount).toLocaleString()}
                  </span>
                )}
                {status === "SETTLED" && (
                  <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    Settled ₹0
                  </span>
                )}
              </div>
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
                      {t.method && <span className="ml-2 text-xs text-[#6b746c]">({t.method})</span>}
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
                      <button
                        title="Edit Transaction"
                        onClick={() => setEditingTransaction(t)}
                        className="inline-flex items-center gap-1 rounded-md p-1.5 text-[#3f563f] hover:bg-[#edf1e8]"
                      >
                        <Edit className="size-4" />
                      </button>
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
    </div>
  );
}

