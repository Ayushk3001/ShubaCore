"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { createOrderAction, updateOrderAction } from "@/lib/actions";

interface OrderModalProps {
  order?: {
    id: string;
    orderNumber?: string;
    customerId: string;
    source: string;
    assignedPartnerId: string | null;
    eventType: string | null;
    eventDate: Date | null;
    deliveryDate: Date | null;
    deliveryAddress: string | null;
    discount: any;
    notes: string | null;
    items: Array<{ description: string; quantity: number; unitPrice: any; customizationDetails: string | null }>;
  } | null;
  customers: Array<{ id: string; name: string; phone: string }>;
  partners: Array<{ id: string; name: string }>;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderModal({ order, customers, partners, isOpen, onClose }: OrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState<Array<{ description: string; quantity: number; unitPrice: number; customizationDetails: string }>>([
    { description: "", quantity: 1, unitPrice: 0, customizationDetails: "" },
  ]);

  const isEditing = Boolean(order);

  useEffect(() => {
    if (order) {
      setDiscount(Number(order.discount) || 0);
      if (order.items && order.items.length > 0) {
        setItems(
          order.items.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unitPrice: Number(i.unitPrice),
            customizationDetails: i.customizationDetails || "",
          }))
        );
      }
    } else {
      setDiscount(0);
      setItems([{ description: "", quantity: 1, unitPrice: 0, customizationDetails: "" }]);
    }
  }, [order, isOpen]);

  if (!isOpen) return null;

  function handleAddItem() {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, customizationDetails: "" }]);
  }

  function handleRemoveItem(index: number) {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  }

  function handleItemChange(index: number, field: string, value: string | number) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = Math.max(0, subtotal - discount);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      customerId: (formData.get("customerId") as string) || undefined,
      source: formData.get("source") as "WHATSAPP" | "INSTAGRAM" | "OTHER",
      assignedPartnerId: (formData.get("assignedPartnerId") as string) || undefined,
      eventType: (formData.get("eventType") as string) || undefined,
      eventDate: (formData.get("eventDate") as string) || undefined,
      deliveryDate: (formData.get("deliveryDate") as string) || undefined,
      deliveryAddress: (formData.get("deliveryAddress") as string) || undefined,
      discount,
      notes: (formData.get("notes") as string) || undefined,
      items: items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        customizationDetails: item.customizationDetails || undefined,
      })),
    };

    try {
      const res = isEditing && order
        ? await updateOrderAction(order.id, data)
        : await createOrderAction(data);

      if (!res.success) {
        setError(res.error || "Failed to save order.");
        return;
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to save order.");
      }
    } finally {
      setLoading(false);
    }
  }

  const defaultEventDate = order?.eventDate
    ? new Date(order.eventDate).toISOString().split("T")[0]
    : "";
  const defaultDeliveryDate = order?.deliveryDate
    ? new Date(order.deliveryDate).toISOString().split("T")[0]
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl border border-[#d8ded2] bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#edf1e8] pb-4">
          <h2 className="text-lg font-bold text-[#20231f]">
            {isEditing ? `Edit Order ${order?.orderNumber || ""}` : "Create New Order"}
          </h2>
          <button onClick={onClose} type="button" className="rounded-lg p-1.5 text-[#6b746c] hover:bg-[#edf1e8]">
            <X className="size-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Select Customer *</label>
              <select
                name="customerId"
                required
                defaultValue={order?.customerId || ""}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none focus:ring-1 focus:ring-[#3f563f]"
              >
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Order Source *</label>
              <select
                name="source"
                required
                defaultValue={order?.source || "WHATSAPP"}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none focus:ring-1 focus:ring-[#3f563f]"
              >
                <option value="WHATSAPP">WhatsApp</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="PHONE_CALL">Phone Call</option>
                <option value="OFFLINE">Offline / Walk-in</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Assign Partner</label>
              <select
                name="assignedPartnerId"
                defaultValue={order?.assignedPartnerId || ""}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none focus:ring-1 focus:ring-[#3f563f]"
              >
                <option value="">Unassigned</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Event Date</label>
              <input
                type="date"
                name="eventDate"
                defaultValue={defaultEventDate}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none focus:ring-1 focus:ring-[#3f563f]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Delivery Date</label>
              <input
                type="date"
                name="deliveryDate"
                defaultValue={defaultDeliveryDate}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none focus:ring-1 focus:ring-[#3f563f]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Delivery Address</label>
            <textarea
              name="deliveryAddress"
              rows={2}
              defaultValue={order?.deliveryAddress || ""}
              placeholder="Delivery destination address..."
              className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none focus:ring-1 focus:ring-[#3f563f]"
            />
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#4e584f]">Order Line Items *</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#3f563f] hover:underline"
              >
                <Plus className="size-3.5" /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="rounded-lg border border-[#edf1e8] bg-[#f8faf6] p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                      required
                      className="flex-1 rounded-md border border-[#d8ded2] bg-white px-2.5 py-1.5 text-xs focus:border-[#3f563f] focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                      required
                      className="w-20 rounded-md border border-[#d8ded2] bg-white px-2.5 py-1.5 text-xs focus:border-[#3f563f] focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Price (₹)"
                      step="0.01"
                      min={0}
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, "unitPrice", Number(e.target.value))}
                      required
                      className="w-28 rounded-md border border-[#d8ded2] bg-white px-2.5 py-1.5 text-xs focus:border-[#3f563f] focus:outline-none"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Customization details"
                    value={item.customizationDetails}
                    onChange={(e) => handleItemChange(idx, "customizationDetails", e.target.value)}
                    className="w-full rounded-md border border-[#d8ded2] bg-white px-2.5 py-1.5 text-xs focus:border-[#3f563f] focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-lg bg-[#edf1e8] p-3 text-xs">
            <div>
              <label className="font-semibold text-[#4e584f]">Discount (₹)</label>
              <input
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-[#d8ded2] bg-white px-2.5 py-1 text-xs focus:outline-none"
              />
            </div>
            <div className="flex flex-col justify-center text-right">
              <span className="text-[#6b746c]">Subtotal: ₹{subtotal.toLocaleString()}</span>
              <span className="text-base font-bold text-[#263326]">Total: ₹{total.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Order Notes</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={order?.notes || ""}
              placeholder="Internal order notes..."
              className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none focus:ring-1 focus:ring-[#3f563f]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#d8ded2] px-4 py-2 text-xs font-medium text-[#4e584f] hover:bg-[#edf1e8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-[#263326] px-4 py-2 text-xs font-medium text-white hover:bg-[#394a39] disabled:opacity-50"
            >
              {loading && <Loader2 className="size-3.5 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
