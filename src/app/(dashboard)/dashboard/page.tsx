import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { calculateProfitMetrics } from "@/lib/profit";
import Link from "next/link";
import {
  TrendingUp,
  CreditCard,
  Receipt,
  ShoppingBag,
  ClipboardList,
  Users,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default async function DashboardPage() {
  const user = await requireUser();

  const [orders, payments, expenses, partnerTransactions, leads, customers, allOrders, products] = await Promise.all([
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } }, payments: true },
    }),
    prisma.payment.findMany(),
    prisma.expense.findMany(),
    prisma.partnerTransaction.findMany(),
    prisma.lead.findMany({ where: { stage: { notIn: ["WON", "LOST"] } } }),
    prisma.customer.count(),
    prisma.order.findMany({
      select: { total: true, status: true, source: true, discount: true, items: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, currentStock: true, purchaseCost: true },
    }),
  ]);

  const {
    totalRevenue,
    grossProfit,
    operatingExpenses,
    inventoryAssetValuation,
    netProfit,
    marginPercent,
  } = calculateProfitMetrics({ orders: allOrders, expenses, partnerTransactions, products });

  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const activeOrdersCount = allOrders.filter((o) => !["COMPLETED", "CANCELLED"].includes(o.status)).length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-[#263326] p-6 text-white shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
            Welcome back, {user.name} 👋
          </p>
          <h1 className="mt-1 text-2xl font-bold">Return Gift Manager Overview</h1>
          <p className="mt-1 text-xs text-emerald-100/80">
            Live business performance metrics from your PostgreSQL single source of truth.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/leads"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            <Plus className="size-3.5" /> New Lead
          </Link>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-[#263326] transition hover:bg-emerald-50"
          >
            <Plus className="size-3.5" /> Create Order
          </Link>
        </div>
      </div>

      {/* Analytics KPI Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6b746c]">Total Revenue</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#edf1e8] text-[#3f563f]">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-[#20231f]">₹{totalRevenue.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-[#8a948b]">From active order quotations</p>
        </div>

        <div className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6b746c]">Payments Collected</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-900">
              <CreditCard className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-950">₹{totalCollected.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-[#8a948b]">Advance & final payments</p>
        </div>

        <div className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6b746c]">Operating Overhead (OpEx)</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-rose-100 text-rose-900">
              <Receipt className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-rose-950">₹{operatingExpenses.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-[#8a948b]">Logistics, tools, overheads</p>
        </div>

        <div className="rounded-xl border border-[#d8ded2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6b746c]">Net Profit</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100 text-blue-900">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-blue-950">₹{netProfit.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-[#8a948b]">{marginPercent}% margin (after COGS & expenses)</p>
        </div>
      </div>

      {/* Operational Highlights Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#d8ded2] bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[#edf1e8] text-[#3f563f]">
            <ShoppingBag className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6b746c]">Active Orders</p>
            <p className="text-lg font-bold text-[#20231f]">{activeOrdersCount} in production</p>
          </div>
        </div>

        <div className="rounded-xl border border-[#d8ded2] bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 text-amber-900">
            <ClipboardList className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6b746c]">Pending Enquiries</p>
            <p className="text-lg font-bold text-[#20231f]">{leads.length} active leads</p>
          </div>
        </div>

        <div className="rounded-xl border border-[#d8ded2] bg-white p-4 shadow-sm flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-900">
            <Users className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6b746c]">Total Clients</p>
            <p className="text-lg font-bold text-[#20231f]">{customers} customers</p>
          </div>
        </div>
      </div>

      {/* Acquisition Channels Overview */}
      <div className="rounded-xl border border-[#d8ded2] bg-white p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-[#edf1e8] pb-3">
          <h2 className="text-sm font-bold text-[#20231f]">Acquisition Channels (All 5 Sources)</h2>
          <Link href="/reports" className="text-xs font-semibold text-[#3f563f] hover:underline flex items-center gap-1">
            View Analytics Report <ArrowRight className="size-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 pt-1">
          {[
            { label: "WhatsApp", key: "WHATSAPP" },
            { label: "Instagram", key: "INSTAGRAM" },
            { label: "Phone Call", key: "PHONE_CALL" },
            { label: "Offline / Walk-in", key: "OFFLINE" },
            { label: "Other", key: "OTHER" },
          ].map(({ label, key }) => {
            const count = allOrders.filter((o) => o.source === key).length;
            return (
              <div key={key} className="rounded-lg bg-[#f8faf6] p-3 border border-[#edf1e8]">
                <span className="text-[11px] font-semibold text-[#5f685e]">{label}</span>
                <p className="mt-1 text-base font-bold text-[#263326]">{count} Orders</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="rounded-xl border border-[#d8ded2] bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#edf1e8] bg-[#f8faf6] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#20231f]">Recent Orders Feed</h2>
          <Link
            href="/orders"
            className="text-xs font-semibold text-[#3f563f] hover:underline flex items-center gap-1"
          >
            View All Orders <ArrowRight className="size-3" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#6b746c]">
            No orders created yet. Click "Create Order" to start.
          </div>
        ) : (
          <div className="divide-y divide-[#edf1e8]">
            {orders.map((o) => {
              const paid = o.payments.reduce((s, p) => s + Number(p.amount), 0);
              return (
                <div key={o.id} className="p-4 flex items-center justify-between hover:bg-[#fbfcf9] transition">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-[#edf1e8] font-bold text-xs text-[#3f563f]">
                      {o.orderNumber.split("-")[2] || "ORD"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#3f563f]">{o.orderNumber}</span>
                        <span className="rounded bg-[#edf1e8] px-2 py-0.5 text-[10px] font-semibold text-[#263326]">
                          {o.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#20231f] mt-0.5">{o.customer.name}</p>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <p className="font-bold text-[#20231f]">₹{Number(o.total).toLocaleString()}</p>
                    <p className="text-emerald-800 text-[11px]">Paid: ₹{paid.toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
