"use client";

import { useState } from "react";
import { Plus, CreditCard, Receipt, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Edit } from "lucide-react";
import { PaymentModal } from "./PaymentModal";
import { ExpenseModal } from "./ExpenseModal";

import { calculateProfitMetrics, calculateOrderGrossProfit } from "@/lib/profit";

export function FinanceClient({
  payments,
  expenses,
  orders,
  partners,
  partnerTransactions = [],
}: {
  payments: Array<any>;
  expenses: Array<any>;
  orders: Array<any>;
  partners: Array<any>;
  partnerTransactions?: Array<any>;
}) {
  const [activeTab, setActiveTab] = useState<"PAYMENTS" | "EXPENSES" | "PROFITABILITY">("PAYMENTS");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  const totalIncome = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const {
    totalRevenue,
    totalCogs,
    grossProfit,
    netProfit,
    marginPercent,
  } = calculateProfitMetrics({ orders, expenses, partnerTransactions });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#20231f]">Finance & Cashflow</h1>
          <p className="mt-1 text-sm text-[#6b746c]">
            Track order payments received, business expenses, COGS, and order-level profit margins.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d8ded2] bg-white px-4 py-2 text-sm font-medium text-[#20231f] transition hover:bg-[#edf1e8] shadow-sm"
          >
            <Receipt className="size-4" />
            Add Expense
          </button>
          <button
            onClick={() => {
              setEditingPayment(null);
              setIsPaymentModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#263326] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#394a39] shadow-sm"
          >
            <CreditCard className="size-4" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#6b746c]">
            <span className="text-xs font-semibold uppercase tracking-wider">Payments Collected</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <ArrowUpRight className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-[#20231f]">₹{totalIncome.toLocaleString()}</p>
        </div>

        <div className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#6b746c]">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Operating Expenses</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-rose-100 text-rose-800">
              <ArrowDownRight className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-[#20231f]">₹{totalExpenses.toLocaleString()}</p>
        </div>

        <div className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#6b746c]">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Business Profit</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-950">₹{grossProfit.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-[#8a948b]">Revenue minus COGS</p>
        </div>

        <div className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#6b746c]">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Profit (Margin %)</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-blue-950">₹{netProfit.toLocaleString()} ({marginPercent}%)</p>
          <p className="mt-1 text-[11px] text-[#8a948b]">After COGS, Expenses & Payouts</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#d8ded2] pb-3">
        <button
          onClick={() => setActiveTab("PAYMENTS")}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === "PAYMENTS"
              ? "bg-[#263326] text-white shadow-sm"
              : "bg-white text-[#5f685e] border border-[#d8ded2] hover:bg-[#edf1e8]"
          }`}
        >
          Payments Received ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab("EXPENSES")}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === "EXPENSES"
              ? "bg-[#263326] text-white shadow-sm"
              : "bg-white text-[#5f685e] border border-[#d8ded2] hover:bg-[#edf1e8]"
          }`}
        >
          Expenses Log ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab("PROFITABILITY")}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === "PROFITABILITY"
              ? "bg-[#263326] text-white shadow-sm"
              : "bg-white text-[#5f685e] border border-[#d8ded2] hover:bg-[#edf1e8]"
          }`}
        >
          Order Profitability Matrix
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "PAYMENTS" && (
        <div className="overflow-hidden rounded-xl border border-[#d8ded2] bg-white shadow-sm">
          {payments.length === 0 ? (
            <div className="p-12 text-center text-[#6b746c] text-sm">No payments recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#edf1e8] bg-[#f8faf6] text-xs font-semibold uppercase tracking-wider text-[#5f685e]">
                  <tr>
                    <th className="px-6 py-3.5">Order Ref / Customer</th>
                    <th className="px-6 py-3.5">Type & Method</th>
                    <th className="px-6 py-3.5">Reference</th>
                    <th className="px-6 py-3.5">Received Date</th>
                    <th className="px-6 py-3.5 text-right">Amount</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf1e8]">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-[#fbfcf9]">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-[#3f563f]">
                          {p.order.orderNumber}
                        </span>
                        <p className="font-semibold text-[#20231f]">{p.order.customer.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">
                          {p.type}
                        </span>
                        <span className="ml-2 text-xs text-[#6b746c]">({p.method})</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-[#6b746c]">
                        {p.reference || "—"}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#4e584f]">
                        {new Date(p.paidAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-[#263326]">
                        ₹{Number(p.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          title="Edit Payment"
                          onClick={() => setEditingPayment(p)}
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
      )}

      {activeTab === "EXPENSES" && (
        <div className="overflow-hidden rounded-xl border border-[#d8ded2] bg-white shadow-sm">
          {expenses.length === 0 ? (
            <div className="p-12 text-center text-[#6b746c] text-sm">No expenses recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#edf1e8] bg-[#f8faf6] text-xs font-semibold uppercase tracking-wider text-[#5f685e]">
                  <tr>
                    <th className="px-6 py-3.5">Category & Description</th>
                    <th className="px-6 py-3.5">Linked Order</th>
                    <th className="px-6 py-3.5">Paid By</th>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5 text-right">Amount</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf1e8]">
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-[#fbfcf9]">
                      <td className="px-6 py-4">
                        <span className="rounded bg-[#edf1e8] px-2 py-0.5 text-xs font-semibold text-[#3f563f]">
                          {e.category}
                        </span>
                        <p className="font-semibold text-[#20231f] mt-1">{e.description}</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-[#4e584f]">
                        {e.order ? e.order.orderNumber : "General Overhead"}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#4e584f]">
                        {e.paidBy?.name || "Company"}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#4e584f]">
                        {new Date(e.expenseDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-rose-700">
                        ₹{Number(e.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          title="Edit Expense"
                          onClick={() => setEditingExpense(e)}
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
      )}

      {activeTab === "PROFITABILITY" && (
        <div className="overflow-hidden rounded-xl border border-[#d8ded2] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#edf1e8] bg-[#f8faf6] text-xs font-semibold uppercase tracking-wider text-[#5f685e]">
                <tr>
                  <th className="px-6 py-3.5">Order Ref</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Revenue</th>
                  <th className="px-6 py-3.5">COGS (Direct Cost)</th>
                  <th className="px-6 py-3.5">Gross Profit</th>
                  <th className="px-6 py-3.5">Linked Expenses</th>
                  <th className="px-6 py-3.5 text-right">Net Profit</th>
                  <th className="px-6 py-3.5 text-right">Gross Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1e8]">
                {orders.map((o) => {
                  const rev = Number(o.total || 0);
                  const cogs = (o.items || []).reduce(
                    (s: number, item: any) => s + Number(item.costPriceSnapshot || 0) * Number(item.quantity || 0),
                    0
                  );
                  const grossProfit = calculateOrderGrossProfit(o);
                  const exp = (o.expenses || []).reduce((s: number, e: any) => s + Number(e.amount), 0);
                  const netProfit = grossProfit - exp;
                  const margin = rev > 0 ? ((grossProfit / rev) * 100).toFixed(1) : "0";

                  return (
                    <tr key={o.id} className="hover:bg-[#fbfcf9]">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-[#3f563f]">
                        {o.orderNumber}
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#20231f]">{o.customer.name}</td>
                      <td className="px-6 py-4 font-semibold text-[#20231f]">
                        ₹{rev.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-amber-800 font-medium">
                        ₹{cogs.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-900">
                        ₹{grossProfit.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-rose-700">₹{exp.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-bold text-blue-950">
                        ₹{netProfit.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-emerald-800">
                        {margin}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PaymentModal
        payment={editingPayment}
        orders={orders}
        isOpen={isPaymentModalOpen || Boolean(editingPayment)}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setEditingPayment(null);
        }}
      />

      <ExpenseModal
        expense={editingExpense}
        orders={orders}
        partners={partners}
        isOpen={isExpenseModalOpen || Boolean(editingExpense)}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
      />
    </div>
  );
}
