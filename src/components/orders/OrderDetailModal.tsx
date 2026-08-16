"use client";

import { useState } from "react";
import { X, DollarSign, TrendingUp, CreditCard, Receipt, CheckCircle, Clock, MapPin, Tag, Edit } from "lucide-react";
import { updateOrderStatusAction } from "@/lib/actions";

interface OrderDetailModalProps {
  order: {
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
    items: Array<{ id: string; description: string; quantity: number; unitPrice: any; customizationDetails: string | null }>;
    payments: Array<{ id: string; amount: any; type: string; method: string; paidAt: Date; reference: string | null }>;
    expenses: Array<{ id: string; category: string; amount: any; description: string; expenseDate: Date }>;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (order: any) => void;
}

const ORDER_STATUSES = [
  "NEW",
  "QUOTED",
  "CONFIRMED",
  "ADVANCE_PAID",
  "DESIGNING",
  "PRODUCTION",
  "READY",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
];

export function OrderDetailModal({ order, isOpen, onClose, onEdit }: OrderDetailModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !order) return null;

  const totalOrderAmount = Number(order.total);
  const totalPayments = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalExpenses = order.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const balance = totalOrderAmount - totalPayments;
  const netProfit = totalOrderAmount - totalExpenses;
  const profitMargin = totalOrderAmount > 0 ? ((netProfit / totalOrderAmount) * 100).toFixed(1) : "0";

  async function handleStatusChange(newStatus: string) {
    if (!order) return;
    setLoading(true);
    try {
      await updateOrderStatusAction({ orderId: order.id, status: newStatus });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-xl border border-[#d8ded2] bg-white p-6 shadow-xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#edf1e8] pb-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-base font-bold text-[#3f563f]">{order.orderNumber}</span>
              <span className="rounded-md bg-[#edf1e8] px-2.5 py-0.5 text-xs font-semibold text-[#263326]">
                {order.status}
              </span>
            </div>
            <p className="text-xs text-[#6b746c] mt-1">
              Customer: <span className="font-semibold text-[#20231f]">{order.customer.name}</span> ({order.customer.phone})
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(order);
                }}
                className="flex items-center gap-1 rounded-lg border border-[#d8ded2] px-3 py-1.5 text-xs font-semibold text-[#3f563f] hover:bg-[#edf1e8]"
              >
                <Edit className="size-3.5" /> Edit Order
              </button>
            )}
            <button onClick={onClose} type="button" className="rounded-lg p-1.5 text-[#6b746c] hover:bg-[#edf1e8]">
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Status Lifecycle Stepper */}
        <div className="mt-4 rounded-lg bg-[#f8faf6] p-3 border border-[#edf1e8]">
          <p className="text-xs font-semibold text-[#4e584f] mb-2">Update Order Status Workflow</p>
          <div className="flex flex-wrap gap-1.5">
            {ORDER_STATUSES.map((st) => {
              const isActive = order.status === st;
              return (
                <button
                  key={st}
                  disabled={loading}
                  onClick={() => handleStatusChange(st)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                    isActive
                      ? "bg-[#263326] text-white shadow-sm"
                      : "bg-white text-[#5f685e] border border-[#d8ded2] hover:bg-[#edf1e8]"
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          <div className="rounded-lg border border-[#d8ded2] bg-[#fdfdfc] p-3 text-center">
            <p className="text-[10px] font-semibold uppercase text-[#6b746c]">Order Total</p>
            <p className="mt-1 text-base font-bold text-[#20231f]">₹{totalOrderAmount.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-center">
            <p className="text-[10px] font-semibold uppercase text-emerald-800">Paid Amount</p>
            <p className="mt-1 text-base font-bold text-emerald-900">₹{totalPayments.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-center">
            <p className="text-[10px] font-semibold uppercase text-amber-800">Balance Due</p>
            <p className="mt-1 text-base font-bold text-amber-900">₹{balance.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-center">
            <p className="text-[10px] font-semibold uppercase text-blue-800">Net Profit</p>
            <p className="mt-1 text-base font-bold text-blue-900">
              ₹{netProfit.toLocaleString()} <span className="text-[10px] font-normal">({profitMargin}%)</span>
            </p>
          </div>
        </div>

        {/* Order Details & Items */}
        <div className="mt-5 space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase text-[#5f685e] tracking-wider mb-2">Order Line Items</h3>
            <div className="divide-y divide-[#edf1e8] rounded-lg border border-[#d8ded2] bg-white">
              {order.items.map((item) => (
                <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-[#20231f]">{item.description}</p>
                    {item.customizationDetails && (
                      <p className="text-[#6b746c] mt-0.5">Details: {item.customizationDetails}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[#20231f]">
                      {item.quantity} × ₹{Number(item.unitPrice).toLocaleString()}
                    </p>
                    <p className="font-bold text-[#263326]">₹{(item.quantity * Number(item.unitPrice)).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payments & Expenses Logs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-semibold uppercase text-[#5f685e] tracking-wider mb-2 flex items-center gap-1">
                <CreditCard className="size-3.5" /> Payments Received ({order.payments.length})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {order.payments.length === 0 ? (
                  <p className="text-xs text-[#8a948b] bg-[#f8faf6] p-3 rounded-lg border border-[#edf1e8]">No payments logged yet.</p>
                ) : (
                  order.payments.map((p) => (
                    <div key={p.id} className="rounded-lg border border-[#d8ded2] bg-white p-2.5 text-xs flex justify-between">
                      <div>
                        <span className="font-semibold text-emerald-800">{p.type}</span> ({p.method})
                        <p className="text-[10px] text-[#8a948b]">{new Date(p.paidAt).toLocaleDateString()}</p>
                      </div>
                      <span className="font-bold text-[#20231f]">₹{Number(p.amount).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase text-[#5f685e] tracking-wider mb-2 flex items-center gap-1">
                <Receipt className="size-3.5" /> Order Expenses ({order.expenses.length})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {order.expenses.length === 0 ? (
                  <p className="text-xs text-[#8a948b] bg-[#f8faf6] p-3 rounded-lg border border-[#edf1e8]">No direct expenses logged.</p>
                ) : (
                  order.expenses.map((e) => (
                    <div key={e.id} className="rounded-lg border border-[#d8ded2] bg-white p-2.5 text-xs flex justify-between">
                      <div>
                        <span className="font-semibold text-[#4e584f]">{e.category}</span>
                        <p className="text-[10px] text-[#8a948b]">{e.description}</p>
                      </div>
                      <span className="font-bold text-rose-700">₹{Number(e.amount).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Delivery & Notes */}
          {order.deliveryAddress && (
            <div className="rounded-lg bg-[#f8faf6] p-3 border border-[#edf1e8] text-xs">
              <p className="font-semibold text-[#4e584f] flex items-center gap-1">
                <MapPin className="size-3.5" /> Delivery Address
              </p>
              <p className="text-[#6b746c] mt-1">{order.deliveryAddress}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
