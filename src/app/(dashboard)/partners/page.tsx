import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PartnersClient } from "@/components/partners/PartnersClient";

export default async function PartnersPage() {
  await requireUser();

  const [partners, transactions] = await Promise.all([
    prisma.user.findMany({
      where: { role: "PARTNER" },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    }),
    prisma.partnerTransaction.findMany({
      orderBy: { occurredAt: "desc" },
      include: {
        partner: { select: { name: true } },
      },
    }),
  ]);

  return <PartnersClient partners={partners} transactions={transactions as any} />;
}
