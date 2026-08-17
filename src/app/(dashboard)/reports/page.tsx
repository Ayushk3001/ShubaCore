import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { calculateProfitMetrics } from "@/lib/profit";
import { BarChart3, PieChart, TrendingUp, DollarSign, Users, ShoppingBag, Coins, Package, ShieldCheck } from "lucide-react";

export default async function ReportsPage() {
  await requireUser();

  const [orders, expenses, partnerTransactions, partners, leads, products] = await Promise.all([
    prisma.order.findMany({
      include: { assignedPartner: true, payments: true, expenses: true, items: true },
    }),
    prisma.expense.findMany(),
    prisma.partnerTransaction.findMany(),
    prisma.user.findMany({ where: { role: "PARTNER" } }),
    prisma.lead.findMany(),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, currentStock: true, purchaseCost: true },
    }),
  ]);

  const {
    totalRevenue,
    totalCogs,
    grossProfit,
    operatingExpenses,
    inventoryStockPurchases,
    capitalInvestments,
    totalAllExpenses,
    partnerPayouts,
    netProfit,
    marginPercent,
    inventoryAssetValuation,
    totalCapitalInvested,
    unrecoveredCapitalBalance,
    capitalRecoveredPercent,
  } = calculateProfitMetrics({ orders, expenses, partnerTransactions, products });

  // Revenue by Partner
  const revenueByPartner = partners.map((p) => {
    const partnerOrders = orders.filter((o) => o.assignedPartnerId === p.id && o.status !== "CANCELLED");
    const rev = partnerOrders.reduce((sum, o) => sum + Number(o.total), 0);
    return { name: p.name, revenue: rev, count: partnerOrders.length };
  });

  // Expenses by Category
  const expenseCategories = Array.from(new Set(expenses.map((e) => e.category)));
  const expensesByCategory = expenseCategories.map((cat) => {
    const catExpenses = expenses.filter((e) => e.category === cat);
    const total = catExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    return { category: cat, total };
  });

  // Revenue by Source
  const sources = ["WHATSAPP", "INSTAGRAM", "PHONE_CALL", "OFFLINE", "OTHER"];
  const SOURCE_LABELS: Record<string, string> = {
    WHATSAPP: "WhatsApp",
    INSTAGRAM: "Instagram",
    PHONE_CALL: "Phone Call",
    OFFLINE: "Offline / Walk-in",
    OTHER: "Other",
  };

  const revenueBySource = sources.map((src) => {
    const srcOrders = orders.filter((o) => o.source === src && o.status !== "CANCELLED");
    const rev = srcOrders.reduce((sum, o) => sum + Number(o.total), 0);
    return { source: src, label: SOURCE_LABELS[src] || src, revenue: rev, count: srcOrders.length };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#20231f]">Analytics & Business Reports</h1>
        <p className="mt-1 text-sm text-[#6b746c]">
          Real-time profitability, inventory asset valuation, OpEx vs CapEx separation, and sales channels breakdown.
        </p>
      </div>

      {/* Top Level P&L Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4">
        <div className="rounded-xl border border-[#d8ded2] bg-white p-4 sm:p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-[#6b746c]">Gross Order Revenue</p>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-[#20231f]">₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-[#d8ded2] bg-white p-4 sm:p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-amber-800">Total COGS (Direct Cost)</p>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-amber-900">₹{totalCogs.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-[#d8ded2] bg-white p-4 sm:p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-emerald-800">Gross Profit (Rev - COGS)</p>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-emerald-900">₹{grossProfit.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-[#d8ded2] bg-white p-4 sm:p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-amber-800">Warehouse Stock Assets</p>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-amber-950">₹{inventoryAssetValuation.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-[#d8ded2] bg-white p-4 sm:p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-rose-800">Operating Overhead (OpEx)</p>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-rose-900">₹{operatingExpenses.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-[#d8ded2] bg-white p-4 sm:p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-blue-800">Net Profit (Margin %)</p>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-blue-950">₹{netProfit.toLocaleString()} ({marginPercent}%)</p>
        </div>
      </div>

      {/* Capital Recovery & Asset Breakdown */}
      <div className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-[#edf1e8] pb-3">
          <ShieldCheck className="size-4 text-[#3f563f]" />
          <h2 className="text-sm font-bold text-[#20231f]">Capital Investment & Stock Asset Recovery</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="rounded-lg border border-[#edf1e8] bg-[#f8faf6] p-3">
            <span className="font-semibold text-[#6b746c]">Capital Stock Investments</span>
            <p className="mt-1 text-lg font-bold text-[#20231f]">₹{totalCapitalInvested.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
            <span className="font-semibold text-emerald-900">Cash Recovered (Inflows)</span>
            <p className="mt-1 text-lg font-bold text-emerald-950">₹{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
            <span className="font-semibold text-amber-900">On-Hand Warehouse Stock</span>
            <p className="mt-1 text-lg font-bold text-amber-950">₹{inventoryAssetValuation.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3">
            <span className="font-semibold text-blue-900">Capital Recovery Progress</span>
            <p className="mt-1 text-lg font-bold text-blue-950">{capitalRecoveredPercent}%</p>
          </div>
        </div>
      </div>

      {/* Reports Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue by Partner */}
        <div className="rounded-xl border border-[#d8ded2] bg-white p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-[#edf1e8] pb-3">
            <Users className="size-4 text-[#3f563f]" />
            <h2 className="text-sm font-bold text-[#20231f]">Sales & Revenue by Assigned Partner</h2>
          </div>
          <div className="space-y-3">
            {revenueByPartner.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-[#20231f]">{item.name}</p>
                  <p className="text-[#8a948b]">{item.count} Orders managed</p>
                </div>
                <p className="font-bold text-[#263326] text-sm">₹{item.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Source */}
        <div className="rounded-xl border border-[#d8ded2] bg-white p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-[#edf1e8] pb-3">
            <PieChart className="size-4 text-[#3f563f]" />
            <h2 className="text-sm font-bold text-[#20231f]">Revenue by Acquisition Channel</h2>
          </div>
          <div className="space-y-3">
            {revenueBySource.map((item) => (
              <div key={item.source} className="flex items-center justify-between text-xs">
                <div>
                  <span className="rounded bg-[#edf1e8] px-2 py-0.5 font-semibold text-[#3f563f]">
                    {item.label}
                  </span>
                  <span className="ml-2 text-[#8a948b]">{item.count} Orders</span>
                </div>
                <p className="font-bold text-[#263326] text-sm">₹{item.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expenses Breakdown */}
      <div className="rounded-xl border border-[#d8ded2] bg-white p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-[#edf1e8] pb-3">
          <BarChart3 className="size-4 text-[#3f563f]" />
          <h2 className="text-sm font-bold text-[#20231f]">Expenses Breakdown by Category</h2>
        </div>
        {expensesByCategory.length === 0 ? (
          <p className="text-xs text-[#8a948b] p-4 text-center">No expenses recorded yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {expensesByCategory.map((item) => (
              <div key={item.category} className="rounded-lg border border-[#edf1e8] bg-[#f8faf6] p-3">
                <span className="text-xs font-semibold text-[#4e584f]">{item.category}</span>
                <p className="mt-1 text-base font-bold text-rose-800">₹{item.total.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
