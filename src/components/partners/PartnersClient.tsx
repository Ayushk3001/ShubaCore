"use client";

import { useState } from "react";
import { Plus, Users, Wallet, ArrowUpRight, ArrowDownRight, Shield, UserPlus } from "lucide-react";
import { PartnerTransactionModal } from "./PartnerTransactionModal";
import { AddPartnerModal } from "./AddPartnerModal";

export function PartnersClient({
  partners,
  transactions,
}: {
  partners: Array<any>;
  transactions: Array<any>;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#20231f]">Partners & Equity Ledger</h1>
          <p className="mt-1 text-sm text-[#6b746c]">
            Track capital investments, reimbursements, withdrawals, and out-of-pocket business expenses for partners.
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
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#263326] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#394a39] shadow-sm"
          >
            <Plus className="size-4" />
            Log Capital Transaction
          </button>
        </div>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-3 gap-4">
        {partners.map((partner) => {
          const partnerTx = transactions.filter((t) => t.partnerId === partner.id);
          const investments = partnerTx
            .filter((t) => t.type === "INITIAL_INVESTMENT" || t.type === "ADDITIONAL_INVESTMENT" || t.type === "EXPENSE_PAID")
            .reduce((s, t) => s + Number(t.amount), 0);
          const withdrawals = partnerTx
            .filter((t) => t.type === "WITHDRAWAL" || t.type === "REIMBURSEMENT")
            .reduce((s, t) => s + Number(t.amount), 0);
          const netCapital = investments - withdrawals;

          return (
            <div key={partner.id} className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-[#edf1e8] font-bold text-[#3f563f]">
                    {partner.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-[#20231f]">{partner.name}</p>
                    <p className="text-xs text-[#6b746c]">{partner.email}</p>
                  </div>
                </div>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">
                  {partner.role}
                </span>
              </div>

              <div className="border-t border-[#edf1e8] pt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#8a948b]">Invested / Paid</span>
                  <p className="font-bold text-emerald-900 mt-0.5">₹{investments.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[#8a948b]">Reimbursed / Drawn</span>
                  <p className="font-bold text-rose-800 mt-0.5">₹{withdrawals.toLocaleString()}</p>
                </div>
              </div>

              <div className="rounded-lg bg-[#f8faf6] p-3 border border-[#edf1e8] flex justify-between items-center text-xs">
                <span className="font-semibold text-[#4e584f]">Net Capital Account</span>
                <span className="text-sm font-bold text-[#263326]">₹{netCapital.toLocaleString()}</span>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PartnerTransactionModal
        partners={partners}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <AddPartnerModal
        isOpen={isAddPartnerOpen}
        onClose={() => setIsAddPartnerOpen(false)}
      />
    </div>
  );
}
