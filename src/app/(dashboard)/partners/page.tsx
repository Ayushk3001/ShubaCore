import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PartnersClient } from "@/components/partners/PartnersClient";
import { serializeData } from "@/lib/serialize";

export default async function PartnersPage() {
  await requireUser();

  const [partners, transactions, expenses, orders, products] = await Promise.all([
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
    prisma.expense.findMany({
      select: { amount: true, paidById: true, type: true, method: true },
    }),
    prisma.order.findMany({
      select: { total: true, status: true, discount: true, items: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, currentStock: true, purchaseCost: true },
    }),
  ]);

  return (
    <PartnersClient
      partners={serializeData(partners)}
      transactions={serializeData(transactions) as any}
      expenses={serializeData(expenses) as any}
      orders={serializeData(orders) as any}
      products={serializeData(products) as any}
    />
  );
}
