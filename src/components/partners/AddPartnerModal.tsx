"use client";

import { useState } from "react";
import { X, Loader2, UserPlus } from "lucide-react";
import { createPartnerUserAction } from "@/lib/actions";

interface AddPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPartnerModal({ isOpen, onClose }: AddPartnerModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
    };

    try {
      const res = await createPartnerUserAction(data);
      if (!res.success) {
        setError(res.error || "Failed to add partner.");
        return;
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to add partner.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-[#d8ded2] bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#edf1e8] pb-4">
          <div className="flex items-center gap-2">
            <UserPlus className="size-5 text-[#3f563f]" />
            <h2 className="text-lg font-bold text-[#20231f]">Add New Partner</h2>
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
          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Partner Name *</label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Rahul Verma"
              className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4e584f]">Partner Email Address *</label>
            <input
              type="email"
              name="email"
              required
              placeholder="rahul@example.com"
              className="mt-1 w-full rounded-lg border border-[#d8ded2] bg-[#fdfdfc] px-3 py-2 text-sm focus:border-[#3f563f] focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-[#8a948b]">
              The new partner can sign in via Clerk with this email address. Their access will be automatically linked on first login.
            </p>
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
              Add Partner
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
