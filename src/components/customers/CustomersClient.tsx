"use client";

import { useState } from "react";
import { Plus, Search, Phone, Mail, FileText, Edit2, ShoppingBag, ClipboardList } from "lucide-react";
import { CustomerModal } from "./CustomerModal";

type CustomerWithRelations = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  createdAt: Date;
  _count: {
    orders: number;
    leads: number;
  };
};

export function CustomersClient({ customers }: { customers: CustomerWithRelations[] }) {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithRelations | null>(null);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  function handleEdit(customer: CustomerWithRelations) {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  }

  function handleCreate() {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#20231f]">Customers Directory</h1>
          <p className="mt-1 text-sm text-[#6b746c]">
            Manage client profiles, contact history, and order relations.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#263326] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#394a39] shadow-sm"
        >
          <Plus className="size-4" />
          Add Customer
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 size-4 text-[#8a948b]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, or email..."
          className="w-full rounded-lg border border-[#d8ded2] bg-white pl-9 pr-4 py-2 text-sm focus:border-[#3f563f] focus:outline-none focus:ring-1 focus:ring-[#3f563f] shadow-sm"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-[#d8ded2] bg-white shadow-sm">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-[#6b746c]">No customers found.</p>
            <p className="mt-1 text-xs text-[#8a948b]">
              {search ? "Try adjusting your search criteria." : "Get started by adding your first customer."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#edf1e8] bg-[#f8faf6] text-xs font-semibold uppercase tracking-wider text-[#5f685e]">
                <tr>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Contact Details</th>
                  <th className="px-6 py-3.5">History</th>
                  <th className="px-6 py-3.5">Notes</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1e8]">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-[#fbfcf9] transition">
                    <td className="px-6 py-4 font-medium text-[#20231f]">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-[#edf1e8] text-sm font-bold text-[#3f563f]">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-[#20231f]">{customer.name}</p>
                          <p className="text-xs text-[#8a948b]">
                            Added {new Date(customer.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2 text-[#4e584f]">
                          <Phone className="size-3.5 text-[#8a948b]" />
                          <span>{customer.phone}</span>
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-2 text-[#4e584f]">
                            <Mail className="size-3.5 text-[#8a948b]" />
                            <span>{customer.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#edf1e8] px-2 py-1 font-medium text-[#3f563f]">
                          <ShoppingBag className="size-3" />
                          {customer._count.orders} Orders
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 font-medium text-amber-800">
                          <ClipboardList className="size-3" />
                          {customer._count.leads} Leads
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="max-w-xs truncate text-xs text-[#6b746c]">
                        {customer.notes || "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEdit(customer)}
                        className="inline-flex items-center gap-1 rounded-md p-1.5 text-[#6b746c] transition hover:bg-[#edf1e8] hover:text-[#20231f]"
                      >
                        <Edit2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CustomerModal
        customer={selectedCustomer}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
