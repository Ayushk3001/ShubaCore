"use client";

import { useState } from "react";
import { Plus, Search, Filter, ArrowRight, UserCheck, Phone, Calendar, Tag } from "lucide-react";
import { LeadModal } from "./LeadModal";
import { LeadConvertModal } from "./LeadConvertModal";
import { updateLeadStatusAction } from "@/lib/actions";

type LeadWithRelations = {
  id: string;
  leadNumber: string;
  source: "WHATSAPP" | "INSTAGRAM" | "OTHER";
  stage: "NEW" | "CONTACTED" | "QUOTED" | "NEGOTIATION" | "WON" | "LOST";
  eventType: string | null;
  eventDate: Date | null;
  estimatedQuantity: number | null;
  estimatedBudget: any;
  quoteAmount: any;
  requirements: string | null;
  notes: string | null;
  createdAt: Date;
  assignedPartnerId: string | null;
  customer: { id: string; name: string; phone: string };
  assignedPartner: { id: string; name: string } | null;
  convertedOrder: { id: string; orderNumber: string } | null;
};

const STAGES = ["ALL", "NEW", "CONTACTED", "QUOTED", "NEGOTIATION", "WON", "LOST"] as const;

export function LeadsClient({
  leads,
  customers,
  partners,
}: {
  leads: LeadWithRelations[];
  customers: Array<{ id: string; name: string; phone: string }>;
  partners: Array<{ id: string; name: string }>;
}) {
  const [selectedStage, setSelectedStage] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<LeadWithRelations | null>(null);

  const filteredLeads = leads.filter((l) => {
    const matchesStage = selectedStage === "ALL" || l.stage === selectedStage;
    const matchesSearch =
      l.leadNumber.toLowerCase().includes(search.toLowerCase()) ||
      l.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      l.customer.phone.includes(search) ||
      (l.eventType && l.eventType.toLowerCase().includes(search.toLowerCase()));
    return matchesStage && matchesSearch;
  });

  async function handleStageChange(leadId: string, stage: any) {
    await updateLeadStatusAction(leadId, stage);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#20231f]">Leads & Enquiries</h1>
          <p className="mt-1 text-sm text-[#6b746c]">
            Track customer enquiries from WhatsApp and Instagram and convert them to orders.
          </p>
        </div>
        <button
          onClick={() => setIsLeadModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#263326] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#394a39] shadow-sm"
        >
          <Plus className="size-4" />
          Add Lead Enquiry
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#d8ded2] pb-3">
        {STAGES.map((stage) => {
          const count = stage === "ALL" ? leads.length : leads.filter((l) => l.stage === stage).length;
          const isActive = selectedStage === stage;
          return (
            <button
              key={stage}
              onClick={() => setSelectedStage(stage)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? "bg-[#263326] text-white shadow-sm"
                  : "bg-white text-[#5f685e] border border-[#d8ded2] hover:bg-[#edf1e8]"
              }`}
            >
              {stage}
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
          placeholder="Search lead #, customer, phone, event..."
          className="w-full rounded-lg border border-[#d8ded2] bg-white pl-9 pr-4 py-2 text-sm focus:border-[#3f563f] focus:outline-none focus:ring-1 focus:ring-[#3f563f] shadow-sm"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-[#d8ded2] bg-white shadow-sm">
        {filteredLeads.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-[#6b746c]">No leads found.</p>
            <p className="mt-1 text-xs text-[#8a948b]">
              Try changing the stage filter or creating a new enquiry.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#edf1e8] bg-[#f8faf6] text-xs font-semibold uppercase tracking-wider text-[#5f685e]">
                <tr>
                  <th className="px-6 py-3.5">Lead Ref / Customer</th>
                  <th className="px-6 py-3.5">Source & Event</th>
                  <th className="px-6 py-3.5">Estimate / Quote</th>
                  <th className="px-6 py-3.5">Assigned Partner</th>
                  <th className="px-6 py-3.5">Stage</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1e8]">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-[#fbfcf9] transition">
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-mono text-xs font-bold text-[#3f563f]">
                          {lead.leadNumber}
                        </span>
                        <p className="font-semibold text-[#20231f]">{lead.customer.name}</p>
                        <div className="flex items-center gap-1.5 text-xs text-[#6b746c]">
                          <Phone className="size-3 text-[#8a948b]" />
                          {lead.customer.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-xs">
                        <span className="inline-flex items-center rounded bg-[#edf1e8] px-2 py-0.5 font-medium text-[#3f563f]">
                          {lead.source}
                        </span>
                        {lead.eventType && (
                          <div className="flex items-center gap-1 text-[#4e584f]">
                            <Tag className="size-3 text-[#8a948b]" />
                            {lead.eventType} ({lead.estimatedQuantity || 0} pcs)
                          </div>
                        )}
                        {lead.eventDate && (
                          <div className="flex items-center gap-1 text-[#4e584f]">
                            <Calendar className="size-3 text-[#8a948b]" />
                            {new Date(lead.eventDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        <p className="font-semibold text-[#20231f]">
                          Quote: {lead.quoteAmount ? `₹${Number(lead.quoteAmount).toLocaleString()}` : "Pending"}
                        </p>
                        {lead.estimatedBudget && (
                          <p className="text-[#6b746c]">
                            Budget: ₹{Number(lead.estimatedBudget).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-[#4e584f]">
                        {lead.assignedPartner?.name || "Unassigned"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={lead.stage}
                        onChange={(e) => handleStageChange(lead.id, e.target.value)}
                        className={`rounded-md border border-[#d8ded2] px-2.5 py-1 text-xs font-semibold focus:outline-none ${
                          lead.stage === "WON"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : lead.stage === "LOST"
                            ? "bg-rose-50 text-rose-800 border-rose-300"
                            : "bg-amber-50 text-amber-800 border-amber-300"
                        }`}
                      >
                        <option value="NEW">NEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="QUOTED">QUOTED</option>
                        <option value="NEGOTIATION">NEGOTIATION</option>
                        <option value="WON">WON</option>
                        <option value="LOST">LOST</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {lead.convertedOrder ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-900">
                          Order: {lead.convertedOrder.orderNumber}
                        </span>
                      ) : (
                        <button
                          onClick={() => setLeadToConvert(lead)}
                          className="inline-flex items-center gap-1.5 rounded-md bg-[#263326] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#394a39] shadow-sm"
                        >
                          Convert to Order
                          <ArrowRight className="size-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <LeadModal
        customers={customers}
        partners={partners}
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
      />

      <LeadConvertModal
        lead={leadToConvert}
        partners={partners}
        isOpen={Boolean(leadToConvert)}
        onClose={() => setLeadToConvert(null)}
      />
    </div>
  );
}
