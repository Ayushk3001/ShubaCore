import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { InventoryClient } from "@/components/inventory/InventoryClient";
import { serializeData } from "@/lib/serialize";
import { calculateProfitMetrics, calculatePartnerBalances } from "@/lib/profit";

export default async function InventoryPage() {
  await requireUser();

  const [products, suppliers, stockMovements, bundles, partners, orders, expenses, partnerTransactions] = await Promise.all([
    prisma.product.findMany({
      orderBy: { name: "asc" },
      include: {
        supplier: { select: { id: true, name: true } },
      },
    }),
    prisma.supplier.findMany({
      orderBy: { name: "asc" },
      include: {
        products: { select: { id: true } },
      },
    }),
    prisma.stockMovement.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { name: true, sku: true, unit: true, purchaseCost: true } },
        createdBy: { select: { name: true } },
      },
    }),
    prisma.productBundle.findMany({
      orderBy: { name: "asc" },
      include: {
        bundleItems: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, purchaseCost: true, currentStock: true, unit: true },
            },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: "PARTNER", isActive: true },
      select: { id: true, name: true },
    }),
    prisma.order.findMany({
      include: { items: true },
    }),
    prisma.expense.findMany(),
    prisma.partnerTransaction.findMany(),
  ]);

  const { netProfit, totalRevenue } = calculateProfitMetrics({
    orders,
    expenses,
    partnerTransactions,
    products,
  });

  const { totalLiquidCashWithdrawable: availableCapital } = calculatePartnerBalances({
    partners,
    partnerTransactions,
    expenses,
    netProfit,
    totalRevenue,
  });

  return (
    <InventoryClient
      products={serializeData(products) as any}
      suppliers={serializeData(suppliers)}
      stockMovements={serializeData(stockMovements) as any}
      bundles={serializeData(bundles) as any}
      partners={serializeData(partners)}
      availableCapital={availableCapital}
    />
  );
}
