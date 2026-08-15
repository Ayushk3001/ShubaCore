import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { BarChart3, PieChart, TrendingUp, DollarSign, Users, ShoppingBag } from "lucide-react";

export default async function ReportsPage() {
  await requireUser();

  const [orders, expenses, partners, leads] = await Promise.all([
    prisma.order.findMany({
      include: { assignedPartner: true, payments: true, expenses: true },
    }),
    prisma.expense.findMany(),
    prisma.user.findMany({ where: { role: "PARTNER" } }),
    prisma.lead.findMany(),
  ]);

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const netProfit = totalRevenue - totalExpenses;
  const marginPercent = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0";

  // Revenue by Partner
  const revenueByPartner = partners.map((p) => {
    const partnerOrders = orders.filter((o) => o.assignedPartnerId === p.id);
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
  const sources = ["WHATSAPP", "INSTAGRAM", "OTHER"];
  const revenueBySource = sources.map((src) => {
    const srcOrders = orders.filter((o) => o.source === src);
    const rev = srcOrders.reduce((sum, o) => sum + Number(o.total), 0);
    return { source: src, revenue: rev, count: srcOrders.length };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#20231f]">Analytics & Business Reports</h1>
        <p className="mt-1 text-sm text-[#6b746c]">
          Real-time metrics, profitability analysis, and sales channels breakdown.
        </p>
      </div>

      {/* Top Level P&L */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-[#6b746c]">Gross Order Revenue</p>
          <p className="mt-2 text-2xl font-bold text-[#20231f]">₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-rose-800">Total Operating Expenses</p>
          <p className="mt-2 text-2xl font-bold text-rose-900">₹{totalExpenses.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-blue-800">Net Business Profit</p>
          <p className="mt-2 text-2xl font-bold text-blue-950">₹{netProfit.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-emerald-800">Overall Profit Margin</p>
          <p className="mt-2 text-2xl font-bold text-emerald-900">{marginPercent}%</p>
        </div>
      </div>

      {/* Reports Breakdown Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Revenue by Partner */}
        <div className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm space-y-4">
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
        <div className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-[#edf1e8] pb-3">
            <PieChart className="size-4 text-[#3f563f]" />
            <h2 className="text-sm font-bold text-[#20231f]">Revenue by Acquisition Channel</h2>
          </div>
          <div className="space-y-3">
            {revenueBySource.map((item) => (
              <div key={item.source} className="flex items-center justify-between text-xs">
                <div>
                  <span className="rounded bg-[#edf1e8] px-2 py-0.5 font-semibold text-[#3f563f]">
                    {item.source}
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
      <div className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-[#edf1e8] pb-3">
          <BarChart3 className="size-4 text-[#3f563f]" />
          <h2 className="text-sm font-bold text-[#20231f]">Expenses Breakdown by Category</h2>
        </div>
        {expensesByCategory.length === 0 ? (
          <p className="text-xs text-[#8a948b] p-4 text-center">No expenses recorded yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
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
