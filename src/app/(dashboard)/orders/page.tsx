import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { OrdersClient } from "@/components/orders/OrdersClient";

export default async function OrdersPage() {
  await requireUser();

  const [orders, customers, partners] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, phone: true, email: true } },
        assignedPartner: { select: { name: true } },
        items: true,
        payments: true,
        expenses: true,
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

  return <OrdersClient orders={orders as any} customers={customers} partners={partners} />;
}
