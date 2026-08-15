"use client";

import { useState } from "react";
import { X, Plus, Trash2, Loader2, ArrowRight } from "lucide-react";
import { convertLeadToOrderAction } from "@/lib/actions";

interface LeadConvertModalProps {
  lead: {
    id: string;
    leadNumber: string;
    customer: { name: string; phone: string };
    assignedPartnerId: string | null;
    quoteAmount: string | number | null;
    requirements: string | null;
  } | null;
  partners: Array<{ id: string; name: string }>;
  isOpen: boolean;
  onClose: () => void;
}

export function LeadConvertModal({ lead, partners, isOpen, onClose }: LeadConvertModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const initialDesc = lead ? lead.requirements || "Customized Return Gift Box" : "Customized Return Gift Box";
  const initialPrice = lead && lead.quoteAmount ? Number(lead.quoteAmount) / 50 : 100;

  const [items, setItems] = useState<Array<{ description: string; quantity: number; unitPrice: number; customizationDetails: string }>>([
    {
      description: initialDesc,
      quantity: 50,
      unitPrice: initialPrice,
      customizationDetails: "",
    },
  ]);

  if (!isOpen || !lead) return null;

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!lead) return;
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      leadId: lead.id,
      assignedPartnerId: formData.get("assignedPartnerId") as string,
      deliveryDate: formData.get("deliveryDate") as string,
      deliveryAddress: formData.get("deliveryAddress") as string,
      notes: formData.get("notes") as string,
      items: items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        customizationDetails: item.customizationDetails,
      })),
    };

    try {
      await convertLeadToOrderAction(data);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to convert lead to order.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl border border-[#d8ded2] bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#edf1e8] pb-4">
          <div>
            <span className="text-xs font-semibold text-[#6d6657]">LEAD CONVERSION</span>
            <h2 className="text-lg font-bold text-[#20231f]">
              Convert {lead.leadNumber} into Order
            </h2>
            <p className="text-xs text-[#6b746c]">Customer: {lead.customer.name}</p>
          </div>
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
              <label className="block text-xs font-semibold text-[#4e584f]">Assigned Partner</label>
              <select
                name="assignedPartnerId"
                defaultValue={lead.assignedPartnerId || ""}
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
              <label className="block text-xs font-semibold text-[#4e584f]">Expected Delivery Date</label>
              <input
                type="date"
                name="deliveryDate"
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none focus:ring-1 focus:ring-[#3f563f]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Delivery Address</label>
            <textarea
              name="deliveryAddress"
              rows={2}
              placeholder="Full venue or delivery address..."
              className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none focus:ring-1 focus:ring-[#3f563f]"
            />
          </div>

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
                      placeholder="Item description (e.g. Brass Diya Set)"
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
                      placeholder="Unit Price (₹)"
                      step="0.01"
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
                    placeholder="Customization details (e.g. Red ribbon, Tag with 'Ananya & Rohan')"
                    value={item.customizationDetails}
                    onChange={(e) => handleItemChange(idx, "customizationDetails", e.target.value)}
                    className="w-full rounded-md border border-[#d8ded2] bg-white px-2.5 py-1.5 text-xs focus:border-[#3f563f] focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between rounded-lg bg-[#edf1e8] px-4 py-2.5 font-semibold text-xs text-[#20231f]">
              <span>Order Calculated Subtotal</span>
              <span className="text-sm font-bold text-[#263326]">₹{subtotal.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Order Notes</label>
            <textarea
              name="notes"
              rows={2}
              placeholder="Special instructions for designing or production..."
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
              className="flex items-center gap-2 rounded-lg bg-[#263326] px-4 py-2 text-xs font-medium text-white hover:bg-[#394a39] disabled:opacity-50 shadow-sm"
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : <ArrowRight className="size-3.5" />}
              Generate Confirmed Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
