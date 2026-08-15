"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createSupplierAction, updateSupplierAction } from "@/lib/actions";

interface SupplierModalProps {
  supplier?: {
    id: string;
    name: string;
    contactPerson: string | null;
    phone: string;
    email: string | null;
    address: string | null;
    notes: string | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SupplierModal({ supplier, isOpen, onClose }: SupplierModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const isEditing = Boolean(supplier);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      contactPerson: formData.get("contactPerson") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      address: formData.get("address") as string,
      notes: formData.get("notes") as string,
    };

    try {
      if (isEditing && supplier) {
        await updateSupplierAction(supplier.id, data);
      } else {
        await createSupplierAction(data);
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to save supplier.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-[#d8ded2] bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#edf1e8] pb-4">
          <h2 className="text-lg font-bold text-[#20231f]">
            {isEditing ? "Edit Supplier Details" : "Add New Vendor / Supplier"}
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
            <label className="block text-xs font-semibold text-[#4e584f]">Company / Vendor Name *</label>
            <input
              type="text"
              name="name"
              defaultValue={supplier?.name || ""}
              required
              placeholder="e.g. Royal Brass Handicrafts Pvt Ltd"
              className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Contact Person</label>
              <input
                type="text"
                name="contactPerson"
                defaultValue={supplier?.contactPerson || ""}
                placeholder="e.g. Ramesh Kumar"
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4e584f]">Phone Number *</label>
              <input
                type="text"
                name="phone"
                defaultValue={supplier?.phone || ""}
                required
                placeholder="+91 98123 45678"
                className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Email Address</label>
            <input
              type="email"
              name="email"
              defaultValue={supplier?.email || ""}
              placeholder="orders@royalbrass.com"
              className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Address</label>
            <textarea
              name="address"
              rows={2}
              defaultValue={supplier?.address || ""}
              placeholder="Wholesale Market, Moradabad, UP"
              className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Notes</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={supplier?.notes || ""}
              placeholder="Payment terms, lead time details..."
              className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
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
              {isEditing ? "Save Supplier" : "Add Supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
