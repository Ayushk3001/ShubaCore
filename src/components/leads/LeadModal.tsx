"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createLeadAction, updateLeadAction } from "@/lib/actions";

interface LeadModalProps {
  lead?: {
    id: string;
    customerId: string;
    source: string;
    stage: string;
    eventType: string | null;
    eventDate: Date | null;
    estimatedQuantity: number | null;
    estimatedBudget: any;
    quoteAmount: any;
    assignedPartnerId: string | null;
    requirements: string | null;
    notes: string | null;
  } | null;
  customers: Array<{ id: string; name: string; phone: string }>;
  partners: Array<{ id: string; name: string }>;
  isOpen: boolean;
  onClose: () => void;
}

export function LeadModal({ lead, customers, partners, isOpen, onClose }: LeadModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const isEditing = Boolean(lead);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      customerId: (formData.get("customerId") as string) || undefined,
      source: formData.get("source") as "WHATSAPP" | "INSTAGRAM" | "OTHER",
      stage: formData.get("stage") as "NEW" | "CONTACTED" | "QUOTED" | "NEGOTIATION" | "WON" | "LOST",
      eventType: (formData.get("eventType") as string) || undefined,
      eventDate: (formData.get("eventDate") as string) || undefined,
      estimatedQuantity: Number(formData.get("estimatedQuantity")) || undefined,
      estimatedBudget: Number(formData.get("estimatedBudget")) || undefined,
      quoteAmount: Number(formData.get("quoteAmount")) || undefined,
      assignedPartnerId: (formData.get("assignedPartnerId") as string) || undefined,
      requirements: (formData.get("requirements") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    };

    try {
      const res = isEditing && lead
        ? await updateLeadAction(lead.id, data)
        : await createLeadAction(data);

      if (!res.success) {
        setError(res.error || "Failed to save lead.");
        return;
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to save lead.");
      }
    } finally {
      setLoading(false);
    }
  }

  const defaultEventDate = lead?.eventDate
    ? new Date(lead.eventDate).toISOString().split("T")[0]
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-[#d8ded2] bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#edf1e8] pb-4">
          <h2 className="text-lg font-semibold text-[#20231f]">
            {isEditing ? "Edit Lead Enquiry" : "Add New Lead Enquiry"}
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
          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Select Customer *</label>
            <select
              name="customerId"
              required
              defaultValue={lead?.customerId || ""}
              className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none focus:ring-1 focus:ring-[#3f563f]"
            >
              <option value="">Select a customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Lead Source *</label>
              <select
                name="source"
                required
                defaultValue={lead?.source || "WHATSAPP"}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none focus:ring-1 focus:ring-[#3f563f]"
              >
                <option value="WHATSAPP">WhatsApp</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="PHONE_CALL">Phone Call</option>
                <option value="OFFLINE">Offline / Walk-in</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Stage *</label>
              <select
                name="stage"
                required
                defaultValue={lead?.stage || "NEW"}
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none focus:ring-1 focus:ring-[#3f563f]"
              >
                <option value="NEW">NEW</option>
                <option value="CONTACTED">CONTACTED</option>
                <option value="QUOTED">QUOTED</option>
                <option value="NEGOTIATION">NEGOTIATION</option>
                <option value="WON">WON</option>
                <option value="LOST">LOST</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Event Type</label>
              <input
                type="text"
                name="eventType"
                defaultValue={lead?.eventType || ""}
                placeholder="e.g. Wedding, Birthday"
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none focus:ring-1 focus:ring-[#3f563f]"
              />
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
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Est. Quantity</label>
              <input
                type="number"
                name="estimatedQuantity"
                defaultValue={lead?.estimatedQuantity ?? ""}
                placeholder="100"
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none focus:ring-1 focus:ring-[#3f563f]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Est. Budget (₹)</label>
              <input
                type="number"
                name="estimatedBudget"
                defaultValue={lead?.estimatedBudget ? Number(lead.estimatedBudget) : ""}
                placeholder="5000"
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none focus:ring-1 focus:ring-[#3f563f]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Quote (₹)</label>
              <input
                type="number"
                name="quoteAmount"
                defaultValue={lead?.quoteAmount ? Number(lead.quoteAmount) : ""}
                placeholder="4500"
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none focus:ring-1 focus:ring-[#3f563f]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Assign Partner</label>
            <select
              name="assignedPartnerId"
              defaultValue={lead?.assignedPartnerId || ""}
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
            <label className="block text-xs font-semibold text-[#4e584f]">Requirements / Theme</label>
            <textarea
              name="requirements"
              rows={2}
              defaultValue={lead?.requirements || ""}
              placeholder="e.g. Eco-friendly jute bags with custom gold foil printing"
              className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none focus:ring-1 focus:ring-[#3f563f]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Internal Notes</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={lead?.notes || ""}
              placeholder="Customer prefers WhatsApp communication..."
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
              {isEditing ? "Save Changes" : "Create Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
