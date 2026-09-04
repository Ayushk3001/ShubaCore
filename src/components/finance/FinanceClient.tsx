"use client";

import { useState } from "react";
import { Plus, CreditCard, Receipt, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Edit, Package, ShieldCheck, PieChart, Wallet, ArrowUp, ArrowDown } from "lucide-react";
import { PaymentModal } from "./PaymentModal";
import { ExpenseModal } from "./ExpenseModal";
import { PartnerTransactionModal } from "@/components/partners/PartnerTransactionModal";
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
  } = calculateProfitMetrics({ orders, expenses, partnerTransactions, products });

  const {
    partnerBalances,
    totalPartnerContributed,
    totalPartnerWithdrawn,
    totalPartnerAllocatedProfit,
    totalWithdrawableCapital,
    totalLiquidCashWithdrawable,
    totalTiedUpInStock,
    totalPayableToCompany,
  } = calculatePartnerBalances({ partners, partnerTransactions, expenses, netProfit, totalRevenue });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#20231f]">Finance & Cashflow</h1>
          <p className="mt-1 text-sm text-[#6b746c]">
            Asset-backed inventory valuation, OpEx vs CapEx separation, real-time COGS, partner settlements & withdrawable balance matrix.
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
            <span className="text-xs font-semibold uppercase tracking-wider">Inventory Asset Valuation</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <Package className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-amber-950">₹{inventoryAssetValuation.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-[#8a948b]">On-hand physical stock value</p>
        </div>

        <div className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#6b746c]">
            <span className="text-xs font-semibold uppercase tracking-wider">Operating Overhead (OpEx)</span>
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
                          <button
                            title="Edit Expense"
                            onClick={() => setEditingExpense(e)}
                            className="inline-flex items-center gap-1 rounded-md p-1.5 text-[#3f563f] hover:bg-[#edf1e8]"
                          >
                            <Edit className="size-4" />
                          </button>
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
            <h3 className="text-base font-bold text-[#20231f]">Capital Investment & Profit Recovery Dashboard</h3>
            <p className="text-xs text-[#6b746c] mt-0.5">
              Tracks partner capital investments, profit earned to recover that capital, remaining balance to recoup, and physical stock assets. Dynamically updates as you invest more or reinvest profits.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border border-[#d8ded2] bg-[#f8faf6] p-4">
              <span className="text-xs font-bold text-[#4e584f] uppercase tracking-wider">Total Capital Invested</span>
              <p className="mt-2 text-2xl font-bold text-[#20231f]">₹{totalCapitalInvested.toLocaleString()}</p>
              <p className="mt-1 text-[11px] text-[#6b746c]">All partner capital injected</p>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Profit Recovered (Realized)</span>
              <p className="mt-2 text-2xl font-bold text-emerald-950">₹{netProfit.toLocaleString()}</p>
              <p className="mt-1 text-[11px] text-emerald-800">Net profit earned from business sales</p>
            </div>

            <div className="rounded-lg border border-amber-300 bg-amber-50/70 p-4">
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">Remaining to Recoup</span>
              <p className="mt-2 text-2xl font-bold text-amber-950">₹{unrecoveredCapitalBalance.toLocaleString()}</p>
              <p className="mt-1 text-[11px] text-amber-800">Needed from future profits to recover capital</p>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4">
              <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">Warehouse Stock Assets</span>
              <p className="mt-2 text-2xl font-bold text-blue-950">₹{inventoryAssetValuation.toLocaleString()}</p>
              <p className="mt-1 text-[11px] text-blue-800">Physical stock backing your capital</p>
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

          {/* Dynamic Reinvestment & Recovery Analysis */}
          <div className="rounded-lg border border-[#d8ded2] bg-[#fdfdfc] p-4 text-xs text-[#5f685e] space-y-2">
            <p className="font-bold text-[#20231f]">Dynamic Reinvestment & Recovery Logic:</p>
            <ul className="list-disc list-inside space-y-1.5 text-[11px] text-[#4e584f]">
              <li>
                <strong>Capital Contributed:</strong> You currently have <strong>₹{totalCapitalInvested.toLocaleString()}</strong> invested by partners. As you inject more investment in the future, this capital base updates dynamically.
              </li>
              <li>
                <strong>Profit-Based Recovery:</strong> The business has generated <strong>₹{netProfit.toLocaleString()} in net profit</strong> so far (<strong>{capitalRecoveredPercent}% of capital recovered</strong>).
              </li>
              <li>
                <strong>Remaining to Recoup:</strong> You need <strong>₹{unrecoveredCapitalBalance.toLocaleString()} in future net profits</strong> to fully recoup your invested capital.
              </li>
              <li>
                <strong>Warehouse Asset Cushion:</strong> Your warehouse holds <strong>₹{inventoryAssetValuation.toLocaleString()} in physical products</strong>. When you sell those products and generate more profit, the recovery meter automatically moves forward.
              </li>
              <li>
                <strong>Reinvestment:</strong> From the ₹{totalRevenue.toLocaleString()} sales revenue, ₹{(totalRevenue - netProfit).toLocaleString()} was reinvested to restock inventory, ensuring continuous operational growth.
              </li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === "PARTNER_SETTLEMENTS" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#d8ded2] bg-white p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#20231f]">Partner Equity, Profit Distribution & Settlements</h3>
              <p className="text-xs text-[#6b746c] mt-1">
                Real-time integration of capital contributions, out-of-pocket business expenses paid by partners, allocated profit shares, and net withdrawable funds vs company receivables.
              </p>
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
                      <th className="px-5 py-3.5">Capital Invested</th>
                      <th className="px-5 py-3.5">Out-of-pocket Paid</th>
                      <th className="px-5 py-3.5">Total Contributed</th>
                      <th className="px-5 py-3.5">Total Withdrawn</th>
                      <th className="px-5 py-3.5">Profit Share</th>
                      <th className="px-5 py-3.5 text-right">Net Settlement Balance</th>
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

                        <td className="px-5 py-4 text-xs font-medium text-[#20231f]">
                          ₹{p.directInvestments.toLocaleString()}
                        </td>

                        <td className="px-5 py-4 text-xs font-medium text-[#3f563f]">
                          ₹{p.outOfPocketExpenses.toLocaleString()}
                        </td>

                        <td className="px-5 py-4 font-bold text-emerald-900">
                          ₹{p.totalContributed.toLocaleString()}
                        </td>

                        <td className="px-5 py-4 font-bold text-rose-800">
                          ₹{p.totalWithdrawn.toLocaleString()}
                        </td>

                        <td className="px-5 py-4 text-xs">
                          <p className="font-semibold text-blue-900">₹{Math.round(p.allocatedProfit).toLocaleString()}</p>
                          <p className="text-[10px] text-[#6b746c]">({p.profitSharePercent.toFixed(1)}% split)</p>
                        </td>

                        <td className="px-5 py-4 text-right">
                          {p.status === "LOCKED_IN_STOCK" && (
                            <div className="inline-flex flex-col items-end">
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-950 border border-amber-300">
                                <Package className="size-3 text-amber-800" />
                                ₹{Math.round(p.tiedUpInStock).toLocaleString()} Tied in Stock
                              </span>
                              <span className="text-[10px] text-amber-800 mt-0.5">Cash Profit: ₹0</span>
                            </div>
                          )}
                          {p.status === "PARTIALLY_RECOVERED" && (
                            <div className="inline-flex flex-col items-end">
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-900 border border-emerald-300">
                                <ArrowUp className="size-3" />
                                Can Withdraw ₹{Math.round(p.liquidCashWithdrawable).toLocaleString()}
                              </span>
                              <span className="text-[10px] text-[#6b746c] mt-0.5">
                                ₹{Math.round(p.allocatedProfit)} profit | ₹{Math.round(p.tiedUpInStock)} in warehouse stock
                              </span>
                            </div>
                          )}
                          {p.status === "WITHDRAWABLE" && (
                            <div className="inline-flex flex-col items-end">
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-900 border border-emerald-300">
                                <ArrowUp className="size-3" />
                                Can Withdraw ₹{Math.round(p.liquidCashWithdrawable).toLocaleString()}
                              </span>
                              <span className="text-[10px] text-emerald-700 mt-0.5">Fully recovered payout</span>
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
        isOpen={isExpenseModalOpen || Boolean(editingExpense)}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
      />

      <PartnerTransactionModal
        partners={partners}
        isOpen={isPartnerTxModalOpen}
        transaction={partnerTxPreFill ? ({ partnerId: partnerTxPreFill.partnerId, type: partnerTxPreFill.type, amount: 0, description: "", method: "BANK_TRANSFER", occurredAt: new Date() } as any) : null}
        onClose={() => {
          setIsPartnerTxModalOpen(false);
          setPartnerTxPreFill(null);
        }}
      />
    </div>
  );
}

