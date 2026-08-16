import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { LeadsClient } from "@/components/leads/LeadsClient";
import { serializeData } from "@/lib/serialize";

export default async function LeadsPage() {
  await requireUser();

  const [leads, customers, partners] = await Promise.all([
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        assignedPartner: { select: { id: true, name: true } },
        convertedOrder: { select: { id: true, orderNumber: true } },
      },
    }),
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true },
    }),
    prisma.user.findMany({
      where: { role: "PARTNER", isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <LeadsClient
      leads={serializeData(leads) as any}
      customers={serializeData(customers)}
      partners={serializeData(partners)}
    />
  );
}
