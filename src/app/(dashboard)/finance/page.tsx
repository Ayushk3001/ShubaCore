import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { FinanceClient } from "@/components/finance/FinanceClient";
import { serializeData } from "@/lib/serialize";

export default async function FinancePage() {
  await requireUser();

  const [payments, expenses, orders, partners, partnerTransactions, products] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { paidAt: "desc" },
      include: {
        order: {
          select: { orderNumber: true, customer: { select: { name: true } } },
        },
      },
    }),
    prisma.expense.findMany({
      orderBy: { expenseDate: "desc" },
      include: {
        order: { select: { orderNumber: true } },
        paidBy: { select: { name: true } },
      },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
        expenses: true,
        items: true,
      },
    }),
    prisma.user.findMany({
      where: { role: "PARTNER" },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    }),
    prisma.partnerTransaction.findMany(),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, currentStock: true, purchaseCost: true },
    }),
  ]);

  return (
    <FinanceClient
      payments={serializeData(payments) as any}
      expenses={serializeData(expenses) as any}
      orders={serializeData(orders) as any}
      partners={serializeData(partners)}
      partnerTransactions={serializeData(partnerTransactions) as any}
      products={serializeData(products) as any}
    />
  );
}
