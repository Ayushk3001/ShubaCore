"use client";

import { useState } from "react";
import { Plus, X, User, Phone, Mail, FileText, Loader2 } from "lucide-react";
import { createCustomerAction, updateCustomerAction } from "@/lib/actions";

interface CustomerModalProps {
  customer?: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    notes: string | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CustomerModal({ customer, isOpen, onClose }: CustomerModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const isEditing = Boolean(customer);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      notes: formData.get("notes") as string,
    };

    try {
      if (isEditing && customer) {
        await updateCustomerAction(customer.id, data);
      } else {
        await createCustomerAction(data);
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred while saving customer.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-[#d8ded2] bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#edf1e8] pb-4">
          <h2 className="text-lg font-semibold text-[#20231f]">
            {isEditing ? "Edit Customer" : "Add New Customer"}
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-1.5 text-[#6b746c] hover:bg-[#edf1e8] hover:text-[#20231f]"
          >
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
            <label className="block text-xs font-semibold text-[#4e584f]">Full Name *</label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-2.5 size-4 text-[#8a948b]" />
              <input
                type="text"
                name="name"
                defaultValue={customer?.name || ""}
                required
                placeholder="e.g. Priya Sharma"
                className="w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] pl-9 pr-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none focus:ring-1 focus:ring-[#3f563f]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Phone Number *</label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-2.5 size-4 text-[#8a948b]" />
              <input
                type="text"
                name="phone"
                defaultValue={customer?.phone || ""}
                required
                placeholder="e.g. +91 98765 43210"
                className="w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] pl-9 pr-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none focus:ring-1 focus:ring-[#3f563f]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Email Address (Optional)</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-2.5 size-4 text-[#8a948b]" />
              <input
                type="email"
                name="email"
                defaultValue={customer?.email || ""}
                placeholder="priya@example.com"
                className="w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] pl-9 pr-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none focus:ring-1 focus:ring-[#3f563f]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Notes & Event Preferences</label>
            <div className="relative mt-1">
              <FileText className="absolute left-3 top-2.5 size-4 text-[#8a948b]" />
              <textarea
                name="notes"
                rows={3}
                defaultValue={customer?.notes || ""}
                placeholder="Custom preferences, frequent themes..."
                className="w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] pl-9 pr-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none focus:ring-1 focus:ring-[#3f563f]"
              />
            </div>
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
              className="flex items-center gap-2 rounded-lg bg-[#263326] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#394a39] disabled:opacity-50"
            >
              {loading && <Loader2 className="size-3.5 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
