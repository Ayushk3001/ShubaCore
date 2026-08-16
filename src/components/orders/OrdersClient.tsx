"use client";

import { useState } from "react";
import { Plus, Search, Filter, ShoppingBag, Eye, Calendar, UserCheck, Edit, Loader2 } from "lucide-react";
import { OrderModal } from "./OrderModal";
import { OrderDetailModal } from "./OrderDetailModal";
import { updateOrderStatusAction } from "@/lib/actions";

type OrderWithRelations = {
  id: string;
  orderNumber: string;
  customerId: string;
  source: string;
  assignedPartnerId: string | null;
  status: string;
  subtotal: any;
  discount: any;
  total: any;
  deliveryAddress: string | null;
  notes: string | null;
  createdAt: Date;
  eventType: string | null;
  eventDate: Date | null;
  deliveryDate: Date | null;
  customer: { name: string; phone: string; email: string | null };
  assignedPartner: { name: string } | null;
  items: Array<{
    id: string;
    productId?: string | null;
    bundleId?: string | null;
    description: string;
    quantity: number;
    unitPrice: any;
    customizationDetails: string | null;
    bundle?: any;
    product?: any;
  }>;
  payments: Array<{ id: string; amount: any; type: string; method: string; paidAt: Date; reference: string | null }>;
  expenses: Array<{ id: string; category: string; amount: any; description: string; expenseDate: Date }>;
};

const STATUS_FILTERS = [
  "ALL",
  "NEW",
  "CONFIRMED",
  "ADVANCE_PAID",
  "DESIGNING",
  "PRODUCTION",
  "READY",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
] as const;

export function OrdersClient({
  orders,
  customers,
  partners,
  products = [],
  bundles = [],
}: {
  orders: OrderWithRelations[];
  customers: Array<{ id: string; name: string; phone: string }>;
  partners: Array<{ id: string; name: string }>;
  products?: Array<{ id: string; name: string; sku: string; purchaseCost: any; currentStock: number }>;
  bundles?: Array<any>;
}) {
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderWithRelations | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithRelations | null>(null);
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string>("");

  async function handleStatusChange(orderId: string, newStatus: string) {
    setStatusLoadingId(orderId);
    setStatusError("");
    try {
      const res = await updateOrderStatusAction({ orderId, status: newStatus });
      if (!res.success) {
        setStatusError(res.error || "Failed to update order status.");
      }
    } catch (err: any) {
      setStatusError(err.message || "Failed to update order status.");
    } finally {
      setStatusLoadingId(null);
    }
  }

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = selectedStatus === "ALL" || o.status === selectedStatus;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.phone.includes(search);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#20231f]">Orders Management</h1>
          <p className="mt-1 text-sm text-[#6b746c]">
            Track order lifecycle, change order statuses, auto-update inventory stock, and manage payments.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingOrder(null);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#263326] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#394a39] shadow-sm"
        >
          <Plus className="size-4" />
          Create Order
        </button>
      </div>

      {statusError && (
        <div className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-200">
          ⚠️ {statusError}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#d8ded2] pb-3">
        {STATUS_FILTERS.map((st) => {
          const count = st === "ALL" ? orders.length : orders.filter((o) => o.status === st).length;
          const isActive = selectedStatus === st;
          return (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? "bg-[#263326] text-white shadow-sm"
                  : "bg-white text-[#5f685e] border border-[#d8ded2] hover:bg-[#edf1e8]"
              }`}
            >
              {st}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  isActive ? "bg-white/20 text-white" : "bg-[#edf1e8] text-[#3f563f]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 size-4 text-[#8a948b]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order #, customer, phone..."
          className="w-full rounded-lg border border-[#d8ded2] bg-white pl-9 pr-4 py-2 text-sm focus:border-[#3f563f] focus:outline-none focus:ring-1 focus:ring-[#3f563f] shadow-sm"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-[#d8ded2] bg-white shadow-sm">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-[#6b746c]">No orders found.</p>
            <p className="mt-1 text-xs text-[#8a948b]">
              Try adjusting your status filter or create a new order.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#edf1e8] bg-[#f8faf6] text-xs font-semibold uppercase tracking-wider text-[#5f685e]">
                <tr>
                  <th className="px-6 py-3.5">Order Ref / Customer</th>
                  <th className="px-6 py-3.5">Delivery Date</th>
                  <th className="px-6 py-3.5">Financial Summary</th>
                  <th className="px-6 py-3.5">Partner</th>
                  <th className="px-6 py-3.5">Change Order Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1e8]">
                {filteredOrders.map((order) => {
                  const totalPaid = order.payments.reduce((s, p) => s + Number(p.amount), 0);
                  const balance = Number(order.total) - totalPaid;

                  return (
                    <tr key={order.id} className="hover:bg-[#fbfcf9] transition">
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-mono text-xs font-bold text-[#3f563f]">
                            {order.orderNumber}
                          </span>
                          <p className="font-semibold text-[#20231f]">{order.customer.name}</p>
                          <p className="text-xs text-[#6b746c]">{order.customer.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-[#4e584f]">
                          <Calendar className="size-3.5 text-[#8a948b]" />
                          {order.deliveryDate
                            ? new Date(order.deliveryDate).toLocaleDateString()
                            : "Not set"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5 text-xs">
                          <p className="font-bold text-[#20231f]">
                            Total: ₹{Number(order.total).toLocaleString()}
                          </p>
                          <p className="text-emerald-800">Paid: ₹{totalPaid.toLocaleString()}</p>
                          <p className={balance > 0 ? "text-amber-800 font-medium" : "text-[#8a948b]"}>
                            Due: ₹{balance.toLocaleString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-[#4e584f]">
                        {order.assignedPartner?.name || "Unassigned"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {statusLoadingId === order.id ? (
                            <Loader2 className="size-4 animate-spin text-[#3f563f]" />
                          ) : (
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className="rounded-md border border-[#d8ded2] bg-[#edf1e8] px-2 py-1 text-xs font-semibold text-[#263326] focus:border-[#3f563f] focus:outline-none cursor-pointer"
                            >
                              <option value="NEW">NEW</option>
                              <option value="QUOTED">QUOTED</option>
                              <option value="CONFIRMED">CONFIRMED</option>
                              <option value="ADVANCE_PAID">ADVANCE_PAID</option>
                              <option value="DESIGNING">DESIGNING</option>
                              <option value="PRODUCTION">PRODUCTION</option>
                              <option value="READY">READY</option>
                              <option value="DELIVERED">DELIVERED</option>
                              <option value="COMPLETED">COMPLETED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="View Details"
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex items-center gap-1 rounded-md p-1.5 text-[#6b746c] hover:bg-[#edf1e8] hover:text-[#20231f]"
                          >
                            <Eye className="size-4" />
                          </button>
                          <button
                            title="Edit Order"
                            onClick={() => setEditingOrder(order)}
                            className="inline-flex items-center gap-1 rounded-md p-1.5 text-[#3f563f] hover:bg-[#edf1e8]"
                          >
                            <Edit className="size-4" />
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

      <OrderModal
        order={editingOrder}
        customers={customers}
        partners={partners}
        products={products}
        bundles={bundles}
        isOpen={isCreateModalOpen || Boolean(editingOrder)}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingOrder(null);
        }}
      />

      <OrderDetailModal
        order={selectedOrder}
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        onEdit={(ord) => setEditingOrder(ord)}
      />
    </div>
  );
}
