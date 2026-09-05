"use client";

import { useState } from "react";
import { Plus, CreditCard, Receipt, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Edit, Package, ShieldCheck, PieChart, Wallet, ArrowUp, ArrowDown, Trash2, Handshake } from "lucide-react";
import { PaymentModal } from "./PaymentModal";
import { ExpenseModal } from "./ExpenseModal";
import { PartnerTransactionModal } from "@/components/partners/PartnerTransactionModal";
import { PartnerPaybackModal } from "@/components/partners/PartnerPaybackModal";
import { deleteExpenseAction } from "@/lib/actions";
import { calculateProfitMetrics, calculateOrderGrossProfit, calculatePartnerBalances } from "@/lib/profit";

export function FinanceClient({
  payments,
  expenses,
  orders,
  partners,
  partnerTransactions = [],
  products = [],
}: {
  payments: Array<any>;
  expenses: Array<any>;
  orders: Array<any>;
  partners: Array<any>;
  partnerTransactions?: Array<any>;
  products?: Array<any>;
}) {
  const [activeTab, setActiveTab] = useState<"PAYMENTS" | "EXPENSES" | "PROFITABILITY" | "CAPITAL_RECOVERY" | "PARTNER_SETTLEMENTS">("PAYMENTS");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPartnerTxModalOpen, setIsPartnerTxModalOpen] = useState(false);
  const [isPaybackModalOpen, setIsPaybackModalOpen] = useState(false);
  const [paybackPayerId, setPaybackPayerId] = useState<string | undefined>(undefined);
  const [paybackRecipientId, setPaybackRecipientId] = useState<string | undefined>(undefined);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [partnerTxPreFill, setPartnerTxPreFill] = useState<{ partnerId: string; type: string } | null>(null);

  // Net cash collected: REFUND payments are money returned to the customer, so they
  // subtract from income rather than adding to it (a refund is not revenue received).
  const totalIncome = payments.reduce(
    (sum, p) => sum + (p.type === "REFUND" ? -Number(p.amount) : Number(p.amount)),
    0
  );

  const {
    totalRevenue,
    totalCogs,
    grossProfit,
    operatingExpenses,
    inventoryStockPurchases,
    capitalInvestments,
    totalAllExpenses,
    netProfit,
    marginPercent,
    inventoryAssetValuation,
    totalCapitalInvested,
    unrecoveredCapitalBalance,
    capitalRecoveredPercent,
    availableCompanyCash,
    totalCompanyAssets,
    directPartnerInvestments,
    totalCashInflow,
    totalCashOutflow,
  } = calculateProfitMetrics({ orders, expenses, partnerTransactions, products, payments });

  const {
    partnerBalances,
    totalPartnerContributed,
    totalPartnerWithdrawn,
    totalPartnerAllocatedProfit,
    totalWithdrawableCapital,
    totalLiquidCashWithdrawable,
    totalTiedUpInStock,
    totalPayableToCompany,
    availableCompanyCapital,
  } = calculatePartnerBalances({ partners, partnerTransactions, expenses, netProfit, totalRevenue, payments });

  const liquidCapital = availableCompanyCapital > 0 ? availableCompanyCapital : availableCompanyCash;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#20231f]">Finance & Cashflow</h1>
          <p className="mt-1 text-sm text-[#6b746c]">
            Real-time tracking of company liquid capital, revenue, OpEx vs CapEx, inventory valuation, and partner withdrawable equity.
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-5 shadow-sm">
          <div className="flex items-center justify-between text-emerald-950">
            <span className="text-xs font-semibold uppercase tracking-wider">Company Capital & Cash</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-200 text-emerald-900">
              <Wallet className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-950">₹{liquidCapital.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-emerald-800">Usable for inventory & withdrawals</p>
        </div>

        <div className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#6b746c]">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Revenue Collected</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <ArrowUpRight className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-[#20231f]">₹{totalIncome.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-[#8a948b]">Total payments received</p>
        </div>

        <div className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#6b746c]">
            <span className="text-xs font-semibold uppercase tracking-wider">Inventory Valuation</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <Package className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-amber-950">₹{inventoryAssetValuation.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-[#8a948b]">On-hand physical stock value</p>
        </div>

        <div className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#6b746c]">
            <span className="text-xs font-semibold uppercase tracking-wider">Operating Overhead</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-rose-100 text-rose-800">
              <ArrowDownRight className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-[#20231f]">₹{operatingExpenses.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-[#8a948b]">Pure operating overheads</p>
        </div>

        <div className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#6b746c]">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Profit (Margin %)</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-blue-950">₹{netProfit.toLocaleString()} ({marginPercent}%)</p>
          <p className="mt-1 text-[11px] text-[#8a948b]">Gross Profit minus OpEx</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#d8ded2] pb-3">
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
        <button
          onClick={() => setActiveTab("CAPITAL_RECOVERY")}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === "CAPITAL_RECOVERY"
              ? "bg-[#263326] text-white shadow-sm"
              : "bg-white text-[#5f685e] border border-[#d8ded2] hover:bg-[#edf1e8]"
          }`}
        >
          Capital Recovery & Assets
        </button>
        <button
          onClick={() => setActiveTab("PARTNER_SETTLEMENTS")}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === "PARTNER_SETTLEMENTS"
              ? "bg-[#263326] text-white shadow-sm"
              : "bg-white text-[#3f563f] border border-[#3f563f]/30 hover:bg-[#edf1e8]"
          }`}
        >
          <Wallet className="size-3.5" />
          Partner Profit & Settlements
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
                    <th className="px-6 py-3.5">Classification Type</th>
                    <th className="px-6 py-3.5">Category & Description</th>
                    <th className="px-6 py-3.5">Linked Order</th>
                    <th className="px-6 py-3.5">Paid By</th>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5 text-right">Amount</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf1e8]">
                  {expenses.map((e) => {
                    const isCapEx = e.type === "INVENTORY_PURCHASE" || e.type === "CAPITAL_INVESTMENT";
                    return (
                      <tr key={e.id} className="hover:bg-[#fbfcf9]">
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded px-2.5 py-0.5 text-xs font-bold ${
                              e.type === "INVENTORY_PURCHASE"
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : e.type === "CAPITAL_INVESTMENT"
                                ? "bg-purple-100 text-purple-900 border border-purple-300"
                                : "bg-blue-50 text-blue-900 border border-blue-200"
                            }`}
                          >
                            {e.type === "INVENTORY_PURCHASE"
                              ? "📦 Bulk Stock Purchase (CapEx)"
                              : e.type === "CAPITAL_INVESTMENT"
                              ? "⚙️ Capital Asset"
                              : "🏢 Operating Overhead (OpEx)"}
                          </span>
                        </td>
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
                          <p className="font-semibold text-[#20231f]">{e.paidBy?.name || "Company"}</p>
                          <span className="mt-0.5 inline-block rounded bg-[#edf1e8] px-1.5 py-0.5 text-[10px] font-medium text-[#3f563f]">
                            {e.method === "PARTNER_CAPITAL" ? "🏛️ Partner Capital Fund" : e.method}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-[#4e584f]">
                          {new Date(e.expenseDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-[#20231f]">
                          ₹{Number(e.amount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              title="Edit Expense"
                              onClick={() => setEditingExpense(e)}
                              className="inline-flex items-center rounded-md p-1.5 text-[#3f563f] hover:bg-[#edf1e8]"
                            >
                              <Edit className="size-4" />
                            </button>
                            <button
                              title="Delete Expense"
                              onClick={async () => {
                                if (confirm(`Are you sure you want to delete this expense of ₹${Number(e.amount).toLocaleString()} (${e.description})?`)) {
                                  const res = await deleteExpenseAction(e.id);
                                  if (res && !res.success) {
                                    alert(res.error || "Failed to delete expense.");
                                  }
                                }
                              }}
                              className="inline-flex items-center rounded-md p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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

      {activeTab === "CAPITAL_RECOVERY" && (
        <div className="rounded-xl border border-[#d8ded2] bg-white p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-[#20231f]">Company Capital, Treasury & Recovery Dashboard</h3>
            <p className="text-xs text-[#6b746c] mt-0.5">
              Comprehensive overview of partner invested capital, collected sales revenue, company liquid treasury funds, and physical warehouse inventory assets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="rounded-lg border border-emerald-300 bg-emerald-50/80 p-4">
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Liquid Company Cash</span>
              <p className="mt-2 text-2xl font-bold text-emerald-950">₹{liquidCapital.toLocaleString()}</p>
              <p className="mt-1 text-[11px] text-emerald-800">Usable for inventory or withdrawals</p>
            </div>

            <div className="rounded-lg border border-[#d8ded2] bg-[#f8faf6] p-4">
              <span className="text-xs font-bold text-[#4e584f] uppercase tracking-wider">Total Capital Invested</span>
              <p className="mt-2 text-2xl font-bold text-[#20231f]">₹{totalCapitalInvested.toLocaleString()}</p>
              <p className="mt-1 text-[11px] text-[#6b746c]">Partner capital injected</p>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4">
              <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">Realized Net Profit</span>
              <p className="mt-2 text-2xl font-bold text-blue-950">₹{netProfit.toLocaleString()}</p>
              <p className="mt-1 text-[11px] text-blue-800">Net profit from sales</p>
            </div>

            <div className="rounded-lg border border-amber-300 bg-amber-50/70 p-4">
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">Warehouse Stock Assets</span>
              <p className="mt-2 text-2xl font-bold text-amber-950">₹{inventoryAssetValuation.toLocaleString()}</p>
              <p className="mt-1 text-[11px] text-amber-800">Physical product value</p>
            </div>

            <div className="rounded-lg border border-purple-200 bg-purple-50/70 p-4">
              <span className="text-xs font-bold text-purple-950 uppercase tracking-wider">Total Company Assets</span>
              <p className="mt-2 text-2xl font-bold text-purple-950">₹{totalCompanyAssets.toLocaleString()}</p>
              <p className="mt-1 text-[11px] text-purple-800">Liquid cash + physical stock</p>
            </div>
          </div>

          {/* Treasury Cash Flow Balance Sheet */}
          <div className="rounded-xl border border-[#d8ded2] bg-[#fcfdfa] p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#263326]">
              Company Capital & Liquid Cash Flow Breakdown
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2 rounded-lg border border-[#edf1e8] bg-white p-4">
                <p className="font-bold text-[#20231f] border-b border-[#edf1e8] pb-1.5">Cash Inflows (Money In)</p>
                <div className="flex justify-between items-center text-[#4e584f]">
                  <span>(+) Total Partner Capital Injected:</span>
                  <span className="font-semibold text-emerald-900">₹{totalCapitalInvested.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-[#4e584f]">
                  <span>(+) Gross Revenue Collected from Sales:</span>
                  <span className="font-semibold text-emerald-900">₹{totalIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-t border-[#edf1e8] pt-1.5 font-bold text-[#20231f]">
                  <span>Total Inflows Received:</span>
                  <span className="text-emerald-950">₹{totalCashInflow.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-[#edf1e8] bg-white p-4">
                <p className="font-bold text-[#20231f] border-b border-[#edf1e8] pb-1.5">Cash Outflows (Money Out)</p>
                <div className="flex justify-between items-center text-[#4e584f]">
                  <span>(-) Company Operating & Stock Expenses:</span>
                  <span className="font-semibold text-rose-800">₹{totalAllExpenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-[#4e584f]">
                  <span>(-) Partner Withdrawals & Reimbursements:</span>
                  <span className="font-semibold text-rose-800">₹{totalPartnerWithdrawn.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-t border-[#edf1e8] pt-1.5 font-bold text-[#20231f]">
                  <span>Total Outflows Paid:</span>
                  <span className="text-rose-950">₹{totalCashOutflow.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
              <div>
                <span className="font-bold text-emerald-950 text-sm">
                  Available Liquid Company Capital: ₹{liquidCapital.toLocaleString()}
                </span>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  This liquid cash is sitting in your company accounts and is 100% available to purchase stock/inventory or execute partner withdrawals.
                </p>
              </div>
              <span className="rounded-md bg-emerald-200 px-3 py-1 font-bold text-emerald-900 whitespace-nowrap">
                Ready to Deploy
              </span>
            </div>
          </div>

          {/* Visual Progress Meter (Profit-Based Recovery) */}
          <div className="rounded-xl border border-[#d8ded2] bg-[#fcfdfa] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#263326]">
                  Capital Recovery from Profit
                </span>
                <p className="text-xs text-[#6b746c] mt-0.5">
                  ₹{netProfit.toLocaleString()} net profit earned of ₹{totalCapitalInvested.toLocaleString()} capital invested
                </p>
              </div>
              <span className="text-xl font-black text-[#263326]">{capitalRecoveredPercent}% Recouped</span>
            </div>

            <div className="h-4 w-full rounded-full bg-[#edf1e8] overflow-hidden p-0.5 border border-[#d8ded2]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-[#263326] transition-all duration-700 shadow-sm"
                style={{ width: `${Math.min(100, Number(capitalRecoveredPercent))}%` }}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-[#5f685e] pt-1 gap-1">
              <span>
                🟢 <strong>₹{netProfit.toLocaleString()}</strong> Profit Recovered ({capitalRecoveredPercent}%)
              </span>
              <span className="font-semibold text-amber-900">
                🟡 <strong>₹{unrecoveredCapitalBalance.toLocaleString()}</strong> Remaining to Recoup (Covered by ₹{inventoryAssetValuation.toLocaleString()} Warehouse Stock)
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "PARTNER_SETTLEMENTS" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#d8ded2] bg-white p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#20231f]">Partner Equity, Profit Distribution & Settlements</h3>
                <p className="text-xs text-[#6b746c] mt-1">
                  Real-time integration of capital contributions, out-of-pocket business expenses paid by partners, allocated profit shares, and net withdrawable funds vs company receivables.
                </p>
              </div>
              <button
                onClick={() => {
                  setPaybackPayerId(undefined);
                  setPaybackRecipientId(undefined);
                  setIsPaybackModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-950 hover:bg-amber-100 shadow-sm whitespace-nowrap self-start sm:self-center"
              >
                <Handshake className="size-4 text-amber-800" />
                Pay Back Partner
              </button>
            </div>

            {/* KPI Cards for Partner Financials */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
                <span className="text-xs font-bold text-blue-900 uppercase">Net Business Profit</span>
                <p className="mt-2 text-2xl font-bold text-blue-950">₹{netProfit.toLocaleString()}</p>
                <p className="mt-1 text-[11px] text-blue-800">Total distributable profit</p>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
                <span className="text-xs font-bold text-emerald-900 uppercase">Total Partner Contributions</span>
                <p className="mt-2 text-2xl font-bold text-emerald-950">₹{totalPartnerContributed.toLocaleString()}</p>
                <p className="mt-1 text-[11px] text-emerald-800">Capital + Out-of-pocket expenses</p>
              </div>

              <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-4">
                <span className="text-xs font-bold text-rose-900 uppercase">Total Withdrawals Made</span>
                <p className="mt-2 text-2xl font-bold text-rose-950">₹{totalPartnerWithdrawn.toLocaleString()}</p>
                <p className="mt-1 text-[11px] text-rose-800">Drawn by partners so far</p>
              </div>

              <div className="rounded-lg border border-[#263326]/20 bg-[#f8faf6] p-4">
                <span className="text-xs font-bold text-[#263326] uppercase">Max Withdrawable Pool</span>
                <p className="mt-2 text-2xl font-bold text-[#263326]">₹{totalWithdrawableCapital.toLocaleString()}</p>
                <p className="mt-1 text-[11px] text-[#6b746c]">Claimable by active partners</p>
              </div>
            </div>

            {/* Partner Accounts Table */}
            <div className="overflow-hidden rounded-xl border border-[#d8ded2] bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#edf1e8] bg-[#f8faf6] text-xs font-semibold uppercase tracking-wider text-[#5f685e]">
                    <tr>
                      <th className="px-5 py-3.5">Partner Account</th>
                      <th className="px-5 py-3.5">Equal Stake %</th>
                      <th className="px-5 py-3.5">Capital Injected</th>
                      <th className="px-5 py-3.5">Equal Profit Share</th>
                      <th className="px-5 py-3.5">Total Stake (Equity)</th>
                      <th className="px-5 py-3.5 text-right">Withdrawable Cash Claim</th>
                      <th className="px-5 py-3.5 text-right">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf1e8]">
                    {partnerBalances.map((p) => (
                      <tr key={p.id} className={!p.isActive ? "bg-slate-50 opacity-60" : "hover:bg-[#fbfcf9]"}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#20231f]">{p.name}</span>
                            {!p.isActive ? (
                              <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                                Deactivated / Past
                              </span>
                            ) : (
                              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-900">
                                Active Partner
                              </span>
                            )}
                          </div>
                          {p.email && <p className="text-xs text-[#6b746c] mt-0.5">{p.email}</p>}
                        </td>

                        <td className="px-5 py-4 text-xs font-bold text-[#263326]">
                          {p.stakePercent.toFixed(1)}% Equal
                        </td>

                        <td className="px-5 py-4 text-xs font-medium text-[#20231f]">
                          ₹{p.totalContributed.toLocaleString()}
                          {p.investmentDeficit > 0.01 && (
                            <p className="text-[10px] text-amber-800">Deficit: ₹{Math.round(p.investmentDeficit).toLocaleString()}</p>
                          )}
                          {p.investmentSurplus > 0.01 && (
                            <p className="text-[10px] text-emerald-800">Surplus: +₹{Math.round(p.investmentSurplus).toLocaleString()}</p>
                          )}
                        </td>

                        <td className="px-5 py-4 text-xs font-semibold text-blue-900">
                          +₹{Math.round(p.allocatedProfit).toLocaleString()}
                        </td>

                        <td className="px-5 py-4 font-bold text-[#20231f]">
                          ₹{Math.round(p.stakeAmount).toLocaleString()}
                        </td>

                        <td className="px-5 py-4 text-right">
                          {(p.status === "WITHDRAWABLE" || p.status === "PARTIALLY_RECOVERED") && (
                            <div className="inline-flex flex-col items-end">
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-900 border border-emerald-300">
                                <ArrowUp className="size-3" />
                                ₹{Math.round(p.withdrawableAmount).toLocaleString()} Cash
                              </span>
                              {p.stockBackedStake > 0.01 && (
                                <span className="text-[10px] text-amber-900 mt-0.5 font-medium">
                                  + ₹{Math.round(p.stockBackedStake).toLocaleString()} in warehouse stock
                                </span>
                              )}
                            </div>
                          )}
                          {p.status === "LOCKED_IN_STOCK" && (
                            <div className="inline-flex flex-col items-end">
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-950 border border-amber-300">
                                <Package className="size-3 text-amber-800" />
                                ₹{Math.round(p.stockBackedStake).toLocaleString()} in Stock
                              </span>
                              <span className="text-[10px] text-amber-800 mt-0.5">Backed by physical inventory</span>
                            </div>
                          )}
                          {p.status === "PAYABLE_TO_COMPANY" && (
                            <div className="inline-flex flex-col items-end">
                              <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-900 border border-rose-300">
                                <ArrowDown className="size-3" />
                                Owes Company ₹{Math.round(p.payableAmount).toLocaleString()}
                              </span>
                              <span className="text-[10px] text-rose-700 mt-0.5">Deficit to pay back</span>
                            </div>
                          )}
                          {p.status === "SETTLED" && (
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                              Settled ₹0
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          {p.isActive && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                title="Record Withdrawal"
                                onClick={() => {
                                  setPartnerTxPreFill({ partnerId: p.id, type: "WITHDRAWAL" });
                                  setIsPartnerTxModalOpen(true);
                                }}
                                className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-800 hover:bg-rose-100"
                              >
                                Withdraw
                              </button>
                              {p.remainingInvestmentDeficit > 0.01 ? (
                                <button
                                  title="Pay Back Partner Investment Deficit"
                                  onClick={() => {
                                    setPaybackPayerId(p.id);
                                    setPaybackRecipientId(undefined);
                                    setIsPaybackModalOpen(true);
                                  }}
                                  className="rounded border border-amber-300 bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-950 hover:bg-amber-200"
                                >
                                  Pay Deficit (₹{Math.round(p.remainingInvestmentDeficit).toLocaleString()})
                                </button>
                              ) : (
                                <button
                                  title="Record Capital Contribution"
                                  onClick={() => {
                                    setPartnerTxPreFill({ partnerId: p.id, type: "ADDITIONAL_INVESTMENT" });
                                    setIsPartnerTxModalOpen(true);
                                  }}
                                  className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
                                >
                                  + Invest
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
        availableCapital={availableCompanyCapital > 0 ? availableCompanyCapital : availableCompanyCash}
        isOpen={isExpenseModalOpen || Boolean(editingExpense)}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
      />

      <PartnerTransactionModal
        partners={partners}
        partnerBalances={partnerBalances}
        isOpen={isPartnerTxModalOpen}
        transaction={partnerTxPreFill ? ({ partnerId: partnerTxPreFill.partnerId, type: partnerTxPreFill.type, amount: 0, description: "", method: "BANK_TRANSFER", occurredAt: new Date() } as any) : null}
        onClose={() => {
          setIsPartnerTxModalOpen(false);
          setPartnerTxPreFill(null);
        }}
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

