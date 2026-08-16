import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { OrdersClient } from "@/components/orders/OrdersClient";
import { serializeData } from "@/lib/serialize";

export default async function OrdersPage() {
  await requireUser();

  const [orders, customers, partners, products, bundles] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, phone: true, email: true } },
        assignedPartner: { select: { name: true } },
        items: {
          include: {
            bundle: {
              include: {
                bundleItems: {
                  include: {
                    product: { select: { name: true, sku: true, unit: true } },
                  },
                },
              },
            },
            product: { select: { name: true, sku: true, unit: true } },
          },
        },
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
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, purchaseCost: true, currentStock: true, unit: true },
    }),
    prisma.productBundle.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        bundleItems: {
          include: {
            product: { select: { id: true, name: true, sku: true, purchaseCost: true, currentStock: true, unit: true } },
          },
        },
      },
    }),
  ]);

  return (
    <OrdersClient
      orders={serializeData(orders) as any}
      customers={serializeData(customers)}
      partners={serializeData(partners)}
      products={serializeData(products) as any}
      bundles={serializeData(bundles) as any}
    />
  );
}
